/* ============================================================
   sims/vector-addition.js — 2D Vector Addition
   Two draggable vectors a (chalk white) and b (yellow chalk)
   anchored at the origin. We show:
     • the parallelogram method (dashed parallelogram + resultant)
     • the triangle / head-to-tail method (b shifted to tip of a)
     • component form, magnitude, and angle of each vector and of a+b
   Three example presets cover the classic teaching cases.
   ============================================================ */
function VectorAdditionSim(engine) {
  MathSimBase.call(this, engine);
  this.p = {
    showParallelogram: true,
    showTriangle: true,
    showComponents: false,
    example: 'General case'
  };
  /* Vector endpoints (the head; tail is always origin) */
  this.a = { x: 4, y: 2 };
  this.b = { x: 1, y: 4 };
}
VectorAdditionSim.prototype = Object.create(MathSimBase.prototype);
VectorAdditionSim.prototype.constructor = VectorAdditionSim;

VectorAdditionSim.prototype._setup = function() {
  this.engine.setRange(-2, 8, -2, 7);
  var self = this;
  /* Handle for vector a (chalk white) */
  this.engine.addHandle(this.a.x, this.a.y, {
    color: '#f5f5f0',
    fillColor: 'rgba(245,245,240,0.18)',
    r: 14,
    label: 'a',
    onDrag: function(wx, wy) { self.a.x = wx; self.a.y = wy; }
  });
  /* Handle for vector b (yellow chalk) */
  this.engine.addHandle(this.b.x, this.b.y, {
    color: '#f0e19a',
    fillColor: 'rgba(240,225,154,0.20)',
    r: 14,
    label: 'b',
    onDrag: function(wx, wy) { self.b.x = wx; self.b.y = wy; }
  });
};

VectorAdditionSim.prototype._buildGui = function() {
  this.gui = new lil.GUI({ title: 'Vector Addition', container: document.getElementById('gui-container'), width: 320 });
  this.gui.add(this.p, 'showParallelogram').name('Parallelogram method');
  this.gui.add(this.p, 'showTriangle').name('Triangle method');
  this.gui.add(this.p, 'showComponents').name('Show components');
  var self = this;
  this.gui.add(this.p, 'example', ['General case', 'Perpendicular', 'Decomposition', 'Opposite vectors']).name('Example').onChange(function(v) {
    self._applyExample(v);
  });
};

VectorAdditionSim.prototype._applyExample = function(name) {
  if (name === 'General case')   { this.a.x = 4; this.a.y = 2; this.b.x = 1; this.b.y = 4; }
  else if (name === 'Perpendicular') { this.a.x = 5; this.a.y = 0; this.b.x = 0; this.b.y = 4; }
  else if (name === 'Decomposition') { this.a.x = 4; this.a.y = 0; this.b.x = 0; this.b.y = 3; }
  else if (name === 'Opposite vectors') { this.a.x = 4; this.a.y = 1; this.b.x = -4; this.b.y = -1; }
  /* Sync the handles */
  if (this.engine.handles[0]) { this.engine.handles[0].x = this.a.x; this.engine.handles[0].y = this.a.y; }
  if (this.engine.handles[1]) { this.engine.handles[1].x = this.b.x; this.engine.handles[1].y = this.b.y; }
};

