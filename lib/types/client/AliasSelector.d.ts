import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ModelAliasSettings } from '../domain.js';
import { NS } from './locales.js';
export interface AliasSelectorInjected {
    available: boolean;
    aliases: SettingsScope<ModelAliasSettings>;
    directory: SnapshotStore<ModelDirectoryState>;
    loadDirectory: () => void;
    select: (selection: ModelSelection) => Promise<boolean>;
}
type AliasSelectorProps = PropsRuntime<'conversation.input.model'> & InjectFace<AliasSelectorInjected> & PropsLocale<typeof NS>;
export declare function AliasSelector(props: AliasSelectorProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=AliasSelector.d.ts.map