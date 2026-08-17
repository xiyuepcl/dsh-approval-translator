# dsh-translator

DeepSeek-powered approval translation for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh).

When the agent requests approval (e.g. a sandbox escalation), the approval dialog's reason text is translated into Simplified Chinese **before it reaches the browser** — the dialog renders natively in Chinese and React re-renders cannot revert it.

## Install

```sh
npx -y @deepseek-ai/dsh plugin --profile web add dsh-translator
```

Then restart the web UI / EAC. No configuration needed — it uses your configured DeepSeek provider/credential (a few tokens per approval, ~1s latency).

## How it works

- Node half prepends an `approval/request` waterfall listener (via `ctx.on(..., true)` so it runs ahead of the web answerer) that translates `req.reason` with the harness's own `ctx.llm`.
- The durable `approval/asked` audit event keeps the original English reason; only the displayed text is translated.
- Already-Chinese or untranslatable reasons pass through untouched; translation failures never block an approval.
- Browser half is a deliberate no-op (the earlier DOM-walking approach was defeated by React re-renders).

## Uninstall

```sh
npx -y @deepseek-ai/dsh plugin --profile web remove dsh-translator
```

## License

MIT
