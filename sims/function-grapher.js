/* ============================================================
   sims/function-grapher.js — Function Grapher
   Teacher types any y = f(x); we parse with math.js, plot it
   live, and offer derivative / integral overlays plus a draggable
   point that draws the tangent line and shows f(x) and f'(x).

   7 built-in example presets cover the classic functions a
   teacher reaches for first.
   ============================================================ */
function FunctionGrapherSim(engine) {
  MathSimBase.call(this, engine);
  this.p = {
    expr: 'sin(x)',
    showDerivative: false,
    showIntegral: false,
    integralA: -3,
    integralB: 3,
    example: 'Sine Wave'
  };
  this.compiled = null;
  this.derivCompiled = null;
  this.derivExpr = '';
  this.error = '';
  this.point = { x: 1.5 };
  this.examples = {
    'Parabola':       'x^2',
    'Sine Wave':      'sin(x)',
    'Cubic':          'x^3 - 3*x',
    'Exponential':    'e^x',
    'Logarithm':      'log(x)',
    'Rational':       '1/x',
    'Sinc':           'sin(x)/x'
  };
}
FunctionGrapherSim.prototype = Object.create(MathSimBase.prototype);
FunctionGrapherSim.prototype.constructor = FunctionGrapherSim;

FunctionGrapherSim.prototype._setup = function() {
  this.engine.setRange(-8, 8, -5, 5);
  this._compile();
  /* Draggable point on the curve — constrained to x-axis movement */
  var self = this;
  this.engine.addHandle(this.point.x, this._evalSafe(this.point.x), {
    color: '#f0e19a',
    fillColor: 'rgba(240,225,154,0.20)',
    r: 12,
    label: 'P',
    constrain: function(wx, wy) {
      /* Snap y to the curve so the point stays on f(x) */
      var y = self._evalSafe(wx);
      return { x: wx, y: isFinite(y) ? y : 0 };
    },
    onDrag: function(wx, wy) { self.point.x = wx; }
  });
};

FunctionGrapherSim.prototype._evalSafe = function(x) {
  if (!this.compiled) return 0;
  try {
    var v = this.compiled.evaluate({ x: x });
    return typeof v === 'number' ? v : 0;
  } catch (_) { return 0; }
};

FunctionGrapherSim.prototype._evalDerivSafe = function(x) {
  if (!this.derivCompiled) return 0;
  try {
    var v = this.derivCompiled.evaluate({ x: x });
    return typeof v === 'number' ? v : 0;
  } catch (_) { return 0; }
};

