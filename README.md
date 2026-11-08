# COMPASS
### Charting Maths, One Angle at a Time

**A smartboard-first maths teaching platform. Built around the way maths is taught — not the way it's textbooked.**

COMPASS is a browser-based maths demonstration environment for teachers. Open a topic — functions, the unit circle, vector addition, conic sections, derivatives — and a parameter-driven, interactive visualisation appears on a chalkboard-green canvas with proper KaTeX-rendered equations alongside. Designed for projection on a 75-inch smart board with touch-friendly controls reachable from any edge of the screen.

The name comes from the **drawing compass** — the first instrument a maths student picks up after arithmetic, the tool Euclid used to draw the first circle and bisect the first angle. Just as the compass is the entry point to geometry, this platform is meant to be the entry point to seeing maths behave.

---

## What's in Phase 1 (this release)

Five simulations across four chapters, with 15+ example presets between them:

| Sim | Chapter | What it does |
|---|---|---|
| **Function Grapher** | Functions & Graphs | Type any `y = f(x)`, plot it live, toggle derivative & integral overlays, drag a point to see tangent + coordinates. **7 example presets:** Parabola, Sine Wave, Cubic, Exponential, Logarithm, Rational, Sinc. |
| **Unit Circle & Trigonometry** | Functions & Graphs | A point sweeps the unit circle; the sine wave (and optionally cosine) builds up live beside it, showing where sin and cos actually come from. **3 example presets:** Sine derivation, Cosine derivation, Reference angles (30°/45°/60° triangles). |
| **Vector Addition** | Vectors | Two draggable vectors a (chalk white) and b (yellow chalk); parallelogram + triangle methods both shown; components, magnitudes, angles, and angle-between-vectors all live. **4 example presets:** General case, Perpendicular, Decomposition, Opposite vectors. |
| **Conic Sections** | Coordinate Geometry | Sweep eccentricity e from 0 → 2 and watch the curve morph continuously through circle → ellipse → parabola → hyperbola. Focus + directrix drawn, second focus shown for ellipse/hyperbola. **5 example presets:** Circle, Ellipse, Parabola, Hyperbola, Sweep e (animated). |
| **Derivative as Tangent** | Calculus | Drag a point along any f(x); the pink tangent line follows; a small rise/run triangle shows the slope numerically; the f'(x) curve is overlaid faded so you can see how slope changes. **4 example presets:** Quadratic, Sine, Exponential, Logarithm. |

Every sim has:
- A **KaTeX equation strip** below the top bar showing the governing formula
- An **analysis drawer** with explanation, formula blocks, and live value chips
- A **controls drawer** (lil-gui) with sliders and example picker
- **Draggable handles** (where relevant) for direct manipulation on the smartboard

---

## The Look

- **Green chalkboard** background with a **radial spotlight** — brighter in the middle (`#1a4a2a`), darker at the edges (`#07150e`), so the simulation in the centre of the board reads cleanly.
- **Engineering graph paper** overlay (minor lines every 32 px, major every 160 px) in faded chalk-green.
- **Drifting math symbols** (∫ ∑ π ∞ √ ∇ ∂ θ α β Δ Σ Π λ μ φ ω ℂ ℝ ℕ ℤ ∠ ⊥ ∥ …) meandering across the background at very low opacity, like chalk dust.
- **Chalk-tone palette:** white `#f5f5f0` for primary curves, faded green `#9fb89f` for secondary, yellow chalk `#f0e19a` for highlights (sine leg, draggable points, focus), pink chalk `#f0c4d4` for tertiaries (3D badge, tangent line, resultant vector).

---

## The Loading Screen

A fascination pass — the first thing the teacher sees:

