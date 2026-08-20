import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type ModelAlias, type ModelAliasSettings } from './domain.js';
export * from './domain.js';
export declare const MODEL_ALIASES_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
export declare const MODEL_ALIAS_SCHEMA: z<ModelAlias>;
export declare const MODEL_ALIASES_SETTINGS_SCHEMA: z<ModelAliasSettings>;
/** 设置持久化是插件的硬依赖；缺少 settings 时应保持等待，而不是静默退化。 */
export declare const inject: string[];
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map