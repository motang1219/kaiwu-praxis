// kaiwu-praxis 客户端插件（浏览器侧）：数字员工广场。
// 自注册 bundle（classic script，非 ESM），由 dsh-client-modules 作为
// /plugins/kaiwu-praxis/client.js 直接下发；materialize 时返回 { name, inject, apply }。
window.__ModuleLoader__.load({
  id: "kaiwu-praxis",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");

    // ---------------------------------------------------------------------
    // CSS：运营台 index.html 的卡片观感（白卡片 + 青绿品牌色 + 渐变头像）。
    // ---------------------------------------------------------------------
    var CSS = [
      ".kwp{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:10px}",
      ".kwp-head{display:flex;align-items:center;gap:10px;min-width:0}",
      ".kwp-title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:700;line-height:22px}",
      ".kwp-badge{background:#0f766e;color:#fff;border-radius:999px;padding:1px 9px;font-size:12px;font-weight:600;line-height:18px}",
      ".kwp-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}",
      ".kwp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(218px,1fr));gap:12px}",
      ".kwp-card{appearance:none;font-family:inherit;text-align:left;cursor:pointer;color:#0f172a;background:#ffffff;border:1px solid #e5e9ee;border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px -18px rgba(15,23,42,.25);padding:13px 15px 12px;display:flex;flex-direction:column;gap:9px;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}",
      ".kwp-card:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px -18px rgba(15,23,42,.35);border-color:#d7dce2}",
      ".kwp-card:active:not(:disabled){transform:translateY(0)}",
      ".kwp-card:disabled{cursor:default;opacity:.65}",
      ".kwp-cardActive{border-color:#0f766e;box-shadow:0 0 0 1px #0f766e,0 10px 30px -18px rgba(15,118,110,.35)}",
      ".kwp-cardTop{display:flex;align-items:center;gap:10px;min-width:0}",
      ".kwp-avatar{flex:none;width:40px;height:40px;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;line-height:1}",
      ".kwp-id{min-width:0;flex:1}",
      ".kwp-name{font-size:14px;font-weight:700;color:#0f172a;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kwp-role{font-size:12px;color:#5b6675;line-height:16px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kwp-online{flex:none;font-size:12px;color:#16a34a;display:flex;align-items:center;gap:5px;line-height:16px}",
      ".kwp-online .kwp-dot{width:7px;height:7px;border-radius:50%;background:#16a34a}",
      ".kwp-inuse{flex:none;font-size:11px;font-weight:600;color:#0f766e;background:#e7f5f3;border-radius:999px;padding:1px 8px;line-height:16px}",
      ".kwp-desc{font-size:12.5px;color:#5b6675;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".kwp-cta{display:block;text-align:center;background:#0f766e;color:#fff;border-radius:9px;padding:8px;font-size:13px;font-weight:600;line-height:18px;transition:background .12s ease}",
      ".kwp-card:hover .kwp-cta{background:#115e59}",
      ".kwp-meta{display:flex;gap:18px;border-top:1px solid #eef1f5;padding-top:8px;font-size:11px;color:#8b95a3;line-height:16px}",
      ".kwp-meta b{color:#0f172a;font-size:13px;font-weight:700;margin-right:3px}",
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
    // 文案。
    // ---------------------------------------------------------------------
    var zh = {
      title: "数字员工广场",
      hint: "选一位数字员工，直接开聊",
      loading: "正在加载数字员工…",
      error: "加载失败",
      inUse: "使用中",
      online: "在线",
      chat: "发起对话",
      ariaCard: "选择数字员工："
    };
    var en = {
      title: "Digital Worker Plaza",
      hint: "Pick a digital worker to start",
      loading: "Loading digital workers…",
      error: "Failed to load",
      inUse: "In use",
      online: "Online",
      chat: "Chat",
      ariaCard: "Start with digital worker: "
    };

    // 每位员工的展示元数据（观感对齐运营台 index.html）。
    var WORKER_META = {
      "kaiwu-watermark": { order: 1, role: "文件安全助手", icon: "水", gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", zi: 0, skill: 0, sop: 0 },
      "kaiwu-docbutler": { order: 2, role: "投标资料管家", icon: "资", gradient: "linear-gradient(135deg,#2563eb,#60a5fa)", zi: 0, skill: 1, sop: 0 },
      "kaiwu-content": { order: 3, role: "营销文案员", icon: "撰", gradient: "linear-gradient(135deg,#7c3aed,#c084fc)", zi: 0, skill: 1, sop: 0 },
      "kaiwu-competitor": { order: 4, role: "竞品分析专家", icon: "竞", gradient: "linear-gradient(135deg,#0e7490,#22d3ee)", zi: 0, skill: 1, sop: 0 },
      "kaiwu-research": { order: 5, role: "情报官", icon: "情", gradient: "linear-gradient(135deg,#0d9488,#2dd4bf)", zi: 0, skill: 1, sop: 0 }
    };

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    // ---------------------------------------------------------------------
    // 广场组件。
    // ---------------------------------------------------------------------
    function WorkerPlaza(props) {
      var api = props.api;
      var startSession = props.startSession;
      var currentSession = props.currentSession;
      var subscribeSessions = props.subscribeSessions;
      var t = props.t;

      var stagedRef = React.useRef(undefined);
      var fallbackRef = React.useRef("");

      var _o = React.useState([]);
      var options = _o[0];
      var setOptions = _o[1];
      var _c = React.useState("");
      var current = _c[0];
      var setCurrent = _c[1];
      var _b = React.useState(false);
      var busy = _b[0];
      var setBusy = _b[1];
      var _e = React.useState(null);
      var error = _e[0];
      var setError = _e[1];

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
          mine.sort(function (a, b) {
            return (WORKER_META[a.id] ? WORKER_META[a.id].order : 99) - (WORKER_META[b.id] ? WORKER_META[b.id].order : 99);
          });
          fallbackRef.current = (mine[0] || {}).id || "";
          setOptions(mine);
          setCurrent(function (c) {
            if (c !== "") return c;
            return (mine.find(function (p) { return p.isDefault; }) || mine[0] || {}).id || "";
          });
        }).catch(function (e) {
          if (alive) setError(messageOf(e));
        });
        return function () { alive = false; };
      }, [api]);

      React.useEffect(function () {
        if (!subscribeSessions) return;
        return subscribeSessions(function () { applyStaged(); });
      }, []);

      function applyStaged() {
        var staged = stagedRef.current;
        if (staged === undefined) return;
        var s = currentSession ? currentSession() : undefined;
        if (s === undefined || !s.blank) return;
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
          applyStaged();
        } else if (startSession) {
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

      return React.createElement("div", { className: "kwp" },
        React.createElement("div", { className: "kwp-head" },
          React.createElement("span", { className: "kwp-title" }, t("title")),
          React.createElement("span", { className: "kwp-badge" }, String(options.length)),
          React.createElement("span", { className: "kwp-hint" }, t("hint"))
        ),
        React.createElement("div", { className: "kwp-grid" },
          options.map(function (p) {
            var meta = WORKER_META[p.id] || { role: "", icon: (p.name || p.id).charAt(0), gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", zi: 0, skill: 0, sop: 0 };
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
                  React.createElement("span", { className: "kwp-avatar", style: { background: meta.gradient } }, meta.icon),
                  React.createElement("span", { className: "kwp-id" },
                    React.createElement("span", { className: "kwp-name" }, p.name || p.id),
                    React.createElement("span", { className: "kwp-role" }, meta.role)
                  ),
                  selected
                    ? React.createElement("span", { className: "kwp-inuse" }, t("inUse"))
                    : React.createElement("span", { className: "kwp-online" }, React.createElement("span", { className: "kwp-dot" }), t("online"))
                ),
                React.createElement("span", { className: "kwp-desc" }, p.description || ""),
                React.createElement("span", { className: "kwp-cta" }, t("chat")),
                React.createElement("span", { className: "kwp-meta" },
                  React.createElement("span", null, React.createElement("b", null, String(meta.zi)), " 资料"),
                  React.createElement("span", null, React.createElement("b", null, String(meta.skill)), " 技能"),
                  React.createElement("span", null, React.createElement("b", null, String(meta.sop)), " SOP")
                )
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

      ctx.inject(["slots", "conversation", "sessions", "workspaces"], function (scope) {
        var api = scope.get("connection") ? scope.get("connection").api : undefined;
        scope.effect(function () {
          var dispose = scope.slots.register({
            name: "conversation.hero.agentPreset",
            // 官方 agent-preset 芯片以 priority 0 占着这个 single 槽；用更低 priority 抢占。
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
