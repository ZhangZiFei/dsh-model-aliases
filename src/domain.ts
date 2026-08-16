export interface ModelAlias {
  name: string
  provider: string
  model: string
  reasoningEffort?: string
}

export interface ModelAliasSettings {
  aliases: ModelAlias[]
}

/** 首次使用或用户清空别名后自动恢复的默认别名。 */
export const DEFAULT_MODEL_ALIASES: readonly ModelAlias[] = [
  {
    name: 'falsh',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    reasoningEffort: 'max',
  },
  {
    name: 'pro',
    provider: 'deepseek-official',
    model: 'deepseek-v4-pro',
  },
]

export interface ModelSelectionLike {
  provider: string
  model: string
  reasoningEffort?: string
}

export interface CatalogModelLike {
  id: string
  reasoning?: {
    efforts: readonly { id: string }[]
    defaultEffort?: string
  }
}

export interface CatalogGroupLike {
  id: string
  models: readonly CatalogModelLike[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 在 Client 设置边界将未知 wire 值收窄为领域设置。 */
export function decodeModelAliasSettings(value: unknown): ModelAliasSettings | undefined {
  if (!isRecord(value) || !Array.isArray(value.aliases)) return undefined
  const aliases: ModelAlias[] = []
  for (const entry of value.aliases) {
    if (!isRecord(entry)
      || typeof entry.name !== 'string'
      || typeof entry.provider !== 'string'
      || typeof entry.model !== 'string'
      || (entry.reasoningEffort !== undefined && typeof entry.reasoningEffort !== 'string')) {
      return undefined
    }
    aliases.push({
      name: entry.name,
      provider: entry.provider,
      model: entry.model,
      ...(entry.reasoningEffort === undefined ? {} : { reasoningEffort: entry.reasoningEffort }),
    })
  }
  const settings = { aliases }
  try {
    validateModelAliasSettings(settings)
    return settings
  } catch {
    return undefined
  }
}

function requireCanonicalText(value: string, field: string): void {
  if (value.length === 0) throw new TypeError(`${field}不能为空`)
  if (value !== value.trim()) throw new TypeError(`${field}首尾不能包含空白字符`)
}

/** 校验设置服务已经完成 schema 校验后的跨字段约束。 */
export function validateModelAliasSettings(value: ModelAliasSettings): void {
  const names = new Set<string>()
  const selections = new Set<string>()

  for (const [index, alias] of value.aliases.entries()) {
    const prefix = `第 ${index + 1} 个别名`
    requireCanonicalText(alias.name, `${prefix}的名称`)
    requireCanonicalText(alias.provider, `${prefix}的提供商`)
    requireCanonicalText(alias.model, `${prefix}的模型`)
    if (alias.reasoningEffort !== undefined) {
      requireCanonicalText(alias.reasoningEffort, `${prefix}的推理等级`)
    }

    if (names.has(alias.name)) throw new TypeError(`别名名称“${alias.name}”重复`)
    names.add(alias.name)

    const key = selectionKey(alias)
    if (selections.has(key)) throw new TypeError(`别名“${alias.name}”绑定了重复的模型配置`)
    selections.add(key)
  }
}

/** 去除表单输入首尾空白，并保留“未指定推理等级”的语义。 */
export function normalizeModelAliases(aliases: readonly ModelAlias[]): ModelAlias[] {
  return aliases.map((alias) => {
    const reasoningEffort = alias.reasoningEffort?.trim()
    return {
      name: alias.name.trim(),
      provider: alias.provider.trim(),
      model: alias.model.trim(),
      ...(reasoningEffort === undefined || reasoningEffort.length === 0 ? {} : { reasoningEffort }),
    }
  })
}

/** 为完整模型选择生成无分隔符碰撞的稳定键。 */
export function selectionKey(selection: ModelSelectionLike): string {
  return JSON.stringify([
    selection.provider,
    selection.model,
    selection.reasoningEffort ?? null,
  ])
}

export function sameSelection(left: ModelSelectionLike, right: ModelSelectionLike): boolean {
  return selectionKey(left) === selectionKey(right)
}

export function aliasForSelection(
  aliases: readonly ModelAlias[],
  selection: ModelSelectionLike | null,
): ModelAlias | undefined {
  if (selection === null) return undefined
  return aliases.find((alias) => sameSelection(alias, selection))
}

export interface AliasAvailability {
  available: boolean
  reason?: 'provider' | 'model' | 'effort'
}

/** 依据当前会话目录判断别名是否仍可选择。 */
export function aliasAvailability(
  alias: ModelAlias,
  groups: readonly CatalogGroupLike[],
): AliasAvailability {
  const group = groups.find((candidate) => candidate.id === alias.provider)
  if (group === undefined) return { available: false, reason: 'provider' }

  const model = group.models.find((candidate) => candidate.id === alias.model)
  if (model === undefined) return { available: false, reason: 'model' }
  if (alias.reasoningEffort === undefined) return { available: true }

  const reasoning = model.reasoning
  const effortExists = reasoning !== undefined && (
    reasoning.defaultEffort === alias.reasoningEffort
    || reasoning.efforts.some((effort) => effort.id === alias.reasoningEffort)
  )
  return effortExists ? { available: true } : { available: false, reason: 'effort' }
}
