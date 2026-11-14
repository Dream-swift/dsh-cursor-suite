/**
 * dsh-read-image-bridge
 *
 * Owns the model-facing `read_image` tool. When the active model route cannot
 * actually inspect a picture (the Cursor subscription route advertises
 * `["text", "image"]` but drops images upstream), the tool forwards the file to
 * a DeepSeek vision subagent — one auxiliary LLM call on an image-capable
 * route — and returns its textual reading. On native routes it behaves exactly
 * like the built-in tool and returns the image block itself.
 *
 * Taking the name needs two steps, because `read_image` is registered twice:
 *
 * 1. The host tree mounts `@deepseek-ai/dsh-tool-fs` once with the default
 *    `readImage: true`, and the bundle patch disables that copy
 *    (`- id: tool-fs, config: { readImage: false }`) so this plugin can own the
 *    name in the global tool layer.
 * 2. Every Agent preset (`standard`, `ptc`, `minimal`, `cordis`) mounts its own
 *    `dsh-tool-fs` inside the agent's scope, and a nearer registration shadows
 *    the global one. `adoptScopedTool` rewrites that shadowing definition in
 *    place on `agent/created`, so the preset keeps its own config while the
 *    model sees this tool. Nothing is duplicated in profile YAML, so a DSH
 *    upgrade that reshapes a preset cannot silently drop the takeover.
 *
 * Cursor's native shell/read/ls/glob/grep/write/delete/fetch execs are rejected
 * by the Cursor half of this suite. An optional system-prompt routing note
 * (`execRoutingHint: true` → `installToolRoutingHint`) can name the DSH
 * replacements; it is off by default.
 */
import { BlockAssembler, createUserMessage, isAgentLoopRequest, markAgentLoopRequest } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { basename, extname } from 'node:path'
import { createSettingsServer } from './settings-server.js'
import { readVisionSettings } from './settings.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'read-image-bridge'

/** Services required before the tool can be registered. */
export const inject = ['tools', 'fs', 'workingDirectory']

const TOOL_NAME = 'read_image'

/** Stamped on a definition this plugin adopted, so a second adoption is a no-op. */
const ADOPTED = Symbol.for('dsh-read-image-bridge.adopted')

/** Media types `read_image` accepts. */
const IMAGE_EXTENSIONS = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const JPEG_SIGNATURE = new Uint8Array([255, 216, 255])

/** Providers whose routes claim image input but cannot deliver it. */
const DEFAULT_DESCRIBE_PROVIDERS = ['cursor-subscription']

/** Providers that always receive the native image block. */
const DEFAULT_NATIVE_PROVIDERS = []

/**
 * Providers whose adapter rejects the client's own native exec surface.
 *
 * The Cursor client protocol defines shell/read/ls/glob/grep/write/delete/fetch
 * execs of its own, and `dsh-cursor-subscription` answers every one of them with
 * a rejection: it encodes no success shape for any of them. A model that reaches
 * for one therefore spends a whole step collecting a refusal before rerunning
 * the same work through DSH's tools. Naming the working tools up front is the
 * only lever a plugin has — the adapter exposes no hook inside that loop.
 */
const DEFAULT_REJECT_NATIVE_EXEC_PROVIDERS = ['cursor-subscription']

/** Section name of the tool-routing note, so a patch layer can address it. */
const ROUTING_SECTION = 'read-image-bridge:tool-routing'

/**
 * Placement of the note: immediately after the harness identity (-1000) and
 * before the deployment persona prefix (0), so the prohibition is among the
 * first behavioural instructions the model reads.
 *
 * It used to sit at 999 — after file-reference, before the per-tool sections.
 * A live Cursor session showed that placement does not change behaviour: the
 * note was verifiably in the assembled prompt, and the model still opened with
 * the client's native tools. Early placement plus the client's own tool names
 * (see `NATIVE_EXEC_TOOLS`) is the second attempt; the section is still
 * route-filtered, so a native route pays nothing for it.
 */
const ROUTING_ORDER = -900

/**
 * The client's own tool names, in the casing the model sees in its tool list.
 *
 * Naming them matters: the previous text said "shell / read / grep …" in lower
 * case, which names no tool the model can actually see. A refusal it cannot map
 * onto a catalogue entry is a refusal it does not apply.
 */
const NATIVE_EXEC_TOOLS = ['Shell', 'ShellStream', 'Read', 'Write', 'StrReplace', 'Grep', 'Glob', 'Delete', 'Fetch']

/**
 * The adapter's refusal, verbatim — `TOOL_REJECT_REASON` in dsh-cursor-subscription.
 *
 * Every native exec it declines carries this one sentence, and the second clause
 * is the part that matters: the adapter tells the model to "use the MCP tools
 * provided instead", and the DSH tools really are delivered to Cursor as MCP tool
 * definitions (`encodeMcpToolDefinition` → `request_context`). Quoting only "Tool
 * not available in this environment." leaves the model to guess what the
 * replacement is; quoting the whole sentence connects the refusal it just read to
 * the list printed underneath it.
 */
const TOOL_REJECT_REASON =
  'Tool not available in this environment. Use the MCP tools provided instead (pwsh, read, grep, glob, write, edit, web_fetch) — do not retry this Cursor-native tool.'

/** Route used for the auxiliary vision call. */
const DEFAULT_VISION_PROVIDER = 'deepseek-account'
const DEFAULT_VISION_MODEL = 'deepseek-flash'
/**
 * Output budget for one vision call, or `undefined` to let the route apply its
 * own maximum.
 *
 * A reasoning model spends the budget on hidden reasoning before it writes the
 * first visible character, so a cap sized for the transcript alone comes back
 * empty: reasoning hits the ceiling and the answer never starts. A 1600-token
 * cap produced exactly that — one screenshot answered, then every retry of the
 * same file returned no text.
 */
