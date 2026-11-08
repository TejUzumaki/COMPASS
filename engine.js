/* ============================================================
   engine.js — COMPASS Core Engine
   Two engines in one file:
     • LabEngine3D  — Three.js scene for 3D maths (vectors in 3D,
                      planes, cross product, matrix transforms, surfaces)
     • Graph2DEngine — Canvas2D plotter for 2D maths (functions,
                      vectors, conics, derivatives, Riemann sums)
   MathSimBase is the common lifecycle both engine types use.
   Chalkboard palette throughout.
   ============================================================ */
'use strict';
var PI = Math.PI, TAU = PI * 2, EPS = 1e-9;
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

/* === COMPASS material + quality library ===
   Chalkboard palette: deep green board, chalk-white accents,
   faded green secondary, yellow chalk for warmth, pink chalk
   for tertiary highlights. */
var COMPASS = {
  /* Chalkboard palette as JS values (for canvas/Three.js) */
  palette: {
    bgDeep:    0x07150e,
    bgMid:     0x0f2a1f,
    bgBright:  0x1a4a2a,
    chalk:     0xf5f5f0,
    chalkDim:  0xc4d4c4,
    yellow:    0xf0e19a,
    green:     0x9fb89f,
    pink:      0xf0c4d4
  },
  quality: {
    sphereHigh: [64, 32],
    sphereMid:  [32, 16],
    sphereLow:  [16, 8]
  },
  materials: {
    metalPolished: function(c) {
      return new THREE.MeshStandardMaterial({
        color: c || 0xffffff, metalness: 0.9, roughness: 0.15, envMapIntensity: 1.0
      });
    },
    metalBrushed: function(c) {
      return new THREE.MeshStandardMaterial({
        color: c || 0xffffff, metalness: 0.6, roughness: 0.4, envMapIntensity: 0.8
      });
    },
    plastic: function(c) {
      return new THREE.MeshStandardMaterial({
        color: c || 0xffffff, metalness: 0.0, roughness: 0.5, envMapIntensity: 0.3
      });
    },
    emissive: function(c, i) {
      return new THREE.MeshStandardMaterial({
        color: c, emissive: c, emissiveIntensity: i || 0.5, metalness: 0.0, roughness: 0.3
      });
    }
  }
};

/* ============================================================
   Graph2DEngine — Canvas2D plotter for 2D mathematics
   Provides chalk-stroke rendering of axes, grid, functions,
   vectors, conics, points, and interactive draggable handles.
   ============================================================ */
function Graph2DEngine(containerId) {
  this.type = '2d';
  this.el = document.getElementById(containerId);
  this.w = this.el.clientWidth;
  this.h = this.el.clientHeight;
  this.activeSim = null;

  this.canvas = document.createElement('canvas');
  this._resize();
  this.canvas.style.touchAction = 'none';
  this.canvas.style.display = 'block';
  this.el.appendChild(this.canvas);
  this.ctx = this.canvas.getContext('2d');

  /* World coordinate ranges (default; sims override via setRange) */
  this.xMin = -10; this.xMax = 10;
  this.yMin = -6;  this.yMax = 6;
  this.padding = 40;  /* px padding for axis labels */

  /* Draggable handles */
  this.handles = [];
  this.activeHandle = null;
  this.hoverHandle = null;

  /* Pointer event handlers (bound once) */
  this._onPointerDown = this._handlePointerDown.bind(this);
  this._onPointerMove = this._handlePointerMove.bind(this);
  this._onPointerUp = this._handlePointerUp.bind(this);
  this.canvas.addEventListener('pointerdown', this._onPointerDown);
  this.canvas.addEventListener('pointermove', this._onPointerMove);
  window.addEventListener('pointerup', this._onPointerUp);

  /* Resize listener */
  var self = this;
  this._resizeListener = function() { self._resize(); if (self.activeSim && self.activeSim.onResize) self.activeSim.onResize(); };
  window.addEventListener('resize', this._resizeListener);
}

Graph2DEngine.prototype._resize = function() {
  this.w = this.el.clientWidth;
  this.h = this.el.clientHeight;
  var dpr = window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio;
  this.canvas.width = Math.round(this.w * dpr);
  this.canvas.height = Math.round(this.h * dpr);
  this.canvas.style.width = this.w + 'px';
  this.canvas.style.height = this.h + 'px';
  this.dpr = dpr;
};

