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

              <label className="dma-field">
                <span>{t('settings.provider')}</span>
                {catalog.groups.length === 0 ? (
                  <input
                    value={alias.provider}
                    placeholder={t('settings.manualHint')}
                    onChange={(event) => replaceAt(index, { ...alias, provider: event.target.value })}
                  />
                ) : (
                  <select
                    value={alias.provider}
                    onChange={(event) => {
                      const group = catalog.groups.find((entry) => entry.id === event.target.value)
                      replaceAt(index, {
                        name: alias.name,
                        provider: event.target.value,
                        model: group?.models[0]?.id ?? '',
                      })
                    }}
                  >
                    {!providerKnown && (
                      <option value={alias.provider}>{alias.provider} · {t('settings.unavailable')}</option>
                    )}
                    {catalog.groups.map((group) => (
                      <option value={group.id} key={group.id}>{group.name}</option>
                    ))}
                  </select>
                )}
              </label>

              <label className="dma-field">
                <span>{t('settings.model')}</span>
                {selectedGroup === undefined ? (
                  <input
                    value={alias.model}
                    placeholder={t('settings.manualHint')}
                    onChange={(event) => replaceAt(index, { ...alias, model: event.target.value })}
                  />
                ) : (
                  <select
                    value={alias.model}
                    onChange={(event) => replaceAt(index, {
                      name: alias.name,
                      provider: alias.provider,
                      model: event.target.value,
                    })}
                  >
                    {!modelKnown && (
                      <option value={alias.model}>{alias.model} · {t('settings.unavailable')}</option>
                    )}
                    {selectedGroup.models.map((model) => (
                      <option value={model.id} key={model.id}>{model.name}</option>
                    ))}
                  </select>
                )}
              </label>

              <label className="dma-field">
                <span>{t('settings.effort')}</span>
                <select
                  value={alias.reasoningEffort ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    const next: ModelAlias = {
                      name: alias.name,
                      provider: alias.provider,
                      model: alias.model,
                    }
                    if (value.length > 0) next.reasoningEffort = value
                    replaceAt(index, next)
                  }}
                >
                  <option value="">{t('settings.providerDefault')}</option>
                  {!effortKnown && alias.reasoningEffort !== undefined && (
                    <option value={alias.reasoningEffort}>
                      {alias.reasoningEffort} · {t('settings.unavailable')}
                    </option>
                  )}
                  {selectedModel?.reasoning?.efforts.map((effort) => (
                    <option value={effort.id} key={effort.id}>{effort.name}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="dma-button dma-button--danger"
                onClick={() => {
                  setSaveError(null)
                  setDraft((current) => current.filter((_, at) => at !== index))
                }}
              >
                {t('settings.remove')}
              </button>
            </article>
          )
        })}
      </div>

      <footer className="dma-settings__actions">
        <button type="button" className="dma-button" onClick={addAlias}>
          {t('settings.add')}
        </button>
        <div className="dma-settings__actions-group">
          {savedRevision === state.revision && !dirty && (
            <span className="dma-settings__status">{t('settings.saved')}</span>
          )}
          <button
            type="button"
            className="dma-button dma-button--primary"
            disabled={!dirty || validationError !== null || !state.writable || saving}
            onClick={() => void save()}
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </footer>
    </section>
  )
}
