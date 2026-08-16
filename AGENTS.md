# AGENTS.md

本文件适用于 `dsh-model-aliases` 项目目录及其全部子目录。

## 项目目标

本项目是 DeepSeek Harness Web 的安装式 Host + Client Cordis 插件：

- Host 注册并拥有持久化的 `model-aliases` 设置命名空间；
- Client 在设置面板提供别名编辑页面；
- Client 使用单一别名选择器遮蔽默认“模型 / 推理等级”控件；
- 所有模型选择必须继续经过 DSH 原生 `ModelDirectory.select()` 链路。

当前兼容目标为 DeepSeek Harness `0.1.0-rc.6`。

## 语言与实现原则

- 回复、文档、代码注释和用户可见文案优先使用中文；英文 locale 必须与中文词条完整对应。
- 选择能够完整满足当前需求的最简单实现，不为假设中的未来需求提前增加抽象。
- 不保留已经废弃的实现路径；替换实现后删除旧代码、旧声明和旧文档。
- 优先复用 DSH 已有服务和类型，不复制其私有组件、RPC 状态机或模型目录逻辑。
- 不直接修改 `lib/` 构建产物；只修改 `src/`、测试和项目配置，然后重新构建。

## 架构边界

### Host

- 设置 namespace 固定为 `model-aliases`。
- 使用 `settingsNamespace()` 和 Schemastery schema 注册 namespace。
- `settings` 是硬依赖；不要增加进程内配置回退。
- 跨字段约束放在 `validateModelAliasSettings()` 中。
- `reasoningEffort` 缺省表示保留适配器或提供商默认行为，不得自动写入虚构默认值。
- `@deepseek-ai/schemastery` 是运行时 dependency；Cordis 和 DSH 服务包保持 peer dependency。

### Client 设置

- 持久化读写必须复用 `ctx.settingsScope`。
- 不重新实现低层 `settings.describe/update/replace/mutate` 控制器。
- 由 `settingsScope` 负责 revision、串行写入、冲突恢复、重连和 `settings/document-updated`。
- wire 数据必须先通过 `decodeModelAliasSettings()` 收窄。
- 远端或只读设置环境必须禁用写操作，不得伪装保存成功。

### Client 模型选择

- 必须复用 `ctx.modelDirectories.directoryFor(sessionId)`。
- 不直接另起 `sessions.models()` 或 `sessions.selectModel()` 状态链路。
- `conversation.input.model` 使用 `priority: -1` 遮蔽默认 occupant；保留原 `ui-model-selection` 插件以提供 `modelDirectories`。
- 当前别名始终由完整选择 `{ provider, model, reasoningEffort? }` 推导，不保存独立的 `selectedAliasId`。
- 组件必须尊重 owner 的 `locked`。
- 使用 `sessions.subagentAddress(sessionId)` 阻止被寻址子代理会话进行模型选择。
- catalog 只用于判断能否发起新的选择：别名不在 catalog 时应保留但禁用；不能据此断言当前 route 一定不可路由。
- reasoning effort 必须来自目标模型的 reasoning metadata，不得维护全局固定词表。

## 设置数据约束

持久化格式：

```yaml
model-aliases:
  aliases:
    - name: 日常
      provider: deepseek
      model: deepseek-chat
    - name: 深度推理
      provider: openai
      model: o3
      reasoningEffort: high
```

约束：

- 名称、provider、model 以及存在的 reasoningEffort 必须是首尾无空白的非空字符串；
- 别名名称唯一；
- 完整模型选择唯一，避免当前选择映射到多个别名；
- 保存前标准化表单值，空 reasoning effort 必须删除字段而不是保存空字符串。

## Cordis 生命周期

- Slot、locale、style、事件和其他副作用必须归属当前 Cordis fiber。
- 使用 `ctx.effect()`、`ctx.on()` 或返回 disposer 的官方注册 API。
- 更新或卸载后不得遗留 style 标签、事件监听器或设置观察器。
- Client bundle 中跨插件协作通过 Cordis service 完成；运行时只 externalize DSH 浏览器模块表已有的共享模块。

## 文件职责

- `src/index.ts`：Host 设置 namespace 和 schema 注册。
- `src/domain.ts`：Host/Client 共享的纯领域规则与 wire decoder。
- `src/client/index.tsx`：Client Cordis 注册、Slot 注入和服务装配。
- `src/client/AliasSelector.tsx`：composer 别名选择器。
- `src/client/AliasSettingsSection.tsx`：设置页面和编辑状态。
- `src/client/locales.ts`：中英文词典。
- `src/client/styles.ts`：随 Cordis fiber 安装和移除的样式文本。
- `test/`：纯领域规则与边界解码测试。
- `lib/`：生成产物，不手工编辑。

## 必做验证

修改源码或构建配置后运行：

```powershell
pnpm run build
pnpm test
pnpm pack --dry-run
```

验收要求：

- TypeScript 严格检查通过；
- Host 和 Client bundle 构建无警告；
- 全部测试通过；
- 发布清单不包含已删除源码对应的陈旧声明；
- `lib/client.js` 不得产生 DSH ModuleLoader 无法提供的运行时 `require()`。

## 安装与 DSH 文件边界

- 开发安装使用 `dsh plugin --profile web add link:.`。
- 插件行写入用户 Web Profile：`$DSH_HOME/profiles/web/cordis.patch.yml`。
- 不修改全局 npm 安装目录中的 `@deepseek-ai/dsh-web-app/cordis.patch.yml`。
- 不修改或删除 DSH 随发行版提供的 agent preset。
- 组合变更或普通 Client 构建后，需要重启当前提供 `http://127.0.0.1:3080` 的 DSH Web 进程并刷新页面；不要启动第二个服务器冒充现有 GUI。
