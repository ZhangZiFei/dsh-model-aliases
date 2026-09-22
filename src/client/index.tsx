import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  decodeModelAliasSettings,
  DEFAULT_MODEL_ALIASES,
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
  'settingsScope',
  'connection',
  'remote',
  'remote.session',
  'sessions',
  'modelDirectories',
]

/**
 * `ctx.sessions` 的客户端切片。Host 的 @deepseek-ai/dsh-session 也向 cordis
 * Context 合并了同名的 `sessions`（host 版 SessionStore），两份声明类型不同，
 * skipLibCheck 下客户端声明会被静默丢弃，因此按需声明结构化切片。
 */
interface ClientSessionsFace {
  readonly list: ObservableSnapshot<SessionListState>
  subagentAddress(id: SessionId): unknown
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

  // 复用 settings UI 提供的高层 scope：revision、串行写入、重连及外部更新均由它处理。
  const aliasSettings = ctx.settingsScope.bind<ModelAliasSettings>({
    namespace: 'model-aliases',
    decode: decodeModelAliasSettings,
  })

  // 「从未设置」由 Host schema default 兜底；这里负责用户显式清空后自动恢复默认。
  // revision 不变不重复尝试，Host 拒绝写入时 recovery read 会保持原 revision，避免重试死循环。
  ctx.effect(() => {
    let evaluatedRevision: number | undefined
    const restoreDefaultsIfEmpty = () => {
      const snapshot = aliasSettings.getSnapshot()
      if (snapshot.status !== 'ready' || !snapshot.writable) return
      if (snapshot.revision === evaluatedRevision) return
      evaluatedRevision = snapshot.revision
      const empty = snapshot.value === undefined || snapshot.value.aliases.length === 0
      if (!empty) return
      void aliasSettings.set('aliases', [...DEFAULT_MODEL_ALIASES]).catch(() => undefined)
    }
    restoreDefaultsIfEmpty()
    return aliasSettings.subscribe(restoreDefaultsIfEmpty)
  }, 'model-aliases: restore defaults after clearing')

  const loadCatalog = async (sessionId: SessionId): Promise<ModelDirectoryState> => {
    if (sessions.subagentAddress(sessionId) !== undefined) {
      throw new Error('被寻址的子代理会话不支持模型选择')
    }
    return ctx.modelDirectories.directoryFor(sessionId).load()
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
        aliases: aliasSettings,
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
      aliases: aliasSettings,
      sessionList: sessions.list,
      loadCatalog,
    }),
  }, AliasSettingsSection))
}
