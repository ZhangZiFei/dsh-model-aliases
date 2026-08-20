export interface ModelAlias {
    name: string;
    provider: string;
    model: string;
    reasoningEffort?: string;
}
export interface ModelAliasSettings {
    aliases: ModelAlias[];
}
/** 首次使用或用户清空别名后自动恢复的默认别名。 */
export declare const DEFAULT_MODEL_ALIASES: readonly ModelAlias[];
export interface ModelSelectionLike {
    provider: string;
    model: string;
    reasoningEffort?: string;
}
export interface CatalogModelLike {
    id: string;
    reasoning?: {
        efforts: readonly {
            id: string;
        }[];
        defaultEffort?: string;
    };
}
export interface CatalogGroupLike {
    id: string;
    models: readonly CatalogModelLike[];
}
/** 在 Client 设置边界将未知 wire 值收窄为领域设置。 */
export declare function decodeModelAliasSettings(value: unknown): ModelAliasSettings | undefined;
/** 校验设置服务已经完成 schema 校验后的跨字段约束。 */
export declare function validateModelAliasSettings(value: ModelAliasSettings): void;
/** 去除表单输入首尾空白，并保留“未指定推理等级”的语义。 */
export declare function normalizeModelAliases(aliases: readonly ModelAlias[]): ModelAlias[];
/** 为完整模型选择生成无分隔符碰撞的稳定键。 */
export declare function selectionKey(selection: ModelSelectionLike): string;
export declare function sameSelection(left: ModelSelectionLike, right: ModelSelectionLike): boolean;
export declare function aliasForSelection(aliases: readonly ModelAlias[], selection: ModelSelectionLike | null, groups?: readonly CatalogGroupLike[]): ModelAlias | undefined;
export interface AliasAvailability {
    available: boolean;
    reason?: 'provider' | 'model' | 'effort';
}
/** 依据当前会话目录判断别名是否仍可选择。 */
export declare function aliasAvailability(alias: ModelAlias, groups: readonly CatalogGroupLike[]): AliasAvailability;
//# sourceMappingURL=domain.d.ts.map