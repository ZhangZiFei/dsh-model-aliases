import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { parse } from "yaml";
//#region src/domain.ts
/** 插件在 profile patch 中的条目 id：Host 设置 namespace 与 Client 表单键共用它。 */
const MODEL_ALIASES_ENTRY_ID = "model-aliases";
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
const MODEL_ALIAS_SCHEMA = z.object({
	name: z.string().required().description("选择器中显示的唯一别名"),
	provider: z.string().required().description("DSH 提供商路由 ID"),
	model: z.string().required().description("提供商拥有的模型 ID"),
	reasoningEffort: z.string().description("可选；缺省时保留提供商默认行为")
});
/**
* 条目 Config 就是设置 namespace：DSH 0.2 用 profile 条目的 Config schema 描述可写字段。
* `volatile` 让 `aliases` 成为可在运行期改写的实时字段，配置表单据此暴露它；
* 本插件自带设置页面，所以自动生成的呈现由 apply 关闭。
*
* 这里刻意不写 `z<ModelAliasSettings>` 注解：`.volatile()` 会把该字段的 metadata 类型
* 标记成 `Volatile<ModelAlias[]>`（schema 内部的实时引用包装），使 `z<T>` 的元数据类型
* 比较失败，而 DSH 读取的是 `schema.toJSON()`，输出类型仍由 schema 推导为同一形状。
*/
const Config = z.object({ aliases: z.array(MODEL_ALIAS_SCHEMA).default([...DEFAULT_MODEL_ALIASES]).description("按显示顺序排列的模型别名；从未设置时使用默认别名").volatile() });
/** 设置表单策略是插件的硬依赖；缺少 settings 时应保持等待，而不是静默退化。 */
const inject = ["settings"];
function apply(ctx) {
	ctx.effect(() => ctx.settings.configure({ auto: false }), "model-aliases: disable the generated settings page");
	const loader = ctx.get("loader");
	const profile = ctx.get("profileContext");
	if (loader === void 0 || profile === void 0) return;
	loader.await().then(() => migrateLegacyAliases(ctx, profile.home));
}
/** 迁移的重试间隔：条目要等载入器把本插件激活后才会出现在设置描述里。 */
const MIGRATION_RETRY_MS = 500;
const MIGRATION_ATTEMPTS = 12;
/**
* 迁移 `settings.yaml.imported` 中本插件的旧别名段。
*
* 条目只有在被载入器激活后才会出现在 `describe()` 里，而激活与 profile 写入都可能晚于
* 首次调用，所以这里做有限重试：一旦条目可见就立即给出结论（迁移、已写入、无旧数据），
* 只有仍不可见才继续等待。
*/
async function migrateLegacyAliases(ctx, home) {
	for (let attempt = 0; attempt < MIGRATION_ATTEMPTS; attempt += 1) {
		try {
			if (await migrateOnce(ctx, home) !== "pending") return;
		} catch (error) {
			ctx.logger.warn("model-aliases: 旧别名迁移失败，已保留 settings.yaml.imported", error);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, MIGRATION_RETRY_MS));
	}
}
/** 一次迁移尝试；`pending` 表示条目尚未出现在设置描述里，值得重试。 */
async function migrateOnce(ctx, home) {
	const current = ctx.settings.describe().find((entry) => entry.ns === MODEL_ALIASES_ENTRY_ID);
	if (current === void 0) return "pending";
	if (current.user !== void 0) return "done";
	const path = join(home, "settings.yaml.imported");
	if (!existsSync(path)) return "done";
	const document = parse(await readFile(path, "utf8"));
	if (typeof document !== "object" || document === null) return "done";
	const section = Reflect.get(document, MODEL_ALIASES_ENTRY_ID);
	if (typeof section !== "object" || section === null) return "done";
	const aliases = decodeLegacyAliases(Reflect.get(section, "aliases"));
	if (aliases === void 0) return "done";
	await ctx.settings.update(MODEL_ALIASES_ENTRY_ID, aliases);
	ctx.logger.info("model-aliases: 已迁移 %d 条旧别名到条目配置", aliases.aliases.length);
	return "done";
}
/** 把旧设置段收窄为合法别名列表；不合法的旧数据保持原样，不写入 profile patch。 */
function decodeLegacyAliases(value) {
	if (!Array.isArray(value)) return void 0;
	const aliases = [];
	for (const entry of value) {
		const { name, provider, model, reasoningEffort } = MODEL_ALIAS_SCHEMA(entry);
		aliases.push({
			name,
			provider,
			model,
			...reasoningEffort === void 0 ? {} : { reasoningEffort }
		});
	}
	const settings = { aliases };
	validateModelAliasSettings(settings);
	return settings;
}
//#endregion
export { Config, DEFAULT_MODEL_ALIASES, MODEL_ALIASES_ENTRY_ID, MODEL_ALIAS_SCHEMA, aliasAvailability, aliasForSelection, apply, decodeModelAliasSettings, inject, normalizeModelAliases, sameSelection, selectionKey, validateModelAliasSettings };

//# sourceMappingURL=index.js.map