/* World ↔ screen coordinate transforms */
Graph2DEngine.prototype.w2sx = function(x) {
  var left = this.padding;
  var right = this.w - this.padding;
  return left + (x - this.xMin) / (this.xMax - this.xMin) * (right - left);
};
Graph2DEngine.prototype.w2sy = function(y) {
  var top = this.padding;
  var bottom = this.h - this.padding;
  return bottom - (y - this.yMin) / (this.yMax - this.yMin) * (bottom - top);
};
Graph2DEngine.prototype.s2wx = function(sx) {
  var left = this.padding;
  var right = this.w - this.padding;
  return this.xMin + (sx - left) / (right - left) * (this.xMax - this.xMin);
};
Graph2DEngine.prototype.s2wy = function(sy) {
  var top = this.padding;
  var bottom = this.h - this.padding;
  return this.yMin + (bottom - sy) / (bottom - top) * (this.yMax - this.yMin);
};
Graph2DEngine.prototype.setRange = function(xMin, xMax, yMin, yMax) {
  this.xMin = xMin; this.xMax = xMax; this.yMin = yMin; this.yMax = yMax;
};

/* === Pointer interaction (draggable handles) === */
Graph2DEngine.prototype._handlePointerDown = function(e) {
  var rect = this.canvas.getBoundingClientRect();
  var sx = e.clientX - rect.left;
  var sy = e.clientY - rect.top;
  /* Find the closest handle within its hit radius */
  var hit = null;
  for (var i = this.handles.length - 1; i >= 0; i--) {
    var h = this.handles[i];
    var hx = this.w2sx(h.x);
    var hy = this.w2sy(h.y);
    var dx = sx - hx, dy = sy - hy;
    if (dx*dx + dy*dy <= h.r * h.r) { hit = h; break; }
  }
  if (hit) {
    this.activeHandle = hit;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  }
};
Graph2DEngine.prototype._handlePointerMove = function(e) {
  if (!this.activeHandle) return;
  var rect = this.canvas.getBoundingClientRect();
  var sx = e.clientX - rect.left;
  var sy = e.clientY - rect.top;
  var wx = this.s2wx(sx);
  var wy = this.s2wy(sy);
  /* Apply constraint function if provided */
  if (this.activeHandle.constrain) {
    var c = this.activeHandle.constrain(wx, wy);
    wx = c.x; wy = c.y;
  }
  this.activeHandle.x = wx;
  this.activeHandle.y = wy;
  if (this.activeHandle.onDrag) this.activeHandle.onDrag(wx, wy);
  e.preventDefault();
};
Graph2DEngine.prototype._handlePointerUp = function(e) {
  if (this.activeHandle) {
    this.activeHandle = null;
    e.preventDefault();
  }
};

Graph2DEngine.prototype.addHandle = function(worldX, worldY, opts) {
  opts = opts || {};
  var handle = {
    x: worldX, y: worldY,
    r: opts.r || 14,
    color: opts.color || '#f5f5f0',
    fillColor: opts.fillColor || 'rgba(245,245,240,0.18)',
    label: opts.label || '',
    constrain: opts.constrain || null,
    onDrag: opts.onDrag || null,
    visible: opts.visible !== false
  };
  this.handles.push(handle);
  return handle;
};
Graph2DEngine.prototype.removeHandle = function(handle) {
  var i = this.handles.indexOf(handle);
  if (i > -1) this.handles.splice(i, 1);
};
Graph2DEngine.prototype.clearHandles = function() { this.handles = []; this.activeHandle = null; };

/* === Drawing primitives (chalk-stroke style) === */
Graph2DEngine.prototype.clear = function() {
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.clearRect(0, 0, this.w, this.h);
  /* Paint the radial chalkboard spotlight behind everything */
  var grad = this.ctx.createRadialGradient(
    this.w * 0.5, this.h * 0.45, 0,
    this.w * 0.5, this.h * 0.45, Math.max(this.w, this.h) * 0.75
  );
  grad.addColorStop(0,    '#1a4a2a');
  grad.addColorStop(0.45, '#0f2a1f');
  grad.addColorStop(1,    '#07150e');
  this.ctx.fillStyle = grad;
  this.ctx.fillRect(0, 0, this.w, this.h);
  this.ctx.restore();
};

