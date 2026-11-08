/* ============================================================
   sims/derivative-tangent.js — Derivative as Tangent Line
   Teacher types any f(x); we plot f and live, as the user drags
   a point along the curve, we draw the tangent line at that point
   and show f'(x) numerically. A second smaller graph below shows
   the f'(x) curve with the matching point — so the relationship
   "f'(x) is the slope of f at x" becomes visible.

   Three example presets cover the classic teaching cases.
   ============================================================ */
function DerivativeTangentSim(engine) {
  MathSimBase.call(this, engine);
  this.p = {
    expr: 'x^2',
    example: 'Quadratic'
  };
  this.compiled = null;
  this.derivCompiled = null;
  this.derivExpr = '';
  this.error = '';
  this.point = { x: 1.0 };
  this.examples = {
    'Quadratic':  'x^2',
    'Sine':       'sin(x)',
    'Exponential':'e^x',
    'Logarithm':  'log(x)'
  };
}
DerivativeTangentSim.prototype = Object.create(MathSimBase.prototype);
DerivativeTangentSim.prototype.constructor = DerivativeTangentSim;

DerivativeTangentSim.prototype._setup = function() {
  this.engine.setRange(-6, 6, -4, 6);
  this._compile();
  var self = this;
  this.engine.addHandle(this.point.x, this._evalSafe(this.point.x), {
    color: '#f0e19a',
    fillColor: 'rgba(240,225,154,0.20)',
    r: 12,
    label: 'P',
    constrain: function(wx, wy) {
      var y = self._evalSafe(wx);
      return { x: wx, y: isFinite(y) ? y : 0 };
    },
    onDrag: function(wx, wy) { self.point.x = wx; }
  });
};

DerivativeTangentSim.prototype._evalSafe = function(x) {
  if (!this.compiled) return 0;
  try {
    var v = this.compiled.evaluate({ x: x });
    return typeof v === 'number' ? v : 0;
  } catch (_) { return 0; }
};
DerivativeTangentSim.prototype._evalDerivSafe = function(x) {
  if (!this.derivCompiled) return 0;
  try {
    var v = this.derivCompiled.evaluate({ x: x });
    return typeof v === 'number' ? v : 0;
  } catch (_) { return 0; }
};

DerivativeTangentSim.prototype._compile = function() {
  this.error = '';
  try {
    var node = math.parse(this.p.expr);
    this.compiled = node.compile();
    var test = this.compiled.evaluate({ x: 1 });
    if (typeof test !== 'number' && typeof test !== 'object') throw new Error('Not a number');
    try {
      var dNode = math.derivative(node, 'x');
      this.derivExpr = dNode.toTex();
      this.derivCompiled = dNode.compile();
    } catch (_) {
      this.derivExpr = '';
      this.derivCompiled = null;
    }
  } catch (e) {
    this.error = e.message || String(e);
    this.compiled = null;
    this.derivCompiled = null;
    this.derivExpr = '';
  }
};

DerivativeTangentSim.prototype._buildGui = function() {
  var self = this;
  this.gui = new lil.GUI({ title: 'Derivative as Tangent', container: document.getElementById('gui-container'), width: 320 });
  this.gui.add(this.p, 'expr').name('f(x) =').onChange(function() { self._compile(); });
  this.gui.add(this.p, 'example', Object.keys(this.examples)).name('Example').onChange(function(v) {
    self.p.expr = self.examples[v];
    self._compile();
    self.gui.controllers.forEach(function(c) { c.updateDisplay(); });
  });
};

