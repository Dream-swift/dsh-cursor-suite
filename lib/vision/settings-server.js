/**
 * The HTTP API behind Settings → 图片识读.
 *
 * The page is `lib/client.js`, a browser module the shell loads from this
 * package (`dsh.client` in package.json) and renders inside the GUI. The two
 * halves therefore talk over one same-origin route instead of an RPC channel:
 * reads are open (they expose a model catalog, never a secret), and a mutation
 * must come from the page this server itself served — a cross-site form post
 * carries a different `Origin` and is refused.
 *
 * Nothing is cached here: the settings file is the whole state, so the panel
 * and the tool can never disagree about what was last saved.
 */
import { clearVisionSettings, readVisionSettings, writeVisionSettings } from './settings.js'

/** Route the panel reads and writes; `API_PATH` in `client.js` matches it. */
export const SETTINGS_ROUTE = '/dsh-read-image-bridge/settings'

/** Largest accepted POST body; a route pick is a few hundred bytes. */
const MAX_BODY_BYTES = 16 * 1024

/** A provider whose catalog hangs must not hold every panel load. */
const CATALOG_TIMEOUT_MS = 8_000

/** One JSON response. */
function sendJson(response, status, body) {
  let payload
  try {
    payload = JSON.stringify(body)
  } catch (error) {
    payload = JSON.stringify({ error: `响应无法序列化：${error?.message ?? error}` })
  }
  try {
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(payload),
    })
    response.end(payload)
  } catch {
    // The socket may already be gone; nothing left to tell.
  }
}

/** Read one bounded JSON request body. */
function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('请求体太大'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim()
      if (text === '') return resolve({})
      try {
        const parsed = JSON.parse(text)
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new Error('请求体必须是 JSON 对象'))
          return
        }
        resolve(parsed)
      } catch {
        reject(new Error('请求体不是合法 JSON'))
      }
    })
    request.on('error', reject)
  })
}

/**
 * Whether a mutation came from the page this server itself served.
 *
 * A same-origin `fetch` always sends `Origin` on POST; a cross-site form post or
 * a script on another page sends its own. A request with no `Origin` at all is
 * a local client (curl, a test), which no web page can make run, so it passes.
 */
function fromThisPage(request) {
  const origin = request.headers?.origin
  if (typeof origin !== 'string' || origin === '') return true
  const host = request.headers?.host
  if (typeof host !== 'string' || host === '') return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** Reject a promise that takes too long, so one adapter cannot stall the panel. */
function withTimeout(promise, ms) {
  let timer
  const expired = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`模型列表在 ${ms}ms 内没有返回`)), ms)
    timer.unref?.()
  })
  return Promise.race([promise, expired]).finally(() => clearTimeout(timer))
}

/** One provider's models, annotated with whether they declare image input. */
function modelsOf(models) {
  return models.map((model) => ({
    id: model.id,
    name: typeof model.name === 'string' && model.name !== '' ? model.name : model.id,
    imageCapable: Array.isArray(model.inputModalities) ? model.inputModalities.includes('image') : null,
    ...(typeof model.description === 'string' ? { description: model.description } : {}),
  }))
}

/**
 * Every registered provider and the models it advertises.
 *
 * The panel needs this to draw its selectors. A provider whose listing fails is
 * reported with its error instead of disappearing, because "this route is not
 * listed" and "this route cannot be reached right now" are different problems
 * for the person choosing a vision model.
 */
async function readCatalog(llm) {
  if (llm === undefined || llm === null) {
    return { providers: [], diagnostics: [{ provider: '', error: '这个部署没有挂载 llm 服务' }] }
  }
  let listed
  try {
    listed = llm.listProviders()
  } catch (error) {
    return { providers: [], diagnostics: [{ provider: '', error: error?.message ?? String(error) }] }
  }
  const providers = []
  const diagnostics = []
  for (const provider of listed ?? []) {
    const id = typeof provider?.id === 'string' ? provider.id : ''
    if (id === '') continue
    const name = typeof provider.name === 'string' && provider.name !== '' ? provider.name : id
    try {
      const models = await withTimeout(Promise.resolve(llm.listModels(id)), CATALOG_TIMEOUT_MS)
      providers.push({ id, name, models: modelsOf(models ?? []) })
    } catch (error) {
      providers.push({ id, name, models: [] })
      diagnostics.push({ provider: id, error: error?.message ?? String(error) })
    }
  }
  return { providers, diagnostics }
}