Graph2DEngine.prototype.drawGrid = function(opts) {
  opts = opts || {};
  var minorStep = opts.minorStep || 1;
  var majorStep = opts.majorStep || 5;
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

  /* Minor lines */
  this.ctx.strokeStyle = 'rgba(159,184,159,0.06)';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  for (var x = Math.ceil(this.xMin / minorStep) * minorStep; x <= this.xMax; x += minorStep) {
    var sx = this.w2sx(x);
    this.ctx.moveTo(sx, this.w2sy(this.yMin));
    this.ctx.lineTo(sx, this.w2sy(this.yMax));
  }
  for (var y = Math.ceil(this.yMin / minorStep) * minorStep; y <= this.yMax; y += minorStep) {
    var sy = this.w2sy(y);
    this.ctx.moveTo(this.w2sx(this.xMin), sy);
    this.ctx.lineTo(this.w2sx(this.xMax), sy);
  }
  this.ctx.stroke();

  /* Major lines */
  this.ctx.strokeStyle = 'rgba(159,184,159,0.14)';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  for (var x = Math.ceil(this.xMin / majorStep) * majorStep; x <= this.xMax; x += majorStep) {
    var sx = this.w2sx(x);
    this.ctx.moveTo(sx, this.w2sy(this.yMin));
    this.ctx.lineTo(sx, this.w2sy(this.yMax));
  }
  for (var y = Math.ceil(this.yMin / majorStep) * majorStep; y <= this.yMax; y += majorStep) {
    var sy = this.w2sy(y);
    this.ctx.moveTo(this.w2sx(this.xMin), sy);
    this.ctx.lineTo(this.w2sx(this.xMax), sy);
  }
  this.ctx.stroke();
  this.ctx.restore();
};

Graph2DEngine.prototype.drawAxes = function(opts) {
  opts = opts || {};
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.strokeStyle = opts.color || 'rgba(245,245,240,0.55)';
  this.ctx.lineWidth = opts.lineWidth || 1.5;
  this.ctx.fillStyle = opts.labelColor || 'rgba(245,245,240,0.5)';
  this.ctx.font = '11px "IBM Plex Mono", monospace';

  /* X axis */
  var y0 = this.w2sy(0);
  var xLeft = this.w2sx(this.xMin);
  var xRight = this.w2sx(this.xMax);
  if (y0 >= this.padding && y0 <= this.h - this.padding) {
    this.ctx.beginPath();
    this.ctx.moveTo(xLeft, y0);
    this.ctx.lineTo(xRight, y0);
    this.ctx.stroke();
    /* Arrowhead at +x */
    this.ctx.beginPath();
    this.ctx.moveTo(xRight, y0);
    this.ctx.lineTo(xRight - 8, y0 - 4);
    this.ctx.lineTo(xRight - 8, y0 + 4);
    this.ctx.closePath();
    this.ctx.fill();
    /* Tick labels */
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    for (var x = Math.ceil(this.xMin); x <= this.xMax; x++) {
      if (x === 0) continue;
      var sx = this.w2sx(x);
      if (sx < this.padding || sx > this.w - this.padding) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, y0 - 3);
      this.ctx.lineTo(sx, y0 + 3);
      this.ctx.stroke();
      if (x % 2 === 0) this.ctx.fillText(String(x), sx, y0 + 6);
    }
    /* Axis label */
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.font = 'italic 13px "IBM Plex Mono", monospace';
    this.ctx.fillStyle = opts.labelColor || 'rgba(245,245,240,0.85)';
    this.ctx.fillText('x', xRight - 4, y0 - 4);
  }

  /* Y axis */
  var x0 = this.w2sx(0);
  var yTop = this.w2sy(this.yMax);
  var yBottom = this.w2sy(this.yMin);
  if (x0 >= this.padding && x0 <= this.w - this.padding) {
    this.ctx.beginPath();
    this.ctx.moveTo(x0, yTop);
    this.ctx.lineTo(x0, yBottom);
    this.ctx.stroke();
    /* Arrowhead at +y */
    this.ctx.beginPath();
    this.ctx.moveTo(x0, yTop);
    this.ctx.lineTo(x0 - 4, yTop + 8);
    this.ctx.lineTo(x0 + 4, yTop + 8);
    this.ctx.closePath();
    this.ctx.fill();
    /* Tick labels */
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = '11px "IBM Plex Mono", monospace';
    this.ctx.fillStyle = opts.labelColor || 'rgba(245,245,240,0.5)';
    for (var y = Math.ceil(this.yMin); y <= this.yMax; y++) {
      if (y === 0) continue;
      var sy = this.w2sy(y);
      if (sy < this.padding || sy > this.h - this.padding) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x0 - 3, sy);
      this.ctx.lineTo(x0 + 3, sy);
      this.ctx.stroke();
      if (y % 2 === 0) this.ctx.fillText(String(y), x0 - 6, sy);
    }
    /* Axis label */
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = 'italic 13px "IBM Plex Mono", monospace';
    this.ctx.fillStyle = opts.labelColor || 'rgba(245,245,240,0.85)';
    this.ctx.fillText('y', x0 + 4, yTop + 4);
  }

  /* Origin label */
  if (x0 >= this.padding && x0 <= this.w - this.padding &&
      y0 >= this.padding && y0 <= this.h - this.padding) {
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '10px "IBM Plex Mono", monospace';
    this.ctx.fillStyle = 'rgba(245,245,240,0.4)';
    this.ctx.fillText('0', x0 - 4, y0 + 4);
  }

  this.ctx.restore();
};

