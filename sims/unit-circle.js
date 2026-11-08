/* ============================================================
   sims/unit-circle.js — Unit Circle & Trigonometry
   A point moves around the unit circle (left half of the canvas);
   to its right, the sine and cosine waves are drawn live as the
   point sweeps, so the teacher can show students where sin and
   cos actually come from geometrically.

   3 example presets:
     • Sine derivation  — point moves CCW, sin wave builds up
     • Cosine derivation — same motion, cos wave highlighted
     • Reference angles — paused at 30°/45°/60° showing the
       right triangle inside the circle
   ============================================================ */
function UnitCircleSim(engine) {
  MathSimBase.call(this, engine);
  this.p = {
    speed: 1.0,
    showSin: true,
    showCos: true,
    paused: false,
    example: 'Sine derivation'
  };
  this.theta = 0;       /* current angle (radians) */
  this.trail = [];      /* accumulated wave points */
  this.MAXTRAIL = 600;
}
UnitCircleSim.prototype = Object.create(MathSimBase.prototype);
UnitCircleSim.prototype.constructor = UnitCircleSim;

UnitCircleSim.prototype._setup = function() {
  /* The world spans the circle on the left and the wave on the right.
     We'll use one wide coordinate system: x ∈ [-3.5, 10], y ∈ [-2.5, 2.5].
     Circle is centred at (-1, 0) with radius 1.5; the wave is drawn
     from x=1 onwards, with the wave parameter being the angle θ. */
  this.engine.setRange(-3.5, 10, -2.5, 2.5);
  this.theta = 0;
  this.trail = [];
};

UnitCircleSim.prototype._buildGui = function() {
  var self = this;
  this.gui = new lil.GUI({ title: 'Unit Circle & Trigonometry', container: document.getElementById('gui-container'), width: 320 });
  this.gui.add(this.p, 'speed', -3, 3, 0.05).name('Angular Speed ω');
  this.gui.add(this.p, 'showSin').name('Show sin(θ)');
  this.gui.add(this.p, 'showCos').name('Show cos(θ)');
  this.gui.add(this.p, 'example', ['Sine derivation', 'Cosine derivation', 'Reference angles']).name('Example').onChange(function(v) {
    self.theta = 0;
    self.trail = [];
    if (v === 'Reference angles') {
      self.p.paused = true;
    } else {
      self.p.paused = false;
    }
  });
  this.gui.add(this.p, 'paused').name('Pause rotation').listen();
};