VectorAdditionSim.prototype.update = function(t, dt) {
  if (!MathSimBase.prototype.update.call(this, t, dt)) return;

  var eng = this.engine;
  eng.clear();
  eng.drawGrid({ minorStep: 1, majorStep: 2 });
  eng.drawAxes({});

  var ax = this.a.x, ay = this.a.y;
  var bx = this.b.x, by = this.b.y;
  var rx = ax + bx, ry = ay + by;  /* resultant a + b */

  /* === Component lines (optional, very faded) === */
  if (this.p.showComponents) {
    eng.drawLine({ x: 0, y: 0 }, { x: ax, y: 0 }, { color: 'rgba(245,245,240,0.3)', lineWidth: 1, dash: [3, 3] });
    eng.drawLine({ x: ax, y: 0 }, { x: ax, y: ay }, { color: 'rgba(245,245,240,0.3)', lineWidth: 1, dash: [3, 3] });
    eng.drawLine({ x: 0, y: 0 }, { x: 0, y: by }, { color: 'rgba(240,225,154,0.3)', lineWidth: 1, dash: [3, 3] });
    eng.drawLine({ x: 0, y: by }, { x: bx, y: by }, { color: 'rgba(240,225,154,0.3)', linewidth: 1, dash: [3, 3] });
  }

  /* === Parallelogram method === */
  if (this.p.showParallelogram) {
    /* Dashed lines completing the parallelogram */
    eng.drawLine({ x: ax, y: ay }, { x: rx, y: ry }, { color: 'rgba(240,225,154,0.55)', lineWidth: 1.4, dash: [5, 4] });
    eng.drawLine({ x: bx, y: by }, { x: rx, y: ry }, { color: 'rgba(245,245,240,0.55)', lineWidth: 1.4, dash: [5, 4] });
    /* Faint fill of the parallelogram */
    eng.fillRegion(
      [{ x: 0, y: 0 }, { x: ax, y: ay }, { x: rx, y: ry }, { x: bx, y: by }],
      { color: 'rgba(159,184,159,0.10)' }
    );
  }

  /* === Triangle method (head-to-tail) ===
     Shift b to start at the tip of a (so it's the vector a→a+b). */
  if (this.p.showTriangle) {
    eng.drawVector({ x: ax, y: ay }, { x: rx, y: ry }, { color: 'rgba(240,225,154,0.7)', lineWidth: 2, opacity: 0.85 });
    eng.drawText("b (shifted)", { x: (ax + rx) / 2, y: (ay + ry) / 2 }, { dx: 8, dy: -8, color: 'rgba(240,225,154,0.85)', font: 'italic 11px "IBM Plex Mono", monospace' });
  }

  /* === The two source vectors a and b === */
  eng.drawVector({ x: 0, y: 0 }, { x: ax, y: ay }, { color: '#f5f5f0', lineWidth: 2.8 });
  eng.drawVector({ x: 0, y: 0 }, { x: bx, y: by }, { color: '#f0e19a', lineWidth: 2.8 });

  /* === The resultant a + b — pink chalk, thicker === */
  eng.drawVector({ x: 0, y: 0 }, { x: rx, y: ry }, { color: '#f0c4d4', lineWidth: 3.2 });
  eng.drawText('a + b', { x: rx, y: ry }, { dx: 12, dy: -12, color: '#f0c4d4', font: 'bold 13px "IBM Plex Mono", monospace' });

  /* === Labels on a and b === */
  eng.drawText('a', { x: ax / 2, y: ay / 2 }, { dx: -12, dy: -8, color: '#f5f5f0', font: 'bold italic 13px "IBM Plex Mono", monospace' });
  eng.drawText('b', { x: bx / 2, y: by / 2 }, { dx: -12, dy: -8, color: '#f0e19a', font: 'bold italic 13px "IBM Plex Mono", monospace' });

  /* Draw the draggable handles on top */
  eng.drawHandles();

  /* === Analysis panel === */
  var aMag = Math.sqrt(ax * ax + ay * ay);
  var bMag = Math.sqrt(bx * bx + by * by);
  var rMag = Math.sqrt(rx * rx + ry * ry);
  var aAng = Math.atan2(ay, ax) * 180 / Math.PI;
  var bAng = Math.atan2(by, bx) * 180 / Math.PI;
  var rAng = Math.atan2(ry, rx) * 180 / Math.PI;
  /* Angle between a and b */
  var dot = ax * bx + ay * by;
  var cosTheta = dot / (aMag * bMag + EPS);
  var angleBetween = Math.acos(clamp(cosTheta, -1, 1)) * 180 / Math.PI;

  this.setOverlay(
    'Drag the chalk-white handle <b>a</b> and the yellow handle <b>b</b> to set the two vectors. ' +
    'The pink arrow is their sum <b>a + b</b>. ' +
    'The <b>parallelogram method</b> (dashed) completes the parallelogram; the diagonal from the origin is the resultant. ' +
    'The <b>triangle method</b> shifts b to the tip of a (head-to-tail), and the resultant goes from origin to the new tip. ' +
    'Both methods give the same answer — that is the geometric meaning of vector addition.'
  );
  this.setFormula(
    '<div class="formula-block"><div class="formula-label">Component Form</div>' +
    'a = (' + ax.toFixed(2) + ', ' + ay.toFixed(2) + ')<br>' +
    'b = (' + bx.toFixed(2) + ', ' + by.toFixed(2) + ')<br>' +
    'a + b = (' + rx.toFixed(2) + ', ' + ry.toFixed(2) + ')</div>' +
    '<div class="formula-block"><div class="formula-label">Magnitude & Direction</div>' +
    '|a| = ' + aMag.toFixed(3) + ', θ_a = ' + aAng.toFixed(1) + '°<br>' +
    '|b| = ' + bMag.toFixed(3) + ', θ_b = ' + bAng.toFixed(1) + '°<br>' +
    '|a+b| = ' + rMag.toFixed(3) + ', θ_{a+b} = ' + rAng.toFixed(1) + '°</div>' +
    '<div class="formula-block"><div class="formula-label">Angle Between a and b</div>' +
    'a · b = ' + dot.toFixed(3) + '<br>' +
    'cos θ = (a · b) / (|a| |b|) = ' + cosTheta.toFixed(4) + '<br>' +
    'θ = ' + angleBetween.toFixed(2) + '°</div>'
  );
  this.setLiveValues([
    { l: '|a|', v: aMag.toFixed(2) },
    { l: '|b|', v: bMag.toFixed(2) },
    { l: '|a+b|', v: rMag.toFixed(2) },
    { l: '∠(a,b)', v: angleBetween.toFixed(1) + '°' }
  ]);
};

VectorAdditionSim.prototype.reset = function() {
  MathSimBase.prototype.reset.call(this);
  this._applyExample(this.p.example);
};
