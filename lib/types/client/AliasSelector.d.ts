import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { AliasSettingsInjected } from './index.js';
import { NS } from './locales.js';
/** 选择器由 apply 闭包注入业务面：插槽只提供会话与语言座位。 */
export interface AliasSelectorInjected extends AliasSettingsInjected {
    available: boolean;
    directory: SnapshotStore<ModelDirectoryState>;
    loadDirectory: () => void;
    select: (selection: ModelSelection) => Promise<boolean>;
}
type AliasSelectorProps = PropsRuntime<'conversation.input.right'> & PropsLocale<typeof NS> & AliasSelectorInjected;
/**
 * 输入框工具行中的别名选择器：与原生「模型 / 推理等级」座位并存。
 * 两侧读写同一个 per-session ModelDirectory，别名只是完整选择的快捷方式；
 * 原生座位上的手动选择会立刻反映为别名或“自定义”。
 */
export declare function AliasSelector(props: AliasSelectorProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=AliasSelector.d.ts.map