FunctionGrapherSim.prototype._compile = function() {
  this.error = '';
  try {
    var node = math.parse(this.p.expr);
    this.compiled = node.compile();
    /* Test-evaluate at x=1 to catch errors early */
    var test = this.compiled.evaluate({ x: 1 });
    if (typeof test !== 'number' && typeof test !== 'object') throw new Error('Not a number');
    /* Try to compute the symbolic derivative */
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

FunctionGrapherSim.prototype._buildGui = function() {
  var self = this;
  this.gui = new lil.GUI({ title: 'Function Grapher', container: document.getElementById('gui-container'), width: 320 });
  this.gui.add(this.p, 'expr').name('f(x) =').onChange(function() { self._compile(); });
  this.gui.add(this.p, 'example', Object.keys(this.examples)).name('Example').onChange(function(v) {
    self.p.expr = self.examples[v];
    self._compile();
    /* rebuild GUI so the expr field shows the new value */
    self.gui.controllers.forEach(function(c) { c.updateDisplay(); });
  });
  this.gui.add(this.p, 'showDerivative').name("Show f'(x)").listen();
  this.gui.add(this.p, 'showIntegral').name('Show ∫f(x) dx').listen();
  var fInt = this.gui.addFolder('Integral Range');
  fInt.add(this.p, 'integralA', -8, 8, 0.1).name('a');
  fInt.add(this.p, 'integralB', -8, 8, 0.1).name('b');
  fInt.open();
};

FunctionGrapherSim.prototype.update = function(t, dt) {
  if (!MathSimBase.prototype.update.call(this, t, dt)) return;

  var eng = this.engine;
  eng.clear();
  eng.drawGrid({ minorStep: 1, majorStep: 2 });
  eng.drawAxes({});

  /* If there's a parse error, show it and bail */
  if (this.error) {
    eng.drawText('Error: ' + this.error, { x: 0, y: 0 }, { color: '#f0c4d4', align: 'center', font: '14px "IBM Plex Mono", monospace' });
    this.setOverlay('<b>Could not parse f(x).</b><br>' + this.error + '<br><br>Try a simpler expression like <code>sin(x)</code> or <code>x^2</code>.');
    this.setFormula('');
    this.setLiveValues([]);
    return;
  }

  /* Integral shading (drawn first so the curve sits on top) */
  if (this.p.showIntegral && this.compiled) {
    var a = Math.min(this.p.integralA, this.p.integralB);
    var b = Math.max(this.p.integralA, this.p.integralB);
    var N = 200;
    var region = [];
    region.push({ x: a, y: 0 });
    for (var i = 0; i <= N; i++) {
      var x = a + (b - a) * i / N;
      region.push({ x: x, y: this._evalSafe(x) });
    }
    region.push({ x: b, y: 0 });
    eng.fillRegion(region, { color: 'rgba(159,184,159,0.22)' });
    /* Vertical lines at a and b */
    eng.drawLine({ x: a, y: 0 }, { x: a, y: this._evalSafe(a) }, { color: 'rgba(159,184,159,0.55)', dash: [4, 4] });
    eng.drawLine({ x: b, y: 0 }, { x: b, y: this._evalSafe(b) }, { color: 'rgba(159,184,159,0.55)', dash: [4, 4] });
  }

  /* The function curve itself — chalk white, slightly thick */
  eng.drawFunction(function(x) { return this._evalSafe(x); }.bind(this), { color: '#f5f5f0', lineWidth: 2.4, N: 600 });

  /* Derivative overlay — yellow chalk, thinner */
  if (this.p.showDerivative && this.derivCompiled) {
    eng.drawFunction(function(x) { return this._evalDerivSafe(x); }.bind(this), { color: '#f0e19a', lineWidth: 1.8, dash: [6, 4], N: 400 });
  }

  /* Draggable point + tangent line */
  var px = this.point.x;
  var py = this._evalSafe(px);
  if (isFinite(py)) {
    /* Tangent line: y = py + f'(px) * (x - px), drawn across the visible range */
    if (this.derivCompiled) {
      var slope = this._evalDerivSafe(px);
      if (isFinite(slope)) {
        /* Find the two endpoints where the tangent line crosses x = xMin and x = xMax */
        var xL = eng.xMin;
        var xR = eng.xMax;
        var yL = py + slope * (xL - px);
        var yR = py + slope * (xR - px);
        eng.drawLine({ x: xL, y: yL }, { x: xR, y: yR }, { color: '#f0c4d4', lineWidth: 1.6, opacity: 0.85, dash: [3, 3] });
      }
    }
    /* Vertical drop line from point to x-axis */
    eng.drawLine({ x: px, y: 0 }, { x: px, y: py }, { color: 'rgba(240,225,154,0.4)', lineWidth: 1, dash: [3, 3] });
    /* The point itself (handle drawn by drawHandles, but we add a glow here) */
    eng.drawPoint({ x: px, y: py }, { color: '#f0e19a', r: 7, glow: true });
    /* Coordinate label */
    eng.drawText('(' + px.toFixed(2) + ', ' + py.toFixed(2) + ')', { x: px, y: py }, { dx: 14, dy: -14, color: '#f0e19a', font: 'bold 12px "IBM Plex Mono", monospace' });
  }

  /* Update the handle's y so it follows the curve */
  if (eng.handles.length > 0) {
    eng.handles[0].x = px;
    eng.handles[0].y = isFinite(py) ? py : 0;
  }
  eng.drawHandles();

  /* === Analysis panel === */
  var slopeNow = this.derivCompiled ? this._evalDerivSafe(px) : NaN;
  var integralVal = NaN;
  if (this.p.showIntegral && this.compiled) {
    var aI = Math.min(this.p.integralA, this.p.integralB);
    var bI = Math.max(this.p.integralA, this.p.integralB);
    /* Simpson's rule with 200 subintervals */
    var N = 200, h = (bI - aI) / N, sum = 0;
    for (var i = 0; i <= N; i++) {
      var xi = aI + i * h;
      var fi = this._evalSafe(xi);
      var coef = (i === 0 || i === N) ? 1 : (i % 2 === 1 ? 4 : 2);
      sum += coef * fi;
    }
    integralVal = sum * h / 3;
  }

  this.setOverlay(
    'Type any function of <b>x</b> in the control panel (uses math.js syntax: <code>sin</code>, <code>cos</code>, <code>tan</code>, <code>log</code>, <code>sqrt</code>, <code>^</code>, <code>e</code>, <code>pi</code>). ' +
    'Drag the yellow point <b>P</b> along the curve to see <b>f(x)</b> and the tangent slope <b>f\'(x)</b> live. ' +
    'Toggle the derivative overlay to compare <b>f</b> and <b>f\'</b> on the same axes, or shade the integral over [a, b].'
  );

  var formulaHtml = '<div class="formula-block"><div class="formula-label">Function</div>' +
    'f(x) = ' + this.p.expr + '</div>';
  if (this.derivExpr) {
    formulaHtml += '<div class="formula-block"><div class="formula-label">Derivative</div>' +
      "f'(x) = $" + this.derivExpr + '$</div>';
  }
  if (this.p.showIntegral) {
    formulaHtml += '<div class="formula-block"><div class="formula-label">Definite Integral (Simpson, N=200)</div>' +
      '∫ from ' + this.p.integralA.toFixed(2) + ' to ' + this.p.integralB.toFixed(2) + ' ≈ ' + integralVal.toFixed(4) + '</div>';
  }
  this.setFormula(formulaHtml);

  var chips = [
    { l: 'x', v: px.toFixed(3) },
    { l: 'f(x)', v: py.toFixed(3) }
  ];
  if (isFinite(slopeNow)) chips.push({ l: "f'(x)", v: slopeNow.toFixed(3) });
  if (isFinite(integralVal)) chips.push({ l: '∫f dx', v: integralVal.toFixed(3) });
  this.setLiveValues(chips);
};

FunctionGrapherSim.prototype.reset = function() {
  MathSimBase.prototype.reset.call(this);
  this.point.x = 1.5;
};