const DEFAULT_MAX_TOKENS = undefined
const DEFAULT_TIMEOUT_MS = 120_000
/** Attempts per read, because a route can still answer with an empty turn. */
const DEFAULT_VISION_ATTEMPTS = 2

const SUBAGENT_SYSTEM = [
  '你是一个图像理解子智能体，被另一个看不到图片的模型调用。',
  '请仔细阅读用户提供的图片，并输出准确、完整、可直接使用的文字结果。',
  '要求：',
  '1. 先用一句话说明这是什么（截图/照片/图表/海报/代码/界面等）。',
  '2. 逐字转录图片中所有可见文字、按钮标签、报错信息、代码片段；不要改写，无法辨认的字用 [?] 标记。',
  '3. 描述布局与结构：区块顺序、表格行列、图表坐标轴与数据趋势、UI 元素位置。',
  '4. 指出任何异常、红色高亮、箭头标注或需要关注的问题。',
  '5. 不要臆测图片以外的信息；不要输出 markdown 代码块包裹全文。',
  '用中文回答。',
].join('\n')

const DEFAULT_PROMPT =
  '请完整阅读这张图片：转录所有可见文字，并描述布局、图表数据和值得注意的细节。'

/**
 * The route one vision call should use.
 *
 * Precedence is Settings → 图片识读 (the saved settings file), then this
 * plugin's loader config, then the built-in default. The file wins because it
 * is the only half a person can change without editing profile YAML and
 * restarting DSH, and the page shows the resulting route so a save is never a
 * guess about what actually ran.
 * @param cfg - plugin configuration from the loader.
 * @param env - environment the DSH home is resolved from.
 * @returns `{ provider, model, source }`; `source` is one of `settings`,
 *   `config` or `default`.
 */
export function resolveVisionRoute(cfg, env = process.env) {
  const saved = readVisionSettings(env)
  if (saved.visionProvider !== undefined && saved.visionModel !== undefined) {
    return { provider: saved.visionProvider, model: saved.visionModel, source: 'settings' }
  }
  const configured = cfg?.visionProvider !== undefined && cfg?.visionModel !== undefined
  return {
    provider: cfg?.visionProvider ?? DEFAULT_VISION_PROVIDER,
    model: cfg?.visionModel ?? DEFAULT_VISION_MODEL,
    source: configured ? 'config' : 'default',
  }
}

/** One log line, prefixed for `desktop-next.log` greps. */
function log(message) {
  console.error(`[read-image-bridge] ${message}`)
}

/** Message of an unknown thrown value. */
function reasonOf(error) {
  return error?.message ?? String(error)
}

/** Media type detected from magic bytes, or undefined. */
function sniffImageMediaType(data) {
  const at = (offset, signature) => {
    if (data.length < offset + signature.length) return false
    for (let i = 0; i < signature.length; i += 1) if (data[offset + i] !== signature[i]) return false
    return true
  }
  const ascii = (offset, text) => {
    if (data.length < offset + text.length) return false
    for (let i = 0; i < text.length; i += 1) if (data[offset + i] !== text.charCodeAt(i)) return false
    return true
  }
  if (at(0, PNG_SIGNATURE)) return 'image/png'
  if (at(0, JPEG_SIGNATURE)) return 'image/jpeg'
  if (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) return 'image/gif'
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp'
  return undefined
}

/** Refuse a media type the deployment's attachment store does not admit. */
function assertAccepts(attachments, mediaType, label) {
  const limits = attachments.imageLimits
  if (limits?.mediaTypes !== undefined && !limits.mediaTypes.includes(mediaType)) {
    throw new Error(`cannot read "${label}": image type ${mediaType} is not accepted by this deployment`)
  }
}

/** Resolve one model-supplied path and require a regular file. */
async function resolveTarget(ctx, exec, requestedPath) {
  // The working directory is a convenience, not a precondition: `ensure` throws
  // `cannot get required service "workingDirectory" in inactive context` once the
  // agent's context has been torn down (restarted window, finished run, a plugin
  // row reloaded under a live session). Losing it must cost only the relative
  // path fallback — `fs.resolve` then uses its own default — instead of failing
  // every read_image call with a service error.
  let cwd
  if (exec.agent !== undefined) {
    try {
      cwd = await ctx.workingDirectory.ensure(exec.agent, exec.signal)
    } catch {
      cwd = undefined
    }
  }
  const target = await ctx.fs.resolve(requestedPath, {
    ...(cwd === undefined ? {} : { cwd }),
    signal: exec.signal,
  })
  const info = await ctx.fs.stat(target, exec.signal)
  if (info === undefined) throw new Error(`cannot read "${target.displayPath}": not found`)
  if (info.type !== 'file') throw new Error(`cannot read "${target.displayPath}": not a regular file`)
  return { target, info }
}

/** Normalize a durable attachment reference into the tool output value. */
function toValueImage(ref) {
  return {
    attachmentId: ref.attachmentId,
    mediaType: ref.mediaType,
    bytes: ref.bytes,
    width: ref.width,
    height: ref.height,
    ...(ref.name === undefined ? {} : { name: ref.name }),
    ...(ref.originalDimensions === undefined ? {} : { originalDimensions: { ...ref.originalDimensions } }),
  }
}

