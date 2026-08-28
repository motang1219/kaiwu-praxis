// kaiwu-praxis 客户端插件（浏览器侧）：数字员工广场。
// 这是一个「自注册 bundle」（classic script，非 ESM）：
// 由 host 的 dsh-client-modules 作为 /plugins/kaiwu-praxis/client.js 直接下发，
// 执行时只注册 factory；被 import 时才 materialize 并返回 { name, inject, apply }。
window.__ModuleLoader__.load({
  id: "kaiwu-praxis",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");

    // ---------------------------------------------------------------------
    // CSS：注入一次，带 data-plugin-css 标记避免重复注入（HMR 归属也靠 data-plugin）。
    // ---------------------------------------------------------------------
    var CSS = [
      ".kwp-root{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:8px}",
      ".kwp-head{display:flex;align-items:baseline;gap:8px;min-width:0}",
      ".kwp-title{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px;white-space:nowrap}",
      ".kwp-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}",
      ".kwp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px}",
      ".kwp-card{appearance:none;font:inherit;text-align:left;cursor:pointer;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;align-items:stretch;gap:6px;padding:10px 12px;display:flex;transition:border-color .15s,background .15s,transform .15s}",
      ".kwp-card:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}",
      ".kwp-card:active:not(:disabled){transform:translateY(1px)}",
      ".kwp-card:disabled{cursor:default;opacity:.65}",
      ".kwp-cardActive{border-color:#0f766e;background:var(--dsw-alias-bg-layer-2)}",
      ".kwp-cardTop{display:flex;align-items:center;gap:8px;min-width:0}",
      ".kwp-mark{flex:none;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;line-height:1}",
      ".kwp-name{min-width:0;font-size:13px;font-weight:600;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kwp-desc{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".kwp-badge{flex:none;color:#0f766e;background:rgba(15,118,110,.12);border-radius:999px;padding:0 7px;font-size:10px;font-weight:600;line-height:16px}",
      ".kwp-empty{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;padding:8px 12px}",
      ".kwp-error{color:var(--dsw-alias-state-error-primary)}"
    ].join("");
    var CSS_TAG = "kaiwu-praxis/plaza.module.css";
    if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + CSS_TAG + '"]') === null) {
      var styleEl = document.createElement("style");
      styleEl.dataset.plugin = "kaiwu-praxis";
      styleEl.dataset.pluginCss = CSS_TAG;
      styleEl.textContent = CSS;
      document.head.appendChild(styleEl);
    }

    // ---------------------------------------------------------------------
    // 文案（zh/en，随 slot 的 locale 座位注入 t）。
    // ---------------------------------------------------------------------
    var zh = {
      title: "数字员工广场",
      hint: "选一位数字员工，直接开聊",
      loading: "正在加载数字员工…",
      error: "加载失败",
      inUse: "使用中",
      ariaCard: "选择数字员工："
    };
    var en = {
      title: "Digital Worker Plaza",
      hint: "Pick a digital worker to start",
      loading: "Loading digital workers…",
      error: "Failed to load",
      inUse: "In use",
      ariaCard: "Start with digital worker: "
    };

    // 每个员工一个主题色 + 图标字（名字首字 fallback）。
    var WORKER_META = {
      "kaiwu-watermark": { color: "#0f766e" },
      "kaiwu-docbutler": { color: "#2563eb" },
      "kaiwu-content": { color: "#7c3aed" },
      "kaiwu-competitor": { color: "#d97706" },
      "kaiwu-research": { color: "#e11d48" }
    };

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    // ---------------------------------------------------------------------
    // 广场组件：读 roster → 过滤 kaiwu-* → 卡片；点卡片 = 选预设 + 开新会话。
    // ---------------------------------------------------------------------
    function WorkerPlaza(props) {
      var api = props.api;
      var startSession = props.startSession;
      var currentSession = props.currentSession;
      var subscribeSessions = props.subscribeSessions;
      var t = props.t;

      var optionsRef = React.useRef([]);
      var stagedRef = React.useRef(undefined);
      var fallbackRef = React.useRef("");

      var _s = React.useState([]);
      var options = _s[0];
      var setOptions = _s[1];
      var _c = React.useState("");
      var current = _c[0];
      var setCurrent = _c[1];
      var _b = React.useState(false);
      var busy = _b[0];
      var setBusy = _b[1];
      var _e = React.useState(null);
      var error = _e[0];
      var setError = _e[1];

      // 读 roster（一次性；广场只关心 kaiwu- 前缀的员工）。
      React.useEffect(function () {
        var alive = true;
        if (!api || !api.agentPresets) {
          if (alive) setError("connection unavailable");
          return;
        }
        api.agentPresets.list({}).then(function (resp) {
          if (!alive) return;
          if (!resp.result.ok) {
            setError(resp.result.error.message);
            return;
          }
          var roster = resp.result.value.presets || [];
          var mine = roster.filter(function (p) {
            return p.broken === undefined && /^kaiwu-/.test(p.id);
          });
          optionsRef.current = mine;
          setOptions(mine);
          fallbackRef.current = (roster.find(function (p) { return p.isDefault; }) || roster[0] || {}).id || "";
          setCurrent(function (c) {
            if (c !== "") return c;
            return (mine.find(function (p) { return p.isDefault; }) || mine[0] || {}).id || "";
          });
        }).catch(function (e) {
          if (alive) setError(messageOf(e));
        });
        return function () { alive = false; };
      }, [api]);

      // 会话列表变化时，把「已暂存」的预设落到新出现的空白会话上。
      React.useEffect(function () {
        if (!subscribeSessions) return;
        return subscribeSessions(function () { applyStaged(); });
      }, []);

      function applyStaged() {
        var staged = stagedRef.current;
        if (staged === undefined) return;
        var s = currentSession ? currentSession() : undefined;
        if (s === undefined || !s.blank) return; // 等一个空白会话出现
        if (s.agentPreset === staged) {
          stagedRef.current = undefined;
          return;
        }
        setBusy(true);
        setError(null);
        api.agentPresets.select({ sessionId: s.id, agentPreset: staged }).then(function (resp) {
          stagedRef.current = undefined;
          setBusy(false);
          if (!resp.result.ok) {
            setError(resp.result.error.message);
            setCurrent(fallbackRef.current);
            return;
          }
          setCurrent(resp.result.value.agentPreset);
        }).catch(function (e) {
          stagedRef.current = undefined;
          setBusy(false);
          setError(messageOf(e));
          setCurrent(fallbackRef.current);
        });
      }

      function pick(id) {
        if (busy) return;
        stagedRef.current = id;
        setCurrent(id);
        setError(null);
        var s = currentSession ? currentSession() : undefined;
        if (s !== undefined && s.blank) {
          // 已有空白会话：直接 recompose 到该预设。
          applyStaged();
        } else if (startSession) {
          // 否则开一个新会话，会话列表变化时会话被 applyStaged 落上预设。
          startSession();
        }
      }

      if (options.length === 0) {
        if (error) {
          return React.createElement("div", { className: "kwp-empty kwp-error", role: "alert" },
            t("error") + " · " + error);
        }
        return React.createElement("div", { className: "kwp-empty" }, t("loading"));
      }

      return React.createElement("div", { className: "kwp-root" },
        React.createElement("div", { className: "kwp-head" },
          React.createElement("span", { className: "kwp-title" }, t("title")),
          React.createElement("span", { className: "kwp-hint" }, t("hint"))
        ),
        React.createElement("div", { className: "kwp-grid" },
          options.map(function (p) {
            var meta = WORKER_META[p.id] || { color: "#0f766e" };
            var mark = (p.name || p.id).charAt(0);
            var selected = current === p.id;
            return React.createElement("button", {
              key: p.id,
              type: "button",
              className: "kwp-card" + (selected ? " kwp-cardActive" : ""),
              "aria-pressed": selected,
              "aria-label": t("ariaCard") + (p.name || p.id),
              disabled: busy,
              onClick: function () { pick(p.id); },
              children: [
                React.createElement("span", { className: "kwp-cardTop" },
                  React.createElement("span", { className: "kwp-mark", style: { background: meta.color } }, mark),
                  React.createElement("span", { className: "kwp-name" }, p.name || p.id),
                  selected ? React.createElement("span", { className: "kwp-badge" }, t("inUse")) : null
                ),
                React.createElement("span", { className: "kwp-desc" }, p.description || "")
              ]
            });
          })
        )
      );
    }

    // ---------------------------------------------------------------------
    // cordis 客户端插件。
    // ---------------------------------------------------------------------
    var inject = ["slots", "locale", "connection"];

    function apply(ctx) {
      ctx.effect(function () {
        ctx.locale.register("kaiwu.praxis", { zh: zh, en: en });
      }, "kaiwu-praxis: plaza locale");

      // 广场放在新会话英雄区（与 workspace picker 同排）。scope 里能拿到
      // sessions（读当前会话 / 订阅变化）与 workspaces（开新会话）。
      ctx.inject(["slots", "conversation", "sessions", "workspaces"], function (scope) {
        var api = scope.get("connection") ? scope.get("connection").api : undefined;
        scope.effect(function () {
          var dispose = scope.slots.register({
            name: "conversation.hero.agentPreset",
            // 官方 agent-preset 芯片以 priority 0 占着这个 single 槽；用更低的
            // priority 抢占，让「数字员工广场」替代它成为启动区的主体。
            priority: -1,
            locale: "kaiwu.praxis",
            inject: function () {
              return {
                api: api,
                startSession: function () {
                  if (scope.workspaces && typeof scope.workspaces.startSession === "function") {
                    scope.workspaces.startSession();
                  }
                },
                currentSession: function () {
                  if (!scope.sessions || !scope.sessions.list) return undefined;
                  var state = scope.sessions.list.getSnapshot();
                  var summary = state.current === undefined ? undefined : state.byId[state.current];
                  if (summary === undefined) return undefined;
                  var out = { id: summary.id, blank: summary.blank };
                  if (summary.agentPreset !== undefined) out.agentPreset = summary.agentPreset;
                  return out;
                },
                subscribeSessions: function (fn) {
                  if (!scope.sessions || !scope.sessions.list) return function () {};
                  return scope.sessions.list.subscribe(fn);
                }
              };
            }
          }, WorkerPlaza);
          return dispose;
        }, "kaiwu-praxis: plaza registration");
      });
    }

    exports.name = "kaiwu-praxis";
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
