/* ============================================================
   sims/conic-sections.js — Conic Sections
   Pick a conic type (Circle / Ellipse / Parabola / Hyperbola) or
   sweep the eccentricity e and watch the curve morph continuously
   through all four. We draw the focus (or foci), the directrix, and
   the geometric definition: the locus of points whose distance to
   the focus equals e times their distance to the directrix.

   Three example presets plus a continuous eccentricity sweep.
   ============================================================ */
function ConicSectionsSim(engine) {
  MathSimBase.call(this, engine);
  this.p = {
    eccentricity: 0.0,
    example: 'Circle'
  };
  /* We use the focus-directrix definition: pick focus F at (p, 0),
     directrix the vertical line x = -p (so p > 0). Then for any
     point (x, y) on the conic, sqrt((x-p)^2 + y^2) = e * |x + p|. */
  this.focusP = 2.5;
}
ConicSectionsSim.prototype = Object.create(MathSimBase.prototype);
ConicSectionsSim.prototype.constructor = ConicSectionsSim;

ConicSectionsSim.prototype._setup = function() {
  this.engine.setRange(-8, 8, -5, 5);
};

ConicSectionsSim.prototype._buildGui = function() {
  var self = this;
  this.gui = new lil.GUI({ title: 'Conic Sections', container: document.getElementById('gui-container'), width: 320 });
  this.gui.add(this.p, 'eccentricity', 0, 2, 0.05).name('Eccentricity (e)').listen();
  this.gui.add(this.p, 'example', ['Circle', 'Ellipse', 'Parabola', 'Hyperbola', 'Sweep e']).name('Example').onChange(function(v) {
    if (v === 'Circle')        self.p.eccentricity = 0.0;
    else if (v === 'Ellipse')  self.p.eccentricity = 0.6;
    else if (v === 'Parabola') self.p.eccentricity = 1.0;
    else if (v === 'Hyperbola')self.p.eccentricity = 1.4;
    /* Sweep e: leave it alone — update() will animate it */
    self.gui.controllers.forEach(function(c) { c.updateDisplay(); });
  });
};