/** Model-facing envelope that accompanies a native image block. */
function formatEnvelope(displayPath, image) {
  let scaled = ''
  if (image.originalDimensions !== undefined) {
    const x = (image.originalDimensions.width / image.width).toFixed(2)
    const y = (image.originalDimensions.height / image.height).toFixed(2)
    scaled = ` (downscaled from ${image.originalDimensions.width}x${image.originalDimensions.height} px)`
  }
  return `<path>${displayPath}</path>
<type>image</type>
<content>
${image.mediaType} image, ${image.width}x${image.height} px, ${image.bytes} bytes${scaled}
</content>`
}

/** One candidate route for this turn. */
function routeFrom(source, provider, model) {
  if (typeof provider !== 'string' || provider === '') return undefined
  return { source, provider, model: typeof model === 'string' && model !== '' ? model : undefined }
}

/**
 * The route the calling turn is using, from the most authoritative source that
 * records one: the request header actually sent, the agent's live model
 * selection, then the agent's construction options. A turn can be routed by any
 * of them (a resumed session replays a header, a `/model` switch only moves the
 * selection), so a single source is not enough.
 * @param exec - the tool execution context of the calling model.
 * @returns `{ source, provider, model }`; provider is undefined when none is recorded.
 */
export function resolveRoute(exec) {
  try {
    const header = typeof exec?.agent?.session?.requestHeader === 'function' ? exec.agent.session.requestHeader() : undefined
    const recorded = routeFrom('request-header', header?.config?.provider, header?.config?.model)
    if (recorded !== undefined) return recorded
  } catch {
    // A session whose header cannot be read falls through to the next source.
  }
  try {
    const current = typeof exec?.agent?.model?.current === 'function' ? exec.agent.model.current() : undefined
    const selected = routeFrom('agent-model', current?.provider, current?.model)
    if (selected !== undefined) return selected
  } catch {
    // Same: keep looking.
  }
  const options = exec?.agent?.options
  return routeFrom('agent-options', options?.provider, options?.model) ?? { source: 'none', provider: undefined, model: undefined }
}

/**
 * Decide whether this call goes to the vision subagent.
 * @param ctx - a context carrying the llm service, to inspect input modalities.
 * @param exec - the tool execution context of the calling model.
 * @param cfg - plugin configuration.
 * @returns `{ describe, reason, route }` — `reason` is logged verbatim.
 */
export async function decideRoute(ctx, exec, cfg) {
  const route = resolveRoute(exec)
  const { provider, model } = route
  const verdict = (describe, reason) => ({ describe, reason, route })
  if (cfg.mode === 'describe') return verdict(true, 'mode=describe')
  if (cfg.mode === 'native') return verdict(false, 'mode=native')
  if (provider === undefined) {
    // An unrouted turn still deserves a reading: forwarding pixels to a route
    // that never delivers them is the failure this plugin exists to prevent.
    return verdict(true, 'no provider is recorded for this turn')
  }
  if ((cfg.describeProviders ?? DEFAULT_DESCRIBE_PROVIDERS).includes(provider)) {
    return verdict(true, `provider "${provider}" is listed in describeProviders`)
  }
  if ((cfg.nativeProviders ?? DEFAULT_NATIVE_PROVIDERS).includes(provider)) {
    return verdict(false, `provider "${provider}" is listed in nativeProviders`)
  }
  const llm = ctx.get('llm')
  if (llm === undefined) return verdict(true, 'no llm service is mounted to inspect input modalities')
  try {
    const info = await llm.resolveModelInfo(provider, model ?? '', exec.signal)
    const modalities = info?.inputModalities
    if (modalities === undefined) return verdict(true, 'the route declares no input modalities')
    if (!modalities.includes('image')) return verdict(true, `the route declares [${modalities.join(', ')}] without image`)
    return verdict(false, 'the route declares image input')
  } catch (error) {
    return verdict(true, `model info is unavailable: ${reasonOf(error)}`)
  }
}

/** Deep-freeze a request payload handed to the LLM service. */
function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const key of Object.keys(value)) deepFreeze(value[key])
  return value
}

/**
 * Run one vision attempt and return its text, or throw.
 * @returns the assistant's textual reading; never empty.
 */