/**
 * The standalone page served on the same route.
 *
 * The GUI half (`lib/client.js`) puts this panel inside Settings, but that path
 * only exists once the desktop shell has loaded the plugin's client module. This
 * HTML needs no build step, no module loader and no slot: opening the route in a
 * browser on this machine is enough to pick a vision model, which also makes the
 * page a way to tell "the module was not loaded" from "the plugin is broken".
 * @returns the page source.
 */
function settingsPageHtml() {
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>图片识读 · read_image</title>',
    '<style>',
    ':root{color-scheme:light dark}',
    'body{margin:0;padding:32px 20px;font:14px/1.6 -apple-system,"Segoe UI",system-ui,sans-serif;background:#f7f8fa;color:#1f2329}',
    '@media (prefers-color-scheme:dark){body{background:#16181d;color:#e6e8ec}}',
    '.wrap{max-width:720px;margin:0 auto}',
    'h1{font-size:20px;margin:0 0 6px}',
    'p.lead{margin:0 0 20px;color:#8a919e;font-size:13px}',
    '.card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:18px;margin-bottom:14px}',
    '@media (prefers-color-scheme:dark){.card{background:#1e2128;border-color:rgba(255,255,255,.1)}}',
    'h2{font-size:14px;margin:0 0 12px}',
    '.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '@media(max-width:640px){.row{grid-template-columns:1fr}}',
    'label{display:block;font-size:12px;color:#5c6370;margin-bottom:6px}',
    '@media (prefers-color-scheme:dark){label{color:#a0a6b0}}',
    'select{width:100%;height:34px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:#fff;color:inherit;font:inherit;padding:0 8px}',
    '@media (prefers-color-scheme:dark){select{background:#252932;border-color:rgba(255,255,255,.14)}}',
    '.actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}',
    'button{height:32px;padding:0 14px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer}',
    'button.primary{background:#4f7cff;border-color:transparent;color:#fff}',
    'button:disabled{opacity:.5;cursor:default}',
    '.status{margin-top:10px;font-size:12px;color:#8a919e;min-height:18px}',
    '.status.err{color:#e5484d}',
    '.kv{font-size:12px;color:#8a919e;word-break:break-all}',
    'ul{margin:8px 0 0;padding-left:18px;font-size:12px;color:#8a919e}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="wrap">',
    '<h1>图片识读（read_image）</h1>',
    '<p class="lead">当前模型看不到图片时，read_image 会把文件交给下面选定的视觉模型读成文字。保存后下一次读图立即生效，不必重启 DSH。</p>',
    '<div class="card">',
    '<h2>图形委托模型</h2>',
    '<div class="row">',
    '<div><label for="provider">服务商</label><select id="provider"></select></div>',
    '<div><label for="model">模型</label><select id="model"></select></div>',
    '</div>',
    '<div class="actions">',
    '<button id="save" class="primary" type="button">保存</button>',
    '<button id="reset" type="button">恢复默认</button>',
    '<button id="reload" type="button">刷新</button>',
    '</div>',
    '<div id="status" class="status" role="status"></div>',
    '</div>',
    '<div class="card">',
    '<h2>当前生效</h2>',
    '<div id="effective" class="kv"></div>',
    '<ul id="problems"></ul>',
    '</div>',
    '</div>',
    '<script>',
    '(function () {',
    '  var state = null;',
    '  var busy = false;',
    '  function byId(id) { return document.getElementById(id); }',
    '  function setStatus(text, isError) {',
    '    var el = byId("status");',
    '    el.textContent = text || "";',
    '    el.className = "status" + (isError ? " err" : "");',
    '  }',
    '  function api(body) {',
    '    var init = { method: body ? "POST" : "GET", cache: "no-store", credentials: "same-origin", headers: { accept: "application/json" } };',
    '    if (body) { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(body); }',
    '    return fetch(location.pathname, init).then(function (response) {',
    '      return response.json().catch(function () { return {}; }).then(function (data) {',
    '        if (!response.ok) throw new Error((data && data.error) || ("HTTP " + response.status));',
    '        return data || {};',
    '      });',
    '    });',
    '  }',
    '  function option(value, text, disabled) {',
    '    var node = document.createElement("option");',
    '    node.value = value;',
    '    node.textContent = text;',
    '    if (disabled) node.disabled = true;',
    '    return node;',
    '  }',
    '  function providers() { return Array.isArray(state && state.providers) ? state.providers : []; }',
    '  function modelsOf(id) {',
    '    var found = providers().filter(function (entry) { return entry && entry.id === id; })[0];',
    '    return found && Array.isArray(found.models) ? found.models : [];',
    '  }',
    '  function sourceLabel(source) {',
    '    if (source === "settings") return "设置页（已保存）";',
    '    if (source === "config") return "插件配置";',
    '    if (source === "default") return "插件默认值";',
    '    return "未知";',
    '  }',
    '  function fillProviders(selected) {',
    '    var select = byId("provider");',
    '    select.textContent = "";',
    '    var list = providers();',
    '    if (list.length === 0) select.appendChild(option("", "（没有可用的服务商）", true));',
    '    list.forEach(function (entry) {',
    '      var count = Array.isArray(entry.models) ? entry.models.length : 0;',
    '      var name = entry.name && entry.name !== entry.id ? entry.name + " (" + entry.id + ")" : entry.id;',
    '      select.appendChild(option(entry.id, name + (count === 0 ? " · 无模型" : " · " + count + " 个模型")));',
    '    });',
    '    if (selected && !list.some(function (entry) { return entry.id === selected; })) {',
    '      select.insertBefore(option(selected, selected + "（未在服务商目录中）"), select.firstChild);',
    '    }',
    '    select.value = selected || (list[0] ? list[0].id : "");',
    '  }',
    '  function fillModels(provider, selected) {',
    '    var select = byId("model");',
    '    select.textContent = "";',
    '    var list = modelsOf(provider);',
    '    if (list.length === 0) select.appendChild(option("", "（这个服务商没有列出模型）", true));',
    '    list.forEach(function (model) {',
    '      var suffix = model.imageCapable === true ? " · 支持图片" : model.imageCapable === false ? " · 无图片输入" : "";',
    '      var text = model.name && model.name !== model.id ? model.name + " (" + model.id + ")" : model.id;',
    '      select.appendChild(option(model.id, text + suffix));',
    '    });',
    '    if (selected && !list.some(function (model) { return model.id === selected; })) {',
    '      select.insertBefore(option(selected, selected + "（不在模型列表中）"), select.firstChild);',
    '    }',
    '    var pick = selected;',
    '    if (!pick) {',
    '      var first = list.filter(function (model) { return model.imageCapable === true; })[0] || list[0];',
    '      pick = first ? first.id : "";',
    '    }',
    '    select.value = pick;',
    '  }',
    '  function render(next, notice, isError) {',
    '    state = next;',
    '    var saved = (next && next.saved) || {};',
    '    var effective = (next && next.effective) || {};',
    '    var provider = saved.visionProvider || effective.provider || "";',
    '    var model = saved.visionModel || effective.model || "";',
    '    fillProviders(provider);',
    '    fillModels(byId("provider").value, model);',
    '    byId("effective").textContent = (effective.provider ? effective.provider + " / " + effective.model : "（尚未确定）")',
    '      + " · 来源：" + sourceLabel(effective.source)',
    '      + (saved.path ? " · 文件：" + saved.path : " · 未保存过自定义模型");',
    '    var list = byId("problems");',
    '    list.textContent = "";',
    '    var problems = [];',
    '    if (saved.error) problems.push(saved.error);',
    '    var diagnostics = next && Array.isArray(next.diagnostics) ? next.diagnostics : [];',
    '    diagnostics.forEach(function (entry) {',
    '      if (!entry) return;',
    '      problems.push((entry.provider ? "「" + entry.provider + "」" : "目录") + "：" + (entry.error || "未知错误"));',
    '    });',
    '    problems.forEach(function (text) {',
    '      var item = document.createElement("li");',
    '      item.textContent = text;',
    '      list.appendChild(item);',
    '    });',
    '    setStatus(notice || "", isError === true);',
    '    syncEnabled();',
    '  }',
    '  function syncEnabled() {',
    '    var saved = (state && state.saved) || {};',
    '    var hasSaved = Boolean(saved.visionProvider && saved.visionModel);',
    '    byId("save").disabled = busy || !byId("provider").value || !byId("model").value;',
    '    byId("reset").disabled = busy || !hasSaved;',
    '    byId("reload").disabled = busy;',
    '    byId("save").textContent = busy ? "保存中…" : "保存";',
    '  }',
    '  function load(notice) {',
    '    busy = true;',
    '    syncEnabled();',
    '    setStatus("正在读取可用的模型目录…", false);',
    '    api(null).then(function (next) {',
    '      busy = false;',
    '      render(next, notice || "");',
    '    }).catch(function (error) {',
    '      busy = false;',
    '      syncEnabled();',
    '      setStatus("无法读取设置：" + (error && error.message ? error.message : error), true);',
    '    });',
    '  }',
    '  function send(body, notice) {',
    '    busy = true;',
    '    syncEnabled();',
    '    api(body).then(function (next) {',
    '      busy = false;',
    '      render(next, notice);',
    '    }).catch(function (error) {',
    '      busy = false;',
    '      syncEnabled();',
    '      setStatus(notice + "失败：" + (error && error.message ? error.message : error), true);',
    '    });',
    '  }',
    '  byId("provider").addEventListener("change", function (event) {',
    '    fillModels(event.target.value, "");',
    '    syncEnabled();',
    '  });',
    '  byId("model").addEventListener("change", syncEnabled);',
    '  byId("save").addEventListener("click", function () {',
    '    send({ action: "save", provider: byId("provider").value, model: byId("model").value }, "已保存");',
    '  });',
    '  byId("reset").addEventListener("click", function () {',
    '    send({ action: "reset" }, "已恢复默认");',
    '  });',
    '  byId("reload").addEventListener("click", function () { load(); });',
    '  load();',
    '})();',
    '</script>',
    '</body>',
    '</html>',
  ].join('\n')
}

