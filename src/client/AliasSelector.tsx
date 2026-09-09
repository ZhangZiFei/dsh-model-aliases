import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import {
  IconChevronDownOutline14,
  Menu,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
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

type AliasSelectorProps = PropsRuntime<'conversation.input.right'>
  & InjectFace<AliasSelectorInjected>
  & PropsLocale<typeof NS>

function routeLabel(alias: ModelAlias): string {
  return `${alias.provider} / ${alias.model}${alias.reasoningEffort === undefined ? '' : ` / ${alias.reasoningEffort}`}`
}

/**
 * 输入框工具行中的别名选择器：与原生「模型 / 推理等级」座位并存。
 * 两侧读写同一个 per-session ModelDirectory，别名只是完整选择的快捷方式；
 * 原生座位上的手动选择会立刻反映为别名或“自定义”。
 */
export function AliasSelector(props: AliasSelectorProps) {
  const {
    available,
    aliases,
    directory,
    loadDirectory,
    select,
    t,
    useSession,
  } = props
  // 原生座位由 composer 通过 owner 的 locked 关闭；工具行插槽没有该 owner 共享，
  // 这里用会话生命周期中同一个 removed 事实禁用，避免会话已删除后仍能切换。
  const locked = useSession((snapshot) => snapshot.removed)
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
  const configuredAliases = aliasState.value?.aliases ?? []

  const currentAlias = useMemo(
    () => aliasForSelection(configuredAliases, directoryState.current, directoryState.groups),
    [configuredAliases, directoryState.current, directoryState.groups],
  )

  // 菜单按设置顺序倒序展示：设置页最顶部的别名出现在菜单底部。
  const menuAliases = useMemo(
    () => [...configuredAliases].reverse(),
    [configuredAliases],
  )

  useEffect(() => {
    if (available) loadDirectory()
  }, [available, loadDirectory])

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
  const error = selectError ?? directoryState.error
  const selectedIndex = currentAlias === undefined
    ? -1
    : menuAliases.findIndex((alias) => alias.name === currentAlias.name)
  const items: MenuEntry[] = [
    ...(error === null ? [] : [{
      id: 'status:error',
      label: <span className="dma-selector__error">{error}</span>,
      disabled: true,
    }]),
    ...(loading ? [{
      id: 'status:loading',
      label: <span className="dma-selector__message">{t('selector.loading')}</span>,
      disabled: true,
    }] : []),
    ...(!loading && configuredAliases.length === 0 ? [{
      id: 'status:empty',
      label: <span className="dma-selector__message">{t('selector.empty')}</span>,
      disabled: true,
    }] : []),
    ...menuAliases.map((alias, index) => {
      const availability = aliasAvailability(alias, directoryState.groups)
      const reason = availability.reason === undefined
        ? undefined
        : t(`selector.stale.${availability.reason}`)
      return {
        id: `alias:${index}`,
        label: (
          <span className="dma-selector__item" title={reason}>
            <span className="dma-selector__item-name">{alias.name}</span>
            <span className="dma-selector__item-route">{routeLabel(alias)}</span>
            {reason === undefined ? null : (
              <span className="dma-selector__item-state">{reason}</span>
            )}
          </span>
        ),
        disabled: !availability.available || directoryState.status === 'selecting',
      }
    }),
  ]

  return (
    <Menu
      className="dma-selector"
      open={open}
      align="end"
      side="top"
      items={items}
      selectedId={selectedIndex < 0 ? undefined : `alias:${selectedIndex}`}
      onClose={() => setOpen(false)}
      onSelect={(id) => {
        if (!id.startsWith('alias:')) return
        const alias = menuAliases[Number(id.slice('alias:'.length))]
        if (alias !== undefined) void choose(alias)
      }}
      anchor={(
        <button
          type="button"
          className="dma-selector__trigger"
          aria-label={t('selector.aria')}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={locked}
          title={currentAlias === undefined ? t('selector.custom') : routeLabel(currentAlias)}
          onClick={openMenu}
        >
          <span className="dma-selector__label">{currentAlias?.name ?? t('selector.custom')}</span>
          <IconChevronDownOutline14 className="dma-selector__chevron" />
        </button>
      )}
    />
  )
}