- **Radial chalkboard spotlight** with a faint graph-paper overlay
- **22 drifting math symbols** wandering slowly across the background
- **4 KaTeX-rendered equations in the corners**, each gently bobbing:
  - Top-left: `e^(iπ) + 1 = 0` (Euler's identity)
  - Top-right: `∫_a^b f(x) dx` (the integral)
  - Bottom-left: `a² + b² = c²` (Pythagoras)
  - Bottom-right: `Σ 1/n² = π²/6` (the Basel problem)
- **A slowly rotating compass-needle SVG** (28-second rotation) behind the logo, very faint — a subtle nod to the platform's name
- **COMPASS** in large chalk-white monospace, breathing gently
- The tagline **CHARTING MATHS, ONE ANGLE AT A TIME** revealing as a chalk-on-dark gradient that fills left-to-right in sync with the progress bar
- A chalk-stroke progress bar (white fill on dark-green track, with a soft glow)
- The motto **"Find your direction in maths."** in faded italic chalk

Total loading time: 4.2 seconds — long enough to enjoy, short enough not to delay the class.

---

## Project Structure

```text
COMPASS/
├── index.html              # App shell, loading screen, CSS theme
├── engine.js               # Graph2DEngine + LabEngine3D + MathSimBase + COMPASS.materials
├── bg.js                   # Graph-paper + drifting math symbols + radial vignette
├── sim-registry.js         # 5 sims registered, engine-type switching
├── compass-ui.js           # Edge panel + loading branding + sim picker
├── compass-ui.css          # Chalkboard + fascinating loading screen styles
├── compass-refinement.js   # KaTeX + equation strip + draggable panels
└── sims/
    ├── function-grapher.js     # y = f(x) plotter with math.js
    ├── unit-circle.js          # Trig derivation via sweeping point
    ├── vector-addition.js      # 2D vectors, parallelogram + triangle
    ├── conic-sections.js       # Eccentricity sweep, focus-directrix
    └── derivative-tangent.js   # Tangent line + f'(x) overlay
```

---

## Architecture

Two engines in `engine.js`:

- **`Graph2DEngine`** — Canvas2D-based plotter with chalk-stroke rendering. Handles world↔screen transforms, axes, grid, functions, vectors, conics, points, draggable handles, and the radial chalkboard spotlight. Used by all 5 Phase 1 sims.
- **`LabEngine3D`** — Three.js scene with chalkboard env-map, ACES tone mapping, PCF soft shadows. Kept ready for future 3D sims (3D vectors, planes, cross product, matrix transformations, surfaces z = f(x,y)).

**`MathSimBase`** is the common lifecycle both engine types use: `_setup()`, `_buildGui()`, `update(t, dt)`, `reset()`, `dispose()`, plus helpers `setOverlay()`, `setFormula()`, `setLiveValues()` for the analysis panel.

The registry's `switchSim()` automatically tears down and recreates the engine when switching between 2D and 3D sims — so a future 3D vector sim will work seamlessly alongside the 2D ones.

---

## External Dependencies (all CDN, no install)

| Library | Version | Purpose |
|---|---|---|
| Three.js | r128 | 3D engine (kept ready for future 3D sims) |
| OrbitControls | 0.128.0 | 3D camera interaction |
| lil-gui | 0.17 | Parameter sliders and dropdowns |
| Lucide | 0.468.0 | UI icons |
| KaTeX | 0.16.22 | Mathematical typesetting (lazy-loaded) |
| **math.js** | **12.4.1** | **Symbolic expression parsing & derivatives — powers the Function Grapher and Derivative as Tangent sims** |

No build step, no npm, no backend. A teacher can clone the repo onto a USB stick and run it offline on a school network.

---

## Running Locally

```bash
git clone https://github.com/TejUzumaki/COMPASS.git
cd COMPASS
python -m http.server 8000
```

Then open `http://localhost:8000` in a modern browser. **Tip for Termux:** `cd ~/COMPASS && python -m http.server 8000`, then open `http://localhost:8000` in Chrome on the same phone.

---

## Smartboard Optimisation

- `devicePixelRatio` capped at 1.5 — sharp on a 4K board without GPU jitter
- ~30K triangle budget per 3D scene (well within any modern smartboard GPU at 60 fps)
- All touch targets ≥ 39 px, edge tabs always reachable from any side of the board
- Teacher / Student mode: one tap on the mode badge hides every control so a student can take the board without changing parameters

---

## Where the Project Is Heading

**Phase 2 sims (next batch):**
- 3D Vectors (magnitude, direction cosines, draggable endpoints)
- Dot Product (projection visualised)
- Cross Product (right-hand-rule animation, parallelogram area)
- Line in 2D / Line in 3D (slope-intercept / point-slope / general form, all live)
- Plane in 3D (normal vector, intercept form, three draggable points)
- Angle Between Two Lines / Line-and-Plane / Two Planes
- Riemann Sums (left/right/midpoint/trapezoid/Simpson, n-slider, convergence)
- Matrix Transformations (2×2 editor, eigenvalues, determinant-as-area-scaling)

**Phase 3:** Distance from point to line/plane, limit visualization, fundamental theorem of calculus, Taylor series, linear systems (graphical), Argand diagram, De Moivre's theorem, triangle properties.

**Phase 4:** Polygon angles, circle theorems, probability distributions (normal/binomial/Poisson), central limit theorem, sequences and series, modular arithmetic clock, Pascal's triangle.

---

## Project Identity

**COMPASS — Charting Maths, One Angle at a Time**

*A maths demonstration platform built around the way maths is taught and learned.*

The ambition: help teachers turn abstract maths into something a class can observe, manipulate, and understand — on the same chalkboard they've always used, just smarter.
