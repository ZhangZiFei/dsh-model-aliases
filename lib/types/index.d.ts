import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type ModelAlias } from './domain.js';
export * from './domain.js';
export declare const MODEL_ALIAS_SCHEMA: z<ModelAlias>;
/**
 * Host 侧按需声明的运行时切片。`loader` 与 `profileContext` 由 DSH 的组合层提供，
 * 声明在这里只用于读取「载入器已稳定」和 profile 主目录，不复制它们的状态机。
 */
interface HostLoaderFace {
    await(): Promise<unknown>;
}
interface HostProfileFace {
    readonly home: string;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        loader?: HostLoaderFace;
        profileContext?: HostProfileFace;
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
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    aliases: z<NoInfer<ModelAlias[]>, NoInfer<ModelAlias[]>, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    aliases: z<NoInfer<ModelAlias[]>, NoInfer<ModelAlias[]>, "volatile-defined">;
}>>, "plain">;
/** 设置表单策略是插件的硬依赖；缺少 settings 时应保持等待，而不是静默退化。 */
export declare const inject: string[];
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map