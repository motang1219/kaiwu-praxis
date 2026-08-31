// kaiwu-praxis 客户端插件（浏览器侧）：数字员工广场（整页覆盖版）。
// 自注册 bundle（classic script，非 ESM）：materialize 时返回 { name, inject, apply }。
// 在「无当前会话」的启动态，用 shell.overlay 全屏覆盖整个界面，展示运营台式广场；
// 一旦选中某位员工并开了会话，覆盖层自动收起，露出 DSH 原生对话界面。
window.__ModuleLoader__.load({
  id: "kaiwu-praxis",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");

    // ---------------------------------------------------------------------
    // CSS：运营台 index.html 的整体观感（浅色、左侧边栏、顶部栏、卡片网格）。
    // ---------------------------------------------------------------------
    var CSS = [
      ".kwp-fixed{position:fixed;inset:0;z-index:2147483000;background:#f4f6f8;color:#0f172a;font-family:'Geist Variable','Alimama ShuHeiTi',-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;display:grid;grid-template-columns:260px 1fr;min-width:0;min-height:0;overflow:hidden;pointer-events:auto}",
      ".kwp-sidebar{background:#ffffff;border-right:1px solid #e5e9ee;display:flex;flex-direction:column;padding:18px 14px;gap:6px;min-height:0}",
      ".kwp-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;padding:4px 8px 16px;color:#0f172a}",
      ".kwp-logoMark{width:30px;height:30px;border-radius:9px;color:#fff;background:linear-gradient(135deg,#0f766e,#14b8a6);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700}",
      ".kwp-nav{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;color:#5b6675;font-size:14px;font-weight:500;background:transparent;border:none;width:100%;text-align:left;cursor:pointer}",
      ".kwp-nav:hover{background:#f4f6f8}",
      ".kwp-navActive{background:#e7f5f3;color:#0f766e;font-weight:600}",
      ".kwp-navBadge{margin-left:auto;background:#eef1f5;color:#5b6675;font-size:12px;padding:1px 8px;border-radius:999px}",
      ".kwp-navActive .kwp-navBadge{background:#0f766e;color:#fff}",
      ".kwp-label{font-size:12px;color:#8b95a3;padding:14px 12px 6px;font-weight:600;letter-spacing:.02em}",
      ".kwp-convs{flex:1;overflow:auto;display:flex;flex-direction:column;gap:4px;min-height:0}",
      ".kwp-conv{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;border:none;background:transparent;width:100%;text-align:left;color:#5b6675;font-size:13px;cursor:pointer}",
      ".kwp-conv:hover{background:#f4f6f8}",
      ".kwp-convDot{width:22px;height:22px;border-radius:7px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600}",
      ".kwp-convT{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".kwp-emptyHint{color:#8b95a3;font-size:12px;padding:4px 12px}",
      ".kwp-foot{border-top:1px solid #e5e9ee;padding-top:10px;display:flex;flex-direction:column;gap:6px}",
      ".kwp-manage{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:9px;border:1px solid #e5e9ee;background:#fff;color:#0f172a;font-size:14px;font-weight:500;cursor:pointer}",
      ".kwp-tag{font-size:12px;color:#0f766e;background:#e7f5f3;padding:2px 8px;border-radius:999px}",
      ".kwp-main{display:flex;flex-direction:column;min-width:0;min-height:0}",
      ".kwp-topbar{display:flex;align-items:center;gap:12px;padding:14px 28px;background:#ffffff;border-bottom:1px solid #e5e9ee;flex:none}",
      ".kwp-search{flex:1;max-width:420px;display:flex;align-items:center;gap:8px;background:#f2f4f7;border:1px solid transparent;border-radius:10px;padding:9px 12px}",
      ".kwp-search:focus-within{border-color:#0f766e;background:#fff}",
      ".kwp-searchIcon{color:#8b95a3}",
      ".kwp-searchInput{border:none;outline:none;background:transparent;flex:1;font-size:14px;color:#0f172a;min-width:0}",
      ".kwp-topRight{margin-left:auto;display:flex;align-items:center;gap:8px}",
      ".kwp-ghost{border:1px solid #e5e9ee;background:#fff;color:#5b6675;border-radius:9px;padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer}",
      ".kwp-avatar{width:32px;height:32px;border-radius:50%;background:#0f766e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}",
      ".kwp-content{padding:22px 28px;overflow:auto;flex:1;min-height:0}",
      ".kwp-tabs{display:flex;gap:4px;border-bottom:1px solid #e5e9ee;margin-bottom:20px}",
      ".kwp-tab{padding:10px 16px;border:none;background:none;color:#5b6675;font-size:14px;font-weight:500;border-bottom:2px solid transparent;cursor:pointer}",
      ".kwp-tabActive{color:#0f766e;border-bottom-color:#0f766e;font-weight:600}",
      ".kwp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}",
      ".kwp-card{appearance:none;font-family:inherit;text-align:left;cursor:pointer;color:#0f172a;background:#ffffff;border:1px solid #e5e9ee;border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px -18px rgba(15,23,42,.25);padding:18px;display:flex;flex-direction:column;gap:12px;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}",
      ".kwp-card:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px -18px rgba(15,23,42,.35);border-color:#d7dce2}",
      ".kwp-card:active:not(:disabled){transform:translateY(0)}",
      ".kwp-card:disabled{cursor:default;opacity:.65}",
      ".kwp-cardHead{display:flex;align-items:center;gap:12px;min-width:0}",
      ".kwp-avatarBox{flex:none;width:46px;height:46px;border-radius:13px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}",
      ".kwp-id{min-width:0;flex:1}",
      ".kwp-name{font-size:16px;font-weight:700;color:#0f172a;line-height:22px;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kwp-handle{color:#8b95a3;font-weight:400;font-size:12px}",
      ".kwp-role{font-size:13px;color:#5b6675;line-height:18px;margin-top:2px}",
      ".kwp-status{margin-left:auto;flex:none;font-size:12px;color:#16a34a;display:flex;align-items:center;gap:5px;line-height:16px;white-space:nowrap}",
      ".kwp-statusDot{width:7px;height:7px;border-radius:50%;background:#16a34a}",
      ".kwp-cta{display:block;text-align:center;background:#0f766e;color:#fff;border-radius:10px;padding:11px;font-size:14px;font-weight:600;line-height:20px;transition:background .12s ease}",
      ".kwp-card:hover .kwp-cta{background:#115e59}",
      ".kwp-desc{font-size:13px;color:#5b6675;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}",
      ".kwp-meta{display:flex;gap:22px;border-top:1px solid #e5e9ee;padding-top:12px;font-size:12px;color:#8b95a3;line-height:16px}",
      ".kwp-meta b{color:#0f172a;font-size:14px;font-weight:700;margin-right:4px}",
      ".kwp-hint{font-size:12px;color:#8b95a3;margin-top:6px;text-align:center}",
      ".kwp-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#5b6675;font-size:14px}",
      ".kwp-error{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#dc2626;font-size:14px}"
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
      brand: "开物Praxis",
      navPlaza: "数字员工广场",
      navMine: "我的数字员工",
      allWorkers: "全部员工",
      manage: "管理端",
      manageTag: "管理",
      searchPlaceholder: "搜索",
      tabAll: "所有员工",
      tabMine: "我的数字员工",
      tabPlaza: "数字员工广场",
      online: "在线",
      chat: "发起对话",
      hint: "「发起对话」将选中对应数字员工并开启新会话。",
      loading: "正在加载数字员工…",
      error: "加载失败",
      noResult: "没有匹配的员工",
      zi: "资料",
      skill: "技能",
      sop: "SOP",
      ariaCard: "选择数字员工：",
      switchLang: "切换语言",
      account: "账户菜单"
    };
    var en = {
      brand: "Kaiwu Praxis",
      navPlaza: "Digital Worker Plaza",
      navMine: "My Digital Workers",
      allWorkers: "All Workers",
      manage: "Admin",
      manageTag: "Admin",
      searchPlaceholder: "Search",
      tabAll: "All Workers",
      tabMine: "My Digital Workers",
      tabPlaza: "Digital Worker Plaza",
      online: "Online",
      chat: "Chat",
      hint: "\"Chat\" picks that digital worker and starts a new session.",
      loading: "Loading digital workers…",
      error: "Failed to load",
      noResult: "No matching workers",
      zi: "Docs",
      skill: "Skills",
      sop: "SOP",
      ariaCard: "Start with digital worker: ",
      switchLang: "Language",
      account: "Account"
    };

    // 员工展示元数据（观感对齐运营台 index.html）。
    var WORKER_META = {
      "kaiwu-watermark": { order: 1, role: "文件安全助手", icon: "水", gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", zi: 0, skill: 0, sop: 0 },
      "kaiwu-docbutler": { order: 2, role: "投标资料管家", icon: "资", gradient: "linear-gradient(135deg,#2563eb,#60a5fa)", zi: 0, skill: 1, sop: 0 },
      "kaiwu-content": { order: 3, role: "营销文案员", icon: "撰", gradient: "linear-gradient(135deg,#7c3aed,#c084fc)", zi: 0, skill: 1, sop: 0 },
      "kaiwu-competitor": { order: 4, role: "竞品分析专家", icon: "竞", gradient: "linear-gradient(135deg,#0e7490,#22d3ee)", zi: 0, skill: 1, sop: 0 },
      "kaiwu-research": { order: 5, role: "情报官", icon: "情", gradient: "linear-gradient(135deg,#0d9488,#2dd4bf)", zi: 0, skill: 1, sop: 0 }
    };
    var DOT_GRADIENTS = ["linear-gradient(135deg,#0f766e,#14b8a6)", "linear-gradient(135deg,#0e7490,#22d3ee)", "linear-gradient(135deg,#7c3aed,#c084fc)"];

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    // ---------------------------------------------------------------------
    // 全屏广场组件（挂到 shell.overlay，只在无当前会话时显示）。
    // ---------------------------------------------------------------------
    function PlazaOverlay(props) {
      var api = props.api;
      var sessions = props.sessions;
      var startSession = props.startSession;
      var t = props.t;

      var _o = React.useState([]);
      var options = _o[0];
      var setOptions = _o[1];
      var _q = React.useState("");
      var query = _q[0];
      var setQuery = _q[1];
      var _b = React.useState(false);
      var busy = _b[0];
      var setBusy = _b[1];
      var _e = React.useState(null);
      var error = _e[0];
      var setError = _e[1];
      var _v = React.useState(false);
      var visible = _v[0];
      var setVisible = _v[1];
      var _s = React.useState([]);
      var convos = _s[0];
      var setConvos = _s[1];

      var stagedRef = React.useRef(undefined);

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
          setOptions(mine);
        }).catch(function (e) {
          if (alive) setError(messageOf(e));
        });
        return function () { alive = false; };
      }, [api]);

      function applyStaged() {
        var staged = stagedRef.current;
        if (staged === undefined || !sessions || !sessions.list) return;
        var state = sessions.list.getSnapshot();
        var cur = state.current;
        var summary = cur === undefined ? undefined : state.byId[cur];
        if (summary === undefined || !summary.blank) return;
        if (summary.agentPreset === staged) {
          stagedRef.current = undefined;
          return;
        }
        setBusy(true);
        setError(null);
        api.agentPresets.select({ sessionId: summary.id, agentPreset: staged }).then(function (resp) {
          stagedRef.current = undefined;
          setBusy(false);
          if (!resp.result.ok) setError(resp.result.error.message);
        }).catch(function (e) {
          stagedRef.current = undefined;
          setBusy(false);
          setError(messageOf(e));
        });
      }

      React.useEffect(function () {
        if (!sessions || !sessions.list) return;
        function refresh() {
          var state = sessions.list.getSnapshot();
          var cur = state.current;
          setVisible(cur === undefined);
          var titles = [];
          var byId = state.byId || {};
          for (var id in byId) {
            var s = byId[id];
            if (s && s.blank === false && typeof s.title === "string" && s.title !== "") titles.push({ id: id, title: s.title });
          }
          titles.sort(function (a, b) { return b.id < a.id ? -1 : b.id > a.id ? 1 : 0; });
          setConvos(titles.slice(0, 12));
          applyStaged();
        }
        refresh();
        return sessions.list.subscribe(refresh);
      }, [sessions, api]);

      function pick(id) {
        if (busy) return;
        stagedRef.current = id;
        setError(null);
        var state = sessions && sessions.list ? sessions.list.getSnapshot() : undefined;
        var cur = state ? state.current : undefined;
        var summary = cur === undefined ? undefined : state.byId[cur];
        if (summary !== undefined && summary.blank) {
          applyStaged();
        } else if (startSession) {
          startSession();
        }
      }

      if (!visible) return null;

      if (options.length === 0) {
        return React.createElement("div", { className: "kwp-fixed" },
          React.createElement("div", { className: error ? "kwp-error" : "kwp-loading", role: error ? "alert" : undefined },
            error ? t("error") + " · " + error : t("loading")
          )
        );
      }

      var q = query.trim().toLowerCase();
      var list = options.filter(function (p) {
        if (!q) return true;
        var meta = WORKER_META[p.id] || {};
        return (p.name + " " + (meta.role || "") + " " + (p.description || "")).toLowerCase().indexOf(q) !== -1;
      });

      return React.createElement("div", { className: "kwp-fixed" },
        React.createElement("aside", { className: "kwp-sidebar" },
          React.createElement("div", { className: "kwp-logo" },
            React.createElement("span", { className: "kwp-logoMark" }, "开"),
            t("brand")
          ),
          React.createElement("button", { type: "button", className: "kwp-nav kwp-navActive" },
            t("navPlaza"),
            React.createElement("span", { className: "kwp-navBadge" }, String(options.length))
          ),
          React.createElement("button", { type: "button", className: "kwp-nav" }, t("navMine")),
          React.createElement("div", { className: "kwp-label" }, t("allWorkers")),
          React.createElement("div", { className: "kwp-convs" },
            convos.length === 0
              ? React.createElement("div", { className: "kwp-emptyHint" }, t("loading"))
              : convos.map(function (c, i) {
                  return React.createElement("button", { key: c.id, type: "button", className: "kwp-conv" },
                    React.createElement("span", { className: "kwp-convDot", style: { background: DOT_GRADIENTS[i % DOT_GRADIENTS.length] } }, c.title.charAt(0)),
                    React.createElement("span", { className: "kwp-convT" }, c.title)
                  );
                })
          ),
          React.createElement("div", { className: "kwp-foot" },
            React.createElement("button", { type: "button", className: "kwp-manage" },
              React.createElement("span", null, t("manage")),
              React.createElement("span", { className: "kwp-tag" }, t("manageTag"))
            )
          )
        ),
        React.createElement("main", { className: "kwp-main" },
          React.createElement("div", { className: "kwp-topbar" },
            React.createElement("div", { className: "kwp-search" },
              React.createElement("span", { className: "kwp-searchIcon" }, "⌕"),
              React.createElement("input", {
                className: "kwp-searchInput",
                type: "text",
                placeholder: t("searchPlaceholder"),
                value: query,
                onChange: function (ev) { setQuery(ev.target.value); }
              })
            ),
            React.createElement("div", { className: "kwp-topRight" },
              React.createElement("button", { type: "button", className: "kwp-ghost" }, t("switchLang") + " ▾"),
              React.createElement("button", { type: "button", className: "kwp-ghost" }, t("account") + " ▾"),
              React.createElement("div", { className: "kwp-avatar" }, "A")
            )
          ),
          React.createElement("div", { className: "kwp-content" },
            React.createElement("div", { className: "kwp-tabs" },
              React.createElement("button", { type: "button", className: "kwp-tab kwp-tabActive" }, t("tabAll")),
              React.createElement("button", { type: "button", className: "kwp-tab" }, t("tabMine")),
              React.createElement("button", { type: "button", className: "kwp-tab" }, t("tabPlaza"))
            ),
            list.length === 0
              ? React.createElement("div", { className: "kwp-emptyHint" }, t("noResult"))
              : React.createElement("div", { className: "kwp-grid" },
                  list.map(function (p) {
                    var meta = WORKER_META[p.id] || { role: "", icon: (p.name || p.id).charAt(0), gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", zi: 0, skill: 0, sop: 0 };
                    return React.createElement("button", {
                      key: p.id,
                      type: "button",
                      className: "kwp-card",
                      "aria-label": t("ariaCard") + (p.name || p.id),
                      disabled: busy,
                      onClick: function () { pick(p.id); },
                      children: [
                        React.createElement("span", { className: "kwp-cardHead" },
                          React.createElement("span", { className: "kwp-avatarBox", style: { background: meta.gradient } }, meta.icon),
                          React.createElement("span", { className: "kwp-id" },
                            React.createElement("span", { className: "kwp-name" },
                              p.name || p.id,
                              React.createElement("span", { className: "kwp-handle" }, "@admin")
                            ),
                            React.createElement("span", { className: "kwp-role" }, meta.role)
                          ),
                          React.createElement("span", { className: "kwp-status" },
                            React.createElement("span", { className: "kwp-statusDot" }),
                            t("online")
                          )
                        ),
                        React.createElement("span", { className: "kwp-cta" }, t("chat")),
                        React.createElement("span", { className: "kwp-desc" }, p.description || ""),
                        React.createElement("span", { className: "kwp-meta" },
                          React.createElement("span", null, React.createElement("b", null, String(meta.zi)), " " + t("zi")),
                          React.createElement("span", null, React.createElement("b", null, String(meta.skill)), " " + t("skill")),
                          React.createElement("span", null, React.createElement("b", null, String(meta.sop)), " " + t("sop"))
                        )
                      ]
                    });
                  })
                ),
            React.createElement("div", { className: "kwp-hint" }, t("hint"))
          )
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

      ctx.inject(["slots", "sessions", "workspaces"], function (scope) {
        var api = scope.get("connection") ? scope.get("connection").api : undefined;
        scope.effect(function () {
          var dispose = scope.slots.register({
            name: "shell.overlay",
            id: "kaiwu-plaza",
            order: 0,
            locale: "kaiwu.praxis",
            inject: function () {
              return {
                api: api,
                sessions: scope.sessions,
                startSession: function () {
                  if (scope.workspaces && typeof scope.workspaces.startSession === "function") {
                    scope.workspaces.startSession();
                  }
                }
              };
            }
          }, PlazaOverlay);
          return dispose;
        }, "kaiwu-praxis: plaza overlay");
      });
    }

    exports.name = "kaiwu-praxis";
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