async function describeOnce(ctx, exec, attachment, prompt, cfg) {
  const llm = ctx.get('llm')
  if (llm === undefined) throw new Error('no llm service is mounted')
  const signal = exec.signal
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('read_image vision subagent timed out')), cfg.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const combined = signal === undefined ? controller.signal : AbortSignal.any([signal, controller.signal])
  try {
    const messages = [
      createUserMessage({
        content: [
          { type: 'text', text: prompt ?? DEFAULT_PROMPT },
          { type: 'image', attachment },
        ],
        source: { kind: 'read-image-bridge' },
      }),
    ]
    const maxTokens = cfg.maxTokens ?? DEFAULT_MAX_TOKENS
    // Resolved per call rather than once at load: a route picked in
    // Settings → 图片识读 has to apply to the very next image, not to the next
    // DSH restart.
    const route = resolveVisionRoute(cfg)
    log(`vision call provider=${route.provider} model=${route.model} source=${route.source}`)
    const call = await llm.prepareCall(
      {
        provider: route.provider,
        model: route.model,
        ...(maxTokens === undefined ? {} : { maxTokens }),
      },
      combined,
      // Lowest supported effort: transcription is not open-ended reasoning, and
      // an effort the route does not offer is rejected outright.
      (controls, modelInfo) => {
        const effort = modelInfo?.reasoning?.efforts?.[0]?.id
        return effort === undefined ? controls : { ...controls, reasoningEffort: effort }
      },
    )
    // Deliberately no `sessionId`.
    //
    // DSH forwards it as `x-deepseek-harness-session-id`, and the compression
    // proxy in front of the account route recognises that identity: it logs
    // `[<session>] side request ...` and measures the request against what it
    // believes the session holds. Borrowing the caller's id made this 2 KB,
    // two-block request inherit a >1.1M-token conversation and be refused at the
    // 750k window (`side_request_payload_too_large`) before one byte reached the
    // model — the number even grew turn by turn with the caller's history.
    //
    // A vision read is a stateless single-shot call about one file. Standing on
    // its own payload is also what lets it run in a conversation of any size.
    const options = deepFreeze({
      ...call.config,
      messages,
      system: SUBAGENT_SYSTEM,
      purpose: 'read-image-vision',
      // The vision call carries an image and travels the same `llm/stream`
      // waterfall, so it is marked as already rewritten. Without this marker a
      // route that is both the vision route and a describe provider would make
      // this plugin describe the image it is in the middle of describing.
      [REWRITTEN]: true,
      signal: combined,
    })
    const assembler = new BlockAssembler()
    for await (const chunk of call.stream(options)) assembler.push(chunk)
    const finish = assembler.finish
    if (finish.kind === 'error') throw new Error(finish.failure?.message ?? 'vision subagent failed')
    if (finish.kind === 'aborted') throw new Error('vision subagent aborted')
    if (finish.kind === 'max-tokens') throw new Error('vision subagent hit its output ceiling before answering')
    const text = assembler
      .blocks()
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()
    if (text === '') throw new Error('vision subagent returned no text')
    return text
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Ask the vision route to read one stored image, retrying an empty answer.
 *
 * A route can answer one read and then come back with an empty turn for the
 * very same file on the next attempt (observed with the account route), so one
 * empty response must not cost the caller the whole reading.
 * @returns the assistant's textual reading.
 */
async function describeImage(ctx, exec, attachment, prompt, cfg) {
  const attempts = Math.max(1, cfg.visionAttempts ?? DEFAULT_VISION_ATTEMPTS)
  let failure
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const text = await describeOnce(ctx, exec, attachment, prompt, cfg)
      if (attempt > 1) log(`vision subagent answered on attempt ${attempt}/${attempts}`)
      return text
    } catch (error) {
      failure = error
      log(`vision attempt ${attempt}/${attempts} failed: ${reasonOf(error)}`)
    }
  }
  throw failure ?? new Error('vision subagent failed')
}

/**
 * Readings already produced in this process, keyed by the durable attachment id
 * and the question asked about it.
 *
 * One pasted screenshot rides every later request of the conversation, so an
 * uncached rewrite would re-describe the same bytes on every step of every
 * turn. The cache is what keeps that cost at one vision call per image.
 */
const descriptionCache = new Map()
const MAX_CACHED_DESCRIPTIONS = 64

/** Cache key for one attachment read under one question. */
function cacheKeyOf(attachment, prompt) {
  return `${attachment.attachmentId}\u0000${prompt ?? DEFAULT_PROMPT}`
}

/** Remember one reading, dropping the oldest entry at the cap. */
function rememberReading(key, text) {
  if (descriptionCache.size >= MAX_CACHED_DESCRIPTIONS) {
    const oldest = descriptionCache.keys().next()
    if (oldest.done !== true) descriptionCache.delete(oldest.value)
  }
  descriptionCache.set(key, text)
}

/**
 * Drop every cached reading.
 *
 * One entry was produced by one vision route. After the route changes in
 * Settings → 图片识读, replaying it would keep answering with the model the
 * person just replaced — and hide the fact that the newly picked one never ran.
 */
export function clearReadings() {
  descriptionCache.clear()
}

/** Every distinct image reference one content list carries, tool results included. */
function collectImageRefs(content, refs) {
  for (const block of content ?? []) {
    if (block?.type === 'image' && block.attachment?.attachmentId !== undefined) {
      if (refs.every((seen) => seen.attachmentId !== block.attachment.attachmentId)) refs.push(block.attachment)
      continue
    }
    if (block?.type === 'tool-result') collectImageRefs(block.content, refs)
  }
  return refs
}

/** Every distinct image reference a whole request carries. */
function requestImageRefs(messages) {
  const refs = []
  for (const message of messages ?? []) collectImageRefs(message?.content, refs)
  return refs
}

/** Replace describable image blocks with their readings; unchanged content is returned as-is. */
function rewriteContent(content, readingOf) {
  let changed = false
  const next = []
  for (const block of content) {
    if (block?.type === 'image' && block.attachment?.attachmentId !== undefined) {
      const reading = readingOf(block.attachment)
      if (reading !== undefined) {
        next.push({ type: 'text', text: reading })
        changed = true
        continue
      }
    }
    if (block?.type === 'tool-result' && Array.isArray(block.content)) {
      const inner = rewriteContent(block.content, readingOf)
      if (inner !== block.content) {
        next.push({ ...block, content: inner })
        changed = true
        continue
      }
    }
    next.push(block)
  }
  return changed ? next : content
}

/** Replace describable images across one request's messages. */
function rewriteMessages(messages, readingOf) {
  let changed = false
  const next = messages.map((message) => {
    const content = message?.content
    if (!Array.isArray(content)) return message
    const rewritten = rewriteContent(content, readingOf)
    if (rewritten === content) return message
    changed = true
    return { ...message, content: rewritten }
  })
  return changed ? next : messages
}

