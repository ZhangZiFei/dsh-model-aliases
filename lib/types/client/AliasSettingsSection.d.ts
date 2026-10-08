import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { AliasSettingsEditorInjected } from './index.js';
import { NS } from './locales.js';
/**
 * 设置页由 apply 闭包注入业务面：插槽只提供全局会话座位与语言座位。
 * `loadCatalog` 自行挑选可用的已挂载会话，页面只负责在会话集合变化时重试。
 */
export interface AliasSettingsSectionInjected extends AliasSettingsEditorInjected {
    loadCatalog: () => Promise<ModelDirectoryState>;
}
type AliasSettingsSectionProps = PropsRuntime<'settings.section'> & PropsLocale<typeof NS> & AliasSettingsSectionInjected;
export declare function AliasSettingsSection(props: AliasSettingsSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=AliasSettingsSection.d.ts.map