import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type {
  ModelProviderGroup,
  SessionId,
  SessionModels,
} from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import {
  Button,
  IconChevronDownOutline14,
  IconChevronUpOutline14,
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
  loadCatalog: (sessionId: SessionId) => Promise<SessionModels>
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

function SettingsSelect({
  value,
  options,
  disabled = false,
  ariaLabel,
  onChange,
}: {
  value: string
  options: readonly SelectOption[]
  disabled?: boolean
  ariaLabel: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  return (
    <Menu
      className="dma-select"
      open={open}
      portal
      align="start"
      items={options.map((option) => ({
        id: option.value,
        label: option.label,
      }))}
      selectedId={value}
      onClose={() => setOpen(false)}
      onSelect={(next) => {
        setOpen(false)
        onChange(next)
      }}
      anchor={(
        <button
          type="button"
          className="dma-select__trigger"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled || options.length === 0}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="dma-select__value">{selected?.label ?? value}</span>
          <IconChevronDownOutline14 className="dma-select__chevron" />
        </button>
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
  const { aliases, loadCatalog, useSessions, t } = props
  const state = useSyncExternalStore(
    (listener) => aliases.subscribe(listener),
    () => aliases.getSnapshot(),
  )
  const currentSessionId = useSessions((sessions) => sessions.current)
  const [draft, setDraft] = useState<ModelAlias[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedRevision, setSavedRevision] = useState<number | undefined>()
  const [catalog, setCatalog] = useState<CatalogState>({
    status: 'idle',
    groups: [],
    error: null,
  })

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

  const moveAlias = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= draft.length) return
    setSaveError(null)
    setDraft((current) => {
      const next = [...current]
      const swapped = next[index]!
      next[index] = next[target]!
      next[target] = swapped
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
        {draft.map((alias, index) => {
          const selectedGroup = catalog.groups.find((group) => group.id === alias.provider)
          const selectedModel = modelFor(catalog.groups, alias.provider, alias.model)
          const providerKnown = selectedGroup !== undefined
          const modelKnown = selectedModel !== undefined
          const effortKnown = alias.reasoningEffort === undefined || (
            selectedModel?.reasoning?.defaultEffort === alias.reasoningEffort
            || selectedModel?.reasoning?.efforts.some((effort) => effort.id === alias.reasoningEffort)
          )

          return (
            <article className="dma-alias-card" key={index}>
              <label className="dma-field">
                <span>{t('settings.aliasName')}</span>
                <input
                  value={alias.name}
                  onChange={(event) => replaceAt(index, { ...alias, name: event.target.value })}
                />
              </label>

              <div className="dma-field">
                <span>{t('settings.provider')}</span>
                {catalog.groups.length === 0 ? (
                  <input
                    value={alias.provider}
                    aria-label={t('settings.provider')}
                    placeholder={t('settings.manualHint')}
                    onChange={(event) => replaceAt(index, { ...alias, provider: event.target.value })}
                  />
                ) : (
                  <SettingsSelect
                    value={alias.provider}
                    ariaLabel={t('settings.provider')}
                    options={[
                      ...(!providerKnown ? [{
                        value: alias.provider,
                        label: `${alias.provider} · ${t('settings.unavailable')}`,
                      }] : []),
                      ...catalog.groups.map((group) => ({
                        value: group.id,
                        label: group.name,
                      })),
                    ]}
                    onChange={(provider) => {
                      const group = catalog.groups.find((entry) => entry.id === provider)
                      replaceAt(index, {
                        name: alias.name,
                        provider,
                        model: group?.models[0]?.id ?? '',
                      })
                    }}
                  />
                )}
              </div>

              <div className="dma-field">
                <span>{t('settings.model')}</span>
                {selectedGroup === undefined ? (
                  <input
                    value={alias.model}
                    aria-label={t('settings.model')}
                    placeholder={t('settings.manualHint')}
                    onChange={(event) => replaceAt(index, { ...alias, model: event.target.value })}
                  />
                ) : (
                  <SettingsSelect
                    value={alias.model}
                    ariaLabel={t('settings.model')}
                    options={[
                      ...(!modelKnown ? [{
                        value: alias.model,
                        label: `${alias.model} · ${t('settings.unavailable')}`,
                      }] : []),
                      ...selectedGroup.models.map((model) => ({
                        value: model.id,
                        label: model.name,
                      })),
                    ]}
                    onChange={(model) => replaceAt(index, {
                      name: alias.name,
                      provider: alias.provider,
                      model,
                    })}
                  />
                )}
              </div>

              <div className="dma-field">
                <span>{t('settings.effort')}</span>
                <SettingsSelect
                  value={alias.reasoningEffort ?? ''}
                  ariaLabel={t('settings.effort')}
                  options={[
                    { value: '', label: t('settings.providerDefault') },
                    ...(!effortKnown && alias.reasoningEffort !== undefined ? [{
                      value: alias.reasoningEffort,
                      label: `${alias.reasoningEffort} · ${t('settings.unavailable')}`,
                    }] : []),
                    ...(selectedModel?.reasoning?.efforts.map((effort) => ({
                      value: effort.id,
                      label: effort.name,
                    })) ?? []),
                  ]}
                  onChange={(value) => {
                    const next: ModelAlias = {
                      name: alias.name,
                      provider: alias.provider,
                      model: alias.model,
                    }
                    if (value.length > 0) next.reasoningEffort = value
                    replaceAt(index, next)
                  }}
                />
              </div>

              <div className="dma-alias-card__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={t('settings.moveUp')}
                  disabled={index === 0}
                  onClick={() => moveAlias(index, -1)}
                >
                  <IconChevronUpOutline14 />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={t('settings.moveDown')}
                  disabled={index === draft.length - 1}
                  onClick={() => moveAlias(index, 1)}
                >
                  <IconChevronDownOutline14 />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="dma-button--danger"
                  onClick={() => {
                    setSaveError(null)
                    setDraft((current) => current.filter((_, at) => at !== index))
                  }}
                >
                  {t('settings.remove')}
                </Button>
              </div>
            </article>
          )
        })}
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
