import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type {
  ModelProviderGroup,
  SessionId,
} from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  Button,
  IconChevronDownOutline14,
  Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  InjectFace,
  PropsLocale,
  PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
import {
  normalizeModelAliases,
  validateModelAliasSettings,
  type ModelAlias,
  type ModelAliasSettings,
} from '../domain.js'
import { NS } from './locales.js'

export interface AliasSettingsSectionInjected {
  aliases: SettingsScope<ModelAliasSettings>
  sessionList: ObservableSnapshot<SessionListState>
  loadCatalog: (sessionId: SessionId) => Promise<ModelDirectoryState>
}

type AliasSettingsSectionProps = PropsRuntime<'settings.section'>
  & InjectFace<AliasSettingsSectionInjected>
  & PropsLocale<typeof NS>

interface CatalogState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  groups: readonly ModelProviderGroup[]
  error: string | null
}

interface SelectOption {
  value: string
  label: string
}

function SettingsCombobox({
  value,
  options,
  disabled = false,
  ariaLabel,
  openOptionsLabel,
  placeholder,
  onInput,
  onSelect,
}: {
  value: string
  options: readonly SelectOption[]
  disabled?: boolean
  ariaLabel: string
  openOptionsLabel: string
  placeholder?: string
  onInput: (value: string) => void
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.some((option) => option.value === value)

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  return (
    <Menu
      className="dma-combobox"
      open={open}
      portal
      align="start"
      items={options.map((option) => ({
        id: option.value,
        label: option.label,
      }))}
      selectedId={selected ? value : undefined}
      onClose={() => setOpen(false)}
      onSelect={(next) => {
        setOpen(false)
        onSelect(next)
      }}
      anchor={(
        <div className="dma-combobox__control">
          <input
            value={value}
            aria-label={ariaLabel}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-haspopup="menu"
            disabled={disabled}
            placeholder={placeholder}
            role="combobox"
            onChange={(event) => onInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && options.length > 0) {
                event.preventDefault()
                setOpen(true)
              }
            }}
          />
          <button
            type="button"
            className="dma-combobox__trigger"
            aria-label={openOptionsLabel}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={disabled || options.length === 0}
            onClick={() => setOpen((current) => !current)}
          >
            <IconChevronDownOutline14 className="dma-combobox__chevron" />
          </button>
        </div>
      )}
    />
  )
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function modelFor(
  groups: readonly ModelProviderGroup[],
  provider: string,
  model: string,
): ModelProviderGroup['models'][number] | undefined {
  return groups.find((group) => group.id === provider)?.models.find((entry) => entry.id === model)
}

function uniqueAliasName(aliases: readonly ModelAlias[]): string {
  let index = aliases.length + 1
  while (aliases.some((alias) => alias.name === `别名 ${index}`)) index += 1
  return `别名 ${index}`
}

