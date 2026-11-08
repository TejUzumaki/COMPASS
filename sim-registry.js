/* COMPASS — Ordered simulation registry */

var SIM_ORDER = [
  "function",
  "unit-circle",
  "vector-addition",
  "conic-sections",
  "derivative-tangent"
];

var SIMS = {
  "function": {
    Cls: FunctionGrapherSim,
    engineType: "2d",
    title: "Function Grapher",
    sub: "y = f(x) — type any function, plot it live",
    icon: "ƒ",
    subtext: "y = f(x)",
    section: "Functions & Graphs"
  },
  "unit-circle": {
    Cls: UnitCircleSim,
    engineType: "2d",
    title: "Unit Circle & Trigonometry",
    sub: "Where sin and cos come from, geometrically",
    icon: "○",
    subtext: "x = cos θ,  y = sin θ",
    section: "Functions & Graphs"
  },
  "vector-addition": {
    Cls: VectorAdditionSim,
    engineType: "2d",
    title: "Vector Addition",
    sub: "Parallelogram + triangle methods, live components",
    icon: "→",
    subtext: "a + b",
    section: "Vectors"
  },
  "conic-sections": {
    Cls: ConicSectionsSim,
    engineType: "2d",
    title: "Conic Sections",
    sub: "Circle → ellipse → parabola → hyperbola via eccentricity",
    icon: "∉",
    subtext: "PF = e · PM",
    section: "Coordinate Geometry"
  },
  "derivative-tangent": {
    Cls: DerivativeTangentSim,
    engineType: "2d",
    title: "Derivative as Tangent",
    sub: "Drag a point — watch f′(x) become the tangent slope",
    icon: "∂",
    subtext: "f′(x) = slope of tangent",
    section: "Calculus"
  }
};

/* Camera presets — for 2D sims we use these as world-range hints
   (sims can override in their own _setup). 3D sims use pos/target. */
var PRESETS = {
  "function":         { xMin: -8, xMax: 8, yMin: -5, yMax: 5 },
  "unit-circle":      { xMin: -3.5, xMax: 10, yMin: -2.5, yMax: 2.5 },
  "vector-addition":  { xMin: -2, xMax: 8, yMin: -2, yMax: 7 },
  "conic-sections":   { xMin: -8, xMax: 8, yMin: -5, yMax: 5 },
  "derivative-tangent": { xMin: -6, xMax: 6, yMin: -4, yMax: 6 },
  default:            { xMin: -10, xMax: 10, yMin: -6, yMax: 6 }
};

(function buildSimGrid() {
  var grid = document.getElementById("sim-grid");
  if (!grid) {
    console.error("COMPASS: #sim-grid was not found.");
    return;
  }
  grid.replaceChildren();
  var lastSection = null;
  SIM_ORDER.forEach(function (key) {
    var meta = SIMS[key];
    if (!meta) return;
    if (meta.section !== lastSection) {
      lastSection = meta.section;
      var heading = document.createElement("div");
      heading.className = "grid-sec-label";
      heading.textContent = meta.section;
      heading.dataset.section = meta.section;
      grid.appendChild(heading);
    }
    var tile = document.createElement("button");
    tile.type = "button";
    tile.className = "sim-tile rh";
    tile.id = "btn-" + key;
    tile.dataset.key = key;
    tile.setAttribute("aria-label", "Open " + meta.title);
    var icon = document.createElement("div");
    icon.className = "st-icon";
    icon.textContent = meta.icon || "●";
    var text = document.createElement("div");
    text.className = "st-text";
    var name = document.createElement("span");
    name.className = "st-name";
    name.textContent = meta.title;
    var formula = document.createElement("span");
    formula.className = "st-formula";
    formula.textContent = meta.subtext || "";
    var check = document.createElement("div");
    check.className = "st-check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");
    text.appendChild(name);
    text.appendChild(formula);
    tile.appendChild(icon);
    tile.appendChild(text);
    tile.appendChild(check);
    tile.addEventListener("click", function () {
      switchSim(key);
      closeSheet();
    });
    grid.appendChild(tile);
  });
})();

var _engine = null;
var _curKey = null;

window.switchSim = function (key) {
  if (!SIMS[key] || key === _curKey) return;
  var overlay = document.getElementById("transition-overlay");
  if (overlay) overlay.classList.add("active");

  setTimeout(function () {
    var meta = SIMS[key];
    var newEngineType = meta.engineType || "2d";

    /* Tear down the old engine if the type changed (or if no engine yet) */
    if (_engine && _engine.type !== newEngineType) {
      if (_engine.activeSim) _engine.activeSim.dispose();
      if (_engine.type === "3d") {
        _engine.renderer && _engine.renderer.dispose();
        if (_engine.renderer && _engine.renderer.domElement && _engine.renderer.domElement.parentNode) {
          _engine.renderer.domElement.parentNode.removeChild(_engine.renderer.domElement);
        }
      } else {
        if (_engine.canvas && _engine.canvas.parentNode) {
          _engine.canvas.parentNode.removeChild(_engine.canvas);
        }
        if (_engine._rafId) cancelAnimationFrame(_engine._rafId);
      }
      _engine = null;
    }

    if (!_engine) {
      if (newEngineType === "3d") {
        _engine = new LabEngine3D("canvas-container");
      } else {
        _engine = new Graph2DEngine("canvas-container");
      }
      _engine.start();
    }

    var simInstance = new meta.Cls(_engine);
    simInstance.cameraPresets = PRESETS[key] || PRESETS.default;
    _engine.loadSim(simInstance);
    _curKey = key;

    var title = document.getElementById("sim-title");
    var subtitle = document.getElementById("sim-subtitle");
    var badge = document.getElementById("overlay-sim-badge");
    if (title) title.textContent = meta.title;
    if (subtitle) subtitle.textContent = meta.sub;
    if (badge) badge.textContent = meta.title;

    SIM_ORDER.forEach(function (simKey) {
      var item = document.getElementById("btn-" + simKey);
      if (item) {
        var active = simKey === key;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      }
    });

    if (overlay) overlay.classList.remove("active");
  }, 380);
};

window.addEventListener("DOMContentLoaded", function () {
  window._ghostEnabled = false;
  /* Boot the first sim */
  _curKey = null;
  window.switchSim(SIM_ORDER[0]);

  if (typeof updateViewModeUI === "function") {
    updateViewModeUI();
  }

  setTimeout(function () {
    var loading = document.getElementById("loading-screen");
    if (loading) {
      loading.classList.add("fade-out");
      setTimeout(function () {
        loading.style.display = "none";
      }, 600);
    }
  }, 4200);
});
