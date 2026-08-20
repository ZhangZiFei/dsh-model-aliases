import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
//#region src/domain.ts
/** 首次使用或用户清空别名后自动恢复的默认别名。 */
const DEFAULT_MODEL_ALIASES = [{
	name: "falsh",
	provider: "deepseek-official",
	model: "deepseek-v4-flash",
	reasoningEffort: "max"
}, {
	name: "pro",
	provider: "deepseek-official",
	model: "deepseek-v4-pro",
	reasoningEffort: "max"
}];
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** 在 Client 设置边界将未知 wire 值收窄为领域设置。 */
function decodeModelAliasSettings(value) {
	if (!isRecord(value) || !Array.isArray(value.aliases)) return void 0;
	const aliases = [];
	for (const entry of value.aliases) {
		if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.provider !== "string" || typeof entry.model !== "string" || entry.reasoningEffort !== void 0 && typeof entry.reasoningEffort !== "string") return;
		aliases.push({
			name: entry.name,
			provider: entry.provider,
			model: entry.model,
			...entry.reasoningEffort === void 0 ? {} : { reasoningEffort: entry.reasoningEffort }
		});
	}
	const settings = { aliases };
	try {
		validateModelAliasSettings(settings);
		return settings;
	} catch {
		return;
	}
}
function requireCanonicalText(value, field) {
	if (value.length === 0) throw new TypeError(`${field}不能为空`);
	if (value !== value.trim()) throw new TypeError(`${field}首尾不能包含空白字符`);
}
/** 校验设置服务已经完成 schema 校验后的跨字段约束。 */
function validateModelAliasSettings(value) {
	const names = /* @__PURE__ */ new Set();
	const selections = /* @__PURE__ */ new Set();
	for (const [index, alias] of value.aliases.entries()) {
		const prefix = `第 ${index + 1} 个别名`;
		requireCanonicalText(alias.name, `${prefix}的名称`);
		requireCanonicalText(alias.provider, `${prefix}的提供商`);
		requireCanonicalText(alias.model, `${prefix}的模型`);
		if (alias.reasoningEffort !== void 0) requireCanonicalText(alias.reasoningEffort, `${prefix}的推理等级`);
		if (names.has(alias.name)) throw new TypeError(`别名名称“${alias.name}”重复`);
		names.add(alias.name);
		const key = selectionKey(alias);
		if (selections.has(key)) throw new TypeError(`别名“${alias.name}”绑定了重复的模型配置`);
		selections.add(key);
	}
}
/** 去除表单输入首尾空白，并保留“未指定推理等级”的语义。 */
function normalizeModelAliases(aliases) {
	return aliases.map((alias) => {
		const reasoningEffort = alias.reasoningEffort?.trim();
		return {
			name: alias.name.trim(),
			provider: alias.provider.trim(),
			model: alias.model.trim(),
			...reasoningEffort === void 0 || reasoningEffort.length === 0 ? {} : { reasoningEffort }
		};
	});
}
/** 为完整模型选择生成无分隔符碰撞的稳定键。 */
function selectionKey(selection) {
	return JSON.stringify([
		selection.provider,
		selection.model,
		selection.reasoningEffort ?? null
	]);
}
function sameSelection(left, right) {
	return selectionKey(left) === selectionKey(right);
}
function aliasForSelection(aliases, selection, groups) {
	if (selection === null) return void 0;
	const exact = aliases.find((alias) => sameSelection(alias, selection));
	if (exact !== void 0) return exact;
	if (groups === void 0 || selection.reasoningEffort === void 0) return void 0;
	if ((groups.find((candidate) => candidate.id === selection.provider)?.models.find((candidate) => candidate.id === selection.model))?.reasoning?.defaultEffort !== selection.reasoningEffort) return void 0;
	return aliases.find((alias) => alias.provider === selection.provider && alias.model === selection.model && alias.reasoningEffort === void 0);
}
/** 依据当前会话目录判断别名是否仍可选择。 */
function aliasAvailability(alias, groups) {
	const group = groups.find((candidate) => candidate.id === alias.provider);
	if (group === void 0) return {
		available: false,
		reason: "provider"
	};
	const model = group.models.find((candidate) => candidate.id === alias.model);
	if (model === void 0) return {
		available: false,
		reason: "model"
	};
	if (alias.reasoningEffort === void 0) return { available: true };
	const reasoning = model.reasoning;
	return reasoning !== void 0 && (reasoning.defaultEffort === alias.reasoningEffort || reasoning.efforts.some((effort) => effort.id === alias.reasoningEffort)) ? { available: true } : {
		available: false,
		reason: "effort"
	};
}
//#endregion
//#region src/index.ts
const MODEL_ALIASES_SETTINGS_NAMESPACE = settingsNamespace("model-aliases");
const MODEL_ALIAS_SCHEMA = z.object({
	name: z.string().required().description("选择器中显示的唯一别名"),
	provider: z.string().required().description("DSH 提供商路由 ID"),
	model: z.string().required().description("提供商拥有的模型 ID"),
	reasoningEffort: z.string().description("可选；缺省时保留提供商默认行为")
});
const MODEL_ALIASES_SETTINGS_SCHEMA = z.object({ aliases: z.array(MODEL_ALIAS_SCHEMA).default([...DEFAULT_MODEL_ALIASES]).description("按显示顺序排列的模型别名；从未设置时使用默认别名") });
/** 设置持久化是插件的硬依赖；缺少 settings 时应保持等待，而不是静默退化。 */
const inject = ["settings"];
function apply(ctx) {
	const options = {
		applies: "live",
		expose: "configuration-client",
		validate: validateModelAliasSettings
	};
	ctx.settings.register(MODEL_ALIASES_SETTINGS_NAMESPACE, MODEL_ALIASES_SETTINGS_SCHEMA, options);
}
//#endregion
export { DEFAULT_MODEL_ALIASES, MODEL_ALIASES_SETTINGS_NAMESPACE, MODEL_ALIASES_SETTINGS_SCHEMA, MODEL_ALIAS_SCHEMA, aliasAvailability, aliasForSelection, apply, decodeModelAliasSettings, inject, normalizeModelAliases, sameSelection, selectionKey, validateModelAliasSettings };

//# sourceMappingURL=index.js.map