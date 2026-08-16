# DSH 模型别名插件

这是一个安装式 Host + Client Cordis 插件，为 DeepSeek Harness Web 提供持久化模型别名。

## 功能

- Host 注册 `model-aliases` 设置命名空间，配置写入 DSH 现有设置提供方。
- 设置面板新增“模型别名”页面，可绑定：
  - 唯一别名；
  - provider 路由；
  - model ID；
  - 可选 reasoning effort。
- 输入框右侧以单一别名选择器替换默认“模型 / 推理等级”控件。
- 选择仍调用 `ModelDirectory.select()`，保留 DSH 原生路由校验、图片兼容检查、会话状态和默认选择持久化行为。
- 当前目录中不存在的别名会保留在设置里，但在选择器中禁用并标明原因。
- 当前完整选择不能精确映射到别名时显示“自定义”。

## 项目结构

- `src/index.ts`：Host 插件与 Schemastery 设置 schema。
- `src/domain.ts`：共享领域类型、校验和选择映射。
- `src/client/index.tsx`：Client Cordis 注册入口。
- `src/client/AliasSelector.tsx`：会话模型别名选择器。
- `src/client/AliasSettingsSection.tsx`：别名设置页面。
- Client 持久化复用 `ctx.settingsScope`，由 DSH 处理 revision、串行写入、重连和外部更新。
- `test/domain.test.ts`：领域规则测试。

## 开发

```powershell
pnpm install
pnpm build
pnpm test
```

构建产物：

- `lib/index.js`：Host 入口；
- `lib/client.js`：DSH ModuleLoader 格式的浏览器包；
- `lib/types/`：TypeScript 声明。

## 安装到 DSH

插件必须同时满足以下条件：

1. `dsh-model-aliases` 能从 Web Profile 的 Node 解析路径找到；
2. Web Profile 的 Cordis Patch 中存在插件行；
3. 原有 `@deepseek-ai/dsh-client-ui-model-selection` 保持挂载，以提供 `modelDirectories` 服务；
4. Host 已挂载可写的 `settings` 提供方。

### 1. 构建插件

```powershell
cd D:\Agents\temp\dsh-model-aliases
pnpm install
pnpm build
pnpm test
```

### 2. 链接到 Web Profile

在插件目录执行：

```powershell
dsh plugin --profile web add link:.
```

`dsh` 会把相对路径锚定到当前插件目录，并将其作为 Web Profile 的本地链接依赖。CLI 可能提示：

```text
declares no dsh.bundle — installed as a plain dependency
```

这是正常提示：本项目是由 Cordis Patch 挂载的普通插件，不是提供整套 Profile Patch 的 Bundle。

验证依赖已经解析：

```powershell
dsh plugin --profile web why dsh-model-aliases
```

### 3. 添加 Cordis 插件行

编辑 `$DSH_HOME\profiles\web\cordis.patch.yml`。当前机器的默认位置是：

```text
C:\Users\zhang\.dsh\profiles\web\cordis.patch.yml
```

如果文件内容仍是 `[]`，将它替换为：

```yaml
# 本机 Web Profile 自定义插件
- insert:
    - id: model-aliases
      name: dsh-model-aliases
```

不要修改全局 npm 安装目录中的 `@deepseek-ai/dsh-web-app/cordis.patch.yml`；该文件属于已安装发行包，升级时会被覆盖。

这个用户 Patch 在 `dsh-web-app` Bundle 之后应用，因此插件会在默认 `ui-model-selection` 行之后插入。Client 清单负责等待模型选择、设置、会话和本地化插件；`conversation.input.model` 使用 `priority: -1` 遮蔽默认 occupant，不修改默认组件源码。

### 4. 验证组合

```powershell
dsh web --dump-config | Select-String -Pattern "model-aliases"
```

输出中应同时出现：

```yaml
id: model-aliases
name: dsh-model-aliases
```

### 5. 重启并验证页面

必须重启当前正在服务 `http://127.0.0.1:3080` 的 DSH Web 进程，然后刷新页面；不要另起第二个服务器。重启当前进程可能中断正在进行的会话。

重启后验证：

- 设置面板出现“模型别名”页面；
- 输入框右侧显示别名选择器；
- 新增并保存别名后，设置写入 `$DSH_HOME\settings.yaml` 的 `model-aliases` 分节；
- 选择别名后，会话模型通过原生 `ModelDirectory.select()` 链路更新。

### 更新本地插件

`link:.` 会直接引用本项目。修改源码后只需重新构建：

```powershell
cd D:\Agents\temp\dsh-model-aliases
pnpm build
```

随后重启当前 DSH Web 进程。没有运行 DSH checkout 的 `pnpm run dev:web` watcher 时，不应期待 Client 代码自动热更新。

### 卸载

1. 从 `$DSH_HOME\profiles\web\cordis.patch.yml` 删除 `model-aliases` 插入行；
2. 执行：

```powershell
dsh plugin --profile web remove dsh-model-aliases
```

3. 重启当前 DSH Web 进程。

## 数据格式

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

- 所有字段必须是首尾无空白的非空字符串；
- 别名名称唯一；
- provider、model、reasoningEffort 组成的完整选择唯一；
- 缺省 `reasoningEffort` 表示保留适配器或提供商默认行为。
