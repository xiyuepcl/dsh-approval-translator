// dsh-translator — DeepSeek-powered translation route for the dsh web UI (node half).
//
// POST /translator/translate
//   { texts: string[], target?: 'zh' | 'en' | ... }
// -> { translations: string[], provider, model }
//
// Each text becomes one auxiliary model call through the harness's own
// ctx.llm service (the user's configured provider and credential — no extra
// API key, no external service, respects the user's provider choice). The
// dsh-llm value constructors are imported by file URL through the profile's
// flat fallback dir (profiles/node_modules), which junctions to the exact
// package instance the harness itself loaded — same module identity, and no
// bare-specifier resolution from this out-of-tree package.
//
// Config (row config in cordis.patch.yml): { provider?, model?, target? }
//   provider/model  pin the model route; defaults resolve the first active
//                   provider (falling back to deepseek-v4-flash for the model).
//   target          default target language when the client omits it (zh).

import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const name = 'dsh-translator'
export const inject = ['llm']

const TARGET_NAMES = {
  zh: 'Simplified Chinese',
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  ru: 'Russian',
  pt: 'Portuguese',
  it: 'Italian',
}

const MAX_TEXTS = 60
const MAX_TEXT_CHARS = 6000
const MAX_TOTAL_CHARS = 20000
const MAX_BODY_BYTES = 64 * 1024
const CALL_TIMEOUT_MS = 120000

let apiPromise = null
function llmApi() {
  if (!apiPromise) {
    const home = process.env.DSH_HOME || join(homedir(), '.dsh')
    const url = pathToFileURL(
      join(home, 'profiles', 'node_modules', '@deepseek-ai', 'dsh-llm', 'lib', 'index.js'),
    ).href
    apiPromise = import(url).then((root) => ({
      BlockAssembler: root.BlockAssembler,
      createUserMessage: root.createUserMessage,
      deepFreeze: root.deepFreeze,
    }))
  }
  return apiPromise
}

function systemPrompt(target) {
  const lang = TARGET_NAMES[target] || TARGET_NAMES.zh
  return `You are a professional translator. Translate the user's text into ${lang}.

Rules:
1. Reply with ONLY the translation — no explanations, no notes, no surrounding quotation marks.
2. Translate natural-language text; keep code, inline code, URLs, placeholders, file paths and line breaks exactly as-is.
3. If the text contains English, ALWAYS provide the ${lang} translation. Only return the input unchanged when it is already ${lang} or contains nothing translatable.`
}

async function translateOne(ctx, api, text, target, provider, model, signal) {
  const { BlockAssembler, createUserMessage, deepFreeze } = api
  const messages = [
    createUserMessage({
      content: [{ type: 'text', text }],
      source: { kind: 'plugin', plugin: 'dsh-translator' },
    }),
  ]
  const options = deepFreeze({
    provider,
    model,
    messages,
    system: systemPrompt(target),
    maxTokens: 1536,
    signal,
  })
  const assembler = new BlockAssembler()
  for await (const chunk of ctx.llm.stream(options)) assembler.push(chunk)
  const finish = assembler.finish
  if (finish && (finish.kind === 'error' || finish.kind === 'aborted')) {
    const code = finish.failure?.code || finish.kind
    throw new Error(`translation model call failed: ${code}`)
  }
  const blocks = assembler.blocks()
  return blocks
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
}

async function resolveRoute(llm, config) {
  let provider = config?.provider
  let model = config?.model
  const providers = llm.listProviders()
  if (!provider || !providers.some((p) => p.id === provider)) provider = providers[0]?.id
  if (!provider) throw new Error('no LLM provider registered — configure one in Settings first')
  if (!model) {
    try {
      const models = await llm.listModels(provider)
      if (models.length) model = models[0].id
    } catch {
      // model discovery is best-effort; fall back below
    }
    if (!model) model = 'deepseek-v4-flash'
  }
  return { provider, model }
}

async function readJsonBody(req, maxBytes) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > maxBytes) return null
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function apply(ctx, config = {}) {
  ctx.inject(['webServer'], (scope) => {
    scope.webServer.register({
      name: 'dsh-translator-translate',
      kind: 'exact',
      path: '/translator/translate',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ error: 'method not allowed' }))
          return
        }
        try {
          const body = await readJsonBody(req, MAX_BODY_BYTES)
          if (body === null) {
            res.writeHead(413, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'payload too large' }))
            return
          }
          const texts = Array.isArray(body?.texts) ? body.texts.filter((t) => typeof t === 'string') : []
          const target = typeof body?.target === 'string' ? body.target : config?.target || 'zh'
          if (!texts.length) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'no texts' }))
            return
          }
          const totalChars = texts.reduce((n, t) => n + t.length, 0)
          if (texts.length > MAX_TEXTS || texts.some((t) => t.length > MAX_TEXT_CHARS) || totalChars > MAX_TOTAL_CHARS) {
            res.writeHead(413, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'texts over limit' }))
            return
          }
          const api = await llmApi()
          const { provider, model } = await resolveRoute(ctx.llm, config)
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS)
          try {
            const translations = []
            for (const text of texts) {
              if (!text.trim()) {
                translations.push(text)
                continue
              }
              try {
                const out = await translateOne(ctx, api, text, target, provider, model, controller.signal)
                translations.push(out || text)
              } catch {
                // per-text failure keeps the batch alive; the client shows the original
                translations.push(text)
              }
            }
            res.writeHead(200, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ translations, provider, model }))
          } finally {
            clearTimeout(timer)
          }
        } catch (error) {
          res.writeHead(500, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ error: String(error?.message ?? error) }))
        }
      },
    })
  })

  // Translate approval reasons host-side, BEFORE the web answerer builds the
  // client frame. Waterfall order is global registration order and the web
  // answerer (dsh-host-apiproxy) registers at boot, so this listener MUST be
  // prepended (prepend:true -> unshift) to run first. The dialog headline is
  // then rendered natively in Chinese by React — no client-side DOM surgery,
  // nothing for React re-renders to revert. The durable approval/asked audit
  // event is appended before the waterfall, so the log keeps the original.
  //
  // The displayed reason carries BOTH the translation and the original text:
  // translating what a user is asked to approve must never hide what they are
  // actually agreeing to. A failed translation retries once, then falls back
  // to the untouched original (approval decisions are never altered or blocked).
  ctx.on(
    'approval/request',
    async (req, next) => {
      if (req && typeof req.reason === 'string' && req.reason.trim() && /[A-Za-z]{4,}/.test(req.reason)) {
        try {
          const api = await llmApi()
          const { provider, model } = await resolveRoute(ctx.llm, config)
          const original = req.reason
          const target = config?.target || 'zh'
          let out = null
          for (let attempt = 1; attempt <= 2 && !out; attempt += 1) {
            try {
              const controller = new AbortController()
              const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS)
              try {
                out = await translateOne(ctx, api, original, target, provider, model, controller.signal)
              } finally {
                clearTimeout(timer)
              }
            } catch (error) {
              if (attempt === 2) {
                console.error('[dsh-translator] approval translation failed after retry: ' + (error?.message ?? error))
              }
            }
          }
          if (out && out !== original) {
            // keep both: translation first (what the user reads), original below
            // (what they are actually approving)
            req.reason = `${out}\n\n（原文）${original}`
          }
        } catch (error) {
          // keep the original reason; translation must never block an approval
          console.error('[dsh-translator] approval translation failed: ' + (error?.message ?? error))
        }
      }
      return next()
    },
    true,
  )
}