Graph2DEngine.prototype.drawLine = function(p1, p2, opts) {
  opts = opts || {};
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.strokeStyle = opts.color || '#f5f5f0';
  this.ctx.lineWidth = opts.lineWidth || 2;
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  if (opts.dash) this.ctx.setLineDash(opts.dash);
  this.ctx.beginPath();
  this.ctx.moveTo(this.w2sx(p1.x), this.w2sy(p1.y));
  this.ctx.lineTo(this.w2sx(p2.x), this.w2sy(p2.y));
  this.ctx.stroke();
  this.ctx.restore();
};

Graph2DEngine.prototype.drawPolyline = function(points, opts) {
  if (!points.length) return;
  opts = opts || {};
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.strokeStyle = opts.color || '#f5f5f0';
  this.ctx.lineWidth = opts.lineWidth || 2;
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  if (opts.dash) this.ctx.setLineDash(opts.dash);
  this.ctx.beginPath();
  this.ctx.moveTo(this.w2sx(points[0].x), this.w2sy(points[0].y));
  for (var i = 1; i < points.length; i++) {
    this.ctx.lineTo(this.w2sx(points[i].x), this.w2sy(points[i].y));
  }
  this.ctx.stroke();
  this.ctx.restore();
};

/* Sample a function fn(x) over [xMin, xMax] at N points and draw it.
   opts: { color, lineWidth, opacity, N } */
Graph2DEngine.prototype.drawFunction = function(fn, opts) {
  opts = opts || {};
  var N = opts.N || 400;
  var points = [];
  for (var i = 0; i <= N; i++) {
    var x = this.xMin + (this.xMax - this.xMin) * i / N;
    var y;
    try { y = fn(x); } catch (_) { continue; }
    if (!isFinite(y)) continue;
    /* Clip y to a sane range to avoid drawing wild asymptotes across the canvas */
    var yClip = clamp(y, this.yMin - 50, this.yMax + 50);
    points.push({ x: x, y: yClip });
  }
  this.drawPolyline(points, opts);
};