ConicSectionsSim.prototype.update = function(t, dt) {
  if (!MathSimBase.prototype.update.call(this, t, dt)) return;

  /* Auto-sweep eccentricity for the "Sweep e" example */
  if (this.p.example === 'Sweep e') {
    this.p.eccentricity = 1.0 + 0.95 * Math.sin(this._st * 0.3);
  }

  var eng = this.engine;
  eng.clear();
  eng.drawGrid({ minorStep: 1, majorStep: 2 });
  eng.drawAxes({});

  var e = this.p.eccentricity;
  var p = this.focusP;

  /* === Directrix: vertical line x = -p === */
  eng.drawLine({ x: -p, y: eng.yMin }, { x: -p, y: eng.yMax }, { color: 'rgba(159,184,159,0.5)', lineWidth: 1.5, dash: [6, 4] });
  eng.drawText('directrix  x = ' + (-p).toFixed(1), { x: -p, y: eng.yMax - 0.3 }, { dx: -8, dy: -10, color: 'rgba(159,184,159,0.85)', align: 'right', font: 'italic 11px "IBM Plex Mono", monospace' });

  /* === Focus F at (p, 0) === */
  eng.drawPoint({ x: p, y: 0 }, { color: '#f0e19a', r: 7, glow: true });
  eng.drawText('F (' + p.toFixed(1) + ', 0)', { x: p, y: 0 }, { dx: 10, dy: -12, color: '#f0e19a', font: 'bold 12px "IBM Plex Mono", monospace' });

  /* === Compute the conic points using the focus-directrix definition ===
     For each x in the visible range, solve sqrt((x-p)^2 + y^2) = e * |x + p|
     → y^2 = e^2 (x+p)^2 - (x-p)^2
     → if RHS ≥ 0, y = ±sqrt(RHS) */
  var N = 600;
  var upper = [], lower = [];
  for (var i = 0; i <= N; i++) {
    var x = eng.xMin + (eng.xMax - eng.xMin) * i / N;
    var rhs = e * e * (x + p) * (x + p) - (x - p) * (x - p);
    if (rhs < 0) continue;
    var y = Math.sqrt(rhs);
    /* Clip very large y values (asymptotes) */
    if (y > 50) continue;
    upper.push({ x: x, y: y });
    lower.push({ x: x, y: -y });
  }

  /* === Draw the conic — chalk white, thick === */
  if (upper.length > 1) eng.drawPolyline(upper, { color: '#f5f5f0', lineWidth: 2.6 });
  if (lower.length > 1) eng.drawPolyline(lower, { color: '#f5f5f0', lineWidth: 2.6 });

  /* === For ellipse and hyperbola, draw the second focus ===
     For ellipse: second focus at (-p*(1-e^2)/(1+e^2)*... ) — easier: by symmetry
     of our setup (directrix at x=-p, focus at x=p), the second focus is at
     x = p*(1-e^2)/(1+e^2)... actually let's just compute it numerically:
     the centre is at x_c, the second focus is symmetric about the centre.
     For ellipse/hyperbola with our setup, the second focus is at:
       F2_x = -p * (1 - e^2) / (1 + e^2)... too messy.
     Simpler approach: show F2 only for ellipse and hyperbola using the
     standard formula. For e<1 (ellipse), 2nd focus at x = -p*(e^2)... */
  if (e > 0.05 && e < 1.95 && Math.abs(e - 1) > 0.05) {
    /* For our setup, centre is at C_x = -p*e^2/(1-e^2)*... let me just compute:
       Standard form: with focus at (p,0) and directrix x=-p, the conic is
       x^2/(a^2) ± y^2/b^2 = 1 where a = e*p/(1-e^2) (signed). The centre is
       at (a*e, 0) = (e^2 p/(1-e^2), 0)... let me just place F2 at (-p, 0)
       shifted: for ellipse (e<1) F2 is at (-p*e^2/(1-e^2) + 2*centre_x... */
    /* Cleaner: use the fact that the second focus is the reflection of F
       about the centre. Centre_x for our setup: */
    var a = e * p / Math.abs(1 - e * e);
    var centreX = a * e;  /* = e^2 p / (1-e^2) */
    var F2x = 2 * centreX - p;
    if (isFinite(F2x) && Math.abs(F2x) < eng.xMax) {
      eng.drawPoint({ x: F2x, y: 0 }, { color: '#f0e19a', r: 6, glow: true });
      eng.drawText("F'", { x: F2x, y: 0 }, { dx: 8, dy: -10, color: '#f0e19a', font: 'bold italic 12px "IBM Plex Mono", monospace' });
    }
  }

  /* === Title and parameter readout === */
  var conicName;
  if (e < 0.05) conicName = 'Circle (e = 0)';
  else if (e < 0.95) conicName = 'Ellipse (0 < e < 1)';
  else if (e < 1.05) conicName = 'Parabola (e = 1)';
  else conicName = 'Hyperbola (e > 1)';
  eng.drawText(conicName, { x: 0, y: eng.yMax - 0.4 }, { dx: 0, dy: 0, color: '#f0c4d4', align: 'center', font: 'bold 13px "IBM Plex Mono", monospace' });

  /* === Analysis panel === */
  this.setOverlay(
    'A <b>conic section</b> is the locus of points whose distance to a focus <b>F</b> equals <b>e</b> times ' +
    'their distance to a fixed line (the <b>directrix</b>). The eccentricity <b>e</b> determines the shape: ' +
    '<br>• e = 0 → <b>Circle</b>' +
    '<br>• 0 < e < 1 → <b>Ellipse</b> (two foci, two directrices)' +
    '<br>• e = 1 → <b>Parabola</b> (one focus, one directrix)' +
    '<br>• e > 1 → <b>Hyperbola</b> (two branches, two foci)' +
    '<br><br>Use the eccentricity slider or pick an example. The "Sweep e" example animates e from 0.05 to 1.95 continuously so the class can watch the morph.'
  );
  this.setFormula(
    '<div class="formula-block"><div class="formula-label">Focus-Directrix Definition</div>' +
    'PF = e · PM<br>' +
    'where F = (' + p.toFixed(2) + ', 0) and directrix is x = ' + (-p).toFixed(2) + '</div>' +
    '<div class="formula-block"><div class="formula-label">Cartesian Equation</div>' +
    '√((x − p)² + y²) = e · |x + p|<br>' +
    '⇒ y² = e²(x + p)² − (x − p)²</div>' +
    '<div class="formula-block"><div class="formula-label">Current Conic</div>' +
    conicName + '<br>' +
    'Eccentricity: e = ' + e.toFixed(3) + '</div>'
  );
  this.setLiveValues([
    { l: 'e', v: e.toFixed(3) },
    { l: 'p', v: p.toFixed(2) },
    { l: 'type', v: conicName.split(' (')[0] }
  ]);
};

ConicSectionsSim.prototype.reset = function() {
  MathSimBase.prototype.reset.call(this);
  /* Re-apply the current example's eccentricity */
  var v = this.p.example;
  if (v === 'Circle')        this.p.eccentricity = 0.0;
  else if (v === 'Ellipse')  this.p.eccentricity = 0.6;
  else if (v === 'Parabola') this.p.eccentricity = 1.0;
  else if (v === 'Hyperbola')this.p.eccentricity = 1.4;
};
