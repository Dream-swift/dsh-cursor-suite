/**
 * dsh-read-image-bridge — 设置 → 图片识读（浏览器侧）。
 *
 * `package.json` 的 `dsh.client.platform: "web"` 让 shell 把本文件当成客户端模块
 * 加载并调用 `apply(ctx)`。面板本身是 `settings.section` 里的一项：两个下拉框
 * （服务商、模型），数据来自宿主的 `GET /dsh-read-image-bridge/settings` ——
 * 那个路由会列出所有已注册路由及其声明的模型（见 lib/settings-server.js）。
 *
 * 这里刻意不用 RPC 通道而走同源 `fetch`：宿主侧把路由挂在共享 webServer 上，
 * 于是不需要额外的连接插桩，任何有 GUI 的部署都能用；没有 webServer 的部署
 * 只是没有这一页，`read_image` 本体照常工作。
 */
window.__ModuleLoader__.load({
  id: "dsh-read-image-bridge",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
    var h = React.createElement;

    /** 宿主注册的路由；`SETTINGS_ROUTE` in lib/settings-server.js 与之相同。 */
    var API_PATH = "/dsh-read-image-bridge/settings";
    /** 设置项 id：shell 用它给导航栏那一项取键。 */
    var SECTION_ID = "read-image-bridge";
    /** 排在「内置插件」(15)、「Cursor 订阅」(20) 之后。 */
    var SECTION_ORDER = 30;
    var STYLE_ID = "dsh-read-image-bridge-style";

    var CSS = [
      '[data-dsh-rib]{color:var(--dsw-alias-label-primary,#1f2329);font-size:13px;line-height:20px;max-width:760px}',
      '[data-dsh-rib] *{box-sizing:border-box}',
      '[data-dsh-rib] .rib-head{margin:0 0 4px;font-size:18px;font-weight:600;line-height:26px}',
      '[data-dsh-rib] .rib-intro{margin:0 0 16px;color:var(--dsw-alias-label-tertiary,#8a919e);font-size:13px;line-height:20px}',
      '[data-dsh-rib] .rib-card{margin:0 0 12px;padding:16px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px}',
      '[data-dsh-rib] .rib-card-title{margin:0 0 4px;font-size:14px;font-weight:600;line-height:22px}',
      '[data-dsh-rib] .rib-card-note{margin:0 0 14px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '[data-dsh-rib] .rib-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px}',
      '[data-dsh-rib] .rib-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
      '[data-dsh-rib] .rib-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#5c6370)}',
      '[data-dsh-rib] .rib-input{width:100%;height:34px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font:inherit;outline:none}',
      '[data-dsh-rib] .rib-input:focus{border-color:var(--dsw-alias-brand-primary,#4f7cff);box-shadow:0 0 0 3px rgba(79,124,255,.14)}',
      '[data-dsh-rib] .rib-input:disabled{opacity:.6;cursor:default}',
      '[data-dsh-rib] .rib-hint{margin:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '[data-dsh-rib] .rib-warn{margin:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-warn-primary,#d89614)}',
      '[data-dsh-rib] .rib-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}',
      '[data-dsh-rib] .rib-btn{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}',
      '[data-dsh-rib] .rib-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04))}',
      '[data-dsh-rib] .rib-btn:disabled{opacity:.5;cursor:default}',
      '[data-dsh-rib] .rib-btn-primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,#4f7cff);color:var(--dsw-alias-label-primary-foreground,#fff)}',
      '[data-dsh-rib] .rib-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#3f6be0)}',
      '[data-dsh-rib] .rib-status{margin-top:10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e);min-height:18px;overflow-wrap:anywhere}',
      '[data-dsh-rib] .rib-status.is-error{color:var(--dsw-alias-state-error-primary,#e5484d)}',
      '[data-dsh-rib] .rib-list{margin:0;padding-left:18px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '[data-dsh-rib] .rib-kv{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e);overflow-wrap:anywhere}',
      '[data-dsh-rib] .rib-loading{padding:12px 0;font-size:12px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '@media(max-width:720px){[data-dsh-rib] .rib-grid{grid-template-columns:1fr}}',
    ].join("");

    function installStyle() {
      try {
        if (typeof document === "undefined") return;
        if (document.getElementById(STYLE_ID) !== null) return;
        var tag = document.createElement("style");
        tag.id = STYLE_ID;
        tag.textContent = CSS;
        document.head.appendChild(tag);
      } catch (error) {
        /* 少一份样式只损失观感 */
      }
    }

    /**
     * 同源路由。宿主不用路径路由（`location.pathname` 恒为 `/`），所以以
     * `document.baseURI` —— 它服务于 UI 的那个目录 —— 为锚点拼出来。
     */
    function apiUrl() {
      var relative = String(API_PATH).replace(/^\/+/, "");
      try {
        if (typeof document === "undefined") return "/" + relative;
        return new URL(relative, document.baseURI).pathname;
      } catch (error) {
        return "/" + relative;
      }
    }

    function message(error) {
      if (error && error.message) return String(error.message);
      return String(error);
    }

    /** 一次 JSON 调用；失败时把服务端给的错误原样抛出来。 */
    function call(method, body) {
      var init = {
        method: method,
        cache: "no-store",
        credentials: "same-origin",
        headers: body === undefined
          ? { accept: "application/json" }
          : { accept: "application/json", "content-type": "application/json" },
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      return fetch(apiUrl(), init).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) throw new Error(data && data.error ? String(data.error) : "HTTP " + response.status);
          return data || {};
        });
      });
    }

    /** 表单初值：已保存的优先，其次当前生效（配置或默认值）。 */
    function formOf(snapshot) {
      var saved = (snapshot && snapshot.saved) || {};
      var effective = (snapshot && snapshot.effective) || {};
      var defaults = (snapshot && snapshot.defaults) || {};
      return {
        provider: saved.visionProvider || effective.provider || defaults.provider || "",
        model: saved.visionModel || effective.model || defaults.model || "",
      };
    }

    function providersOf(snapshot) {
      var list = snapshot && snapshot.providers;
      return Array.isArray(list) ? list : [];
    }

    function modelsOf(snapshot, provider) {
      var found = providersOf(snapshot).filter(function (entry) {
        return entry && entry.id === provider;
      })[0];
      return found && Array.isArray(found.models) ? found.models : [];
    }

    /** 来源的人话说明。 */
    function sourceLabel(source) {
      if (source === "settings") return "设置页（已保存）";
      if (source === "config") return "插件配置";
      if (source === "default") return "插件默认值";
      return "未知";
    }

    function optionRow(key, value, text, disabled) {
      return h("option", { key: key, value: value, disabled: disabled === true }, text);
    }

    function providerOptions(providers, current) {
      var rows = providers.map(function (entry) {
        var count = Array.isArray(entry.models) ? entry.models.length : 0;
        var suffix = count === 0 ? " · 无模型" : " · " + count + " 个模型";
        var name = entry.name && entry.name !== entry.id ? entry.name + " (" + entry.id + ")" : entry.id;
        return optionRow(entry.id, entry.id, name + suffix);
      });
      var known = providers.some(function (entry) { return entry.id === current; });
      if (current !== "" && !known) {
        rows.unshift(optionRow("__current", current, current + "（未在服务商目录中）"));
      }
      if (rows.length === 0) rows.push(optionRow("__none", "", "（没有可用的服务商）", true));
      return rows;
    }

    function modelOptions(models, current) {
      var rows = models.map(function (model) {
        var suffix = model.imageCapable === true ? " · 支持图片" : model.imageCapable === false ? " · 无图片输入" : "";
        var text = model.name && model.name !== model.id ? model.name + " (" + model.id + ")" : model.id;
        return optionRow(model.id, model.id, text + suffix);
      });
      var known = models.some(function (model) { return model.id === current; });
      if (current !== "" && !known) {
        rows.unshift(optionRow("__current", current, current + "（不在模型列表中）"));
      }
      if (rows.length === 0) rows.push(optionRow("__none", "", "（这个服务商没有列出模型）", true));
      return rows;
    }

    var INITIAL_VIEW = {
      phase: "loading",
      snapshot: null,
      form: { provider: "", model: "" },
      error: "",
      notice: "",
      busy: false,
    };

    function SettingsPanel() {
      var state = React.useState(INITIAL_VIEW);
      var view = state[0];
      var setView = state[1];
      var alive = React.useRef(true);

      React.useEffect(function () {
        alive.current = true;
        return function () { alive.current = false; };
      }, []);

      var update = React.useCallback(function (next) {
        setView(function (previous) { return Object.assign({}, previous, next); });
      }, []);

      var applySnapshot = React.useCallback(function (snapshot, extra) {
        if (!alive.current) return;
        setView(function (previous) {
          return Object.assign({}, previous, {
            phase: "ready",
            snapshot: snapshot,
            form: formOf(snapshot),
            busy: false,
            error: "",
          }, extra || {});
        });
      }, []);

      var load = React.useCallback(function () {
        update({ phase: "loading", error: "", notice: "" });
        call("GET").then(function (snapshot) {
          applySnapshot(snapshot);
        }).catch(function (error) {
          if (!alive.current) return;
          update({ phase: "error", busy: false, error: "无法读取设置：" + message(error) });
        });
      }, [applySnapshot, update]);

      React.useEffect(function () { load(); }, [load]);

      var send = React.useCallback(function (body, label) {
        update({ busy: true, error: "", notice: "" });
        call("POST", body).then(function (snapshot) {
          applySnapshot(snapshot, { notice: label });
        }).catch(function (error) {
          if (!alive.current) return;
          update({ busy: false, error: label + "失败：" + message(error) });
        });
      }, [applySnapshot, update]);

      var snapshot = view.snapshot;
      var providers = providersOf(snapshot);
      var saved = (snapshot && snapshot.saved) || {};
      var effective = (snapshot && snapshot.effective) || {};
      var hasSaved = Boolean(saved.visionProvider && saved.visionModel);
      var models = modelsOf(snapshot, view.form.provider);
      var selected = models.filter(function (model) { return model.id === view.form.model; })[0];
      var baseline = hasSaved
        ? { provider: saved.visionProvider, model: saved.visionModel }
        : { provider: effective.provider || "", model: effective.model || "" };
      var dirty = view.form.provider !== baseline.provider || view.form.model !== baseline.model;
      var ready = view.phase === "ready";
      var canSave = ready && !view.busy && view.form.provider !== "" && view.form.model !== "";

      function pickProvider(id) {
        var next = modelsOf(snapshot, id);
        var pick = next.filter(function (model) { return model.imageCapable === true; })[0] || next[0];
        update({ form: { provider: id, model: pick ? pick.id : "" }, notice: "" });
      }

      function pickModel(id) {
        update({ form: { provider: view.form.provider, model: id }, notice: "" });
      }

      function save() {
        send({ action: "save", provider: view.form.provider, model: view.form.model }, "已保存");
      }

      function reset() {
        send({ action: "reset" }, "已恢复默认");
      }

      var capability = null;
      if (selected !== undefined && selected.imageCapable === false) {
        capability = h("p", { className: "rib-warn" }, "这个模型没有声明图片输入能力，交给它读图很可能直接失败。");
      } else if (selected !== undefined && selected.imageCapable === null) {
        capability = h("p", { className: "rib-hint" }, "这个模型没有声明输入模态，无法确认它能不能读图。");
      }

      var problems = [];
      if (typeof saved.error === "string" && saved.error !== "") problems.push(saved.error);
      var diagnostics = snapshot && Array.isArray(snapshot.diagnostics) ? snapshot.diagnostics : [];
      for (var index = 0; index < diagnostics.length; index += 1) {
        var entry = diagnostics[index];
        if (!entry) continue;
        problems.push((entry.provider ? "「" + entry.provider + "」" : "目录") + "：" + String(entry.error || "未知错误"));
      }

      var status = view.error !== "" ? view.error : view.notice;
      var statusClass = "rib-status" + (view.error !== "" ? " is-error" : "");

      return h("div", { "data-dsh-rib": "" },
        h("h2", { className: "rib-head" }, "图片识读（read_image）"),
        h("p", { className: "rib-intro" },
          "当前模型看不到图片时，read_image 会把文件交给这里的视觉模型读成文字。保存后下一次读图立即生效，不必重启 DSH。"),

        view.phase === "loading" && snapshot === null
          ? h("p", { className: "rib-loading" }, "正在读取可用的模型目录…")
          : null,

        h("div", { className: "rib-card" },
          h("h3", { className: "rib-card-title" }, "图形委托模型"),
          h("p", { className: "rib-card-note" }, "选中一个能看图的模型；它的服务商必须已在本部署注册。"),
          h("div", { className: "rib-grid" },
            h("label", { className: "rib-field" },
              h("span", { className: "rib-label" }, "服务商"),
              h("select", {
                className: "rib-input",
                value: view.form.provider,
                disabled: !ready || view.busy,
                onChange: function (event) { pickProvider(event.target.value); },
              }, providerOptions(providers, view.form.provider)),
            ),
            h("label", { className: "rib-field" },
              h("span", { className: "rib-label" }, "模型"),
              h("select", {
                className: "rib-input",
                value: view.form.model,
                disabled: !ready || view.busy,
                onChange: function (event) { pickModel(event.target.value); },
              }, modelOptions(models, view.form.model)),
            ),
          ),
          capability,
          h("div", { className: "rib-actions" },
            h("button", {
              type: "button",
              className: "rib-btn rib-btn-primary",
              disabled: !canSave,
              onClick: save,
            }, view.busy ? "保存中…" : "保存"),
            h("button", {
              type: "button",
              className: "rib-btn",
              disabled: !ready || view.busy || !hasSaved,
              onClick: reset,
            }, "恢复默认"),
            h("button", {
              type: "button",
              className: "rib-btn",
              disabled: view.busy,
              onClick: load,
            }, "刷新"),
          ),
          h("p", { className: statusClass, role: view.error !== "" ? "alert" : "status" }, status),
        ),

        h("div", { className: "rib-card" },
          h("h3", { className: "rib-card-title" }, "当前生效"),
          h("p", { className: "rib-kv" },
            (effective.provider ? effective.provider + " / " + effective.model : "（尚未确定）")
              + " · 来源：" + sourceLabel(effective.source)
              + (hasSaved ? " · 文件：" + saved.path : " · 未保存过自定义模型")),
          problems.length > 0
            ? h("ul", { className: "rib-list" }, problems.map(function (text, at) {
                return h("li", { key: "p" + at }, text);
              }))
            : null,
          problems.length === 0 && providers.length === 0 && ready
            ? h("p", { className: "rib-hint" }, "这个部署没有列出任何模型路由，先用配置里的默认值。")
            : null,
        ),
      );
    }

    function apply(ctx) {
      installStyle();
      try {
        ctx.slots.inject("settings.section", function () {
          return ctx.slots.register({
            name: "settings.section",
            id: SECTION_ID,
            order: SECTION_ORDER,
            label: function () { return "图片识读"; },
          }, SettingsPanel);
        });
        // 浏览器控制台一行。「模块压根没加载」和「模块加载了但导航没接受这一项」
        // 从设置页看完全一样，只有这行能区分。
        try {
          console.info("[dsh-read-image-bridge] settings section registered: " + SECTION_ID);
        } catch (ignored) {
          /* console 不可用就算了 */
        }
      } catch (error) {
        // 少一页设置不影响 read_image 本体。
        try {
          console.error("[dsh-read-image-bridge] settings section registration failed:", error);
        } catch (ignored) {
          /* nothing to do */
        }
      }
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    // Pure helpers a test can pin; the DSH client module loader reads only
    // `apply` and `inject`, so exporting these costs nothing at runtime.
    exports.__internals = {
      API_PATH: API_PATH,
      SECTION_ID: SECTION_ID,
      SECTION_ORDER: SECTION_ORDER,
      apiUrl: apiUrl,
      formOf: formOf,
      providerOptions: providerOptions,
      modelOptions: modelOptions,
      sourceLabel: sourceLabel,
      SettingsPanel: SettingsPanel,
    };
    return module.exports;
  },
});
