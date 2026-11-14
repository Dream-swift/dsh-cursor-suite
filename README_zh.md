# dsh-cursor-suite

[English](README.md) | **简体中文**

一个 DeepSeek Harness 插件，把两半能力打成一套安装：

1. **Cursor 订阅通道**：浏览器 PKCE 登录、模型发现、Agent 协议流式对话；工具走 DSH 本地工具，而不是 Cursor 原生 exec。
2. **`read_image` 视觉桥**：当前路由（含 Cursor）看不了图时，把图片交给具备视觉能力的子路由，再把文字结果交回模型。

> ⚠️ Cursor 半边对接的是未公开的 Agent 协议（`agent.v1.AgentService/Run`），属于社区逆向，Cursor 改服务端后可能失效。与 Anysphere / Cursor 无关，请遵守 Cursor 服务条款。

## 功能

- 用 Cursor 账号登录（无需 API Key）；凭证进 DSH 凭据库并自动刷新。
- 模型列表来自可用模型发现；命名池用量 ≥95% 时目录只保留 **Auto**，会话里旧的命名模型会自动改到 Auto。
- 流式正文与思考；原生 Shell/Read/Grep 等会被拒绝，文案与 [dsh-cursor-subscription](https://github.com/orrinzeng/dsh-cursor-subscription) 一致。
- 流结束策略与上游 subscription 一致：答案步等 `turnEnded`，不因 checkpoint 提前收束。
- 接管内置 `read_image`，让「声称支持图片却丢像素」的路由也能读图。
- 设置页：**设置 → Cursor Suite**（命名空间 `cursor-suite`）。

## 安装

### 插件市场（dshmarket）

收录进 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 后，可在 **插件 → 插件市场** 搜索 `dsh-cursor-suite` 安装，或：

```sh
dsh plugin --profile desktop add github:Dream-swift/dsh-cursor-suite
```

装完后重启 DSH。同一 profile **不要**再装 `dsh-cursor-subscription` 或单独的 read-image 桥，本套件已包含两者。

### 从 GitHub 手动安装

```sh
dsh plugin --profile desktop add github:Dream-swift/dsh-cursor-suite
dsh plugin --profile desktop list dsh-cursor-suite --depth 0
```

pnpm 可能跳过 24 小时内刚发的版本；可钉死版本号，或在 profile 的 `pnpm-workspace.yaml` 里把本包装进 `minimumReleaseAgeExclude`。

### 本地开发

在 profile 目录（如 `%USERPROFILE%\.dsh\profiles\desktop`）：

```sh
pnpm add file:G:/DeepSeek_Sandbox/qqbot/_repo/dsh-cursor-suite
```

把 `dsh-cursor-suite` 写进该 profile `package.json` 的 `dsh.profile.bundles`，然后重启 DSH。

## 登录与使用

1. 打开 **设置 → Cursor Suite**。
2. 选 **浏览器登录**，完成 Cursor 授权。
3. 在会话模型选择器里选 Cursor 模型或 Auto。
4. 需要跑命令/读文件时走 DSH 工具（`pwsh`、`read`、`grep` 等），不要用 Cursor 原生 Shell。

读图：在 Cursor 路由下调用 `read_image` 时，桥可能打到视觉路由（默认 `deepseek-account` / `deepseek-flash`）。需要改配置时编辑 `~/.dsh/read-image-bridge.json`。

## 更新与卸载

```sh
dsh plugin --profile desktop update dsh-cursor-suite
dsh plugin --profile desktop remove dsh-cursor-suite
```

之后手动重启 DSH。

## 与 dsh-cursor-subscription 的关系

| | `dsh-cursor-subscription` | `dsh-cursor-suite` |
|--|--|--|
| Cursor 通道 | 有 | 有 |
| `read_image` 桥 | 无 | 有 |
| 设置命名空间 | `cursor-subscription` | `cursor-suite` |
| Bundle 行 id | `cursor-subscription` | `cursor-suite` |

每个 profile 只装其中一个即可。

## 排错

- **登录后仍显示未登录：** 确认浏览器走完回调；轮询大约 2.5 分钟。
- **模型列表为空：** 发现失败时会用内置兜底列表，仍可手填模型 id。
- **401：** 刷新令牌失效时重新登录。
- **`patch: entry "cursor-suite" not found` / peer 不兼容：** 安装与当前 DSH（0.2.0-rc 线）匹配的版本。
- **Cursor 下图片无效：** 确认已加载本套件，且 bundle patch 已关闭内置 `tool-fs.readImage`。

## 许可证

[MIT](LICENSE)