/**
 * Read every image one request carries, from the cache or the vision subagent.
 * @returns attachment id → model-facing reading; a failed read becomes a note so
 * the request still goes out with a truthful placeholder instead of pixels the
 * route would silently drop.
 */
async function readRequestImages(ctx, options, refs, cfg) {
  const readings = new Map()
  const exec = {
    signal: options.signal,
    ...(options.sessionId === undefined ? {} : { agent: { session: { id: options.sessionId } } }),
  }
  for (const ref of refs) {
    const key = cacheKeyOf(ref, cfg.requestPrompt)
    const cached = descriptionCache.get(key)
    if (cached !== undefined) {
      readings.set(ref.attachmentId, cached)
      log(`request image ${String(ref.attachmentId).slice(0, 27)}… reused a cached reading`)
      continue
    }
    try {
      const text = await describeImage(ctx, exec, ref, cfg.requestPrompt, cfg)
      rememberReading(key, text)
      readings.set(ref.attachmentId, text)
      log(`request image ${String(ref.attachmentId).slice(0, 27)}… described (${text.length} chars)`)
    } catch (error) {
      readings.set(ref.attachmentId, `[这张图片无法读取：视觉子智能体失败（${reasonOf(error)}）]`)
      log(`request image ${String(ref.attachmentId).slice(0, 27)}… could not be described: ${reasonOf(error)}`)
    }
  }
  return readings
}

/** Marks a request this plugin already rewrote, so the nested call cannot loop. */
const REWRITTEN = Symbol.for('dsh-read-image-bridge.rewritten')

/**
 * Requests this plugin already rebuilt.
 *
 * The marker normally rides the rebuilt request object as {@link REWRITTEN}, but
 * an intermediate wrapper is free to copy a request before dispatching it, and a
 * dropped symbol would send this plugin through its own rewrite a second time.
 * The WeakSet keeps the answer independent of whether a symbol survives the copy.
 */
const rewrittenRequests = new WeakSet()

/**
 * Whether one dispatched request already carries readings instead of pixels.
 * @param options - the request the waterfall received.
 */
export function isRewrittenRequest(options) {
  return options?.[REWRITTEN] === true || rewrittenRequests.has(options)
}

/**
 * Describe images before a route that cannot consume them receives them.
 *
 * A screenshot pasted into the composer never reaches `read_image`: it enters the
 * conversation as an image block and rides every request from then on, and the
 * Cursor route claims `image` input while dropping the pixels. `llm/stream` is a
 * listener waterfall, so a listener may take over the whole call instead of
 * continuing the chain: this one rebuilds the request with readings in place of
 * the image blocks and dispatches the rebuilt request. That request carries
 * {@link REWRITTEN}, so this listener steps aside for it instead of rewriting an
 * already rewritten request.
 *
 * The readings are cached per attachment and question, so one pasted screenshot
 * costs one vision call for the whole conversation instead of one per step.
 * @param ctx - the host plugin context.
 * @param cfg - plugin configuration.
 */
export function installRequestVision(ctx, cfg) {
  if (cfg.transformRequests === false) return
  const providers = new Set(cfg.describeProviders ?? DEFAULT_DESCRIBE_PROVIDERS)
  ctx.on('llm/stream', (options, next) => {
    if (isRewrittenRequest(options)) return next()
    if (cfg.mode === 'native') return next()
    if (typeof options?.provider !== 'string' || !providers.has(options.provider)) return next()
    const refs = requestImageRefs(options.messages)
    if (refs.length === 0) return next()
    return (async function* rewrittenRequest() {
      const readings = await readRequestImages(ctx, options, refs, cfg)
      const messages = rewriteMessages(options.messages, (ref) => readings.get(ref.attachmentId))
      const llm = ctx.get('llm')
      if (messages === options.messages || llm === undefined) {
        yield* next()
        return
      }
      log(`replacing ${refs.length} request image(s) with readings before provider "${options.provider}"`)
      // The agent loop tags its own request object, and features keyed to that tag
      // (session titles, auxiliary-request logging) ignore a rebuilt one. A
      // different object would silently disable them for every image-bearing turn.
      const rebuilt = { ...options, messages, [REWRITTEN]: true }
      rewrittenRequests.add(rebuilt)
      yield* llm.stream(isAgentLoopRequest(options) ? markAgentLoopRequest(rebuilt) : rebuilt)
    })()
  })
  log(`request-level image rewriting installed for ${[...providers].join(', ') || '(no providers)'}`)
}

/**
 * Rewrite one shadowing `read_image` definition so it becomes this tool.
 *
 * The tool layer keeps definition objects by reference ("values are borrowed"),
 * so a nearer registration — an agent preset's own `dsh-tool-fs` with the
 * default `readImage: true` — can be adopted in place. Registrations themselves
 * cannot be replaced, and `restrict()` only hides global tools, so this is the
 * one way to own the name inside an agent scope.
 * @returns `own` (already this tool), `absent`, `adopted`, `frozen`,
 * `unavailable` (the view could not be read) or `no-definition`.
 */
