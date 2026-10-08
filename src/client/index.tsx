import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  decodeModelAliasSettings,
  DEFAULT_MODEL_ALIASES,
  MODEL_ALIASES_ENTRY_ID,
  type ModelAlias,
  type ModelAliasSettings,
} from '../domain.js'
import { AliasSelector } from './AliasSelector.js'
import { AliasSettingsSection } from './AliasSettingsSection.js'
import {
  en,
  NS,
  zh,
  type ModelAliasesKey,
} from './locales.js'
import { STYLE_TEXT } from './styles.js'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.model-aliases': ModelAliasesKey
  }
}

/** Client 端所需服务；modelDirectories 保证复用 DSH 原生模型目录与选择链路。 */
export const inject = [
  'slots',
  'locale',
  'configForms',
  'sessions',
  'modelDirectories',
]

/**
 * `ctx.sessions` 的客户端切片。Host 的 @deepseek-ai/dsh-session 也向 cordis
 * Context 合并了同名的 `sessions`（host 版 SessionStore），两份声明类型不同，
 * skipLibCheck 下客户端声明会被静默丢弃，因此按需声明结构化切片。
 *
 * `scope`/`binding` 是 `ModelDirectoryResolver.directoryFor()` 的前置条件：
 * 只有挂着已保留 Agent 作用域的会话才能解析出模型目录。
 */
interface ClientSessionsFace {
  readonly list: ObservableSnapshot<SessionListState>
  subagentAddress(id: SessionId): unknown
  scope(id: SessionId): unknown
  binding(id: SessionId): unknown
}

/** 别名设置的读取面：DSH 共享配置表单的别名快照。 */
export interface AliasSettingsInjected {
  getAliases: () => readonly ModelAlias[]
  subscribe: (listener: () => void) => () => void
}

/** 设置页面多一个写入口：一次 revision 围栏内的原子别名写入。 */
export interface AliasSettingsEditorInjected extends AliasSettingsInjected {
  /** 当前 Host 同步状态；`loading` 表示首个已接受值尚未到达。 */
  status: () => 'loading' | 'ready' | 'unavailable'
  /** Host 文档是否接受写入。 */
  writable: () => boolean
  save: (aliases: readonly ModelAlias[]) => Promise<boolean>
}

/**
 * 复用 ui-settings 共享的配置表单：revision 围栏、串行写入、冲突恢复、
 * 重连与 `settings/document-updated` 观察全部由它处理。
 *
 * 快照对象在下一次变更前保持引用稳定，因此按快照缓存解码结果，
 * 让 `useSyncExternalStore` 的 getSnapshot 返回稳定引用。
 */
function createAliasSettings(form: ConfigForm<ModelAliasSettings>): AliasSettingsInjected & {
  status: AliasSettingsEditorInjected['status']
  writable: AliasSettingsEditorInjected['writable']
  save: AliasSettingsEditorInjected['save']
} {
  let cachedSnapshot: unknown
  let cachedAliases: readonly ModelAlias[] = DEFAULT_MODEL_ALIASES

  const getAliases = (): readonly ModelAlias[] => {
    const snapshot = form.getSnapshot()
    if (snapshot !== cachedSnapshot) {
      cachedSnapshot = snapshot
      // 条目从未写入时由 Config schema 的 default 兜底；这里只处理被显式清空的空数组。
      const decoded = decodeModelAliasSettings(snapshot.value)?.aliases
      cachedAliases = decoded === undefined || decoded.length === 0
        ? DEFAULT_MODEL_ALIASES
        : decoded
    }
    return cachedAliases
  }

  return {
    getAliases,
    subscribe: (listener) => form.subscribe(listener),
    status: () => form.getSnapshot().status,
    writable: () => form.getSnapshot().writable,
    save: (aliases) => form.mutate([{ op: 'set', path: ['aliases'], value: [...aliases] }]),
  }
}

export function apply(ctx: Context): void {
  const sessions = ctx.sessions as unknown as ClientSessionsFace
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    'model-aliases: locale dictionaries',
  )

  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-model-aliases'
    tag.textContent = STYLE_TEXT
    document.head.appendChild(tag)
    return () => tag.remove()
  }, 'model-aliases: styles')

  const form = ctx.configForms.get<ModelAliasSettings>(MODEL_ALIASES_ENTRY_ID)
  const aliases = createAliasSettings(form)

  /**
   * 设置面板挂在 root scope，没有会话作用域可继承，只能借用会话列表里
   * 「已挂载 Agent 作用域」的会话读取共享模型目录：`directoryFor()` 对没有
   * 保留作用域的会话会直接抛错（`resolved no scope`），因此逐个尝试，
   * 第一个能解析出目录的即为可用来源；全部不可用才报错。
   */
  const loadCatalog = async (): Promise<ModelDirectoryState> => {
    for (const sessionId of sessions.list.getSnapshot().ids) {
      if (sessions.subagentAddress(sessionId) !== undefined) continue
      if (sessions.scope(sessionId) === undefined) continue
      if (sessions.binding(sessionId) === undefined) continue
      return ctx.modelDirectories.directoryFor(sessionId).load()
    }
    throw new Error('没有已挂载的会话可读取模型目录')
  }

  // 别名选择器是输入框工具行里的独立控件：原生「模型 / 推理等级」座位保持可见，
  // 两侧共用同一个 per-session ModelDirectory，因此别名选择会立刻改变原生座位的内容，
  // 在原生座位上手动选择模型或推理等级也会立刻反映到别名选择器。
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'model-aliases',
    order: 10,
    locale: NS,
    inject: (sessionId) => {
      const directory = ctx.modelDirectories.directoryFor(sessionId)
      const available = sessions.subagentAddress(sessionId) === undefined
      return {
        available,
        getAliases: aliases.getAliases,
        subscribe: aliases.subscribe,
        directory: directory.store,
        loadDirectory: () => {
          if (available) void directory.load().catch(() => undefined)
        },
        select: (selection) => available
          ? directory.select(selection).then(() => true, () => false)
          : Promise.resolve(false),
      }
    },
  }, AliasSelector))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'model-aliases',
    order: 15,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS,
    inject: () => ({
      getAliases: aliases.getAliases,
      subscribe: aliases.subscribe,
      status: aliases.status,
      writable: aliases.writable,
      save: aliases.save,
      loadCatalog,
    }),
  }, AliasSettingsSection))
}
