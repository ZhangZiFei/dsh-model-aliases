import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import {
  validateModelAliasSettings,
  type ModelAlias,
  type ModelAliasSettings,
} from './domain.js'

export * from './domain.js'

export const MODEL_ALIASES_SETTINGS_NAMESPACE = settingsNamespace('model-aliases')

export const MODEL_ALIAS_SCHEMA: z<ModelAlias> = z.object({
  name: z.string().required().description('选择器中显示的唯一别名'),
  provider: z.string().required().description('DSH 提供商路由 ID'),
  model: z.string().required().description('提供商拥有的模型 ID'),
  reasoningEffort: z.string().description('可选；缺省时保留提供商默认行为'),
})

export const MODEL_ALIASES_SETTINGS_SCHEMA: z<ModelAliasSettings> = z.object({
  aliases: z.array(MODEL_ALIAS_SCHEMA).default([]).description('按显示顺序排列的模型别名'),
})

/** 设置持久化是插件的硬依赖；缺少 settings 时应保持等待，而不是静默退化。 */
export const inject = ['settings']

export function apply(ctx: Context): void {
  ctx.settings.register(
    MODEL_ALIASES_SETTINGS_NAMESPACE,
    MODEL_ALIASES_SETTINGS_SCHEMA,
    {
      applies: 'live',
      validate: validateModelAliasSettings,
    },
  )
}