export function adoptScopedTool(ctx, agent, definition) {
  if (definition === undefined) return 'no-definition'
  let visible
  try {
    visible = ctx.tools.view(agent).visible
  } catch (error) {
    log(`cannot read the tool view of agent ${agent?.id ?? '(unknown)'}: ${reasonOf(error)}`)
    return 'unavailable'
  }
  const registered = visible?.get?.(TOOL_NAME)
  if (registered === undefined) return 'absent'
  if (registered === definition || registered[ADOPTED] === true) return 'own'
  try {
    for (const key of Object.keys(definition)) registered[key] = definition[key]
    for (const key of Object.keys(registered)) if (!Object.hasOwn(definition, key)) delete registered[key]
    registered[ADOPTED] = true
  } catch (error) {
    log(`cannot adopt read_image in the scope of agent ${agent?.id ?? '(unknown)'}: ${reasonOf(error)}`)
    return 'frozen'
  }
  const adopted = visible.get(TOOL_NAME)
  if (adopted !== registered || adopted.execute !== definition.execute) {
    log(`adopted read_image in the scope of agent ${agent?.id ?? '(unknown)'} but the registration did not follow`)
    return 'frozen'
  }
  return 'adopted'
}

/**
 * Build the `read_image` definition.
 * @param ctx - the plugin context; services are resolved per call, not here.
 * @param cfg - plugin configuration from the loader.
 */
function buildDefinition(ctx, cfg) {
  return defineTool({
    name: TOOL_NAME,
    description:
      'Read a PNG/JPEG/WebP/GIF image. When the current model route cannot inspect images itself, an image-capable DeepSeek vision subagent reads the picture and returns a precise textual description (transcribed text, layout, chart data, UI details). Large images are downscaled automatically.',
    parameters: {
      file_path: {
        type: 'string',
        required: true,
        description: 'Path to the image file, resolved by the filesystem backend.',
      },
      prompt: {
        type: 'string',
        description: 'Optional: what to focus on when asking the vision subagent. Defaults to a full transcription and layout description.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string', required: true, description: 'Canonical absolute path in the filesystem execution world.' },
          mode: { type: 'string', required: true, enum: ['describe', 'native'] },
          text: { type: 'string', required: true, description: 'Model-facing text: the vision subagent reading, or the native image envelope.' },
          image: {
            type: 'object',
            additionalProperties: false,
            properties: {
              attachmentId: { type: 'string', required: true },
              mediaType: { type: 'string', enum: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], required: true },
              bytes: { type: 'integer', required: true },
              width: { type: 'integer', required: true },
              height: { type: 'integer', required: true },
              name: { type: 'string' },
              originalDimensions: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  width: { type: 'integer', required: true },
                  height: { type: 'integer', required: true },
                },
              },
            },
          },
        },
      },
      render: (_args, value) => {
        const blocks = [{ type: 'text', text: value.text }]
        if (value.image !== undefined) blocks.push({ type: 'image', attachment: value.image })
        return blocks
      },
      presentationMeta: (_args, value) => ({ path: value.path }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const filePath = typeof args.file_path === 'string' ? args.file_path.trim() : ''
      if (filePath === '') throw new Error('file_path must be a non-empty string')
      const extension = extname(filePath).toLowerCase()
      const declared = IMAGE_EXTENSIONS[extension]
      if (declared === undefined && extension !== '') {
        throw new Error(
          `cannot read "${filePath}": the ${extension} extension does not declare a supported image format; read_image accepts PNG/JPEG/WebP/GIF files`,
        )
      }
      const attachments = ctx.get('attachments')
      if (attachments === undefined) throw new Error(`cannot read "${filePath}" as an image: no attachment service is mounted`)
      if (declared !== undefined) assertAccepts(attachments, declared, filePath)

      const { target, info } = await resolveTarget(ctx, exec, filePath)
      const limits = attachments.imageLimits
      const byteCap = Math.min(limits.maxImageBytes, limits.maxMessageImageBytes)
      const data = await ctx.fs.readBytes(target, exec.signal, byteCap)
      const mediaType = declared ?? sniffImageMediaType(data)
      if (mediaType === undefined) {
        throw new Error(`cannot read "${target.displayPath}": the file content is not a supported image format; read_image accepts PNG/JPEG/WebP/GIF`)
      }
      if (declared === undefined) assertAccepts(attachments, mediaType, target.displayPath)

      const displayPath = ctx.fs.processPath(target)
      let saved
      try {
        saved = await attachments.saveImage({ data, mediaType, name: basename(displayPath) })
      } catch (error) {
        throw new Error(`cannot read "${displayPath}": ${reasonOf(error)}`, { cause: error })
      }
      ctx.emit('fs/observed', target, { kind: 'present', version: info.version }, exec)
      const imageValue = toValueImage(saved)
      const decision = await decideRoute(ctx, exec, cfg)
      log(
        `read_image provider=${decision.route.provider ?? '(unknown)'} model=${decision.route.model ?? '(unknown)'} source=${decision.route.source} describe=${decision.describe} reason=${decision.reason}`,
      )

      if (decision.describe) {
        try {
          const text = await describeImage(ctx, exec, saved, args.prompt, cfg)
          log(`read_image vision subagent answered (${text.length} chars)`)
          return { path: displayPath, mode: 'describe', text }
        } catch (error) {
          // Degrade to the native envelope: the caller still gets the image.
          log(`read_image vision subagent failed: ${reasonOf(error)}`)
          return {
            path: displayPath,
            mode: 'native',
            text: `${formatEnvelope(displayPath, imageValue)}\n\n[read-image-bridge: vision subagent failed: ${reasonOf(error)}]`,
            image: imageValue,
          }
        }
      }
      return { path: displayPath, mode: 'native', text: formatEnvelope(displayPath, imageValue), image: imageValue }
    },
  })
}

