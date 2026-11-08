/* ============================================================
   bg.js — COMPASS ambient background
   Engineering graph paper + drifting math symbols + radial
   chalkboard spotlight (brighter in the middle, darker at edges).
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("bg-particles");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var W = 0, H = 0, dpr = 1;

  /* Drifting math symbols — chosen for variety across maths chapters */
  var SYMBOLS = [
    "∫", "∑", "π", "∞", "√", "∇", "∂", "θ", "α", "β", "γ", "Δ", "Σ", "Π",
    "λ", "μ", "φ", "ω", "≠", "≤", "≥", "→", "⇒", "∠", "⊥", "∥", "ℂ", "ℝ",
    "ℕ", "ℤ", "±", "≈", "∝", "∴", "∵", "∈", "∀", "∃", "⊗", "⊕"
  ];

  var particles = [];
  var PARTICLE_COUNT = 26;

  function spawnParticle(reset) {
    var sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    var p = {
      sym: sym,
      x: Math.random() * W,
      y: reset ? H + 40 : Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.05 - Math.random() * 0.18,
      size: 14 + Math.random() * 36,
      alpha: 0.04 + Math.random() * 0.10,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.004,
      hue: Math.random()
    };
    /* colour: pick a chalk tone */
    if (p.hue < 0.6) p.color = "245,245,240";        /* chalk white */
    else if (p.hue < 0.85) p.color = "159,184,159"; /* faded green */
    else p.color = "240,225,154";                   /* yellow chalk */
    return p;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(spawnParticle(false));

  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    /* 1) Radial chalkboard spotlight — brighter middle, darker edges */
    var cx = W * 0.5, cy = H * 0.45;
    var rMax = Math.max(W, H) * 0.85;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
    grad.addColorStop(0,    "#1a4a2a");
    grad.addColorStop(0.40, "#0f2a1f");
    grad.addColorStop(1,    "#07150e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* 2) Engineering graph paper — minor + major lines */
    /* Minor grid: every 32px, very faded green */
    ctx.strokeStyle = "rgba(159,184,159,0.045)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x < W; x += 32) {
      ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H);
    }
    for (var y = 0; y < H; y += 32) {
      ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    /* Major grid: every 160px, slightly stronger */
    ctx.strokeStyle = "rgba(159,184,159,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x < W; x += 160) {
      ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H);
    }
    for (var y = 0; y < H; y += 160) {
      ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    /* 3) Drifting math symbols */
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;

      if (p.y < -60 || p.x < -60 || p.x > W + 60) {
        var np = spawnParticle(true);
        particles[i] = np;
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = "rgba(" + p.color + "," + p.alpha + ")";
      ctx.font = p.size + "px 'IBM Plex Mono', 'Cascadia Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.sym, 0, 0);
      ctx.restore();
    }
  }

  draw();
})();