Graph2DEngine.prototype.drawCircle = function(center, radius, opts) {
  opts = opts || {};
  var sx = this.w2sx(center.x);
  var sy = this.w2sy(center.y);
  /* Convert world radius to screen radius (average of x and y scale) */
  var rx = Math.abs(this.w2sx(center.x + radius) - sx);
  var ry = Math.abs(this.w2sy(center.y + radius) - sy);
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.strokeStyle = opts.color || '#f5f5f0';
  this.ctx.lineWidth = opts.lineWidth || 2;
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  if (opts.dash) this.ctx.setLineDash(opts.dash);
  this.ctx.beginPath();
  this.ctx.ellipse(sx, sy, rx, ry, 0, 0, TAU);
  this.ctx.stroke();
  if (opts.fill) {
    this.ctx.fillStyle = opts.fill;
    this.ctx.globalAlpha = opts.fillOpacity !== undefined ? opts.fillOpacity : 0.2;
    this.ctx.fill();
  }
  this.ctx.restore();
};

Graph2DEngine.prototype.drawEllipse = function(center, a, b, opts) {
  opts = opts || {};
  var sx = this.w2sx(center.x);
  var sy = this.w2sy(center.y);
  var sxa = Math.abs(this.w2sx(center.x + a) - sx);
  var syb = Math.abs(this.w2sy(center.y + b) - sy);
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.strokeStyle = opts.color || '#f5f5f0';
  this.ctx.lineWidth = opts.lineWidth || 2;
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  if (opts.dash) this.ctx.setLineDash(opts.dash);
  this.ctx.beginPath();
  this.ctx.ellipse(sx, sy, sxa, syb, 0, 0, TAU);
  this.ctx.stroke();
  if (opts.fill) {
    this.ctx.fillStyle = opts.fill;
    this.ctx.globalAlpha = opts.fillOpacity !== undefined ? opts.fillOpacity : 0.2;
    this.ctx.fill();
  }
  this.ctx.restore();
};

Graph2DEngine.prototype.drawPoint = function(p, opts) {
  opts = opts || {};
  var sx = this.w2sx(p.x);
  var sy = this.w2sy(p.y);
  var r = opts.r || 5;
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.fillStyle = opts.color || '#f5f5f0';
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  this.ctx.beginPath();
  this.ctx.arc(sx, sy, r, 0, TAU);
  this.ctx.fill();
  if (opts.glow) {
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, r * 2.2, 0, TAU);
    this.ctx.fill();
  }
  this.ctx.restore();
};

/* Vector from `from` to `to` with an arrowhead */
Graph2DEngine.prototype.drawVector = function(from, to, opts) {
  opts = opts || {};
  var sx1 = this.w2sx(from.x), sy1 = this.w2sy(from.y);
  var sx2 = this.w2sx(to.x),   sy2 = this.w2sy(to.y);
  var dx = sx2 - sx1, dy = sy2 - sy1;
  var len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return;
  var headLen = clamp(opts.headLen || 14, 6, len * 0.5);
  var headAngle = 0.45;  /* radians */
  var ux = dx / len, uy = dy / len;
  /* shorten the line so it stops at the base of the arrowhead */
  var baseX = sx2 - ux * headLen * 0.6;
  var baseY = sy2 - uy * headLen * 0.6;
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.strokeStyle = opts.color || '#f5f5f0';
  this.ctx.fillStyle = opts.color || '#f5f5f0';
  this.ctx.lineWidth = opts.lineWidth || 2.5;
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  this.ctx.beginPath();
  this.ctx.moveTo(sx1, sy1);
  this.ctx.lineTo(baseX, baseY);
  this.ctx.stroke();
  /* arrowhead */
  this.ctx.beginPath();
  this.ctx.moveTo(sx2, sy2);
  this.ctx.lineTo(sx2 - ux * headLen + uy * headLen * Math.tan(headAngle),
                  sy2 - uy * headLen - ux * headLen * Math.tan(headAngle));
  this.ctx.lineTo(sx2 - ux * headLen - uy * headLen * Math.tan(headAngle),
                  sy2 - uy * headLen + ux * headLen * Math.tan(headAngle));
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.restore();
};

Graph2DEngine.prototype.drawText = function(text, p, opts) {
  opts = opts || {};
  var sx = this.w2sx(p.x) + (opts.dx || 0);
  var sy = this.w2sy(p.y) + (opts.dy || 0);
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.font = opts.font || '12px "IBM Plex Mono", monospace';
  this.ctx.fillStyle = opts.color || '#f5f5f0';
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  this.ctx.textAlign = opts.align || 'left';
  this.ctx.textBaseline = opts.baseline || 'middle';
  this.ctx.fillText(text, sx, sy);
  this.ctx.restore();
};

