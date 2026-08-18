# DSH审批汉化 · dsh-translator

**DSH审批汉化** — DeepSeek 驱动的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) 审批弹窗自动汉化插件。

Agent 请求审批（如沙箱权限升级）时，审批弹窗的说明文字会在**到达浏览器之前**被翻译成简体中文——弹窗原生渲染中文，React 重渲染也无法还原。命令行为保持英文（它是命令，不是说明）。

> Approval dialog auto-translation for DeepSeek Harness (dsh). The reason text is translated to Simplified Chinese **before** it reaches the browser, so React can never revert it; the command line stays English on purpose.

## 安装 Install

```sh
npx -y @deepseek-ai/dsh plugin --profile web-desktop add https://github.com/xiyuepcl/DSH审批汉化/releases/download/v0.1.1/dsh-translator-0.1.1.tgz
```

（桌面客户端 EAC 4.x 用 `web-desktop` profile；CLI 网页版用 `web`。）装完重启 Web 服务/EAC 即可。无需配置——使用你已配置的 DeepSeek provider/凭据（每次审批约 1 秒 + 少量 token）。

> EAC 4.x uses the `web-desktop` profile; the CLI web uses `web`. Replace the profile name accordingly.

## 原理 How it works

- Node 半边以 `ctx.on('approval/request', ..., true)`（prepend）挂一个瀑布监听器，抢在官方答案器之前用 `ctx.llm` 翻译 `req.reason`。
- 持久化的 `approval/asked` 审计事件保留英文原文；只有展示给用户的文本被翻译。
- 已是中文或不可翻译的 reason 原样放行；翻译失败绝不影响审批（仅记录一条错误日志）。
- 浏览器半边是无操作（早先的 DOM 改写方案被 React 重渲染击败，已弃用）。

## 卸载 Uninstall

```sh
npx -y @deepseek-ai/dsh plugin --profile web-desktop remove dsh-translator
```

## License

MIT
