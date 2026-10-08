import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { parse } from 'yaml'
import type {} from '@deepseek-ai/dsh-settings'
import {
  DEFAULT_MODEL_ALIASES,
  MODEL_ALIASES_ENTRY_ID,
  validateModelAliasSettings,
  type ModelAlias,
  type ModelAliasSettings,
} from './domain.js'

export * from './domain.js'

export const MODEL_ALIAS_SCHEMA: z<ModelAlias> = z.object({
  name: z.string().required().description('选择器中显示的唯一别名'),
  provider: z.string().required().description('DSH 提供商路由 ID'),
  model: z.string().required().description('提供商拥有的模型 ID'),
  reasoningEffort: z.string().description('可选；缺省时保留提供商默认行为'),
})

/**
 * Host 侧按需声明的运行时切片。`loader` 与 `profileContext` 由 DSH 的组合层提供，
 * 声明在这里只用于读取「载入器已稳定」和 profile 主目录，不复制它们的状态机。
 */
interface HostLoaderFace {
  await(): Promise<unknown>
}

interface HostProfileFace {
  readonly home: string
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    loader?: HostLoaderFace
    profileContext?: HostProfileFace
  }
}

/**
 * 条目 Config 就是设置 namespace：DSH 0.2 用 profile 条目的 Config schema 描述可写字段。
 * `volatile` 让 `aliases` 成为可在运行期改写的实时字段，配置表单据此暴露它；
 * 本插件自带设置页面，所以自动生成的呈现由 apply 关闭。
 *
 * 这里刻意不写 `z<ModelAliasSettings>` 注解：`.volatile()` 会把该字段的 metadata 类型
 * 标记成 `Volatile<ModelAlias[]>`（schema 内部的实时引用包装），使 `z<T>` 的元数据类型
 * 比较失败，而 DSH 读取的是 `schema.toJSON()`，输出类型仍由 schema 推导为同一形状。
 */
export const Config = z.object({
  aliases: z.array(MODEL_ALIAS_SCHEMA)
    .default([...DEFAULT_MODEL_ALIASES])
    .description('按显示顺序排列的模型别名；从未设置时使用默认别名')
    .volatile(),
})

/** 设置表单策略是插件的硬依赖；缺少 settings 时应保持等待，而不是静默退化。 */
export const inject = ['settings']

export function apply(ctx: Context): void {
  ctx.effect(
    () => ctx.settings.configure({ auto: false }),
    'model-aliases: disable the generated settings page',
  )
  // 0.1 的别名存放在 settings.yaml；DSH 0.2 把它改名为 *.imported 并逐段并入条目配置时，
  // 本插件尚未安装，因此那一段会留在文件里。这里在载入器稳定后补做一次同样的导入。
  // 没有载入器或 profile 事实的组合（单元测试、内嵌宿主）不做迁移。
  const loader = ctx.get('loader')
  const profile = ctx.get('profileContext')
  if (loader === undefined || profile === undefined) return
  void loader.await().then(() => migrateLegacyAliases(ctx, profile.home))
}

/** 迁移的重试间隔：条目要等载入器把本插件激活后才会出现在设置描述里。 */
const MIGRATION_RETRY_MS = 500
const MIGRATION_ATTEMPTS = 12

/**
 * 迁移 `settings.yaml.imported` 中本插件的旧别名段。
 *
 * 条目只有在被载入器激活后才会出现在 `describe()` 里，而激活与 profile 写入都可能晚于
 * 首次调用，所以这里做有限重试：一旦条目可见就立即给出结论（迁移、已写入、无旧数据），
 * 只有仍不可见才继续等待。
 */
async function migrateLegacyAliases(ctx: Context, home: string): Promise<void> {
  for (let attempt = 0; attempt < MIGRATION_ATTEMPTS; attempt += 1) {
    try {
      const result = await migrateOnce(ctx, home)
      if (result !== 'pending') return
    } catch (error) {
      ctx.logger.warn('model-aliases: 旧别名迁移失败，已保留 settings.yaml.imported', error)
      return
    }
    await new Promise((resolve) => setTimeout(resolve, MIGRATION_RETRY_MS))
  }
}

/** 一次迁移尝试；`pending` 表示条目尚未出现在设置描述里，值得重试。 */
async function migrateOnce(ctx: Context, home: string): Promise<'done' | 'pending'> {
  const current = ctx.settings.describe().find((entry) => entry.ns === MODEL_ALIASES_ENTRY_ID)
  if (current === undefined) return 'pending'
  // 条目已存在：用户写过就不再迁移，`user` 存在即代表已经写过。
  if (current.user !== undefined) return 'done'

  const path = join(home, 'settings.yaml.imported')
  if (!existsSync(path)) return 'done'
  const document: unknown = parse(await readFile(path, 'utf8'))
  if (typeof document !== 'object' || document === null) return 'done'
  const section = Reflect.get(document, MODEL_ALIASES_ENTRY_ID)
  if (typeof section !== 'object' || section === null) return 'done'
  const aliases = decodeLegacyAliases(Reflect.get(section, 'aliases'))
  if (aliases === undefined) return 'done'

  await ctx.settings.update(MODEL_ALIASES_ENTRY_ID, aliases)
  ctx.logger.info('model-aliases: 已迁移 %d 条旧别名到条目配置', aliases.aliases.length)
  return 'done'
}

/** 把旧设置段收窄为合法别名列表；不合法的旧数据保持原样，不写入 profile patch。 */
function decodeLegacyAliases(value: unknown): ModelAliasSettings | undefined {
  if (!Array.isArray(value)) return undefined
  const aliases: ModelAlias[] = []
  for (const entry of value) {
    const decoded = MODEL_ALIAS_SCHEMA(entry)
    const { name, provider, model, reasoningEffort } = decoded
    aliases.push({
      name,
      provider,
      model,
      ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
    })
  }
  const settings = { aliases }
  validateModelAliasSettings(settings)
  return settings
}
