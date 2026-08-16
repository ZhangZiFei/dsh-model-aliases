import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {
  SessionId,
  SessionModels,
} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  decodeModelAliasSettings,
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
  'sessions',
  'modelDirectories',
]

export function apply(ctx: ClientContext): void {
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

  const loadCatalog = async (sessionId: SessionId): Promise<SessionModels> => {
    if (ctx.sessions.subagentAddress(sessionId) !== undefined) {
      throw new Error('被寻址的子代理会话不支持模型选择')
    }
    return ctx.modelDirectories.directoryFor(sessionId).load()
  }

  ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
    name: 'conversation.input.model',
    priority: -1,
    locale: NS,
    inject: (sessionId) => {
      const directory = ctx.modelDirectories.directoryFor(sessionId)
      const available = ctx.sessions.subagentAddress(sessionId) === undefined
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
      loadCatalog,
    }),
  }, AliasSettingsSection))
}
