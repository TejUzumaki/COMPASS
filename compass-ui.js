/* COMPASS — Responsive edge controls + fascinating loading screen. */
(function () {
  "use strict";

  var panel = null;
  var currentSide = null;
  var tabs = {};

  var iconMap = {
    "fab-sims": "layout-grid",
    "fab-analysis": "chart-no-axes-combined",
    "fab-ctrl": "sliders-horizontal",
    "fab-ghost": "route",
    "fab-viewmode": "box",
    "fab-reset": "rotate-ccw",
    "fab-pause": "pause"
  };

  var labelMap = {
    "fab-sims": "Simulations",
    "fab-analysis": "Analysis",
    "fab-ctrl": "Controls",
    "fab-ghost": "Motion trail",
    "fab-viewmode": "Switch view",
    "fab-reset": "Reset",
    "fab-pause": "Pause / Resume"
  };

  /* Lucide icon name per sim key — kept consistent for the new maths sims */
  var simIconMap = {
    "function": "trending-up",
    "unit-circle": "circle-dashed",
    "vector-addition": "move-right",
    "conic-sections": "spline",
    "derivative-tangent": "spline"
  };

  function iconElement(name) {
    var el = document.createElement("i");
    el.setAttribute("data-lucide", name);
    el.setAttribute("aria-hidden", "true");
    return el;
  }
  function refreshIcons(root) {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons(root ? { root: root } : {});
    }
  }
  function replaceIcon(element, name) {
    if (!element) return;
    element.replaceChildren(iconElement(name));
    refreshIcons(element);
  }

  function updateModeIcon() {
    var icon = document.getElementById("mode-icon");
    var label = document.getElementById("mode-label");
    var badge = document.getElementById("mode-badge");
    var student = document.body.classList.contains("student-mode");
    if (icon) replaceIcon(icon, student ? "graduation-cap" : "book-open");
    if (label) label.textContent = student ? "Student" : "Teacher";
    if (badge) badge.classList.toggle("student", student);
  }

  function updateViewIcon() {
    /* All Phase 1 sims are 2D, so the 3D toggle is hidden. We still update
       the badge to read 2D. */
    var badge = document.getElementById("view-badge");
    if (badge) {
      badge.textContent = "2D";
      badge.classList.remove("mode-3d");
    }
  }

  function updatePauseIcon() {
    var button = document.getElementById("fab-pause");
    var label = document.querySelector("#fr-pause .fab-lbl");
    var paused = !!(window._engine && window._engine.activeSim && window._engine.activeSim._paused);
    if (button) {
      replaceIcon(button, paused ? "play" : "pause");
      button.classList.toggle("paused", paused);
      button.setAttribute("aria-label", paused ? "Resume" : "Pause");
      button.title = paused ? "Resume" : "Pause";
    }
    if (label) label.textContent = paused ? "Resume" : "Pause";
  }

  function updateGhostState() {
    var button = document.getElementById("fab-ghost");
    if (button) button.classList.toggle("ghost-on", !!window._ghostEnabled);
  }

  function setEdgeIcon(side, iconName) {
    if (tabs[side]) replaceIcon(tabs[side], iconName);
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    currentSide = null;
    setEdgeIcon("left", "chevron-right");
    setEdgeIcon("right", "chevron-left");
    setEdgeIcon("bottom", "chevron-up");
    Object.keys(tabs).forEach(function (side) {
      tabs[side].setAttribute("aria-expanded", "false");
    });
  }

  function openPanel(side) {
    if (!panel) return;
    if (currentSide === side && panel.classList.contains("open")) {
      closePanel();
      return;
    }
    panel.classList.remove("from-left", "from-right", "from-bottom");
    panel.classList.add("from-" + side);
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    currentSide = side;
    var heading = document.getElementById("compass-panel-heading");
    if (heading) heading.textContent = side === "bottom" ? "COMPASS / CONTROLS" : "CONTROLS";
    setEdgeIcon("left", side === "left" ? "chevron-left" : "chevron-right");
    setEdgeIcon("right", side === "right" ? "chevron-right" : "chevron-left");
    setEdgeIcon("bottom", side === "bottom" ? "chevron-down" : "chevron-up");
    Object.keys(tabs).forEach(function (position) {
      tabs[position].setAttribute("aria-expanded", String(position === side));
    });
    updateViewIcon();
    updatePauseIcon();
    updateGhostState();
  }

  function createEdgeTab(id, side, iconName, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.className = "compass-edge-tab";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-expanded", "false");
    button.appendChild(iconElement(iconName));
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      openPanel(side);
    });
    document.body.appendChild(button);
    return button;
  }

  function installPanel() {
    var cluster = document.getElementById("fab-cluster");
    if (!cluster || document.getElementById("compass-control-panel")) return;

    panel = document.createElement("section");
    panel.id = "compass-control-panel";
    panel.setAttribute("aria-label", "Maths experiment controls");
    panel.setAttribute("aria-hidden", "true");

    var header = document.createElement("div");
    header.className = "compass-panel-header";
    var heading = document.createElement("div");
    heading.id = "compass-panel-heading";
    heading.className = "compass-panel-title";
    heading.textContent = "CONTROLS";
    var close = document.createElement("button");
    close.id = "compass-panel-close";
    close.type = "button";
    close.className = "compass-panel-close";
    close.setAttribute("aria-label", "Close controls");
    close.title = "Close controls";
    close.appendChild(iconElement("x"));
    close.addEventListener("click", closePanel);
    header.appendChild(heading);
    header.appendChild(close);
    panel.appendChild(header);

    ["fr-sims", "fr-analysis", "fr-ctrl", "fr-ghost", "fr-viewmode", "fr-reset", "fr-pause"].forEach(function (rowId) {
      var row = document.getElementById(rowId);
      if (!row) {
        console.warn("COMPASS: missing control row", rowId);
        return;
      }
      var button = row.querySelector("button");
      var label = row.querySelector(".fab-lbl");
      if (button) {
        replaceIcon(button, iconMap[button.id] || "circle");
        button.setAttribute("aria-label", labelMap[button.id] || button.id);
        button.setAttribute("title", labelMap[button.id] || button.id);
        button.classList.remove("vis");
      }
      if (label && button) label.textContent = labelMap[button.id] || label.textContent;
      row.classList.remove("vis");
      panel.appendChild(row);
    });

    document.body.appendChild(panel);
    tabs.left = createEdgeTab("compass-tab-left", "left", "chevron-right", "Open controls from left");
    tabs.right = createEdgeTab("compass-tab-right", "right", "chevron-left", "Open controls from right");
    tabs.bottom = createEdgeTab("compass-tab-bottom", "bottom", "chevron-up", "Open controls from bottom");

    var main = document.getElementById("fab-main");
    if (main) main.setAttribute("aria-hidden", "true");

    refreshIcons();
  }

  /* === Fascinating loading screen with floating math symbols === */
  function installBranding() {
    var logo = document.querySelector("#loading-screen .ls-logo");
    var expansion = document.querySelector("#loading-screen .ls-expansion");
    var fill = document.querySelector("#loading-screen .ls-fill");
    var motto = document.querySelector("#loading-screen .ls-tag");

    if (logo) {
      logo.replaceChildren();
      ["C", "O", "M", "P", "A", "S", "S"].forEach(function (character, index) {
        var span = document.createElement("span");
        span.className = "compass-letter";
        span.textContent = character;
        span.style.animationDelay = (index * 70) + "ms";
        logo.appendChild(span);
      });
      logo.setAttribute("aria-label", "COMPASS");
    }

    if (expansion) {
      expansion.textContent = "CHARTING MATHS, ONE ANGLE AT A TIME";
      expansion.setAttribute("data-text", "CHARTING MATHS, ONE ANGLE AT A TIME");
      expansion.style.setProperty("--compass-progress", "0%");
    }
    if (motto) motto.textContent = "Find your direction in maths.";

    /* === Spawn floating math symbols in the loading screen === */
    var ls = document.getElementById("loading-screen");
    if (ls && !ls.querySelector(".ls-symbols")) {
      var symContainer = document.createElement("div");
      symContainer.className = "ls-symbols";
      var SYMBOLS = ["∫", "∑", "π", "∞", "√", "∇", "∂", "θ", "α", "β", "γ", "Δ", "Σ", "Π", "λ", "μ", "φ", "ω", "≠", "≤", "≥", "→", "⇒", "∠", "⊥", "∥", "ℂ", "ℝ", "ℕ", "ℤ", "±", "≈"];
      for (var i = 0; i < 22; i++) {
        var s = document.createElement("span");
        s.className = "ls-symbol";
        s.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        s.style.left = (Math.random() * 100) + "%";
        s.style.top = (Math.random() * 100) + "%";
        s.style.fontSize = (16 + Math.random() * 38) + "px";
        s.style.animationDuration = (8 + Math.random() * 12) + "s";
        s.style.animationDelay = (-Math.random() * 12) + "s";
        s.style.opacity = (0.05 + Math.random() * 0.18);
        symContainer.appendChild(s);
      }
      ls.insertBefore(symContainer, ls.firstChild);
    }

    /* === Progress bar animation (4.2 seconds) === */
    if (fill && expansion) {
      fill.style.animation = "none";
      fill.style.width = "0%";
      var start = null;
      var duration = 4200;
      function animate(now) {
        if (start === null) start = now;
        var progress = Math.min(1, (now - start) / duration);
        var percent = (progress * 100).toFixed(2) + "%";
        fill.style.width = percent;
        expansion.style.setProperty("--compass-progress", percent);
        if (progress < 1) window.requestAnimationFrame(animate);
      }
      window.requestAnimationFrame(animate);
    }
  }

  function installModalIntegration() {
    var sheet = document.getElementById("sim-sheet");
    if (!sheet) return;
    var originalOpen = window.openSheet;
    var originalClose = window.closeSheet;
    var originalCloseAll = window.closeAll;
    window.openSheet = function () {
      closePanel();
      document.body.classList.add("compass-sheet-open");
      if (typeof originalOpen === "function") originalOpen.apply(this, arguments);
      sheet.classList.add("open");
    };
    window.closeSheet = function () {
      if (typeof originalClose === "function") originalClose.apply(this, arguments);
      sheet.classList.remove("open");
      document.body.classList.remove("compass-sheet-open");
    };
    if (typeof originalCloseAll === "function") {
      window.closeAll = function () {
        originalCloseAll.apply(this, arguments);
        sheet.classList.remove("open");
        document.body.classList.remove("compass-sheet-open");
      };
    }
    var backdrop = document.getElementById("backdrop");
    if (backdrop) backdrop.addEventListener("click", window.closeAll || window.closeSheet);
  }

  function installActionObservers() {
    var pause = document.getElementById("fab-pause");
    if (pause) pause.addEventListener("click", function () { window.setTimeout(updatePauseIcon, 0); });
    var ghost = document.getElementById("fab-ghost");
    if (ghost) ghost.addEventListener("click", function () { window.setTimeout(updateGhostState, 0); });
    var view = document.getElementById("fab-viewmode");
    if (view) view.addEventListener("click", function () { window.setTimeout(updateViewIcon, 40); });
    var modeBadge = document.getElementById("mode-badge");
    if (modeBadge) {
      modeBadge.addEventListener("click", function () { window.setTimeout(updateModeIcon, 40); });
      modeBadge.setAttribute("role", "button");
      modeBadge.setAttribute("tabindex", "0");
      modeBadge.addEventListener("keydown", function (event) {
        if ((event.key === "Enter" || event.key === " ") && typeof window.toggleStudentMode === "function") {
          event.preventDefault();
          window.toggleStudentMode();
          updateModeIcon();
        }
      });
    }
  }

  function installSimulationIcons() {
    document.querySelectorAll("#sim-grid .sim-tile").forEach(function (tile) {
      var key = tile.dataset.key || tile.dataset.sim || tile.id.replace(/^btn-/, "");
      var name = simIconMap[key];
      var box = tile.querySelector(".st-icon");
      if (name && box) box.replaceChildren(iconElement(name));
    });
    refreshIcons();
  }

  function installKeyboardAndOutsideClose() {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePanel();
    });
    document.addEventListener("pointerdown", function (event) {
      if (!panel || !panel.classList.contains("open")) return;
      if (panel.contains(event.target)) return;
      if (event.target.closest && event.target.closest(".compass-edge-tab")) return;
      closePanel();
    });
  }

  function initialise() {
    installBranding();
    installPanel();
    installModalIntegration();
    installActionObservers();
    installKeyboardAndOutsideClose();
    updateModeIcon();
    installSimulationIcons();
    updateViewIcon();
    updatePauseIcon();
    updateGhostState();
    refreshIcons();
    window.setTimeout(installSimulationIcons, 200);
    window.setTimeout(installSimulationIcons, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();

/* COMPASS edge-aware simulation controls */
(function installEdgeAwareControls() {
  function install() {
    var originalToggle = window.toggleCtrl;
    var drawer = document.getElementById("ctrl-drawer");
    if (!drawer || typeof originalToggle !== "function") return;
    if (window.__compassEdgeControlsInstalled) return;
    window.__compassEdgeControlsInstalled = true;

    function getSelectedSide() {
      var panel = document.getElementById("compass-control-panel");
      if (!panel) return "right";
      if (panel.classList.contains("from-left")) return "left";
      if (panel.classList.contains("from-bottom")) return "bottom";
      return "right";
    }
    function applyDrawerPosition() {
      drawer.classList.remove(
        "compass-controls-from-left",
        "compass-controls-from-right",
        "compass-controls-from-bottom"
      );
      var side = getSelectedSide();
      drawer.classList.add("compass-controls-from-" + side);
      drawer.dataset.compassEdge = side;
    }
    window.toggleCtrl = function () {
      originalToggle.apply(this, arguments);
      if (drawer.classList.contains("open")) applyDrawerPosition();
    };
    var originalClose = window.closeCtrl;
    if (typeof originalClose === "function") {
      window.closeCtrl = function () {
        originalClose.apply(this, arguments);
        drawer.classList.remove(
          "compass-controls-from-left",
          "compass-controls-from-right",
          "compass-controls-from-bottom"
        );
        delete drawer.dataset.compassEdge;
      };
    }
    document.querySelectorAll(".compass-edge-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        if (drawer.classList.contains("open")) {
          window.setTimeout(applyDrawerPosition, 0);
        }
      });
    });
    console.info("COMPASS: edge-aware simulation controls installed.");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