/**
 * Name the tools that actually run on a route whose native exec surface is
 * rejected, so the model does not spend a whole step on a call that can only be
 * refused.
 *
 * Two details carry the message. The forbidden list uses the client's own tool
 * names (see `NATIVE_EXEC_TOOLS`) instead of lowercase exec kinds, and every
 * replacement entry says which forbidden tool it stands in for. The first
 * version of this note said "shell / read / grep …", was verifiably present in
 * the assembled prompt of a live session, and still did not change what the
 * model called: a prohibition it cannot map onto a catalogue entry is one it
 * does not apply. Replacement names still come from the step's own admission, so
 * a POSIX deployment is told about `bash` and a restricted-away tool is never
 * mentioned.
 * @param available - tool names visible to the calling agent for this step.
 * @returns the guidance text, or `''` when no working tool is left to name.
 */
export function toolRoutingHint(available) {
  const has = (name) => available.has(name)
  const shell = has('pwsh') ? 'pwsh' : has('bash') ? 'bash' : undefined
  const lines = [
    '【本回合工具可用性 · 硬性规则】下面这些客户端原生工具在本路由不可用，调用只会立刻收到',
    `"${TOOL_REJECT_REASON}"，并白白消耗一整轮：`,
    `  ${NATIVE_EXEC_TOOLS.map((name) => `\`${name}\``).join('、')}`,
    '不要尝试它们，也不要抱着「先试一下看行不行」的心态调用。适配器说的「MCP 工具」就是下面这组',
    'DSH 工具 —— DSH 通过 `request_context` 把工具目录当作 MCP 工具定义下发，所以它们在本回合可以直接执行：',
  ]
  if (shell !== undefined) {
    lines.push(
      `- 执行命令（替代 \`Shell\` / \`ShellStream\`）：\`${shell}\`，整条命令作为 \`command\` 传入；\`description\` 为必填短说明（一句话即可），缺了会 INVALID_ARGS。stdout/stderr 原样返回。`,
    )
  }
  if (has('read')) lines.push('- 读文件（替代 `Read`）：`read`，带行号；大文件用 offset/limit 取窗口。')
  if (has('glob')) lines.push('- 按文件名查找（替代 `Glob`）：`glob`。')
  if (has('grep')) lines.push('- 按内容搜索（替代 `Grep`）：`grep`。')
  if (has('write')) lines.push('- 新建或整体覆盖文件（替代 `Write`）：`write`。')
  if (has('edit')) lines.push('- 局部修改文件（替代 `StrReplace`）：`edit`，按字面量替换。')
  if (has('read_image')) lines.push('- 读图片：`read_image`（本路由看不到像素，会返回一段文字读解）。')
  if (has('web_fetch')) lines.push('- 取网页（替代 `Fetch`）：`web_fetch`。')
  if (has('web_search')) lines.push('- 搜索网页：`web_search`。')
  if (shell !== undefined && has('write')) {
    lines.push(`- 删除文件（替代 \`Delete\`）：用 \`${shell}\` 执行删除命令。`)
  }
  // Nothing usable to name means nothing worth saying: an empty string makes the
  // renderer drop the section, so the note never becomes a dead paragraph.
  if (!lines.some((line) => line.startsWith('- '))) return ''
  lines.push('上表就是本回合的全部可用动作工具；每次要执行动作时都从其中选一个。')
  lines.push(
    '收到原生工具拒绝后，同一意图只允许立刻改用上表对应 MCP 工具重试一次；禁止再次调用 `Shell` / `Grep` / `Read` 等原生工具，也不要调用 Cursor 内部的 `mcpState`。',
  )
  lines.push(
    '禁止只写「我先核对/让我看一下」之类的计划就结束本回合：要么立刻调用上表工具，要么直接给出完整结论；不要停在意图说明。',
  )
  return lines.join('\n')
}

/**
 * Install the tool-routing note on routes whose adapter rejects the client's
 * native execs.
 *
 * One global section, filtered per assembly: a route not in
 * `rejectNativeExecProviders` renders `''`, and the prompt renderer drops an
 * empty section, so the note costs nothing on routes that work natively. Tool
 * names come from the step's own admission, so the section stays correct under
 * restrictions and on a POSIX deployment.
 * @param ctx - the host plugin context.
 * @param cfg - plugin configuration.
 */
export function installToolRoutingHint(ctx, cfg) {
  // Opt-in only. Default apply() skips this unless `execRoutingHint: true`.
  if (cfg.execRoutingHint !== true) return
  const providers = new Set(cfg.rejectNativeExecProviders ?? DEFAULT_REJECT_NATIVE_EXEC_PROVIDERS)
  if (providers.size === 0) return
  const text = (context) => {
    try {
      const provider = resolveRoute({ agent: context?.agent }).provider ?? context?.modelSelection?.provider
      if (provider === undefined || !providers.has(provider)) return ''
      const definitions = ctx.tools.definitions(context?.scope, context?.toolSet) ?? []
      return toolRoutingHint(new Set(definitions.map((definition) => definition.name)))
    } catch (error) {
      log(`cannot build the tool-routing note: ${reasonOf(error)}`)
      return ''
    }
  }
  // Injected rather than read once through `ctx.get`: the section is registered
  // when the service is actually there, so load order cannot silently drop it,
  // and a host without one only loses the note instead of the tool.
  ctx.inject(['systemPrompt'], (promptCtx) => {
    // The injected context is where the service lives; a host (or a test double)
    // that hands the parent context back answers `get` the same way, so either
    // shape reaches the service instead of throwing on an undefined scope.
    const scope = typeof promptCtx?.get === 'function' ? promptCtx : ctx
    const systemPrompt = scope?.get?.('systemPrompt')
    if (systemPrompt === undefined || typeof systemPrompt.section !== 'function') {
      log('no systemPrompt service is mounted; the tool-routing note is skipped')
      return
    }
    try {
      systemPrompt.section({ name: ROUTING_SECTION, order: ROUTING_ORDER, text })
    } catch (error) {
      // A duplicate name means another copy already installed it; the host keeps
      // working either way.
      log(`failed to register the tool-routing note: ${reasonOf(error)}`)
      return
    }
    log(`tool-routing note installed for ${[...providers].join(', ') || '(no providers)'}`)
  })
}

