import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client';
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ModelAliasSettings } from '../domain.js';
import { NS } from './locales.js';
export interface AliasSettingsSectionInjected {
    aliases: SettingsScope<ModelAliasSettings>;
    loadCatalog: (sessionId: SessionId) => Promise<ModelDirectoryState>;
}
type AliasSettingsSectionProps = PropsRuntime<'settings.section'> & InjectFace<AliasSettingsSectionInjected> & PropsLocale<typeof NS>;
export declare function AliasSettingsSection(props: AliasSettingsSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=AliasSettingsSection.d.ts.map