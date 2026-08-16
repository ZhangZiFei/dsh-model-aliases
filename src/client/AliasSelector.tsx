import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type {
  SettingsScope,
  SnapshotStore,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {
  InjectFace,
  PropsLocale,
  PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
import {
  aliasAvailability,
  aliasForSelection,
  type ModelAlias,
  type ModelAliasSettings,
} from '../domain.js'
import { NS } from './locales.js'

export interface AliasSelectorInjected {
  available: boolean
  aliases: SettingsScope<ModelAliasSettings>
  directory: SnapshotStore<ModelDirectoryState>
  loadDirectory: () => void
  select: (selection: ModelSelection) => Promise<boolean>
}

type AliasSelectorProps = PropsRuntime<'conversation.input.model'>
  & InjectFace<AliasSelectorInjected>
  & PropsLocale<typeof NS>

function routeLabel(alias: ModelAlias): string {
  return `${alias.provider} / ${alias.model}${alias.reasoningEffort === undefined ? '' : ` / ${alias.reasoningEffort}`}`
}

export function AliasSelector(props: AliasSelectorProps) {
  const {
    locked,
    available,
    aliases,
    directory,
    loadDirectory,
    select,
    t,
  } = props
  const aliasState = useSyncExternalStore(
    (listener) => aliases.subscribe(listener),
    () => aliases.getSnapshot(),
  )
  const directoryState = useSyncExternalStore(
    (listener) => directory.subscribe(listener),
    () => directory.getSnapshot(),
  )
  const [open, setOpen] = useState(false)
  const [selectError, setSelectError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const configuredAliases = aliasState.value?.aliases ?? []

  const currentAlias = useMemo(
    () => aliasForSelection(configuredAliases, directoryState.current),
    [configuredAliases, directoryState.current],
  )

  useEffect(() => {
    if (available) loadDirectory()
  }, [available, loadDirectory])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])

  if (!available) return null

  const choose = async (alias: ModelAlias) => {
    setSelectError(null)
    const accepted = await select({
      provider: alias.provider,
      model: alias.model,
      ...(alias.reasoningEffort === undefined ? {} : { reasoningEffort: alias.reasoningEffort }),
    })
    if (accepted) setOpen(false)
    else setSelectError(directory.getSnapshot().error ?? '模型选择未被 Host 接受')
  }

  const openMenu = () => {
    setOpen((value) => !value)
    setSelectError(null)
    loadDirectory()
  }

  const loading = aliasState.status === 'loading'
    || directoryState.status === 'idle'
    || directoryState.status === 'loading'

  return (
    <div className="dma-selector" ref={rootRef}>
      <button
        type="button"
        className="dma-selector__trigger"
        aria-label={t('selector.aria')}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={locked}
        title={currentAlias?.name ?? t('selector.custom')}
        onClick={openMenu}
      >
        <span className="dma-selector__label">{currentAlias?.name ?? t('selector.custom')}</span>
        <span className={`dma-selector__chevron${open ? ' dma-selector__chevron--open' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="dma-selector__menu" role="menu" aria-busy={loading}>
          {(selectError ?? directoryState.error) !== null && (
            <div className="dma-selector__error">{selectError ?? directoryState.error}</div>
          )}
          {loading && <div className="dma-selector__message">{t('selector.loading')}</div>}
          {!loading && configuredAliases.length === 0 && (
            <div className="dma-selector__message">{t('selector.empty')}</div>
          )}
          {configuredAliases.map((alias) => {
            const availability = aliasAvailability(alias, directoryState.groups)
            const reason = availability.reason === undefined
              ? undefined
              : t(`selector.stale.${availability.reason}`)
            return (
              <button
                key={alias.name}
                type="button"
                role="menuitemradio"
                aria-checked={currentAlias?.name === alias.name}
                className="dma-selector__item"
                disabled={!availability.available || directoryState.status === 'selecting'}
                title={reason}
                onClick={() => void choose(alias)}
              >
                <span>
                  <span className="dma-selector__item-name">{alias.name}</span>
                  <span className="dma-selector__item-route">{routeLabel(alias)}</span>
                </span>
                <span className="dma-selector__item-state">
                  {currentAlias?.name === alias.name ? '✓' : reason}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