DerivativeTangentSim.prototype.update = function(t, dt) {
  if (!MathSimBase.prototype.update.call(this, t, dt)) return;

  var eng = this.engine;
  eng.clear();
  eng.drawGrid({ minorStep: 1, majorStep: 2 });
  eng.drawAxes({});

  if (this.error) {
    eng.drawText('Error: ' + this.error, { x: 0, y: 0 }, { color: '#f0c4d4', align: 'center', font: '14px "IBM Plex Mono", monospace' });
    this.setOverlay('<b>Could not parse f(x).</b><br>' + this.error);
    this.setFormula('');
    this.setLiveValues([]);
    return;
  }

  /* === Main: f(x) curve === */
  eng.drawFunction(function(x) { return this._evalSafe(x); }.bind(this), { color: '#f5f5f0', lineWidth: 2.4, N: 600 });

  /* === Draggable point + tangent line === */
  var px = this.point.x;
  var py = this._evalSafe(px);
  if (isFinite(py)) {
    var slope = this._evalDerivSafe(px);
    if (isFinite(slope)) {
      /* Tangent line: y = py + slope * (x - px), drawn across the visible range */
      var xL = eng.xMin, xR = eng.xMax;
      var yL = py + slope * (xL - px);
      var yR = py + slope * (xR - px);
      eng.drawLine({ x: xL, y: yL }, { x: xR, y: yR }, { color: '#f0c4d4', lineWidth: 2, opacity: 0.9, dash: [5, 4] });

      /* Slope triangle: a small right-triangle visualising rise/run */
      var run = 1.2;
      var rise = slope * run;
      var triX0 = px, triY0 = py;
      var triX1 = px + run, triY1 = py;
      var triX2 = px + run, triY2 = py + rise;
      eng.drawLine({ x: triX0, y: triY0 }, { x: triX1, y: triY1 }, { color: '#9fb89f', lineWidth: 1.5 });
      eng.drawLine({ x: triX1, y: triY1 }, { x: triX2, y: triY2 }, { color: '#9fb89f', lineWidth: 1.5 });
      eng.drawLine({ x: triX2, y: triY2 }, { x: triX0, y: triY0 }, { color: 'rgba(159,184,159,0.4)', lineWidth: 1, dash: [3, 3] });
      eng.drawText('run = 1', { x: (triX0 + triX1) / 2, y: triY0 }, { dy: 14, color: '#9fb89f', align: 'center', font: '10px "IBM Plex Mono", monospace' });
      eng.drawText('rise = ' + rise.toFixed(2), { x: triX1, y: (triY1 + triY2) / 2 }, { dx: 8, color: '#9fb89f', font: '10px "IBM Plex Mono", monospace' });
    }

    /* Vertical drop line from point to x-axis */
    eng.drawLine({ x: px, y: 0 }, { x: px, y: py }, { color: 'rgba(240,225,154,0.4)', lineWidth: 1, dash: [3, 3] });
    /* The point itself */
    eng.drawPoint({ x: px, y: py }, { color: '#f0e19a', r: 7, glow: true });
    /* Coordinate label */
    eng.drawText('(' + px.toFixed(2) + ', ' + py.toFixed(2) + ')', { x: px, y: py }, { dx: 14, dy: -14, color: '#f0e19a', font: 'bold 12px "IBM Plex Mono", monospace' });
    /* Slope label near the tangent line, on the right edge */
    eng.drawText("slope = f'(" + px.toFixed(2) + ') = ' + slope.toFixed(3), { x: eng.xMax - 0.2, y: py + slope * (eng.xMax - px) }, { dx: -8, dy: -8, color: '#f0c4d4', align: 'right', font: 'bold 12px "IBM Plex Mono", monospace' });
  }

  /* === f'(x) curve — drawn faded yellow, for visual comparison === */
  if (this.derivCompiled) {
    eng.drawFunction(function(x) { return this._evalDerivSafe(x); }.bind(this), { color: 'rgba(240,225,154,0.5)', lineWidth: 1.6, dash: [4, 3], N: 400 });
    /* Point on f'(x) directly below (px, slope) */
    if (isFinite(slope)) {
      eng.drawPoint({ x: px, y: slope }, { color: '#f0c4d4', r: 5, glow: true });
    }
  }

  /* Update the handle's y so it follows the curve */
  if (eng.handles.length > 0) {
    eng.handles[0].x = px;
    eng.handles[0].y = isFinite(py) ? py : 0;
  }
  eng.drawHandles();

  /* === Analysis panel === */
  this.setOverlay(
    'Drag the yellow point <b>P</b> along the curve. The pink dashed line is the <b>tangent</b> at P — its slope is <b>f\'(x)</b>, the derivative. ' +
    'The small green triangle shows <b>rise / run</b> = slope numerically. ' +
    'The faded yellow curve is <b>f\'(x)</b> itself, plotted on the same axes so you can see how the slope changes as you move P. ' +
    'The pink dot on the yellow curve is the point (x, f\'(x)) — as you drag P along f, watch this dot trace out f\'.'
  );

  var formulaHtml = '<div class="formula-block"><div class="formula-label">Function</div>f(x) = ' + this.p.expr + '</div>';
  if (this.derivExpr) {
    formulaHtml += '<div class="formula-block"><div class="formula-label">Derivative (symbolic, via math.js)</div>f\'(x) = $' + this.derivExpr + '$</div>';
  }
  formulaHtml += '<div class="formula-block"><div class="formula-label">At the current point</div>' +
    'x = ' + px.toFixed(3) + '<br>' +
    'f(x) = ' + py.toFixed(3) + '<br>' +
    "f'(x) = " + (isFinite(slope) ? slope.toFixed(3) : '—') + '</div>';
  this.setFormula(formulaHtml);

  this.setLiveValues([
    { l: 'x', v: px.toFixed(3) },
    { l: 'f(x)', v: py.toFixed(3) },
    { l: "f'(x)", v: isFinite(slope) ? slope.toFixed(3) : '—' }
  ]);
};

DerivativeTangentSim.prototype.reset = function() {
  MathSimBase.prototype.reset.call(this);
  this.point.x = 1.0;
};