Graph2DEngine.prototype.fillRegion = function(points, opts) {
  if (!points.length) return;
  opts = opts || {};
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.ctx.fillStyle = opts.color || 'rgba(245,245,240,0.18)';
  this.ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;
  this.ctx.beginPath();
  this.ctx.moveTo(this.w2sx(points[0].x), this.w2sy(points[0].y));
  for (var i = 1; i < points.length; i++) {
    this.ctx.lineTo(this.w2sx(points[i].x), this.w2sy(points[i].y));
  }
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.restore();
};

/* Draw all handles (called after the rest of the scene is drawn) */
Graph2DEngine.prototype.drawHandles = function() {
  this.ctx.save();
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  for (var i = 0; i < this.handles.length; i++) {
    var h = this.handles[i];
    if (!h.visible) continue;
    var sx = this.w2sx(h.x);
    var sy = this.w2sy(h.y);
    /* Outer ring */
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, h.r, 0, TAU);
    this.ctx.fillStyle = h.fillColor;
    this.ctx.fill();
    this.ctx.strokeStyle = h.color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    /* Inner dot */
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, 3, 0, TAU);
    this.ctx.fillStyle = h.color;
    this.ctx.fill();
    /* Label */
    if (h.label) {
      this.ctx.font = 'bold 13px "IBM Plex Mono", monospace';
      this.ctx.fillStyle = h.color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(h.label, sx, sy - h.r - 10);
    }
  }
  this.ctx.restore();
};

/* Lifecycle: load a sim, start the RAF loop */
Graph2DEngine.prototype.loadSim = function(sim) {
  if (this.activeSim) this.activeSim.dispose();
  this.activeSim = sim;
  this.activeSim.build();
};
Graph2DEngine.prototype.start = function() {
  var self = this;
  var clock = new THREE.Clock();
  (function tick() {
    self._rafId = requestAnimationFrame(tick);
    var dt = clock.getDelta();
    if (dt > 0.033) dt = 0.033;
    if (self.activeSim) self.activeSim.update(self._st = (self._st || 0) + dt, dt);
    else { self.clear(); }
  })();
};

/* ============================================================
   LabEngine3D — Three.js engine for 3D maths (kept for future
   sims: 3D vectors, planes, cross product, surfaces, matrices).
   Currently unused by Phase 1 sims but ready when needed.
   ============================================================ */
function LabEngine3D(containerId) {
  this.type = '3d';
  this.el = document.getElementById(containerId);
  this.w = this.el.clientWidth; this.h = this.el.clientHeight;
  this.activeSim = null;
  this.viewMode = '3d';

  this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  var dpr = window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio;
  this.renderer.setPixelRatio(dpr);
  this.renderer.setSize(this.w, this.h);
  this.renderer.setClearColor(0x0f2a1f, 1);
  this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = 1.0;
  this.renderer.outputEncoding = THREE.sRGBEncoding;
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  this.renderer.domElement.style.touchAction = 'none';
  this.el.appendChild(this.renderer.domElement);

  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.FogExp2(0x0f2a1f, 0.012);
  this.scene.background = null;

  this.camera = new THREE.PerspectiveCamera(45, this.w / this.h, 0.1, 1000);
  this.camera.position.set(0, 10, 30);

  this.orbit = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  this.orbit.enableDamping = true;
  this.orbit.dampingFactor = 0.06;
  this.orbit.minDistance = 2;
  this.orbit.maxDistance = 200;

  this.ambientLight = new THREE.AmbientLight(0x143a26, 1.8);
  this.scene.add(this.ambientLight);
  var dirLight = new THREE.DirectionalLight(0xf5f5f0, 0.9);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1; dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -40; dirLight.shadow.camera.right = 40;
  dirLight.shadow.camera.top = 40; dirLight.shadow.camera.bottom = -40;
  dirLight.shadow.bias = -0.0005;
  this.scene.add(dirLight);
  this.dirLight = dirLight;

  var fillLight = new THREE.DirectionalLight(0xf0e19a, 0.3);
  fillLight.position.set(-10, 5, -10);
  this.scene.add(fillLight);

  var self = this;
  window.addEventListener('resize', function() {
    self.w = self.el.clientWidth; self.h = self.el.clientHeight;
    self.camera.aspect = self.w / self.h; self.camera.updateProjectionMatrix();
    self.renderer.setSize(self.w, self.h);
    if (self.activeSim && self.activeSim.onResize) self.activeSim.onResize();
  });
}
LabEngine3D.prototype.loadSim = function(sim) {
  if (this.activeSim) this.activeSim.dispose();
  this.activeSim = sim;
  this.activeSim.build(this.scene, this.camera, this.renderer);
};
LabEngine3D.prototype.start = function() {
  var self = this;
  var clock = new THREE.Clock();
  (function tick() {
    self._rafId = requestAnimationFrame(tick);
    var dt = clock.getDelta();
    if (dt > 0.033) dt = 0.033;
    if (self.orbit) self.orbit.update();
    if (self.activeSim) self.activeSim.update(clock.getElapsedTime(), dt);
    self.renderer.render(self.scene, self.camera);
  })();
};

