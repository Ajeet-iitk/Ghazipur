/* ══════════════════════════════════════════════════════════════
   GHAZIPUR — a painted river, drawn frame by frame.
   Canvas 2D. No libraries, no images.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('scene');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d', { alpha: false });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, DPR = 1;
  var time = 0;            /* animation clock, in seconds */
  var day = 0.18, target = 0.18;   /* 0 = before dawn, 1 = deep night */
  var scrollProg = 0;
  var pX = 0, pY = 0, tpX = 0, tpY = 0;
  var running = true, raf = 0, last = 0;
  var stars = [], clouds = [], skyline = [], motes = [], birds = [], diyas = [], ripples = [];

  /* ── math ─────────────────────────────────────────────────── */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function mix(c1, c2, t) {
    return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  }
  function rgba(c, a) {
    return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')';
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ── palettes ─────────────────────────────────────────────── */
  var STOPS = [
    { t: 0.00, top: [20, 26, 50], bot: [98, 74, 98], water: [38, 46, 66], deep: [16, 24, 40], sun: [255, 212, 176], hill: [24, 32, 44], far: [44, 54, 72], haze: [128, 112, 142], star: 1.0, warm: 0.35 },
    { t: 0.16, top: [76, 96, 142], bot: [249, 178, 128], water: [134, 146, 162], deep: [62, 84, 104], sun: [255, 220, 168], hill: [54, 68, 82], far: [96, 108, 124], haze: [255, 206, 170], star: 0.35, warm: 0.75 },
    { t: 0.34, top: [140, 180, 214], bot: [247, 224, 190], water: [148, 182, 186], deep: [84, 130, 138], sun: [255, 250, 230], hill: [74, 102, 94], far: [128, 152, 148], haze: [250, 236, 214], star: 0.0, warm: 0.30 },
    { t: 0.55, top: [120, 176, 210], bot: [214, 234, 232], water: [118, 166, 178], deep: [62, 114, 126], sun: [255, 255, 246], hill: [66, 100, 88], far: [124, 156, 146], haze: [236, 246, 242], star: 0.0, warm: 0.15 },
    { t: 0.72, top: [112, 124, 160], bot: [247, 166, 98], water: [172, 150, 136], deep: [94, 90, 94], sun: [255, 198, 124], hill: [54, 62, 64], far: [112, 104, 102], haze: [250, 198, 148], star: 0.0, warm: 1.0 },
    { t: 0.86, top: [58, 52, 92], bot: [233, 126, 92], water: [98, 96, 122], deep: [42, 50, 76], sun: [255, 150, 112], hill: [30, 34, 52], far: [70, 66, 92], haze: [230, 140, 120], star: 0.55, warm: 0.85 },
    { t: 1.00, top: [9, 15, 38], bot: [34, 48, 78], water: [24, 36, 56], deep: [9, 19, 33], sun: [236, 240, 224], hill: [10, 18, 28], far: [24, 34, 52], haze: [70, 90, 120], star: 1.0, warm: 0.55 }
  ];

  var P = {};

  function paletteAt(t) {
    t = clamp(t, 0, 1);
    var a = STOPS[0], b = STOPS[STOPS.length - 1];
    for (var i = 0; i < STOPS.length - 1; i++) {
      if (t >= STOPS[i].t && t <= STOPS[i + 1].t) { a = STOPS[i]; b = STOPS[i + 1]; break; }
    }
    var f = (t - a.t) / Math.max(0.0001, (b.t - a.t));
    f = f * f * (3 - 2 * f);
    return {
      top: mix(a.top, b.top, f),
      bot: mix(a.bot, b.bot, f),
      water: mix(a.water, b.water, f),
      deep: mix(a.deep, b.deep, f),
      sun: mix(a.sun, b.sun, f),
      hill: mix(a.hill, b.hill, f),
      far: mix(a.far, b.far, f),
      haze: mix(a.haze, b.haze, f),
      star: lerp(a.star, b.star, f),
      warm: lerp(a.warm, b.warm, f)
    };
  }

  /* ── setup ────────────────────────────────────────────────── */
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStatic();
    if (reduced) draw(performance.now() / 1000);
  }

  function buildStatic() {
    var rnd = mulberry32(20260815);

    stars = [];
    for (var i = 0; i < 130; i++) {
      stars.push({
        x: rnd(), y: rnd() * 0.62,
        r: 0.35 + rnd() * 1.35,
        p: rnd() * Math.PI * 2,
        s: 0.4 + rnd() * 1.6
      });
    }

    clouds = [];
    for (var c = 0; c < 7; c++) {
      clouds.push({
        x: rnd() * 1.2 - 0.1, y: 0.06 + rnd() * 0.30,
        s: 0.55 + rnd() * 1.25, v: 0.0018 + rnd() * 0.004,
        a: 0.10 + rnd() * 0.20
      });
    }

    /* the far bank: domes, shikharas, minarets, houses */
    skyline = [];
    var x = -0.02, sr = mulberry32(4417);
    while (x < 1.04) {
      var r = sr(), type, h, w;
      if (r < 0.14) { type = 'temple'; h = 0.050 + sr() * 0.048; w = 0.026 + sr() * 0.020; }
      else if (r < 0.31) { type = 'dome'; h = 0.026 + sr() * 0.036; w = 0.030 + sr() * 0.032; }
      else if (r < 0.44) { type = 'minaret'; h = 0.058 + sr() * 0.050; w = 0.010 + sr() * 0.008; }
      else if (r < 0.52) { type = 'chhatri'; h = 0.034 + sr() * 0.022; w = 0.022 + sr() * 0.012; }
      else { type = 'house'; h = 0.013 + sr() * 0.020; w = 0.026 + sr() * 0.040; }
      skyline.push({ x: x, w: w, h: h, type: type, win: sr() < 0.45, off: sr() });
      x += w * (0.82 + sr() * 0.55) + 0.006;
    }

    motes = [];
    for (var m = 0; m < 54; m++) {
      motes.push({
        x: rnd(), y: rnd(), z: 0.35 + rnd() * 1,
        sp: 0.004 + rnd() * 0.012, p: rnd() * Math.PI * 2,
        r: 0.8 + rnd() * 2.1, rot: rnd() * Math.PI, vr: (rnd() - 0.5) * 0.6
      });
    }

    birds = [];
    for (var f = 0; f < 2; f++) {
      var flock = { x: rnd(), y: 0.18 + rnd() * 0.14, v: 0.006 + rnd() * 0.006, members: [] };
      for (var b = 0; b < 4 + Math.floor(rnd() * 3); b++) {
        flock.members.push({ dx: (rnd() - 0.5) * 0.07, dy: (rnd() - 0.5) * 0.04, p: rnd() * 6.28, s: 0.6 + rnd() * 0.8 });
      }
      birds.push(flock);
    }

    diyas = diyas.slice(0, 6);
  }

  /* ── drawing helpers ──────────────────────────────────────── */
  function horizonY() { return H * 0.545; }

  /* where the top step of the ghat meets the water at a given x (0..1) */
  function ghatEdgeY(xn) {
    var f = clamp((xn - 0.56) / 0.44, 0, 1);
    return H - (H - H * 0.585) * f;
  }

  function figureInk(p) { return mix([24, 30, 28], p.hill, 0.32); }
  function sunRim(p, a) { return rgba(mix(p.sun, [255, 238, 204], 0.35), a); }

  function drawSky(p) {
    var hz = horizonY();
    var g = ctx.createLinearGradient(0, 0, 0, hz + 4);
    g.addColorStop(0, rgba(p.top));
    g.addColorStop(0.62, rgba(mix(p.top, p.bot, 0.55)));
    g.addColorStop(1, rgba(p.bot));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, hz + 4);

    /* stars */
    if (p.star > 0.02) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = 0.55 + 0.45 * Math.sin(time * 1.6 * s.s + s.p);
        ctx.globalAlpha = p.star * tw * (1 - s.y * 0.55);
        ctx.fillStyle = 'rgba(255,248,230,1)';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function bodyXY(prog, dir) {
    var hz = horizonY();
    var a = clamp(prog, 0, 1);
    return {
      x: W * (dir > 0 ? 0.16 + a * 0.68 : 0.84 - a * 0.62),
      y: hz - Math.sin(Math.PI * a) * H * 0.40,
      r: Math.min(W, H) * 0.040
    };
  }

  function drawBodies(p) {
    var hz = horizonY();

    /* sun until late */
    var sunA = 1 - smooth(0.80, 0.90, day);
    if (sunA > 0.01) {
      var sp = bodyXY(day / 0.86, 1);
      var gr = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, Math.min(W, H) * 0.42);
      gr.addColorStop(0, rgba(p.sun, 0.42 * sunA));
      gr.addColorStop(0.22, rgba(p.sun, 0.16 * sunA));
      gr.addColorStop(1, rgba(p.sun, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, hz + 40);
      ctx.globalAlpha = sunA;
      ctx.fillStyle = rgba(mix(p.sun, [255, 255, 255], 0.35));
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* moon */
    var mA = smooth(0.74, 0.92, day);
    if (mA > 0.01) {
      var mp = bodyXY((day - 0.76) / 0.24, -1);
      mp.y = hz - Math.sin(Math.PI * clamp((day - 0.76) / 0.30, 0, 1)) * H * 0.36;
      var mg = ctx.createRadialGradient(mp.x, mp.y, 0, mp.x, mp.y, Math.min(W, H) * 0.30);
      mg.addColorStop(0, 'rgba(228,238,236,' + (0.30 * mA) + ')');
      mg.addColorStop(1, 'rgba(228,238,236,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, W, hz + 40);

      ctx.globalAlpha = mA;
      ctx.fillStyle = 'rgba(246,244,225,1)';
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, mp.r * 0.82, 0, 6.283);
      ctx.fill();
      /* shadow bite, painted with the sky's own gradient so no seam shows */
      var bite = ctx.createLinearGradient(0, 0, 0, hz + 4);
      bite.addColorStop(0, rgba(p.top));
      bite.addColorStop(0.62, rgba(mix(p.top, p.bot, 0.55)));
      bite.addColorStop(1, rgba(p.bot));
      ctx.fillStyle = bite;
      ctx.beginPath();
      ctx.arc(mp.x + mp.r * 0.42, mp.y - mp.r * 0.18, mp.r * 0.74, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawClouds(p) {
    var hz = horizonY();
    var col = mix(p.haze, [255, 255, 255], 0.35);
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var x = ((c.x + time * c.v * 7) % 1.35) - 0.18;
      var y = c.y * hz;
      var sc = c.s * (Math.min(W, H) / 900) * 90;
      ctx.globalAlpha = c.a * (0.5 + p.star * 0.25);
      for (var k = 0; k < 4; k++) {
        var ox = (k - 1.5) * sc * 0.62;
        var oy = (k % 2 === 0 ? -1 : 1) * sc * 0.13;
        var rr = sc * (0.55 + (k % 3) * 0.14);
        var g = ctx.createRadialGradient(x * W + ox, y + oy, 0, x * W + ox, y + oy, rr);
        g.addColorStop(0, rgba(col, 0.55));
        g.addColorStop(0.6, rgba(col, 0.22));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x * W + ox, y + oy, rr, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function hillPath(baseY, amp, freq, phase, shift) {
    ctx.beginPath();
    ctx.moveTo(-40, baseY + 60);
    for (var x = -40; x <= W + 40; x += 14) {
      var n = Math.sin((x * freq) + phase) * amp
        + Math.sin((x * freq * 2.3) + phase * 1.7) * amp * 0.35
        + Math.sin((x * freq * 0.41) + phase * 0.5) * amp * 0.7;
      ctx.lineTo(x + shift, baseY - n);
    }
    ctx.lineTo(W + 40, baseY + 60);
    ctx.closePath();
  }

  function drawHills(p) {
    var hz = horizonY();
    var shift = pX * 10;

    hillPath(hz - H * 0.012, H * 0.012, 0.0022, 1.2, shift * 0.5);
    ctx.fillStyle = rgba(mix(p.far, p.hill, 0.5), 0.55);
    ctx.fill();

    hillPath(hz + 2, H * 0.008, 0.0034, 4.0, shift);
    ctx.fillStyle = rgba(mix(p.hill, p.far, 0.35), 0.8);
    ctx.fill();
  }

  function drawSkyline(p, alpha, flip) {
    var hz = horizonY();
    var col = mix(p.far, [12, 20, 24], 0.50);
    var shift = pX * 16;
    ctx.save();
    if (flip) {
      ctx.translate(0, hz * 2);
      ctx.scale(1, -1);
    }
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    for (var i = 0; i < skyline.length; i++) {
      var s = skyline[i];
      var x = s.x * W + shift;
      var w = s.w * W;
      var h = s.h * H;
      var y = hz;

      ctx.fillStyle = rgba(col);
      ctx.beginPath();
      if (s.type === 'dome') {
        var br = h * 0.50;
        ctx.rect(x, y - br, w, br);
        ctx.moveTo(x, y - br);
        ctx.quadraticCurveTo(x + w * 0.5, y - br - (h - br) * 1.55, x + w, y - br);
        ctx.fill();
        ctx.fillRect(x + w * 0.47, y - h - 3, w * 0.06, 3.4);
      } else if (s.type === 'temple') {
        ctx.rect(x, y - h * 0.24, w, h * 0.24);
        ctx.moveTo(x + w * 0.08, y - h * 0.24);
        ctx.lineTo(x + w * 0.5, y - h);
        ctx.lineTo(x + w * 0.92, y - h * 0.24);
        ctx.fill();
        ctx.fillRect(x + w * 0.47, y - h - 4, w * 0.06, 4.6);
        ctx.beginPath(); ctx.arc(x + w * 0.5, y - h - 4, w * 0.11, 0, 6.283); ctx.fill();
      } else if (s.type === 'minaret') {
        ctx.rect(x, y - h, w, h);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y - h, w * 0.9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + w * 0.44, y - h - w * 1.5, w * 0.12, w * 1.1);
      } else if (s.type === 'chhatri') {
        ctx.fillRect(x + w * 0.18, y - h * 0.62, w * 0.64, h * 0.62);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y - h * 0.62, w * 0.34, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + w * 0.47, y - h - 4, w * 0.06, 4);
      } else {
        ctx.rect(x, y - h, w, h);
        ctx.fill();
        if (s.off > 0.5) {
          ctx.beginPath();
          ctx.moveTo(x - 1, y - h);
          ctx.lineTo(x + w * 0.5, y - h - h * 0.42);
          ctx.lineTo(x + w + 1, y - h);
          ctx.fill();
        }
      }
    }

    /* lit windows, only when the sky gets warm or dark */
    var lit = smooth(0.66, 0.84, day) * 0.9 + p.warm * 0.18;
    if (lit > 0.06) {
      ctx.fillStyle = 'rgba(255,196,120,' + (0.55 * lit) + ')';
      for (var j = 0; j < skyline.length; j++) {
        var q = skyline[j];
        if (!q.win) continue;
        var wx = q.x * W + shift + q.w * W * 0.32;
        var wy = hz - q.h * H * 0.52;
        ctx.fillRect(wx, wy, Math.max(1.2, q.w * W * 0.10), Math.max(1.2, q.h * H * 0.10));
        if (q.off > 0.62) ctx.fillRect(wx + q.w * W * 0.34, wy, Math.max(1.2, q.w * W * 0.10), Math.max(1.2, q.h * H * 0.10));
      }
    }
    ctx.restore();
  }

  function drawWater(p) {
    var hz = horizonY();
    var g = ctx.createLinearGradient(0, hz, 0, H);
    g.addColorStop(0, rgba(mix(p.water, p.bot, 0.35)));
    g.addColorStop(0.35, rgba(p.water));
    g.addColorStop(1, rgba(mix(p.water, p.deep, 0.55)));
    ctx.fillStyle = g;
    ctx.fillRect(0, hz, W, H - hz);

    /* skyline reflection */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, hz, W, H - hz);
    ctx.clip();
    ctx.globalAlpha = 0.28;
    drawSkyline(p, 0.5, true);
    ctx.globalAlpha = 1;
    var fg = ctx.createLinearGradient(0, hz, 0, H);
    fg.addColorStop(0, rgba(p.water, 0.15));
    fg.addColorStop(0.6, rgba(p.water, 0.85));
    fg.addColorStop(1, rgba(p.water, 0.98));
    ctx.fillStyle = fg;
    ctx.fillRect(0, hz, W, H - hz);
    ctx.restore();

    /* sun / moon column */
    var bodyA = 1 - smooth(0.80, 0.90, day);
    var bx = bodyXY(day / 0.86, 1).x;
    var bcol = p.sun;
    var bAlpha = 0.30 * bodyA;
    if (day > 0.78) {
      var mp = bodyXY((day - 0.76) / 0.24, -1);
      if (smooth(0.78, 0.92, day) > 0.05) { bx = mp.x; bcol = [240, 244, 228]; bAlpha = 0.26 * smooth(0.78, 0.95, day); }
    }
    for (var i = 0; i < 26; i++) {
      var q = i / 26;
      var yy = hz + Math.pow(q, 1.7) * (H - hz) * 0.92;
      var ww = Math.min(W, H) * 0.028 * (1.2 - q) * (0.55 + 0.45 * Math.sin(i * 1.7 + time * 2));
      var xx = bx + Math.sin(time * 1.1 + i * 0.55) * (6 + q * 22);
      ctx.globalAlpha = bAlpha * (1 - q * 0.85);
      ctx.fillStyle = rgba(bcol);
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(xx - ww / 2, yy, ww, 1.8, 1.8); ctx.fill(); }
      else ctx.fillRect(xx - ww / 2, yy, ww, 1.8);
    }
    ctx.globalAlpha = 1;

    /* shimmer lines */
    var light = mix(p.haze, [255, 255, 255], 0.28);
    for (var k = 0; k < 44; k++) {
      var f = k / 44;
      var y2 = hz + Math.pow(f, 1.55) * (H - hz);
      var len = W * (0.012 + (1 - f) * 0.055) * (0.5 + 0.5 * Math.sin(k * 2.1 + time * 0.9));
      var x2 = ((k * 0.137 + time * 0.03) % 1.1) * W - len * 0.5;
      ctx.globalAlpha = (1 - f) * 0.24 + 0.03;
      ctx.strokeStyle = rgba(light);
      ctx.lineWidth = Math.max(0.7, (1 - f) * 1.9);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 + len, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* fine sparkle */
    if (p.star < 0.8) {
      for (var s = 0; s < 18; s++) {
        var sx = ((s * 0.217 + Math.sin(time * 0.3 + s) * 0.01) % 1) * W;
        var sy = hz + ((s * 0.313 + 0.07) % 1) * (H - hz) * 0.75;
        ctx.globalAlpha = 0.10 + 0.18 * Math.abs(Math.sin(time * 1.4 + s * 2.2));
        ctx.fillStyle = rgba(light);
        ctx.fillRect(sx, sy, 2.2, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawMist(p) {
    var hz = horizonY();
    for (var i = 0; i < 3; i++) {
      var y = hz - H * 0.035 + i * H * 0.028;
      var drift = Math.sin(time * 0.12 + i) * W * 0.05;
      var g = ctx.createLinearGradient(0, y - 30, 0, y + 34);
      var a = (0.10 + i * 0.03) * (0.7 + (1 - p.star) * 0.5);
      g.addColorStop(0, rgba(p.haze, 0));
      g.addColorStop(0.5, rgba(p.haze, a));
      g.addColorStop(1, rgba(p.haze, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-W * 0.1 + drift, y - 34, W * 1.2, 70);
    }
  }

  function drawBoat(p) {
    var hz = horizonY();
    var t = time;
    var bx = W * (0.60 + 0.035 * Math.sin(t * 0.10)) + pX * 8;
    var by = hz + (H - hz) * 0.22 + Math.sin(t * 0.9) * 2.4;
    var s = Math.min(W, H) * 0.00042;
    var scale = clamp(Math.min(W, H) / 900, 0.55, 1.35);
    var dark = mix(p.hill, [10, 14, 16], 0.55);

    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(scale, scale);

    /* reflection */
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = rgba(mix(p.water, dark, 0.5));
    ctx.beginPath();
    ctx.ellipse(0, 12 + Math.sin(t * 0.9) * 2, 46, 5, 0, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;

    /* hull */
    ctx.fillStyle = rgba(dark);
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.quadraticCurveTo(-18, 13, 12, 11);
    ctx.quadraticCurveTo(38, 9, 46, -2);
    ctx.quadraticCurveTo(22, 4, -6, 3);
    ctx.quadraticCurveTo(-26, 2, -42, 0);
    ctx.fill();

    /* boatman */
    ctx.fillStyle = rgba(dark);
    ctx.beginPath();
    ctx.ellipse(-2, -12, 3.6, 8.5, 0.06, 0, 6.283);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2.4, -23, 3.1, 0, 6.283);
    ctx.fill();
    /* oar */
    ctx.strokeStyle = rgba(dark);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(3, -20);
    ctx.lineTo(26, 4);
    ctx.stroke();
    /* a lantern at the bow when evening comes */
    var lampOn = smooth(0.70, 0.86, day);
    if (lampOn > 0.05) {
      ctx.globalAlpha = lampOn;
      var lg = ctx.createRadialGradient(30, -4, 0, 30, -4, 22);
      lg.addColorStop(0, 'rgba(255,190,110,0.95)');
      lg.addColorStop(0.35, 'rgba(255,160,80,0.32)');
      lg.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(30, -4, 22, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,214,150,1)';
      ctx.beginPath(); ctx.arc(30, -4, 1.9, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBirds(p) {
    var dark = mix(p.hill, [16, 20, 22], 0.4);
    ctx.strokeStyle = rgba(dark, 0.62);
    ctx.lineWidth = 1.35;
    ctx.lineCap = 'round';
    for (var i = 0; i < birds.length; i++) {
      var fl = birds[i];
      var bx = ((fl.x + time * fl.v * 2) % 1.25) * W - W * 0.08;
      var by = fl.y * H + Math.sin(time * 0.5 + i) * 8;
      for (var j = 0; j < fl.members.length; j++) {
        var m = fl.members[j];
        var x = bx + m.dx * W * 0.55;
        var y = by + m.dy * H * 0.55;
        var flap = Math.sin(time * 7 * m.s + m.p) * 3.4;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.quadraticCurveTo(x - 2.5, y - 3.2 - flap, x, y);
        ctx.quadraticCurveTo(x + 2.5, y - 3.2 - flap, x + 6, y);
        ctx.stroke();
      }
    }
  }

  /* the stone ghat in the bottom-right corner */
  function drawGhat(p) {
    var stone = mix([54, 62, 58], p.hill, 0.42);
    var warm = p.warm;
    var baseX = W * 0.60;

    ctx.save();
    ctx.translate(pX * 20, pY * 10);

    ctx.beginPath();
    ctx.moveTo(baseX - W * 0.04, H + 4);
    ctx.lineTo(W + 4, H * 0.585);
    ctx.lineTo(W + 4, H + 4);
    ctx.closePath();
    ctx.fillStyle = rgba(mix(stone, [22, 30, 28], 0.16), 0.94);
    ctx.fill();

    /* a pale rim where the top step meets the water */
    ctx.beginPath();
    ctx.moveTo(baseX - W * 0.04, H + 4);
    ctx.lineTo(W + 4, H * 0.585);
    ctx.strokeStyle = rgba(mix(stone, p.haze, 0.7), 0.22);
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* step lines */
    ctx.strokeStyle = rgba(mix(stone, p.haze, 0.24), 0.30);
    ctx.lineWidth = 1.2;
    for (var i = 1; i <= 7; i++) {
      var f = i / 8;
      var y1 = H + 4 - (H - H * 0.585) * f;
      ctx.beginPath();
      ctx.moveTo(baseX - W * 0.04 + (W - baseX + W * 0.04) * f * 0.94, y1);
      ctx.lineTo(W + 4, y1 - (H * 0.585) * (1 - f) * 0.06);
      ctx.stroke();
    }

    /* a chhatri pavilion on the upper step */
    var px0 = W * 0.885 - W * 0.11;
    var py0 = H * 0.585 + H * 0.055;
    var pw = W * 0.075, ph = H * 0.105;
    ctx.fillStyle = rgba(mix(stone, [12, 18, 16], 0.35));
    ctx.fillRect(px0, py0 - ph * 0.72, pw, ph * 0.72);
    ctx.beginPath();
    ctx.arc(px0 + pw / 2, py0 - ph * 0.72, pw * 0.52, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(px0 + pw / 2 - 1.5, py0 - ph * 0.72 - pw * 0.62, 3, pw * 0.14);
    /* pillars */
    ctx.fillStyle = rgba(mix(stone, [10, 16, 14], 0.4), 0.65);
    for (var c = 0; c < 3; c++) {
      ctx.fillRect(px0 + pw * (0.14 + c * 0.30), py0 - ph * 0.70, Math.max(2, pw * 0.045), ph * 0.7);
    }

    /* a small brass lamp on the step */
    var lampA = 0.35 + smooth(0.62, 0.86, day) * 0.65;
    var lx = W * 0.78, ly = H * 0.80;
    ctx.globalAlpha = lampA;
    var lg = ctx.createRadialGradient(lx, ly - 6, 0, lx, ly - 6, 42 + warm * 18);
    lg.addColorStop(0, 'rgba(255,205,130,0.55)');
    lg.addColorStop(0.4, 'rgba(255,170,90,0.16)');
    lg.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly - 6, 42 + warm * 18, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,150,0.95)';
    ctx.beginPath(); ctx.ellipse(lx, ly - 8, 2.4, 4.2, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  /* ── life on the steps and in the water ───────────────────── */
  function drawKid(x, y, s, ph, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(0, -Math.abs(Math.sin(time * 3.4 + ph)) * 3.4);
    ctx.fillStyle = rgba(dark, 0.96);
    ctx.strokeStyle = rgba(dark, 0.96);
    ctx.lineCap = 'round';
    var sw = Math.sin(time * 5.6 + ph);

    /* legs */
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(sw * 4.4, 4.5);
    ctx.moveTo(0, -5); ctx.lineTo(-sw * 4.4, 4.5);
    ctx.stroke();

    /* little kurta */
    ctx.beginPath();
    ctx.moveTo(-2.7, -15);
    ctx.quadraticCurveTo(0, -12, 2.7, -15);
    ctx.lineTo(2.5, -4.4); ctx.lineTo(-2.5, -4.4);
    ctx.closePath(); ctx.fill();

    /* arms, thrown out while running */
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-1, -13); ctx.lineTo(-5 - sw * 3, -17 + sw * 2);
    ctx.moveTo(1, -13); ctx.lineTo(5 + sw * 3, -17 - sw * 2);
    ctx.stroke();

    /* head */
    ctx.beginPath(); ctx.arc(0, -19.4, 3.5, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function drawKids(p, a) {
    if (a < 0.01) return;
    var dark = figureInk(p);
    var sc = clamp(Math.min(W, H) / 900, 0.55, 1.5) * 1.18;
    var x1 = W * 0.648, x2 = W * 0.716, x3 = W * 0.784;
    var y1 = ghatEdgeY(0.648) + H * 0.008;
    var y2 = ghatEdgeY(0.716) + H * 0.010;
    var y3 = ghatEdgeY(0.784) + H * 0.012;

    var b = (Math.sin(time * 0.62) + 1) / 2;
    var bx = lerp(x1, x3, b);
    var by = lerp(y1, y3, b) - H * 0.052 * Math.sin(Math.PI * b);
    var br = 3.4 * sc;

    ctx.save();
    ctx.globalAlpha = a;

    /* a long evening shadow */
    ctx.globalAlpha = a * 0.22;
    ctx.fillStyle = rgba(dark);
    ctx.beginPath(); ctx.ellipse((x1 + x3) / 2, (y1 + y3) / 2 + 4, W * 0.09, 4, -0.17, 0, 6.283); ctx.fill();
    ctx.globalAlpha = a;

    drawKid(x1, y1, sc, 0.2, dark);
    drawKid(x2, y2, sc * 0.96, 2.1, dark);
    drawKid(x3, y3, sc * 0.92, 4.4, dark);

    /* the ball, catching the last of the sun */
    var glow = ctx.createRadialGradient(bx, by, 0, bx, by, br * 3.6);
    glow.addColorStop(0, 'rgba(255,218,150,0.30)');
    glow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(bx, by, br * 3.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgba(mix([244, 236, 210], p.sun, 0.25));
    ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.283); ctx.fill();
    ctx.strokeStyle = sunRim(p, 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(bx, by, br, -0.9, 0.9); ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawFisherman(p, a) {
    if (a < 0.01) return;
    var dark = figureInk(p);
    var u = clamp(Math.min(W, H) / 900, 0.55, 1.45) * 1.15;
    var bob = Math.sin(time * 0.82) * 2.2;
    var x = W * 0.485, y = H * 0.845 + bob;
    var cyc = (time % 7.4) / 7.4;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(u, u);

    /* reflection */
    ctx.globalAlpha = a * 0.25;
    ctx.fillStyle = rgba(mix(p.water, dark, 0.55));
    ctx.beginPath(); ctx.ellipse(0, 8, 32, 5, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = a;

    /* coracle */
    ctx.fillStyle = rgba(mix(dark, [70, 56, 44], 0.35));
    ctx.beginPath(); ctx.ellipse(0, 0, 31, 9.5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgba(mix(dark, p.water, 0.3), 0.9);
    ctx.beginPath(); ctx.ellipse(0, -2.6, 22, 5.2, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgba(dark, 0.9);
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(0, 0, 31, 9.5, 0, 0, 6.283); ctx.stroke();

    /* seated fisherman */
    ctx.fillStyle = rgba(dark);
    ctx.strokeStyle = rgba(dark);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -4); ctx.quadraticCurveTo(3, -11, 1, -19);
    ctx.lineTo(-4, -19); ctx.quadraticCurveTo(-6, -10, -5, -4);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-1.5, -23, 3.3, 0, 6.283); ctx.fill();
    /* the arm that holds the rod */
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(9, -20); ctx.stroke();
    /* a thin rod, curving over the water */
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(8, -20);
    ctx.quadraticCurveTo(34, -37, 66, -15);
    ctx.stroke();
    /* line and float */
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(66, -15);
    ctx.quadraticCurveTo(69, -2, 68 + Math.sin(time * 0.7) * 2, 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(240,180,90,0.9)';
    ctx.beginPath(); ctx.arc(68 + Math.sin(time * 0.7) * 2, 7, 1.5, 0, 6.283); ctx.fill();

    ctx.restore();

    /* a fish rises now and then, and the line answers */
    if (cyc < 0.17) {
      var f = cyc / 0.17;
      var fx = x + 66 * u;
      var fy = y + 6 * u - Math.sin(Math.PI * f) * 22 * u;
      ctx.save();
      ctx.globalAlpha = a * Math.sin(Math.PI * f);
      ctx.translate(fx, fy);
      ctx.rotate(-0.5 + f * 0.9);
      ctx.fillStyle = 'rgba(238,232,210,0.9)';
      ctx.beginPath(); ctx.ellipse(0, 0, 6 * u, 2.2 * u, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5.4 * u, 0); ctx.lineTo(-9 * u, -2.6 * u); ctx.lineTo(-9 * u, 2.6 * u); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (cyc < 0.04 || (cyc > 0.15 && cyc < 0.20)) {
      ctx.save();
      ctx.globalAlpha = a * 0.35;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1;
      var rr = 6 + cyc * 220;
      ctx.beginPath();
      ctx.ellipse(x + 66 * u, y + 7 * u, rr, rr * 0.24, 0, 0, 6.283);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function drawPerson(x, y, s, dark, pose, ph) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = rgba(dark, 0.95);
    ctx.strokeStyle = rgba(dark, 0.95);
    ctx.lineCap = 'round';
    var br = Math.sin(time * 1.3 + ph) * 0.3;

    ctx.lineWidth = 3.6;
    if (pose === 'sit') {
      ctx.beginPath();
      ctx.moveTo(-3, -3); ctx.lineTo(-9, 1);
      ctx.moveTo(3, -3); ctx.lineTo(10, 2);
      ctx.stroke();
    } else if (pose === 'crouch') {
      ctx.beginPath();
      ctx.moveTo(-1, -5); ctx.lineTo(-8, 1); ctx.lineTo(-2, 2);
      ctx.moveTo(1, -5); ctx.lineTo(-1, 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-1.5, -6); ctx.lineTo(-3, 5);
      ctx.moveTo(1.5, -6); ctx.lineTo(3, 5);
      ctx.stroke();
    }

    /* torso */
    ctx.beginPath();
    ctx.moveTo(-4, -25 - br);
    ctx.quadraticCurveTo(0, -27 - br, 4, -25 - br);
    ctx.lineTo(2.6, -7);
    ctx.lineTo(-2.6, -7);
    ctx.closePath();
    ctx.fill();

    /* arms */
    ctx.lineWidth = 2.6;
    if (pose === 'raise') {
      ctx.beginPath();
      ctx.moveTo(-3, -22); ctx.lineTo(-8, -33);
      ctx.moveTo(3, -22); ctx.lineTo(8, -33);
      ctx.stroke();
    } else if (pose === 'crouch' || pose === 'sit') {
      ctx.beginPath();
      ctx.moveTo(-3, -21); ctx.lineTo(-8, -14);
      ctx.moveTo(3, -21); ctx.lineTo(8, -13);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-3, -22); ctx.lineTo(-6, -14);
      ctx.moveTo(3, -22); ctx.lineTo(6, -14);
      ctx.stroke();
    }

    /* head, with a small top-knot */
    ctx.beginPath(); ctx.arc(0, -30, 3.7, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(0.3, -34, 1.5, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function drawAartiLamp(x, y, s, a) {
    var flick = 0.82 + 0.18 * Math.sin(time * 7.1) + 0.05 * Math.sin(time * 19);
    var g = ctx.createRadialGradient(x, y, 0, x, y, 70 * s);
    g.addColorStop(0, 'rgba(255,222,152,' + (0.55 * a) + ')');
    g.addColorStop(0.3, 'rgba(255,176,90,' + (0.20 * a) + ')');
    g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 70 * s, 0, 6.283); ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = a;

    /* the brass aarti plate */
    ctx.fillStyle = 'rgba(120,78,44,0.95)';
    ctx.beginPath(); ctx.ellipse(0, 4, 20, 4.5, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,196,110,0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 3.2, 17, 3.4, 0, 0, 6.283); ctx.stroke();

    /* five flames on little wicks */
    for (var i = -2; i <= 2; i++) {
      var fx = i * 8;
      var fy = -1 - Math.abs(i) * 1.5;
      ctx.fillStyle = 'rgba(84,56,38,0.95)';
      ctx.fillRect(fx - 0.6, fy, 1.2, 5);
      var fg = ctx.createRadialGradient(fx, fy - 6, 0, fx, fy - 6, 9);
      fg.addColorStop(0, 'rgba(255,246,205,1)');
      fg.addColorStop(0.45, 'rgba(255,196,96,0.95)');
      fg.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(fx, fy - 6, 2.6, 5.4 * flick, 0, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawAarti(p, a) {
    if (a < 0.01) return;
    var dark = figureInk(p);
    var sc = clamp(Math.min(W, H) / 900, 0.55, 1.5) * 1.2;
    var px = W * 0.792;
    var py = ghatEdgeY(0.792) + H * 0.006;
    var lx = px, ly = py - 52 * sc;
    var fx = W * 0.735, fy = ghatEdgeY(0.735) + H * 0.012;
    var gx = W * 0.848, gy = ghatEdgeY(0.848) + H * 0.010;

    ctx.save();
    ctx.globalAlpha = a;

    /* a pool of warm light on the stones */
    var wash = ctx.createRadialGradient(lx, py, 0, lx, py, 170 * sc);
    wash.addColorStop(0, 'rgba(255,196,110,0.28)');
    wash.addColorStop(0.5, 'rgba(255,160,80,0.08)');
    wash.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = wash;
    ctx.beginPath(); ctx.ellipse(lx, py, 170 * sc, 70 * sc, -0.2, 0, 6.283); ctx.fill();

    /* the priest, arms lifted, and the lamp */
    drawPerson(px, py, sc, dark, 'raise', 0.4);
    drawAartiLamp(lx, ly, sc, a);

    /* two people seated, watching, and one lighting a diya */
    drawPerson(fx, fy, sc * 0.94, dark, 'sit', 1.7);
    drawPerson(gx, gy, sc * 0.94, dark, 'sit', 3.2);
    drawPerson(W * 0.708, ghatEdgeY(0.708) + H * 0.005, sc * 0.88, dark, 'crouch', 5.1);

    /* the little lamps already set out on the steps */
    var spots = [[0.688, 0.016], [0.724, 0.024], [0.762, 0.006], [0.826, 0.020], [0.872, 0.008], [0.906, 0.026]];
    for (var i = 0; i < spots.length; i++) {
      var sx = W * spots[i][0];
      var sy = ghatEdgeY(spots[i][0]) + H * spots[i][1];
      var fl = 0.7 + 0.3 * Math.sin(time * 5.2 + i * 1.7) + 0.06 * Math.sin(time * 15 + i);
      var lg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 20 * sc);
      lg.addColorStop(0, 'rgba(255,214,140,0.55)');
      lg.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(sx, sy, 20 * sc, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(84,56,38,0.9)';
      ctx.beginPath(); ctx.ellipse(sx, sy, 4 * sc, 1.5 * sc, 0, 0, 6.283); ctx.fill();
      ctx.save();
      ctx.translate(sx, sy - 1.6 * sc);
      ctx.scale(1, fl);
      var fg = ctx.createRadialGradient(0, -2 * sc, 0, 0, -2 * sc, 5 * sc);
      fg.addColorStop(0, 'rgba(255,246,205,1)');
      fg.addColorStop(0.5, 'rgba(255,196,96,0.9)');
      fg.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(0, -2.4 * sc, 1.8 * sc, 4 * sc, 0, 0, 6.283); ctx.fill();
      ctx.restore();
    }

    /* a warm rim along the figures against the dark */
    ctx.globalAlpha = a * 0.22;
    ctx.strokeStyle = sunRim(p, 0.8);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(px, py - 30 * sc, 4.4 * sc, -2.6, -0.4);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  var lastFloat = 0;
  function drawGhatLife(p) {
    var dayA = 1 - smooth(0.62, 0.82, day);
    var nightA = smooth(0.66, 0.88, day);

    drawKids(p, dayA);
    drawFisherman(p, dayA);
    drawAarti(p, nightA);

    /* now and then a lit diya is set on the river from the steps */
    if (nightA > 0.55 && time - lastFloat > 8.5) {
      lastFloat = time;
      diyas.push({
        x: 0.78 + Math.random() * 0.16,
        y: 0.88 + Math.random() * 0.07,
        vx: -0.00028 - Math.random() * 0.00035,
        life: 1.1 + Math.random() * 0.5,
        s: 0.7 + Math.random() * 0.35,
        p: Math.random() * 6.28
      });
      if (diyas.length > 44) diyas.shift();
    }
  }

  /* a neem branch entering from the top-right, leaves swaying */
  function drawBranch(p) {
    var dark = mix([22, 30, 24], p.hill, 0.30);
    var sway = Math.sin(time * 0.55) * 4 + pX * 26;

    ctx.save();
    ctx.translate(W, -H * 0.02);
    ctx.strokeStyle = rgba(dark, 0.94);
    ctx.fillStyle = rgba(dark, 0.94);
    ctx.lineCap = 'round';

    ctx.lineWidth = Math.max(5, W * 0.008);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-W * 0.10, H * 0.02, -W * 0.18, H * 0.09, -W * 0.30 + sway, H * 0.115);
    ctx.stroke();
    ctx.lineWidth = Math.max(2.4, W * 0.0035);
    ctx.beginPath();
    ctx.moveTo(-W * 0.14, H * 0.065);
    ctx.quadraticCurveTo(-W * 0.20, H * 0.10, -W * 0.235 + sway * 0.6, H * 0.16);
    ctx.stroke();

    function leaf(x, y, rx, ry, rot, a) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    var leaves = [
      [-0.05, 0.012, 16, 7, -0.5], [-0.09, 0.030, 19, 8, -0.2], [-0.13, 0.018, 15, 6.5, 0.3],
      [-0.17, 0.052, 21, 8, -0.15], [-0.21, 0.045, 16, 7, 0.55], [-0.245, 0.070, 17, 7, -0.4],
      [-0.275, 0.058, 14, 6, 0.2], [-0.30, 0.090, 15, 6.5, -0.55], [-0.335, 0.078, 12, 5.5, 0.35],
      [-0.115, 0.075, 13, 5.5, 0.8], [-0.155, 0.105, 16, 6.5, 0.15], [-0.19, 0.135, 14, 6, -0.5],
      [-0.215, 0.165, 11, 5, 0.4], [-0.06, 0.055, 12, 5, 0.9], [-0.04, 0.085, 10, 4.5, -0.7]
    ];
    for (var i = 0; i < leaves.length; i++) {
      var L = leaves[i];
      var sw = Math.sin(time * 1.15 + i * 0.7) * (3 + i * 0.2);
      leaf(W * L[0] + sw + sway * (0.4 + L[1] * 3), H * L[1], L[2] * (W / 1400 + 0.45), L[3] * (W / 1400 + 0.45), L[4] + Math.sin(time * 0.6 + i) * 0.04, 0.9);
    }
    ctx.restore();
  }

  /* reeds and lotus in the bottom-left foreground */
  function drawReeds(p) {
    var dark = mix([20, 28, 24], p.hill, 0.26);
    ctx.save();
    ctx.translate(pX * 18, pY * 8);
    ctx.strokeStyle = rgba(dark, 0.85);
    ctx.fillStyle = rgba(dark, 0.85);

    for (var i = 0; i < 13; i++) {
      var x = W * (0.005 + i * 0.014) + Math.sin(i * 2.1) * 8;
      var h = H * (0.05 + (i % 5) * 0.026);
      var bend = Math.sin(time * 0.7 + i * 0.9) * 9;
      ctx.lineWidth = 1.1 + (i % 3) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, H + 4);
      ctx.quadraticCurveTo(x + bend * 0.4, H - h * 0.6, x + bend, H - h);
      ctx.stroke();
    }

    /* lotus pads */
    for (var k = 0; k < 4; k++) {
      var lx = W * (0.02 + k * 0.035);
      var ly = H * (0.955 + (k % 2) * 0.012);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 20 - k * 3, 5.5 - k * 0.7, -0.12, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* a single lotus flower */
    if (day < 0.88) {
      var fx = W * 0.055, fy = H * 0.925;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = rgba(mix([232, 186, 190], p.haze, 0.35));
      for (var q = 0; q < 5; q++) {
        var ang = -1.9 + q * 0.28;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(ang) * 4, fy + Math.sin(ang) * 3, 7, 2.6, ang, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawMotes(p) {
    var petals = day < 0.80;
    var fire = day > 0.70;
    if (!petals && !fire) return;

    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      var drift = time * m.sp * 4 * m.z;
      var y = ((m.y + drift * 0.9) % 1.12) - 0.06;
      var x = ((m.x + drift * 0.32 + Math.sin(time * 0.4 + m.p) * 0.012) % 1.12) - 0.06;

      if (fire && (i % 2 === 0)) {
        var blink = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.9 * m.z + m.p));
        var fy = 0.42 + ((m.y * 0.5 + drift * 0.22) % 0.58);
        var fx = ((m.x + drift * 0.18 + Math.sin(time * 0.5 + m.p) * 0.02) % 1.05);
        ctx.globalAlpha = blink * smooth(0.72, 0.92, day);
        var g = ctx.createRadialGradient(fx * W, fy * H, 0, fx * W, fy * H, 14 * m.z);
        g.addColorStop(0, 'rgba(255,226,150,0.95)');
        g.addColorStop(0.25, 'rgba(255,190,90,0.30)');
        g.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx * W, fy * H, 14 * m.z, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (petals) {
        var a = (1 - smooth(0.62, 0.80, day)) * 0.55 * m.z;
        ctx.globalAlpha = a;
        ctx.fillStyle = i % 7 === 0 ? 'rgba(232,160,120,1)' : 'rgba(250,236,226,1)';
        ctx.save();
        ctx.translate(x * W, y * H);
        ctx.rotate(m.rot + time * m.vr + Math.sin(time + m.p) * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.4 * m.z + 1, 1.1 * m.z + 0.5, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawDiyas() {
    for (var i = diyas.length - 1; i >= 0; i--) {
      var d = diyas[i];
      d.life -= 0.0016;
      d.x += d.vx;
      if (d.life <= 0) { diyas.splice(i, 1); continue; }

      var x = d.x * W, y = d.y * H + Math.sin(time * 1.2 + d.p) * H * 0.0035;
      var s = d.s;
      var flick = 0.75 + 0.25 * Math.sin(time * 6.5 + d.p) + 0.06 * Math.sin(time * 19 + d.p);
      var a = clamp(d.life * 1.6, 0, 1);

      /* water glow */
      var g = ctx.createRadialGradient(x, y, 0, x, y, 34 * s);
      g.addColorStop(0, 'rgba(255,198,116,' + (0.40 * a) + ')');
      g.addColorStop(0.4, 'rgba(255,160,70,' + (0.14 * a) + ')');
      g.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 34 * s, 0, 6.283); ctx.fill();

      /* clay bowl */
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = 'rgba(72,44,32,1)';
      ctx.beginPath();
      ctx.ellipse(x, y, 7 * s, 2.6 * s, 0, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,72,44,1)';
      ctx.beginPath();
      ctx.ellipse(x, y - 1.2 * s, 7 * s, 1.6 * s, 0, 0, 6.283);
      ctx.fill();
      /* flame */
      ctx.save();
      ctx.translate(x, y - 2 * s);
      ctx.scale(1, flick);
      var fg = ctx.createRadialGradient(0, -5 * s, 0, 0, -5 * s, 9 * s);
      fg.addColorStop(0, 'rgba(255,240,196,1)');
      fg.addColorStop(0.5, 'rgba(255,196,104,0.9)');
      fg.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(0, -5 * s, 3.2 * s, 5.8 * s, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function drawRipples() {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i];
      r.t += 0.016;
      if (r.t > 1) { ripples.splice(i, 1); continue; }
      var rad = 8 + r.t * 120;
      ctx.globalAlpha = (1 - r.t) * 0.35;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad, rad * 0.22, 0, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = (1 - r.t) * 0.18;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad * 0.6, rad * 0.13, 0, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawVignette(p) {
    var g = ctx.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, p.star > 0.5 ? 'rgba(2,6,12,0.42)' : 'rgba(12,18,16,0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── frame ────────────────────────────────────────────────── */
  function draw(now) {
    if (!W || !H) return;
    P = paletteAt(clamp(day + Math.sin(now * 0.07) * 0.004, 0, 1));

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* slight vertical drift, like breathing */
    var bob = Math.sin(now * 0.22) * 2.2;

    drawSky(P);
    drawBodies(P);
    drawClouds(P);
    ctx.save();
    ctx.translate(0, bob);
    drawHills(P);
    drawSkyline(P, 1, false);
    drawBirds(P);
    drawMist(P);
    drawWater(P);
    drawBoat(P);
    drawRipples();
    drawDiyas();
    drawGhat(P);
    drawGhatLife(P);
    drawMotes(P);
    drawReeds(P);
    drawBranch(P);
    drawVignette(P);
    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    if (!last) last = now;
    var dt = Math.min(64, now - last);
    last = now;

    target = clamp(target, 0, 1);
    /* an exponential glide, slow enough to read as light changing */
    day += (target - day) * Math.min(1, dt * 0.00085);
    time += dt / 1000;
    pX += (tpX - pX) * Math.min(1, dt * 0.0022);
    pY += (tpY - pY) * Math.min(1, dt * 0.0022);

    draw(now / 1000);
    raf = requestAnimationFrame(loop);
  }

  /* ── public ───────────────────────────────────────────────── */
  var api = {
    setTime: function (t) {
      target = clamp(t, 0, 1);
      if (reduced) { time = target; draw(performance.now() / 1000); }
    },
    setScroll: function (p) { scrollProg = p; },
    ripple: function (x, y) {
      ripples.push({ x: x, y: y, t: 0 });
      if (ripples.length > 14) ripples.shift();
    },
    releaseDiya: function (n) {
      n = n || 1;
      for (var i = 0; i < n; i++) {
        diyas.push({
          x: 0.55 + Math.random() * 0.42,
          y: 0.80 + Math.random() * 0.16,
          vx: -0.00035 - Math.random() * 0.0005,
          life: 1 + Math.random() * 0.4,
          s: 0.7 + Math.random() * 0.6,
          p: Math.random() * 6.28
        });
      }
      if (diyas.length > 44) diyas.splice(0, diyas.length - 44);
    },
    shake: function () {
      /* tiny golden ring from the moon — used by the bell */
      ripples.push({ x: W * 0.5, y: horizonY() - H * 0.10, t: 0 });
    },
    pause: function () { running = false; cancelAnimationFrame(raf); },
    resume: function () { if (!running) { running = true; last = 0; raf = requestAnimationFrame(loop); } },
    getDay: function () { return day; },
    _diag: function () { return { day: day, diyas: diyas.map(function (d) { return { x: +d.x.toFixed(3), y: +d.y.toFixed(3), s: +d.s.toFixed(2), life: +d.life.toFixed(2) }; }) }; },
    get horizon() { return horizonY(); }
  };

  window.Scene = api;

  /* ── input ────────────────────────────────────────────────── */
  window.addEventListener('pointermove', function (e) {
    tpX = (e.clientX / window.innerWidth - 0.5) * 2;
    tpY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('a,button,input,label,select,textarea,[data-no-ripple]');
    if (el) return;
    var y = e.clientY;
    if (y > horizonY() * 0.92) {
      api.ripple(e.clientX, y);
      if (window.Ambient && window.Ambient.plop) window.Ambient.plop();
    }
  }, { passive: true });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) api.pause(); else api.resume();
  });

  /* ── go ───────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { resize(); raf = requestAnimationFrame(loop); });
  } else {
    resize();
    raf = requestAnimationFrame(loop);
  }

  /* first gentle wave of diyas after load */
  window.addEventListener('load', function () {
    setTimeout(function () { api.releaseDiya(3); }, 2400);
  });
})();
