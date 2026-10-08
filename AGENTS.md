# AGENTS.md

本文件适用于 `dsh-model-aliases` 项目目录及其全部子目录。

## 项目目标

本项目是 DeepSeek Harness 的安装式 Host + Client Cordis 插件：

- Host 通过 profile 条目 `model-aliases` 的 `Config` schema 拥有持久化别名配置；
- Client 在设置面板提供别名编辑页面；
- Client 在输入框工具行提供别名选择器，与原生“模型 / 推理等级”控件并存；
- 所有模型选择必须继续经过 DSH 原生 `ModelDirectory.select()` 链路。

当前兼容目标为 DeepSeek Harness `0.2.0-rc.2`。

## 语言与实现原则

- 回复、文档、代码注释和用户可见文案优先使用中文；英文 locale 必须与中文词条完整对应。
- 选择能够完整满足当前需求的最简单实现，不为假设中的未来需求提前增加抽象。
- 不保留已经废弃的实现路径；替换实现后删除旧代码、旧声明和旧文档。
- 优先复用 DSH 已有服务和类型，不复制其私有组件、RPC 状态机或模型目录逻辑。
- 不直接修改 `lib/` 构建产物；只修改 `src/`、测试和项目配置，然后重新构建。

## 架构边界

### Host

- 设置面就是 profile 条目的 Config：导出 `Config` schema，条目 id 固定为 `model-aliases`（`MODEL_ALIASES_ENTRY_ID`）。
- `aliases` 字段必须 `.volatile()`，否则 `SettingsForms` 不把它当实时字段，配置表单看不到它。
- `apply` 只做两件事：用 `ctx.settings.configure({ auto: false })` 关闭自动生成页面，并在载入器稳定后补做一次旧 `settings.yaml.imported` 迁移。
- 迁移只在条目从未被写入（`describe().user === undefined`）时执行一次；失败只记日志，不改写原文件。
- 跨字段约束（唯一名称、唯一完整选择、首尾空白）放在 `validateModelAliasSettings()` 中：0.2 的设置服务没有写入期校验钩子，客户端提交前校验，Host 侧只在迁移时校验。
- `reasoningEffort` 缺省表示保留适配器或提供商默认行为，不得自动写入虚构默认值。
- `@deepseek-ai/schemastery` 和 `yaml` 是运行时 dependency；Cordis 和 DSH 服务包保持 peer dependency。

### Client 设置

- 持久化读写必须复用 `ctx.configForms.get(MODEL_ALIASES_ENTRY_ID)`。
- 不重新实现低层 `settings.describe/update/replace/mutate` 控制器。
- 由共享配置表单负责 revision 围栏、串行写入、冲突恢复、重连和 `settings/document-updated`。
- wire 数据必须先通过 `decodeModelAliasSettings()` 收窄；`getAliases()` 必须按快照缓存结果，保证 `useSyncExternalStore` 的引用稳定性。
- 别名写入使用一次 `mutate([{ op: 'set', path: ['aliases'], value }])`，不逐字段写。
- 远端或只读设置环境必须禁用写操作，不得伪装保存成功（`writable()` 为假时禁用全部编辑控件）。

### Client 模型选择

- 必须复用 `ctx.modelDirectories.directoryFor(sessionId)`。
- 不直接另起 `sessions.models()` 或 `sessions.selectModel()` 状态链路。
- 别名选择器注册到 `conversation.input.right`（list 插槽），不得遮蔽 `conversation.input.model` 原生座位；保留原 `ui-model-selection` 插件以提供 `modelDirectories` 和原生座位。
- 该插槽在 0.2 没有 owner 共享，注册时用 `inject` 工厂提供业务面，`loadCatalog` 等只依赖 `sessionId` 的能力由 apply 闭包持有。
- 别名只是完整选择的快捷方式：选择别名通过同一个 `ModelDirectory.select()` 改写原生座位内容，原生座位上的手动选择也直接决定别名选择器的显示。
- 当前别名始终由完整选择 `{ provider, model, reasoningEffort? }` 推导，不保存独立的 `selectedAliasId`。
- 工具行插槽没有 owner 的 `locked` 共享，组件必须用 `useSession()` 的会话事实（`removed`）自行关闭交互。
- 使用 `sessions.subagentAddress(sessionId)` 阻止被寻址子代理会话进行模型选择。
- catalog 只用于判断能否发起新的选择：别名不在 catalog 时应保留但禁用；不能据此断言当前 route 一定不可路由。
- reasoning effort 必须来自目标模型的 reasoning metadata，不得维护全局固定词表。

## 设置数据约束

持久化位置：profile patch 中 `model-aliases` 条目的 `config.aliases`。

```yaml
- id: model-aliases
  name: dsh-model-aliases
  config:
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
- 保存前标准化表单值，空 reasoning effort 必须删除字段而不是保存空字符串；
- `aliases` 为空数组时界面按 `DEFAULT_MODEL_ALIASES` 显示，但不得为了“修复”而自动写回。

## Cordis 生命周期

- Slot、locale、style、事件和其他副作用必须归属当前 Cordis fiber。
- 使用 `ctx.effect()`、`ctx.on()` 或返回 disposer 的官方注册 API。
- 更新或卸载后不得遗留 style 标签、事件监听器或设置观察器。
- Client bundle 中跨插件协作通过 Cordis service 完成；运行时只 externalize DSH 浏览器模块表已有的共享模块。

## 文件职责

- `src/index.ts`：Host 条目 `Config` schema、页面策略与旧设置迁移。
- `src/domain.ts`：Host/Client 共享的纯领域规则、条目 id 与 wire decoder。
- `src/client/index.tsx`：Client Cordis 注册、Slot 注入和配置表单装配。
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
- `lib/client.js` 只 `require()` DSH ModuleLoader 提供的共享模块（当前为 `react`、`react/jsx-runtime`、`@deepseek-ai/dsh-client-ui-primitives`）。

## 安装与 DSH 文件边界

- 开发安装使用 `dsh plugin --profile <profile> add link:.`；本机桌面 Profile 为 `desktop`。
- 插件行写入用户 Profile：`$DSH_HOME/profiles/<profile>/cordis.patch.yml`。
- 不修改 DSH 安装目录（`app.asar` / `app.asar.unpacked`）内的任何文件。
- 不修改或删除 DSH 随发行版提供的 agent preset。
- CLI 安装只写文件，不会热加载：必须重启提供 `DSH_WEB_URL` 的 DSH 进程并刷新页面；不要启动第二个服务器冒充现有 GUI。
