/* COMPASS — Interface refinement
   Formula strip, KaTeX, draggable/resizable controls, adaptive sliders.
   The maths engine and simulation implementations remain untouched.
*/
(function () {
  "use strict";

  if (window.__COMPASS_REFINEMENT_V3__) return;
  window.__COMPASS_REFINEMENT_V3__ = true;

  const STYLE_ID = "compass-refinement-v3-style";
  const EQUATION_ID = "compass-equation-strip";

  /* Math equations for each simulation (rendered via KaTeX) */
  const FORMULAS = {
    "function":            String.raw`y = f(x), \qquad f'(x) = \frac{df}{dx}, \qquad \int_a^b f(x)\,dx`,
    "unit-circle":         String.raw`x = \cos\theta, \quad y = \sin\theta, \quad x^2 + y^2 = 1`,
    "vector-addition":     String.raw`\vec{a} + \vec{b} = \vec{r}, \qquad |\vec{r}| = \sqrt{(a_x+b_x)^2 + (a_y+b_y)^2}`,
    "conic-sections":      String.raw`PF = e \cdot PM, \qquad y^2 = e^2(x+p)^2 - (x-p)^2`,
    "derivative-tangent":  String.raw`f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}, \qquad \text{slope of tangent at } x`
  };

  /* Chalkboard palette injected as CSS variables */
  const STYLE = `
    :root {
      --compass-ref-bg: #0f2a1f;
      --compass-ref-panel: #143a26;
      --compass-ref-line: #2a5a3a;
      --compass-ref-text: #f5f5f0;
      --compass-ref-muted: #9fb89f;
      --compass-ref-accent: #f5f5f0;
    }

    #top-bar .tb-logo {
      font-size: 19px !important;
      font-weight: 800 !important;
      letter-spacing: 0.10em !important;
    }
    #top-bar .tb-dot { display: none !important; }

    #${EQUATION_ID} {
      position: fixed;
      z-index: 105;
      top: calc(var(--topbar-h, 64px) + 7px);
      left: 50%;
      transform: translateX(-50%);
      display: flex; align-items: center; justify-content: center;
      box-sizing: border-box;
      width: max-content;
      max-width: min(94vw, 900px);
      min-height: 34px;
      padding: 5px 15px;
      overflow: hidden;
      color: #f5f5f0;
      background: rgba(15,42,31,.88);
      border: 1px solid rgba(245,245,240,.18);
      border-radius: 7px;
      font-size: 15px;
      line-height: 1.5;
      text-align: center;
      pointer-events: none;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    #${EQUATION_ID} .katex { font-size: 1em; color: inherit; }
    #${EQUATION_ID} .katex-display { margin: 0; }
    #${EQUATION_ID}:empty { display: none; }
    @media (max-width: 600px) {
      #${EQUATION_ID} {
        top: calc(var(--topbar-h, 64px) + 5px);
        max-width: 96vw;
        min-height: 29px;
        padding: 4px 8px;
        font-size: 12px;
      }
    }

    #view-badge, #mode-badge { flex-shrink: 0; }

    #compass-control-panel {
      box-sizing: border-box !important;
      gap: 4px !important;
      padding: 8px 6px !important;
      color: var(--compass-ref-text) !important;
      background: rgba(15,42,31,.97) !important;
      border-color: var(--compass-ref-line) !important;
      box-shadow: 0 10px 30px rgba(0,0,0,.35) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      transition: opacity .18s ease, visibility .18s ease, box-shadow .18s ease !important;
    }
    #compass-control-panel .compass-panel-header { cursor: grab; user-select: none; -webkit-user-select: none; touch-action: pan-y; }
    #compass-control-panel .compass-panel-header:active { cursor: grabbing; }
    #compass-control-panel .compass-panel-title { color: #f5f5f0 !important; font-size: 9px !important; letter-spacing: 0.12em !important; }
    #compass-control-panel .compass-panel-close { color: #c4d4c4 !important; background: transparent !important; border: 1px solid #2a5a3a !important; border-radius: 6px !important; }
    #compass-control-panel .fab-row { box-sizing: border-box; min-width: 0; margin: 0 !important; padding: 2px !important; border-radius: 7px !important; }
    #compass-control-panel .fab { box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; min-height: 35px !important; padding: 7px !important; color: #c4d4c4 !important; background: transparent !important; border: 1px solid transparent !important; border-radius: 6px !important; box-shadow: none !important; }
    #compass-control-panel .fab svg { width: 17px !important; height: 17px !important; stroke: currentColor !important; stroke-width: 1.7 !important; }
    #compass-control-panel .fab-lbl { color: #9fb89f !important; font-size: 9px !important; letter-spacing: 0.01em !important; }
    #compass-control-panel .fab:hover,
    #compass-control-panel .fab.on,
    #compass-control-panel .fab.ghost-on,
    #compass-control-panel .fab.paused {
      color: #fff !important; background: #1a4a2a !important; border-color: #4a7a5a !important;
    }
    #compass-control-panel .fab:hover .fab-lbl,
    #compass-control-panel .fab.on .fab-lbl { color: #f5f5f0 !important; }

    #compass-control-panel.from-left,
    #compass-control-panel.from-right {
      width: 112px; min-width: 64px;
      max-width: min(42vw, 300px);
      height: auto; min-height: 190px;
      max-height: calc(100dvh - 24px);
      overflow: auto; resize: horizontal;
      scrollbar-width: thin;
      scrollbar-color: #4a7a5a transparent;
      flex-direction: column; justify-content: flex-start;
    }
    #compass-control-panel.from-left { border-left: 0 !important; border-radius: 0 10px 10px 0 !important; }
    #compass-control-panel.from-right { border-right: 0 !important; border-radius: 10px 0 0 10px !important; }
    #compass-control-panel.from-left .compass-panel-header,
    #compass-control-panel.from-right .compass-panel-header {
      flex-direction: row; align-items: center; justify-content: space-between;
      padding: 0 0 7px; border-bottom: 1px solid var(--compass-ref-line);
    }
    #compass-control-panel.from-left .fab-row,
    #compass-control-panel.from-right .fab-row { width: 100% !important; }
    #compass-control-panel.from-bottom {
      width: min(620px, calc(100vw - 24px));
      min-width: 250px; max-width: calc(100vw - 12px);
      height: 104px; min-height: 68px; max-height: 45dvh;
      overflow: auto; resize: vertical;
      scrollbar-width: thin;
      scrollbar-color: #4a7a5a transparent;
      border-radius: 10px 10px 0 0 !important;
      align-items: stretch; justify-content: flex-start;
      padding: 7px 9px !important;
    }
    #compass-control-panel.from-bottom .compass-panel-header {
      min-width: 54px; flex-direction: column; justify-content: center;
      padding: 0 8px 0 0; border-right: 1px solid var(--compass-ref-line); border-bottom: 0;
    }
    #compass-control-panel.from-bottom .fab-row { flex: 0 0 54px; width: 54px !important; align-self: stretch; }
    #compass-control-panel.from-bottom .fab { height: 100% !important; }

    #compass-control-panel.compass-compact .compass-panel-title { display: none !important; }
    #compass-control-panel.compass-compact .compass-panel-header { justify-content: center !important; padding-bottom: 5px !important; }
    #compass-control-panel.compass-compact .fab-lbl { display: none !important; }
    #compass-control-panel.compass-compact .fab { min-height: 32px !important; padding: 6px !important; }
    #compass-control-panel.from-bottom.compass-compact .fab-row { flex-basis: 42px; width: 42px !important; }

    #ctrl-drawer {
      box-sizing: border-box !important;
      min-width: 210px !important; min-height: 130px !important;
      width: min(340px, 86vw) !important;
      max-width: 94vw !important; max-height: 86dvh !important;
      overflow: auto !important; resize: both;
      background: #0f2a1f !important;
      border: 1px solid #2a5a3a !important;
      border-radius: 10px !important;
      box-shadow: 0 14px 38px rgba(0,0,0,.45) !important;
      scrollbar-width: thin; scrollbar-color: #4a7a5a transparent;
    }
    #ctrl-drawer .drawer-hdr {
      min-height: 43px !important; height: 43px !important;
      padding: 0 12px !important;
      background: #143a26 !important;
      border-bottom: 1px solid #2a5a3a !important;
      cursor: grab; user-select: none; -webkit-user-select: none; touch-action: none;
    }
    #ctrl-drawer .drawer-hdr:active { cursor: grabbing; }
    #ctrl-drawer .drawer-ttl { color: #f5f5f0 !important; font-size: 11px !important; letter-spacing: 0.09em !important; }
    #ctrl-drawer .drawer-body { box-sizing: border-box !important; padding: 9px !important; overflow: auto !important; }

    #ctrl-drawer .lil-gui, #ctrl-drawer .lil-gui.root {
      width: 100% !important; max-width: 100% !important;
      background: transparent !important;
      color: #f5f5f0 !important;
      border: 0 !important; box-shadow: none !important;
      font-size: 11px !important;
    }
    #ctrl-drawer .lil-gui .title {
      min-height: 27px !important; line-height: 27px !important;
      padding-left: 7px !important;
      color: #f5f5f0 !important;
      background: #1a4a2a !important;
      border-bottom: 1px solid #2a5a3a !important;
      font-size: 10px !important; letter-spacing: 0.04em !important;
    }
    #ctrl-drawer .lil-gui .controller {
      min-height: 31px !important; padding: 4px 6px !important;
      border-bottom: 1px solid rgba(245,245,240,.07) !important;
    }
    #ctrl-drawer .lil-gui .controller .name { color: #c4d4c4 !important; font-size: 10px !important; line-height: 1.3 !important; }
    #ctrl-drawer .lil-gui .widget { min-width: 0 !important; }
    #ctrl-drawer .lil-gui input,
    #ctrl-drawer .lil-gui select {
      color: #f5f5f0 !important;
      background: #143a26 !important;
      border: 1px solid #4a7a5a !important;
      border-radius: 4px !important;
      font-size: 10px !important;
    }
    #ctrl-drawer .lil-gui input[type="range"] { accent-color: #f5f5f0 !important; cursor: ew-resize; }
    #ctrl-drawer .lil-gui .slider {
      position: relative !important; min-height: 17px !important;
      overflow: visible !important;
      background: #2a5a3a !important;
      border-radius: 999px !important; cursor: ew-resize !important;
    }
    #ctrl-drawer .lil-gui .slider .slider-fg { background: #c4d4c4 !important; border-radius: 999px !important; }
    #ctrl-drawer .lil-gui .slider::after {
      content: ""; position: absolute; z-index: 2;
      top: 50%; left: var(--compass-slider-position, 50%);
      width: 12px; height: 12px; transform: translate(-50%, -50%);
      background: #f5f5f0; border: 2px solid #143a26; border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(245,245,240,.3); pointer-events: none;
    }
    #ctrl-drawer .lil-gui .slider:hover::after { box-shadow: 0 0 0 3px rgba(245,245,240,.12); }
    #ctrl-drawer .lil-gui .controller:hover { background: rgba(245,245,240,.04) !important; }
    #ctrl-drawer.compass-drawer-compact .lil-gui .controller { min-height: 27px !important; padding: 3px 5px !important; }
    #ctrl-drawer.compass-drawer-compact .lil-gui .controller .name { font-size: 9px !important; }

    @media (max-width: 520px) {
      #ctrl-drawer { min-width: 190px !important; width: min(300px, 90vw) !important; }
      #ctrl-drawer .drawer-body { padding: 6px !important; }
      #compass-control-panel.from-left,
      #compass-control-panel.from-right { width: 92px; }
    }
    @media (prefers-reduced-motion: reduce) {
      #compass-control-panel, #ctrl-drawer, #${EQUATION_ID} { transition: none !important; }
    }
  `;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function loadKatex(callback) {
    if (window.katex) { callback(); return; }
    if (window.__compassKatexLoading) {
      window.__compassKatexCallbacks = window.__compassKatexCallbacks || [];
      window.__compassKatexCallbacks.push(callback);
      return;
    }
    window.__compassKatexLoading = true;
    window.__compassKatexCallbacks = [callback];

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js";
    script.onload = function () {
      window.__compassKatexLoading = false;
      (window.__compassKatexCallbacks || []).forEach(function (fn) {
        try { fn(); } catch (error) { console.error("COMPASS KaTeX:", error); }
      });
      window.__compassKatexCallbacks = [];
      renderAllMath();
    };
    script.onerror = function () {
      window.__compassKatexLoading = false;
      console.warn("COMPASS: KaTeX could not load.");
    };
    document.head.appendChild(script);
  }

  function activeSimulationKey() {
    if (typeof window._curKey === "string" && FORMULAS[window._curKey]) {
      return window._curKey;
    }
    const title = (document.getElementById("sim-title")?.textContent || "").toLowerCase();
    if (title.includes("function")) return "function";
    if (title.includes("unit circle")) return "unit-circle";
    if (title.includes("vector")) return "vector-addition";
    if (title.includes("conic")) return "conic-sections";
    if (title.includes("derivative")) return "derivative-tangent";
    return "function";
  }

  function ensureEquationStrip() {
    let strip = document.getElementById(EQUATION_ID);
    if (strip) return strip;
    strip = document.createElement("div");
    strip.id = EQUATION_ID;
    strip.setAttribute("role", "status");
    strip.setAttribute("aria-label", "Active simulation equation");
    const topbar = document.getElementById("top-bar");
    if (topbar && topbar.parentNode) {
      topbar.parentNode.insertBefore(strip, topbar.nextSibling);
    } else {
      document.body.appendChild(strip);
    }
    return strip;
  }

  function renderTex(element, tex, displayMode) {
    if (!element || !window.katex || !tex) return;
    try {
      window.katex.render(tex, element, {
        throwOnError: false, strict: "ignore",
        displayMode: !!displayMode, output: "html"
      });
    } catch (error) {
      element.textContent = tex;
    }
  }

  function renderHeaderEquation() {
    const strip = ensureEquationStrip();
    const key = activeSimulationKey();
    const formula = FORMULAS[key];
    if (!formula) { strip.textContent = ""; return; }
    if (strip.dataset.formula === formula && strip.dataset.key === key) return;
    strip.dataset.formula = formula;
    strip.dataset.key = key;
    if (window.katex) renderTex(strip, formula, false);
    else strip.textContent = formula;
  }

  function renderAllMath() {
    if (!window.katex) return;
    renderHeaderEquation();
    document.querySelectorAll(".sim-tile, .sim-card, [data-sim-key]").forEach(function (tile) {
      const key = tile.dataset.simKey || tile.dataset.key || tile.getAttribute("data-sim") || "";
      const formula = FORMULAS[key];
      const target = tile.querySelector(".st-formula, .sim-formula, .formula");
      if (formula && target && target.dataset.compassTex !== formula) {
        target.dataset.compassTex = formula;
        renderTex(target, formula, false);
      }
    });
    document.querySelectorAll(
      ".formula-block, #formula-container, .analysis-formula, [data-katex]"
    ).forEach(function (element) {
      if (element.dataset.compassMathRendered === "1") return;
      let source = element.getAttribute("data-katex");
      if (!source) source = element.textContent.trim();
      /* Find $...$ or $$...$$ or \(...\) delimiters in the source */
      /* The textContent may contain $...$ inline */
      const match = source.match(/\$\$([\s\S]+?)\$\$|\$([\s\S]+?)\$|\\\(([\s\S]+?)\\\)/);
      if (!match) return;
      const tex = match[1] || match[2] || match[3];
      if (!tex) return;
      /* Replace the entire textContent with the rendered TeX */
      element.dataset.compassMathRendered = "1";
      /* For inline $...$ we replace just the matched portion */
      if (match[2]) {
        /* Inline — replace the $...$ span with rendered TeX, keep surrounding text */
        const before = source.substring(0, match.index);
        const after = source.substring(match.index + match[0].length);
        element.textContent = before;
        const texSpan = document.createElement("span");
        element.appendChild(texSpan);
        renderTex(texSpan, tex, false);
        element.appendChild(document.createTextNode(after));
      } else {
        /* Display — replace entire content */
        element.textContent = "";
        renderTex(element, tex, !!match[1]);
      }
    });
  }

  function installAdaptivePanel(panel) {
    if (!panel || panel.dataset.compassAdaptiveInstalled === "1") return;
    panel.dataset.compassAdaptiveInstalled = "1";
    const update = function () {
      const width = panel.getBoundingClientRect().width;
      panel.classList.toggle("compass-compact", width < 88);
    };
    if ("ResizeObserver" in window) new ResizeObserver(update).observe(panel);
    update();
  }

  function installDraggable(panel, handle, mode) {
    if (!panel || !handle || handle.dataset.compassDragInstalled === "1") return;
    handle.dataset.compassDragInstalled = "1";
    let active = false, startX = 0, startY = 0, baseLeft = 0, baseTop = 0, pointerId = null;
    handle.addEventListener("pointerdown", function (event) {
      if (event.target.closest("button")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const rect = panel.getBoundingClientRect();
      active = true; pointerId = event.pointerId;
      startX = event.clientX; startY = event.clientY;
      baseLeft = rect.left; baseTop = rect.top;
      panel.classList.add("compass-is-dragging");
      handle.style.cursor = "grabbing";
      try { handle.setPointerCapture(pointerId); } catch (_) {}
      event.preventDefault();
    });
    handle.addEventListener("pointermove", function (event) {
      if (!active || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX, dy = event.clientY - startY;
      const rect = panel.getBoundingClientRect();
      const left = Math.max(0, Math.min(window.innerWidth - Math.min(rect.width, window.innerWidth), baseLeft + dx));
      const top = Math.max(0, Math.min(window.innerHeight - Math.min(rect.height, window.innerHeight), baseTop + dy));
      panel.style.left = left + "px"; panel.style.top = top + "px";
      panel.style.right = "auto"; panel.style.bottom = "auto";
      panel.style.transform = "none";
      panel.dataset.compassManuallyPositioned = "1";
    });
    function finish(event) {
      if (!active) return;
      if (event && pointerId !== null && event.pointerId !== pointerId) return;
      active = false; pointerId = null;
      panel.classList.remove("compass-is-dragging");
      handle.style.cursor = "";
    }
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
    window.addEventListener("blur", finish);
  }

  function installDrawerDragging() {
    const drawer = document.getElementById("ctrl-drawer");
    const header = drawer?.querySelector(".drawer-hdr");
    if (!drawer || !header) return;
    installDraggable(drawer, header, "drawer");
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        const width = drawer.getBoundingClientRect().width;
        drawer.classList.toggle("compass-drawer-compact", width < 270);
      }).observe(drawer);
    }
  }

  function installEdgePanelDragging() {
    const panel = document.getElementById("compass-control-panel");
    const header = panel?.querySelector(".compass-panel-header");
    if (!panel || !header) return;
    installAdaptivePanel(panel);
    installDraggable(panel, header, "edge-panel");
  }

  function updateSliderKnobs() {
    document.querySelectorAll("#ctrl-drawer .lil-gui .slider").forEach(function (slider) {
      const fg = slider.querySelector(".slider-fg");
      if (!fg) return;
      const width = fg.getBoundingClientRect().width;
      const total = slider.getBoundingClientRect().width;
      if (!total) return;
      const percent = Math.max(0, Math.min(100, (width / total) * 100));
      slider.style.setProperty("--compass-slider-position", percent + "%");
    });
  }

  function keepEquationBelowHeader() {
    const strip = document.getElementById(EQUATION_ID);
    const topbar = document.getElementById("top-bar");
    if (!strip || !topbar) return;
    const rect = topbar.getBoundingClientRect();
    strip.style.top = Math.max(0, rect.bottom + 6) + "px";
  }

  function update() {
    renderHeaderEquation();
    installEdgePanelDragging();
    installDrawerDragging();
    updateSliderKnobs();
    keepEquationBelowHeader();
  }

  function start() {
    addStyles();
    ensureEquationStrip();
    const logo = document.querySelector("#top-bar .tb-logo");
    if (logo) {
      logo.textContent = "COMPASS";
      logo.setAttribute("aria-label", "COMPASS");
    }
    loadKatex(function () {
      renderAllMath();
      renderHeaderEquation();
      /* Also render the 4 corner equations on the loading screen */
      document.querySelectorAll("#loading-screen .ls-corner").forEach(function (el) {
        const tex = el.dataset.tex;
        if (tex) renderTex(el, tex, false);
      });
    });
    update();
    const observer = new MutationObserver(function () {
      renderHeaderEquation();
      renderAllMath();
      installEdgePanelDragging();
      installDrawerDragging();
    });
    observer.observe(document.body, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["class", "data-sim-key"]
    });
    window.addEventListener("resize", keepEquationBelowHeader, { passive: true });
    window.setInterval(update, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