/* ============================================================
   MathSimBase — common lifecycle for both 2D and 3D sims.
   Sims override _setup(), _buildGui(), update().
   ============================================================ */
function MathSimBase(engine) {
  this.engine = engine;
  this.gui = null;
  this._st = 0;
  this._paused = false;
  this.cameraPresets = null;
}

MathSimBase.prototype.build = function(scene, camera, renderer) {
  /* For 3D sims the engine passes scene/camera/renderer; for 2D sims they're null */
  this.scene = scene || null;
  this.camera = camera || null;
  this.renderer = renderer || null;
  this._st = 0;
  this._paused = false;
  /* Clear UI overlays */
  var overlayText = document.getElementById('overlay-text');
  var formulaContainer = document.getElementById('formula-container');
  var liveValues = document.getElementById('live-values');
  var energyContainer = document.getElementById('energy-container');
  var momentumContainer = document.getElementById('momentum-container');
  if (overlayText) overlayText.innerHTML = '';
  if (formulaContainer) formulaContainer.innerHTML = '';
  if (liveValues) liveValues.innerHTML = '';
  if (energyContainer) { energyContainer.style.display = 'none'; energyContainer.innerHTML = ''; }
  if (momentumContainer) { momentumContainer.style.display = 'none'; momentumContainer.innerHTML = ''; }
  /* Reset 2D engine state if applicable */
  if (this.engine.type === '2d') {
    this.engine.clearHandles();
    this.engine.setRange(-10, 10, -6, 6);
  }
  this._setup();
  this._buildGui();
};

MathSimBase.prototype._setup = function() {};
MathSimBase.prototype._buildGui = function() {};

MathSimBase.prototype.update = function(t, dt) {
  if (this._paused) return false;
  this._st += dt;
  return true;
};

MathSimBase.prototype.onResize = function() {};
MathSimBase.prototype.reset = function() { this._st = 0; };
MathSimBase.prototype.togglePause = function() {
  this._paused = !this._paused;
  var ind = document.getElementById('pause-indicator');
  if (ind) ind.style.display = this._paused ? 'block' : 'none';
};
MathSimBase.prototype.dispose = function() {
  if (this.gui) { this.gui.destroy(); this.gui = null; }
  if (this.engine && this.engine.type === '2d') this.engine.clearHandles();
  var ind = document.getElementById('pause-indicator');
  if (ind) ind.style.display = 'none';
};

/* Helper: write to the analysis panel */
MathSimBase.prototype.setOverlay = function(html) {
  var el = document.getElementById('overlay-text');
  if (el) el.innerHTML = html;
};
MathSimBase.prototype.setFormula = function(html) {
  var el = document.getElementById('formula-container');
  if (el) el.innerHTML = html;
};
MathSimBase.prototype.setLiveValues = function(chips) {
  /* chips: [{ l: 'label', v: 'value' }, ...] */
  var el = document.getElementById('live-values');
  if (el) el.innerHTML = chips.map(function(c) {
    return '<div class="live-chip">' + c.l + ': <span>' + c.v + '</span></div>';
  }).join('');
};
