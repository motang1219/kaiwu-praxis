// kaiwu-praxis 客户端插件（浏览器侧）：数字员工广场（覆盖主内容区、保留 DSH 原生侧边栏）。
// 自注册 bundle（classic script，非 ESM）：materialize 时返回 { name, inject, apply }。
// 侧边栏注入「数字员工广场」入口按钮，点击后在主内容区展示广场；
// 选中某位员工并开启会话后，广场自动收起，露出 DSH 原生对话界面。
window.__ModuleLoader__.load({
  id: "kaiwu-praxis",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");

    // ---------------------------------------------------------------------
    // CSS：广场主内容区观感（浅色、顶部栏、卡片网格；深色跟随 DSH 主题）。
    // ---------------------------------------------------------------------
    var CSS = [
      ".kwp-fixed{position:fixed;top:0;right:0;bottom:0;left:280px;z-index:2147483000;background:#fcfcfc;color:#18181a;font-family:'Geist Variable','Alimama ShuHeiTi',-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;pointer-events:auto}",
      ".kwp-emptyHint{color:#8b95a3;font-size:12px;padding:4px 12px}",
      ".kwp-topbar{display:flex;align-items:center;gap:12px;padding:14px 28px;background:transparent;flex:none}",
      ".kwp-title{font-size:15px;font-weight:600;line-height:20px}",
      ".kwp-content{padding:0 28px 22px;overflow:auto;flex:1;min-height:0}",
      ".kwp-grid{display:grid;grid-template-columns:1fr;gap:18px;align-content:start}",
      "@media (min-width:640px){.kwp-grid{grid-template-columns:repeat(2,1fr)}}",
      "@media (min-width:1024px){.kwp-grid{grid-template-columns:repeat(3,1fr)}}",
      "@media (min-width:1536px){.kwp-grid{grid-template-columns:repeat(4,1fr)}}",
      "@media (min-width:900px){.kwp-grid{gap:32px}}",
      ".kwp-card{appearance:none;font-family:inherit;text-align:left;cursor:pointer;color:#0f172a;background:#ffffff;border:1px solid #f6f6f6;border-radius:20px;padding:12px 10px;display:flex;flex-direction:column;position:relative;overflow:visible;transition:box-shadow .2s ease}",
      ".kwp-card:hover:not(:disabled){box-shadow:0 16px 30px 0 rgba(0,0,0,.10)}",
      ".kwp-card:active:not(:disabled){box-shadow:0 8px 16px 0 rgba(0,0,0,.08)}",
      ".kwp-card:disabled{cursor:default;opacity:.65}",
      ".kwp-cardBand{position:relative;display:flex;align-items:center;gap:10px;border-radius:18px;height:68px;background:#f6f6f6;padding:8px;margin-top:34px;box-sizing:border-box}",
      ".kwp-avatarBox{position:relative;width:80px;flex:none;align-self:stretch}",
      ".kwp-avatarInner{position:absolute;left:0;bottom:8px;width:80px;height:94px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;color:#fff;overflow:hidden}",
      ".kwp-id{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}",
      ".kwp-name{font-size:12px;font-weight:700;color:#18181a;line-height:1.5;display:flex;align-items:baseline;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kwp-handle{font-weight:400;color:#9ca3af;font-size:11px}",
      ".kwp-role{font-size:10px;color:#757f9c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kwp-online{display:inline-flex;align-items:center;gap:2px;padding:2px 4px;font-size:8px;font-weight:600;color:#757f9c;border-radius:90px;background:#fff;width:fit-content;line-height:1.2}",
      ".kwp-online i{width:6px;height:6px;border-radius:50%;background:#22c55e;flex:none;display:inline-block}",
      ".kwp-chatBtn{width:28px;height:28px;border-radius:10px;background:#fff;color:#757f9c;display:flex;align-items:center;justify-content:center;flex:none;align-self:center;transition:color .15s}",
      ".kwp-card:hover .kwp-chatBtn{color:#18181a}",
      ".kwp-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:8px;height:36px;flex:none;font-size:12px;line-height:18px;color:#757f9c}",
      ".kwp-tags{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0;align-items:center}",
      ".kwp-wtag{border-radius:20px;padding:0 8px;font-size:10px;line-height:13px;color:#757f9c;border:1px solid #e3e7f1;white-space:nowrap}",
      ".kwp-stats{margin-top:auto;display:grid;grid-template-columns:repeat(3,1fr);border-radius:14px;border:1px solid #e3e7f1;box-sizing:border-box}",
      ".kwp-statCell{display:flex;flex-direction:column;justify-content:center;gap:4px;padding:6px 20px;border-right:1px solid #eef1f5}",
      ".kwp-statCell:last-child{border-right:0}",
      ".kwp-statValue{font-size:18px;line-height:24px;font-weight:700;color:#18181a}",
      ".kwp-statLabel{font-size:10px;color:#464c5e;font-style:normal}",
      ".kwp-hint{font-size:12px;color:#8b95a3;margin-top:6px;text-align:center}",
      ".kwp-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#5b6675;font-size:14px}",
      ".kwp-error{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#dc2626;font-size:14px}",
      ".kwp-back{display:flex;align-items:center;gap:2px;flex:none;border:0;background:transparent;color:#757f9c;font-size:13px;font-weight:500;padding:6px 10px;border-radius:9px;cursor:pointer}",
      ".kwp-back:hover{background:#f1f2f5;color:#18181a}",
      ".kwp-backChevron{font-size:18px;line-height:1}",
      ".kwp-entry{box-sizing:border-box;width:100%;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border:none;border-radius:8px;align-items:center;gap:8px;padding:0 10px;font-size:13px;display:flex}",
      ".kwp-entry:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".kwp-entry[data-active=true]{background:var(--dsw-specific-sidebar-nav-item-active);color:var(--dsw-alias-label-primary)}",
      ".kwp-entryIcon{flex:none;justify-content:center;align-items:center;width:24px;height:24px;display:inline-flex}",
      ".kwp-entryIcon svg{width:18px;height:18px;display:block}",
      ".kwp-entryLabel{text-overflow:ellipsis;overflow:hidden}",
      "[data-dsh-frame][data-sidebar-collapsed] .kwp-entry,[data-sidebar-collapsed] .kwp-entry{border-radius:50%;justify-content:center;width:36px;height:36px;margin:0 auto 12px;padding:0}",
      "[data-dsh-frame][data-sidebar-collapsed] .kwp-entryLabel,[data-sidebar-collapsed] .kwp-entryLabel{display:none}",
      // ---- 深色模式：跟随 DSH 主题（body[data-ds-dark-theme]）----
      "body[data-ds-dark-theme] .kwp-fixed{background:#141518;color:#f5f6f7}",
      "body[data-ds-dark-theme] .kwp-emptyHint{color:#757b84}",
      "body[data-ds-dark-theme] .kwp-card{background:#1c1d21;border-color:#26272c}",
      "body[data-ds-dark-theme] .kwp-cardBand{background:#26272c}",
      "body[data-ds-dark-theme] .kwp-name{color:#f5f6f7}",
      "body[data-ds-dark-theme] .kwp-role{color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-online{background:#1c1d21;color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-chatBtn{background:#1c1d21;color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-card:hover .kwp-chatBtn{color:#f5f6f7}",
      "body[data-ds-dark-theme] .kwp-desc{color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-wtag{color:#a6abb4;border-color:#3a3b41}",
      "body[data-ds-dark-theme] .kwp-stats{border-color:#2a2b2f}",
      "body[data-ds-dark-theme] .kwp-statCell{border-right-color:#26272c}",
      "body[data-ds-dark-theme] .kwp-statValue{color:#f5f6f7}",
      "body[data-ds-dark-theme] .kwp-statLabel{color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-back{color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-back:hover{background:#222329;color:#f5f6f7}",
      "body[data-ds-dark-theme] .kwp-hint{color:#757b84}",
      "body[data-ds-dark-theme] .kwp-loading{color:#a6abb4}",
      "body[data-ds-dark-theme] .kwp-error{color:#f87171}"
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
      back: "返回会话",
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
      back: "Back to chat",
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
      "kaiwu-watermark": { order: 1, role: "文件安全助手", icon: "水", gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", zi: 0, skill: 0, sop: 0, tags: ["本地零联网", "批量处理", "防泄密"] },
      "kaiwu-docbutler": { order: 2, role: "投标资料管家", icon: "资", gradient: "linear-gradient(135deg,#2563eb,#60a5fa)", zi: 0, skill: 1, sop: 0, tags: ["分类归档", "到期预警", "清单生成"] },
      "kaiwu-content": { order: 3, role: "营销文案员", icon: "撰", gradient: "linear-gradient(135deg,#7c3aed,#c084fc)", zi: 0, skill: 1, sop: 0, tags: ["营销文案", "多版本输出"] },
      "kaiwu-competitor": { order: 4, role: "竞品分析专家", icon: "竞", gradient: "linear-gradient(135deg,#0e7490,#22d3ee)", zi: 0, skill: 1, sop: 0, tags: ["竞品盯防", "对比表"] },
      "kaiwu-research": { order: 5, role: "情报官", icon: "情", gradient: "linear-gradient(135deg,#0d9488,#2dd4bf)", zi: 0, skill: 1, sop: 0, tags: ["情报汇总", "简报输出"] }
    };

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    function chatIcon() {
      return React.createElement("svg", { viewBox: "0 0 16 16", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement("path", { d: "M14 7.5a5.5 5.5 0 0 1-5.5 5.5H5L2 15v-3.1A5.5 5.5 0 1 1 14 7.5Z" })
      );
    }

    function plazaIcon() {
      return React.createElement("svg", { viewBox: "0 0 16 16", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        React.createElement("path", { d: "M2.5 2.5h4v4h-4z" }),
        React.createElement("path", { d: "M9.5 2.5h4v4h-4z" }),
        React.createElement("path", { d: "M2.5 9.5h4v4h-4z" }),
        React.createElement("path", { d: "M9.5 9.5h4v4h-4z" })
      );
    }

    // 广场开合状态：由侧边栏注入的「数字员工广场」入口按钮驱动。
    var plazaStore = {
      open: false,
      listeners: [],
      toggle: function () { setPlazaOpen(!plazaStore.open); },
      subscribe: function (fn) { plazaStore.listeners.push(fn); return function () { plazaStore.listeners = plazaStore.listeners.filter(function (f) { return f !== fn; }); }; }
    };
    function setPlazaOpen(open) {
      plazaStore.open = open;
      for (var i = 0; i < plazaStore.listeners.length; i++) plazaStore.listeners[i](open);
    }

    var ENTRY_SELECTOR = "[data-kaiwu-plaza-entry]";
    var ENTRY_ICON = '<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 2.5h4v4h-4z"/><path d="M9.5 2.5h4v4h-4z"/><path d="M2.5 9.5h4v4h-4z"/><path d="M9.5 9.5h4v4h-4z"/></svg>';

    function sidebarRoot() {
      var column = document.querySelector("[data-pane='sidebar'], [class*='sidebarCol']");
      if (column === null) return undefined;
      return column.querySelector("[class*='logoRow']")?.parentElement ?? column.firstElementChild;
    }

    function newSessionButton(root) {
      var nested = root.querySelector("button[class*='newSession']");
      if (nested !== null) return nested;
      for (var i = 0; i < root.children.length; i++) {
        if (root.children[i].tagName === "BUTTON") return root.children[i];
      }
      return undefined;
    }

    function createPlazaEntry(t) {
      var entry = document.createElement("button");
      entry.type = "button";
      entry.setAttribute("data-kaiwu-plaza-entry", "");
      entry.setAttribute("data-dsh-plugin", "kaiwu-praxis");
      entry.setAttribute("data-dsh-part", "sidebar-entry");
      entry.className = "kwp-entry";
      entry.setAttribute("aria-label", t("navPlaza"));
      entry.innerHTML = '<span class="kwp-entryIcon">' + ENTRY_ICON + '</span><span class="kwp-entryLabel">' + t("navPlaza") + '</span>';
      entry.addEventListener("click", function () { plazaStore.toggle(); });
      return entry;
    }

    function placeEntry(root, entry) {
      var button = newSessionButton(root);
      if (button === undefined) return false;
      if (entry.parentElement !== root) {
        var row = button.closest("[class*='logoRow']");
        var base = row !== null && row.parentElement === root ? row : button;
        var anchor = base.nextElementSibling;
        root.insertBefore(entry, anchor);
      }
      return true;
    }

    function mountPlazaEntry(t) {
      if (typeof document === "undefined" || document.querySelector(ENTRY_SELECTOR) !== null) return function () {};
      var entry = createPlazaEntry(t);
      var root;
      var placed = false;
      var waitObserver = new MutationObserver(function () { tryPlace(); });
      var rootObserver = new MutationObserver(function () {
        if (root === undefined || !root.isConnected) { placed = false; tryPlace(); return; }
        if (!root.contains(entry)) placed = placeEntry(root, entry);
      });
      var syncActive = function () {
        if (plazaStore.open) entry.setAttribute("data-active", "true");
        else entry.removeAttribute("data-active");
      };
      var unsub = plazaStore.subscribe(syncActive);
      function tryPlace() {
        if (root !== undefined && !root.isConnected) { rootObserver.disconnect(); root = undefined; placed = false; }
        if (placed) {
          if (document.body.contains(entry)) return;
          rootObserver.disconnect(); root = undefined; placed = false;
        }
        if (root === undefined) root = sidebarRoot();
        if (root === undefined) return;
        placed = placeEntry(root, entry);
        if (placed) rootObserver.observe(root, { childList: true, subtree: true });
      }
      waitObserver.observe(document.body, { childList: true, subtree: true });
      syncActive();
      tryPlace();
      return function () {
        waitObserver.disconnect();
        rootObserver.disconnect();
        unsub();
        entry.remove();
      };
    }

    // ---------------------------------------------------------------------
    // 广场组件（挂到 shell.overlay，由侧边栏入口驱动开合，只覆盖主内容区）。
    // ---------------------------------------------------------------------
    function PlazaOverlay(props) {
      var api = props.api;
      var sessions = props.sessions;
      var startSession = props.startSession;
      var t = props.t;

      var _o = React.useState([]);
      var options = _o[0];
      var setOptions = _o[1];
      var _b = React.useState(false);
      var busy = _b[0];
      var setBusy = _b[1];
      var _e = React.useState(null);
      var error = _e[0];
      var setError = _e[1];
      var _v = React.useState(false);
      var visible = _v[0];
      var setVisible = _v[1];
      var _l = React.useState(280);
      var leftPx = _l[0];
      var setLeftPx = _l[1];

      var stagedRef = React.useRef(undefined);
      var pickedForRef = React.useRef(null);

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

      React.useEffect(function () {
        setVisible(plazaStore.open);
        return plazaStore.subscribe(function (open) { setVisible(open); });
      }, []);

      React.useEffect(function () {
        function measure() {
          var col = document.querySelector("[class*='sidebarCol']");
          if (!col) col = document.querySelector("[data-pane='sidebar']");
          if (!col) return;
          var w = col.getBoundingClientRect().width;
          if (w > 0) setLeftPx(w);
        }
        measure();
        var ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
        var col = document.querySelector("[class*='sidebarCol']");
        if (ro && col) ro.observe(col);
        var mo = new MutationObserver(measure);
        var frame = document.querySelector("[data-dsh-frame]");
        if (frame) mo.observe(frame, { attributes: true, attributeFilter: ["data-sidebar-collapsed"] });
        return function () { if (ro) ro.disconnect(); mo.disconnect(); };
      }, []);

      function applyStaged() {
        var staged = stagedRef.current;
        if (staged === undefined || !sessions || !sessions.list) return;
        var state = sessions.list.getSnapshot();
        var cur = state.current;
        var summary = cur === undefined ? undefined : state.byId[cur];
        if (summary === undefined || !summary.blank) return;
        if (summary.agentPreset === staged) {
          stagedRef.current = undefined;
          pickedForRef.current = summary.id;
          setPlazaOpen(false);
          return;
        }
        setBusy(true);
        setError(null);
        api.agentPresets.select({ sessionId: summary.id, agentPreset: staged }).then(function (resp) {
          stagedRef.current = undefined;
          setBusy(false);
          if (!resp.result.ok) {
            setError(resp.result.error.message);
            return;
          }
          pickedForRef.current = summary.id;
          setPlazaOpen(false);
        }).catch(function (e) {
          stagedRef.current = undefined;
          setBusy(false);
          setError(messageOf(e));
        });
      }

      React.useEffect(function () {
        if (!sessions || !sessions.list) return;
        function refresh() { applyStaged(); }
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
        return React.createElement("div", { className: "kwp-fixed", style: { left: leftPx + "px" } },
          React.createElement("div", { className: error ? "kwp-error" : "kwp-loading", role: error ? "alert" : undefined },
            error ? t("error") + " · " + error : t("loading")
          )
        );
      }

      var list = options;

      return React.createElement("div", { className: "kwp-fixed", style: { left: leftPx + "px" } },
        React.createElement("div", { className: "kwp-topbar" },
          React.createElement("button", { type: "button", className: "kwp-back", onClick: function () { setPlazaOpen(false); } },
            React.createElement("span", { className: "kwp-backChevron" }, "‹"),
            t("back")
          ),
          React.createElement("span", { className: "kwp-title" }, t("navPlaza"))
        ),
        React.createElement("div", { className: "kwp-content" },
          list.length === 0
            ? React.createElement("div", { className: "kwp-emptyHint" }, t("noResult"))
            : React.createElement("div", { className: "kwp-grid" },
                list.map(function (p) {
                  var meta = WORKER_META[p.id] || { role: "", icon: (p.name || p.id).charAt(0), gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", zi: 0, skill: 0, sop: 0, tags: [] };
                  var tags = meta.tags || [];
                  return React.createElement("button", {
                    key: p.id,
                    type: "button",
                    className: "kwp-card",
                    "aria-label": t("ariaCard") + (p.name || p.id),
                    disabled: busy,
                    onClick: function () { pick(p.id); },
                    children: [
                      React.createElement("span", { className: "kwp-cardBand" },
                        React.createElement("span", { className: "kwp-avatarBox" },
                          React.createElement("span", { className: "kwp-avatarInner", style: { background: meta.gradient } }, meta.icon)
                        ),
                        React.createElement("span", { className: "kwp-id" },
                          React.createElement("strong", { className: "kwp-name" },
                            (p.name || p.id) + " ",
                            React.createElement("span", { className: "kwp-handle" }, "@admin")
                          ),
                          React.createElement("span", { className: "kwp-role" }, meta.role),
                          React.createElement("span", { className: "kwp-online" },
                            React.createElement("i", null),
                            t("online")
                          )
                        ),
                        React.createElement("span", { className: "kwp-chatBtn" }, chatIcon())
                      ),
                      React.createElement("p", { className: "kwp-desc" }, p.description || ""),
                      tags.length > 0
                        ? React.createElement("div", { className: "kwp-tags" },
                            tags.slice(0, 3).map(function (tag) {
                              return React.createElement("span", { key: tag, className: "kwp-wtag" }, tag);
                            })
                          )
                        : null,
                      React.createElement("div", { className: "kwp-stats" },
                        React.createElement("div", { className: "kwp-statCell" },
                          React.createElement("strong", { className: "kwp-statValue" }, String(meta.zi)),
                          React.createElement("em", { className: "kwp-statLabel" }, t("zi"))
                        ),
                        React.createElement("div", { className: "kwp-statCell" },
                          React.createElement("strong", { className: "kwp-statValue" }, String(meta.skill)),
                          React.createElement("em", { className: "kwp-statLabel" }, t("skill"))
                        ),
                        React.createElement("div", { className: "kwp-statCell" },
                          React.createElement("strong", { className: "kwp-statValue" }, String(meta.sop)),
                          React.createElement("em", { className: "kwp-statLabel" }, t("sop"))
                        )
                      )
                    ]
                  });
                })
              ),
          React.createElement("div", { className: "kwp-hint" }, t("hint"))
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

      ctx.effect(function () {
        return mountPlazaEntry(ctx.locale.bind("kaiwu.praxis"));
      }, "kaiwu-praxis: sidebar plaza entry");

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
