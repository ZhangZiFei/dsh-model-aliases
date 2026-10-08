import type { Context } from '@deepseek-ai/cordis';
import { type ModelAlias } from '../domain.js';
import { type ModelAliasesKey } from './locales.js';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'settings.model-aliases': ModelAliasesKey;
    }
}
/** Client 端所需服务；modelDirectories 保证复用 DSH 原生模型目录与选择链路。 */
export declare const inject: string[];
/** 别名设置的读取面：DSH 共享配置表单的别名快照。 */
export interface AliasSettingsInjected {
    getAliases: () => readonly ModelAlias[];
    subscribe: (listener: () => void) => () => void;
}
/** 设置页面多一个写入口：一次 revision 围栏内的原子别名写入。 */
export interface AliasSettingsEditorInjected extends AliasSettingsInjected {
    /** 当前 Host 同步状态；`loading` 表示首个已接受值尚未到达。 */
    status: () => 'loading' | 'ready' | 'unavailable';
    /** Host 文档是否接受写入。 */
    writable: () => boolean;
    save: (aliases: readonly ModelAlias[]) => Promise<boolean>;
}
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map