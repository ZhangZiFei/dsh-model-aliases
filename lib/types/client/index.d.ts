import type { Context } from '@deepseek-ai/cordis';
import { type ModelAliasesKey } from './locales.js';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'settings.model-aliases': ModelAliasesKey;
    }
}
/** Client 端所需服务；modelDirectories 保证复用 DSH 原生模型目录与选择链路。 */
export declare const inject: string[];
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map