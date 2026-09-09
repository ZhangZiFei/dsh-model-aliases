import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
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
type AliasSelectorProps = PropsRuntime<'conversation.input.right'> & InjectFace<AliasSelectorInjected> & PropsLocale<typeof NS>;
/**
 * 输入框工具行中的别名选择器：与原生「模型 / 推理等级」座位并存。
 * 两侧读写同一个 per-session ModelDirectory，别名只是完整选择的快捷方式；
 * 原生座位上的手动选择会立刻反映为别名或“自定义”。
 */
export declare function AliasSelector(props: AliasSelectorProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=AliasSelector.d.ts.map