/**
 * Register the panel's route.
 *
 * @param options - wiring supplied by the plugin.
 * @param options.ctx - a context that can read the `webServer` and `llm` services.
 * @param options.defaults - `{ provider, model }` the plugin falls back to.
 * @param options.currentRoute - the route a read would use right now, with its source.
 * @param options.onRouteChanged - called after a save or reset, so readings made by
 *   the previous route stop being served from the cache.
 * @param options.env - environment the DSH home is resolved from.
 * @returns `{ route, dispose }`, or `null` when this deployment has no route registry.
 */
export function createSettingsServer({ ctx, defaults, currentRoute, onRouteChanged = () => {}, env = process.env } = {}) {
  let webServer
  try {
    webServer = ctx?.webServer ?? (typeof ctx?.get === 'function' ? ctx.get('webServer') : undefined)
  } catch {
    webServer = undefined
  }
  if (webServer === undefined || webServer === null || typeof webServer.register !== 'function') return null

  /** The current view: what is saved, what it means, and what can be chosen. */
  const snapshot = async () => {
    let llm
    try {
      llm = typeof ctx?.get === 'function' ? ctx.get('llm') : undefined
    } catch {
      llm = undefined
    }
    const catalog = await readCatalog(llm)
    return {
      saved: readVisionSettings(env),
      effective: typeof currentRoute === 'function' ? currentRoute() : undefined,
      defaults,
      ...catalog,
    }
  }

  const handler = async (request, response) => {
    try {
      if (request.method === 'GET') {
        // A browser opening the route asks for HTML; the settings panel fetches
        // this same route with `accept: application/json` and gets the state.
        // One route means the page and the API can never drift apart.
        if (String(request.headers?.accept ?? '').includes('text/html')) {
          const html = settingsPageHtml()
          response.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-store',
            'content-length': Buffer.byteLength(html),
          })
          response.end(html)
          return
        }
        sendJson(response, 200, await snapshot())
        return
      }
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: '只支持 GET 和 POST' })
        return
      }
      if (!fromThisPage(request)) {
        sendJson(response, 403, { error: '这次修改必须来自 DSH 设置面板' })
        return
      }
      const body = await readBody(request)
      if (body.action === 'save') {
        writeVisionSettings(
          {
            visionProvider: typeof body.provider === 'string' ? body.provider : '',
            visionModel: typeof body.model === 'string' ? body.model : '',
          },
          env,
        )
        onRouteChanged()
        sendJson(response, 200, await snapshot())
        return
      }
      if (body.action === 'reset') {
        clearVisionSettings(env)
        onRouteChanged()
        sendJson(response, 200, await snapshot())
        return
      }
      sendJson(response, 400, { error: 'action 只能是 save 或 reset' })
    } catch (error) {
      const message = String(error?.message ?? error).slice(0, 300)
      sendJson(response, 400, { error: message })
    }
  }

  let dispose
  try {
    dispose = webServer.register({ kind: 'exact', path: SETTINGS_ROUTE, handler })
  } catch (error) {
    throw new Error(`cannot register ${SETTINGS_ROUTE}: ${error?.message ?? error}`, { cause: error })
  }

  return {
    route: SETTINGS_ROUTE,
    dispose() {
      try {
        dispose?.()
      } catch {
        // Disposing a route that was never fully mounted is not a failure.
      }
    },
  }
}