/**
 * Mount the HTTP API behind Settings → 图片识读.
 *
 * The page itself is `lib/client.js`: `package.json` declares
 * `dsh.client.platform: "web"`, so the shell loads that module and it registers
 * a `settings.section` entry. The two halves then meet on this one same-origin
 * route, which is also why the panel needs no RPC channel and no connection
 * plugin — a deployment with a GUI but without either still gets the page.
 *
 * `webServer` may mount after this plugin, so the route is registered from an
 * injection instead of being probed once in `apply`. A deployment without one
 * (the headless CLI) simply has no page; `read_image` keeps working.
 * @param ctx - the host plugin context.
 * @param cfg - plugin configuration, the fallback the page reports.
 */
export function installSettingsApi(ctx, cfg) {
  ctx.inject(['webServer'], (webCtx) => {
    let server
    try {
      server = createSettingsServer({
        ctx: webCtx,
        defaults: {
          provider: cfg.visionProvider ?? DEFAULT_VISION_PROVIDER,
          model: cfg.visionModel ?? DEFAULT_VISION_MODEL,
        },
        currentRoute: () => resolveVisionRoute(cfg),
        onRouteChanged: () => {
          // A cached reading was produced by the route the person just replaced.
          // Replaying it would keep answering with the old model — and hide the
          // fact that the newly picked one never ran.
          clearReadings()
          const route = resolveVisionRoute(cfg)
          log(`vision route changed in Settings → ${route.provider}/${route.model} (source=${route.source}); cached readings dropped`)
        },
      })
    } catch (error) {
      // A taken route only costs the page, never the tool.
      log(`settings page is unavailable: ${reasonOf(error)}`)
      return
    }
    if (server === null) {
      log('no webServer route registry is mounted; the settings page is skipped')
      return
    }
    // Print the absolute URL. The profile pins `port: 0`, so the GUI lands on a
    // random port every boot and "/dsh-read-image-bridge/settings" alone leaves
    // the reader with no address to open.
    let origin = ''
    try {
      const carrier = webCtx.webServer
      if (typeof carrier?.getOrigin === 'function') origin = String(carrier.getOrigin() ?? '')
      // Older carriers answer only the port; loopback is the only host this
      // route is reachable on in that case either.
      if (origin === '' && Number.isInteger(carrier?.port)) origin = `http://127.0.0.1:${carrier.port}`
    } catch {
      origin = ''
    }
    log(`settings page mounted at ${origin}${server.route}`)
    try {
      if (typeof webCtx.effect === 'function') {
        webCtx.effect(() => () => server.dispose(), 'read-image-bridge: settings route')
      }
    } catch (error) {
      log(`cannot bind the settings route lifetime: ${reasonOf(error)}`)
    }
  })
}

/**
 * @param ctx - the host plugin context.
 * @param config - loader configuration (all keys optional).
 */
export function apply(ctx, config) {
  const cfg = config ?? {}
  // Request-level rewriting is the half that makes a *pasted* screenshot
  // readable: a pasted image never calls `read_image`, it rides every later
  // request as an image block that this route silently drops. Install it first
  // and independently of the tool, so a rejected tool schema cannot also cost
  // the caller the paste path.
  installRequestVision(ctx, cfg)
  try {
    installSettingsApi(ctx, cfg)
  } catch (error) {
    // The page is optional. A host without `ctx.inject`, or a route already
    // taken, must not cost the caller the tool.
    log(`cannot mount the settings page: ${reasonOf(error)}`)
  }
  let definition
  try {
    definition = buildDefinition(ctx, cfg)
  } catch (error) {
    // A schema the loader rejects must not take the host down; the built-in tool
    // (or another owner of the name) simply keeps working.
    log(`cannot build read_image: ${reasonOf(error)}`)
    return
  }
  ctx.inject(['attachments'], () => {
    try {
      ctx.tools.register(definition)
      const route = resolveVisionRoute(cfg)
      log(
        `read_image registered (mode=${cfg.mode ?? 'auto'}, vision=${route.provider}/${route.model} source=${route.source})`,
      )
    } catch (error) {
      // A host-level copy already owns the name; the agent-scope takeover below
      // still runs, so the model can still reach the vision path.
      log(`failed to register read_image globally: ${reasonOf(error)}`)
    }
  })
  // Tool-routing system-prompt section is off: it was verifiably present but
  // did not stop native Shell/Grep probes, and it added noise to every Cursor turn.
  // Native execs stay rejected in the Cursor adapter; call `installToolRoutingHint`
  // (or set execRoutingHint) only if a deployment wants the note back.
  if (cfg.execRoutingHint === true) installToolRoutingHint(ctx, cfg)
  ctx.on('agent/created', ({ agent }) => {
    const outcome = adoptScopedTool(ctx, agent, definition)
    if (outcome === 'adopted' || outcome === 'frozen' || outcome === 'unavailable' || outcome === 'own') {
      log(`agent ${agent?.id ?? '(unknown)'} read_image adoption: ${outcome}`)
    }
  })
}