UnitCircleSim.prototype.update = function(t, dt) {
  if (!MathSimBase.prototype.update.call(this, t, dt)) return;

  /* Advance theta unless paused or in reference-angles example */
  if (!this.p.paused) {
    this.theta += this.p.speed * dt;
  }

  var eng = this.engine;
  eng.clear();
  eng.drawGrid({ minorStep: 0.5, majorStep: 1 });
  eng.drawAxes({});

  /* === Layout constants ===
     Circle: centre (-1, 0), radius 1.5
     Wave:   x from 1.5 to 9.5, y = ±1.5 mapping to sin/cos
     The wave's "x" axis is the angle θ, scaled by 1.5/π so that
     a full 2π rotation spans about 3 units. */
  var cCx = -1, cCy = 0, cR = 1.5;
  var waveX0 = 1.5, waveXMax = 9.5;
  var waveScale = 1.5 / Math.PI;  /* radians → world-x */

  /* === 1) Unit circle === */
  eng.drawCircle({ x: cCx, y: cCy }, cR, { color: 'rgba(245,245,240,0.55)', lineWidth: 2 });

  /* Reference-angle triangles for the 30°/45°/60° example */
  if (this.p.example === 'Reference angles') {
    var angles = [Math.PI/6, Math.PI/4, Math.PI/3];
    var colors = ['#f0e19a', '#9fb89f', '#f0c4d4'];
    for (var i = 0; i < angles.length; i++) {
      var a = angles[i];
      var px = cCx + cR * Math.cos(a);
      var py = cCy + cR * Math.sin(a);
      /* Triangle: centre, point on circle, dropped to x-axis */
      eng.fillRegion([
        { x: cCx, y: cCy },
        { x: px, y: py },
        { x: px, y: cCy }
      ], { color: colors[i], opacity: 0.18 });
      eng.drawLine({ x: cCx, y: cCy }, { x: px, y: py }, { color: colors[i], lineWidth: 1.5 });
      eng.drawLine({ x: px, y: py }, { x: px, y: cCy }, { color: colors[i], lineWidth: 1.5, dash: [3, 3] });
      eng.drawText((a * 180 / Math.PI).toFixed(0) + '°', { x: (cCx + px) / 2, y: cCy - 0.25 }, { color: colors[i], align: 'center', font: 'bold 11px "IBM Plex Mono", monospace' });
    }
  }

  /* === 2) The moving point on the circle === */
  var ptX = cCx + cR * Math.cos(this.theta);
  var ptY = cCy + cR * Math.sin(this.theta);
  eng.drawLine({ x: cCx, y: cCy }, { x: ptX, y: ptY }, { color: '#f5f5f0', lineWidth: 1.5 });
  /* Drop a vertical line from the point to the x-axis (the "sine" leg) */
  eng.drawLine({ x: ptX, y: ptY }, { x: ptX, y: cCy }, { color: '#f0e19a', lineWidth: 2.5 });
  /* Horizontal line from the point to the y-axis (the "cosine" leg) */
  eng.drawLine({ x: cCx, y: cCy }, { x: cCx, y: ptY }, { color: '#9fb89f', lineWidth: 1.5, opacity: 0.6 });
  eng.drawPoint({ x: ptX, y: ptY }, { color: '#f5f5f0', r: 6, glow: true });

  /* === 3) Connector from circle point to the start of the wave === */
  var waveStartX = waveX0;
  var waveStartY = ptY;  /* same y as the circle point */
  eng.drawLine({ x: ptX, y: ptY }, { x: waveStartX, y: waveStartY }, { color: 'rgba(240,225,154,0.35)', lineWidth: 1, dash: [3, 3] });

  /* === 4) Wave axis (horizontal line at y=0 from waveStartX to waveXMax) === */
  eng.drawLine({ x: waveX0, y: 0 }, { x: waveXMax, y: 0 }, { color: 'rgba(245,245,240,0.4)', lineWidth: 1 });

  /* === 5) Accumulate trail of (theta, sin(theta)) points === */
  /* Convert theta to wave-x: waveX = waveX0 + theta * waveScale, wrap modulo (waveXMax - waveX0) */
  var wrapSpan = waveXMax - waveX0;
  var waveX = waveX0 + ((this.theta * waveScale) % wrapSpan + wrapSpan) % wrapSpan;
  this.trail.push({ x: waveX, y: ptY - cCy, theta: this.theta });
  if (this.trail.length > this.MAXTRAIL) this.trail.shift();

  /* === 6) Draw the sin wave (yellow chalk) ===
     The trail's y is the value (sin or cos), but we need to map it
     to the world coordinate: worldY = sin(theta) * cR (since the
     circle's radius is cR). The ptY already includes cCy offset;
     ptY - cCy = cR*sin(theta). So worldY on the wave = (ptY - cCy).
     But we want it scaled to ±1.5, and ptY-cCy already is ±1.5.
     So worldY = trail[i].y where trail[i].y was stored as ptY - cCy. */
  if (this.p.showSin) {
    var sinPts = [];
    for (var i = 0; i < this.trail.length; i++) {
      sinPts.push({ x: this.trail[i].x, y: this.trail[i].y });
    }
    if (sinPts.length > 1) eng.drawPolyline(sinPts, { color: '#f0e19a', lineWidth: 2.4 });
    /* Current point on the wave */
    eng.drawPoint({ x: waveX, y: ptY - cCy }, { color: '#f0e19a', r: 5, glow: true });
  }

  /* === 7) Draw the cos wave (faded green chalk) ===
     For cos, the y-value is cR*cos(theta) which equals (ptX - cCx). */
  if (this.p.showCos) {
    var cosPts = [];
    for (var i = 0; i < this.trail.length; i++) {
      var cosVal = cR * Math.cos(this.trail[i].theta);
      cosPts.push({ x: this.trail[i].x, y: cosVal });
    }
    if (cosPts.length > 1) eng.drawPolyline(cosPts, { color: '#9fb89f', lineWidth: 2, opacity: 0.85 });
  }

  /* === 8) Labels === */
  eng.drawText('Unit Circle', { x: cCx, y: cCy + cR + 0.35 }, { align: 'center', color: 'rgba(245,245,240,0.7)', font: 'bold 11px "IBM Plex Mono", monospace' });
  eng.drawText('sin(θ)', { x: waveX0 + 0.2, y: 1.65 }, { color: '#f0e19a', font: 'bold 12px "IBM Plex Mono", monospace' });
  if (this.p.showCos) eng.drawText('cos(θ)', { x: waveX0 + 0.2, y: -1.65 }, { color: '#9fb89f', font: 'bold 12px "IBM Plex Mono", monospace' });
  eng.drawText('θ = ' + (this.theta * 180 / Math.PI).toFixed(1) + '°', { x: ptX, y: ptY }, { dx: 12, dy: -12, color: '#f5f5f0', font: 'bold 12px "IBM Plex Mono", monospace' });

  /* === Analysis panel === */
  var sinV = Math.sin(this.theta);
  var cosV = Math.cos(this.theta);
  this.setOverlay(
    'The point travels around the unit circle. Its <span style="color:#f0e19a">y-coordinate is sin(θ)</span> (the yellow vertical drop) ' +
    'and its <span style="color:#9fb89f">x-coordinate is cos(θ)</span> (the green horizontal leg). ' +
    'As θ increases, the wave on the right builds up by plotting (θ, sin θ) — this is where the sine curve <i>comes from</i>. ' +
    'Try the Reference Angles example to see the special triangles 30°/45°/60°.'
  );
  this.setFormula(
    '<div class="formula-block"><div class="formula-label">Unit Circle Definitions</div>' +
    'x = cos(θ)<br>y = sin(θ)<br>x² + y² = 1</div>' +
    '<div class="formula-block"><div class="formula-label">Pythagorean Identity</div>' +
    'sin²(θ) + cos²(θ) = 1</div>'
  );
  this.setLiveValues([
    { l: 'θ (deg)', v: (this.theta * 180 / Math.PI).toFixed(1) + '°' },
    { l: 'θ (rad)', v: this.theta.toFixed(3) },
    { l: 'sin(θ)', v: sinV.toFixed(4) },
    { l: 'cos(θ)', v: cosV.toFixed(4) }
  ]);
};

UnitCircleSim.prototype.reset = function() {
  MathSimBase.prototype.reset.call(this);
  this.theta = 0;
  this.trail = [];
};