function sameAliases(left: readonly ModelAlias[], right: readonly ModelAlias[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function AliasSettingsSection(props: AliasSettingsSectionProps) {
  const { aliases, loadCatalog, sessionList, t } = props
  const state = useSyncExternalStore(
    (listener) => aliases.subscribe(listener),
    () => aliases.getSnapshot(),
  )
  const sessionState = useSyncExternalStore(
    (listener) => sessionList.subscribe(listener),
    () => sessionList.getSnapshot(),
  )
  // 设置面板是 root scope；重连或页面恢复的短暂窗口里 current 可能被遮蔽，
  // 但列表中的普通会话仍能安全承载同一份模型目录查询。
  const currentSessionId = sessionState.current ?? sessionState.ids[0]
  const [draft, setDraft] = useState<ModelAlias[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedRevision, setSavedRevision] = useState<number | undefined>()
  const [catalog, setCatalog] = useState<CatalogState>({
    status: 'idle',
    groups: [],
    error: null,
  })
  // 拖拽排序状态
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dropAfter, setDropAfter] = useState(false)

  useEffect(() => {
    setDraft((state.value?.aliases ?? []).map((alias) => ({ ...alias })))
  }, [state.revision, state.value])

  useEffect(() => {
    if (currentSessionId === undefined) {
      setCatalog({ status: 'error', groups: [], error: null })
      return
    }
    let active = true
    setCatalog((previous) => ({ ...previous, status: 'loading', error: null }))
    loadCatalog(currentSessionId).then(
      (models) => {
        if (active) setCatalog({ status: 'ready', groups: models.groups, error: null })
      },
      (error) => {
        if (active) setCatalog({ status: 'error', groups: [], error: messageOf(error) })
      },
    )
    return () => {
      active = false
    }
  }, [currentSessionId, loadCatalog, t])

  const normalized = useMemo(() => normalizeModelAliases(draft), [draft])
  const validationError = useMemo(() => {
    try {
      validateModelAliasSettings({ aliases: normalized })
      return null
    } catch (error) {
      return messageOf(error)
    }
  }, [normalized])
  const acceptedAliases = state.value?.aliases ?? []
  const dirty = !sameAliases(normalized, acceptedAliases)

  const replaceAt = (index: number, next: ModelAlias) => {
    setSaveError(null)
    setDraft((current) => current.map((alias, at) => at === index ? next : alias))
  }

  const addAlias = () => {
    const firstGroup = catalog.groups[0]
    const firstModel = firstGroup?.models[0]
    setSaveError(null)
    setDraft((current) => [
      ...current,
      {
        name: uniqueAliasName(current),
        provider: firstGroup?.id ?? '',
        model: firstModel?.id ?? '',
      },
    ])
  }

  const moveAlias = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= draft.length || to >= draft.length) return
    setSaveError(null)
    setDraft((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return next
    })
  }

  const save = async () => {
    if (validationError !== null) return
    setSaving(true)
    setSaveError(null)
    await aliases.set('aliases', normalized)
    const snapshot = aliases.getSnapshot()
    if (sameAliases(snapshot.value?.aliases ?? [], normalized)) {
      setSavedRevision(snapshot.revision)
    } else {
      setSaveError('设置未被 Host 接受，请检查连接或重新加载后再试。')
    }
    setSaving(false)
  }

  const resetDrag = () => {
    setDragIndex(null)
    setDropIndex(null)
    setDropAfter(false)
  }

  const handleDragStart = (index: number) => (event: React.DragEvent) => {
    event.dataTransfer.setData('text/plain', String(index))
    event.dataTransfer.effectAllowed = 'move'
    setDragIndex(index)
  }

  const handleDragOver = (index: number) => (event: React.DragEvent) => {
    if (dragIndex === null) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    setDropIndex(index)
    setDropAfter(after)
  }

  const handleDrop = (index: number) => (event: React.DragEvent) => {
    event.preventDefault()
    const from = Number(event.dataTransfer.getData('text/plain'))
    if (Number.isNaN(from)) return
    const to = dropAfter ? index + 1 : index
    // 如果源在目标之前，删除后目标索引会前移一位
    const adjustedTo = from < to ? to - 1 : to
    moveAlias(from, adjustedTo)
    resetDrag()
  }

  const handleKeyDown = (index: number) => (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault()
      moveAlias(index, index - 1)
    } else if (event.key === 'ArrowDown' && index < draft.length - 1) {
      event.preventDefault()
      moveAlias(index, index + 1)
    }
  }

  const loading = state.status === 'loading'

  return (
    <section className="dma-settings">
      <header className="dma-settings__header">
        <h2>{t('settings.title')}</h2>
        <p>{t('settings.description')}</p>
      </header>

      {loading && <div className="dma-settings__notice">{t('settings.loading')}</div>}
      {catalog.status === 'loading' && (
        <div className="dma-settings__notice">{t('settings.catalogLoading')}</div>
      )}
      {catalog.status === 'error' && (
        <div className="dma-settings__notice">
          {t('settings.catalogUnavailable')}{catalog.error === null ? '' : ` ${catalog.error}`}
        </div>
      )}
      {!state.writable && !loading && (
        <div className="dma-settings__notice">{t('settings.readOnly')}</div>
      )}
      {(saveError ?? validationError) !== null && (
        <div className="dma-settings__error">{saveError ?? validationError}</div>
      )}

      <div className="dma-settings__list">
        {draft.length === 0 && !loading && (
          <div className="dma-settings__empty">{t('settings.empty')}</div>
        )}

        {draft.length > 0 && (
          <div className="dma-alias-table" role="table" aria-label={t('settings.title')}>
            {/* 表头 */}
            <div className="dma-alias-row dma-alias-row--header" role="row">
              <span className="dma-alias-cell dma-alias-cell--handle" aria-hidden="true" />
              <span className="dma-alias-cell dma-alias-cell--name">{t('settings.aliasName')}</span>
              <span className="dma-alias-cell dma-alias-cell--provider">{t('settings.provider')}</span>
              <span className="dma-alias-cell dma-alias-cell--model">{t('settings.model')}</span>
              <span className="dma-alias-cell dma-alias-cell--effort">{t('settings.effort')}</span>
              <span className="dma-alias-cell dma-alias-cell--remove" aria-hidden="true" />
            </div>

            {/* 数据行 */}
            {draft.map((alias, index) => {
              const selectedGroup = catalog.groups.find((group) => group.id === alias.provider)
              const selectedModel = modelFor(catalog.groups, alias.provider, alias.model)
              const isDragging = dragIndex === index
              const isDropTarget = dropIndex === index && dragIndex !== null
              const rowClasses = [
                'dma-alias-row',
                'dma-alias-row--data',
                isDragging ? 'dma-alias-row--dragging' : '',
                isDropTarget && !dropAfter ? 'dma-alias-row--drop-before' : '',
                isDropTarget && dropAfter ? 'dma-alias-row--drop-after' : '',
              ].filter(Boolean).join(' ')

              return (
                <div
                  key={index}
                  className={rowClasses}
                  role="row"
                  draggable={state.writable}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                  onDragEnd={resetDrag}
                >
                  {/* 拖拽手柄 */}
                  <span className="dma-alias-cell dma-alias-cell--handle">
                    <button
                      type="button"
                      className="dma-drag-handle"
                      aria-label={`${t('settings.aliasName')} ${alias.name}`}
                      disabled={!state.writable}
                      onKeyDown={handleKeyDown(index)}
                    >
                      <span className="dma-drag-handle__icon" aria-hidden="true" />
                    </button>
                  </span>

                  {/* 别名 */}
                  <span className="dma-alias-cell dma-alias-cell--name">
                    <input
                      value={alias.name}
                      aria-label={t('settings.aliasName')}
                      onChange={(event) => replaceAt(index, { ...alias, name: event.target.value })}
                    />
                  </span>

                  {/* 提供商 */}
                  <span className="dma-alias-cell dma-alias-cell--provider">
                    <SettingsCombobox
                      value={alias.provider}
                      ariaLabel={t('settings.provider')}
                      openOptionsLabel={t('settings.openOptions')}
                      placeholder={t('settings.manualHint')}
                      options={catalog.groups.map((group) => ({
                        value: group.id,
                        label: group.name,
                      }))}
                      onInput={(provider) => replaceAt(index, { ...alias, provider })}
                      onSelect={(provider) => {
                        const group = catalog.groups.find((entry) => entry.id === provider)
                        replaceAt(index, {
                          name: alias.name,
                          provider,
                          model: group?.models[0]?.id ?? '',
                        })
                      }}
                    />
                  </span>

                  {/* 模型 */}
                  <span className="dma-alias-cell dma-alias-cell--model">
                    <SettingsCombobox
                      value={alias.model}
                      ariaLabel={t('settings.model')}
                      openOptionsLabel={t('settings.openOptions')}
                      placeholder={t('settings.manualHint')}
                      options={selectedGroup?.models.map((model) => ({
                        value: model.id,
                        label: model.name,
                      })) ?? []}
                      onInput={(model) => replaceAt(index, { ...alias, model })}
                      onSelect={(model) => replaceAt(index, {
                        name: alias.name,
                        provider: alias.provider,
                        model,
                      })}
                    />
                  </span>

                  {/* 推理等级 */}
                  <span className="dma-alias-cell dma-alias-cell--effort">
                    <SettingsCombobox
                      value={alias.reasoningEffort ?? ''}
                      ariaLabel={t('settings.effort')}
                      openOptionsLabel={t('settings.openOptions')}
                      placeholder={t('settings.providerDefault')}
                      options={[
                        { value: '', label: t('settings.providerDefault') },
                        ...(selectedModel?.reasoning?.efforts.map((effort) => ({
                          value: effort.id,
                          label: effort.name,
                        })) ?? []),
                      ]}
                      onInput={(value) => {
                        const next: ModelAlias = {
                          name: alias.name,
                          provider: alias.provider,
                          model: alias.model,
                        }
                        if (value.length > 0) next.reasoningEffort = value
                        replaceAt(index, next)
                      }}
                      onSelect={(value) => {
                        const next: ModelAlias = {
                          name: alias.name,
                          provider: alias.provider,
                          model: alias.model,
                        }
                        if (value.length > 0) next.reasoningEffort = value
                        replaceAt(index, next)
                      }}
                    />
                  </span>

                  {/* 删除 */}
                  <span className="dma-alias-cell dma-alias-cell--remove">
                    <button
                      type="button"
                      className="dma-remove-button"
                      aria-label={`${t('settings.remove')} ${alias.name}`}
                      disabled={!state.writable}
                      onClick={() => {
                        setSaveError(null)
                        setDraft((current) => current.filter((_, at) => at !== index))
                      }}
                    >
                      ×
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer className="dma-settings__actions">
        <Button type="button" variant="outline" onClick={addAlias}>
          {t('settings.add')}
        </Button>
        <div className="dma-settings__actions-group">
          {savedRevision === state.revision && !dirty && (
            <span className="dma-settings__status">{t('settings.saved')}</span>
          )}
          <Button
            type="button"
            variant="primary"
            disabled={!dirty || validationError !== null || !state.writable || saving}
            onClick={() => void save()}
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </footer>
    </section>
  )
}
