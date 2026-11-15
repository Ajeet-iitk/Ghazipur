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
    { t: 0.00, top: [26, 42, 100], bot: [92, 98, 160], water: [46, 70, 120], deep: [24, 40, 82], sun: [255, 212, 176], hill: [30, 44, 82], far: [56, 76, 124], haze: [128, 112, 142], star: 1.0, warm: 0.35 },
    { t: 0.16, top: [76, 96, 142], bot: [249, 178, 128], water: [134, 146, 162], deep: [62, 84, 104], sun: [255, 220, 168], hill: [54, 68, 82], far: [96, 108, 124], haze: [255, 206, 170], star: 0.35, warm: 0.75 },
    { t: 0.34, top: [140, 180, 214], bot: [247, 224, 190], water: [148, 182, 186], deep: [84, 130, 138], sun: [255, 250, 230], hill: [74, 102, 94], far: [128, 152, 148], haze: [250, 236, 214], star: 0.0, warm: 0.30 },
    { t: 0.55, top: [120, 176, 210], bot: [214, 234, 232], water: [118, 166, 178], deep: [62, 114, 126], sun: [255, 255, 246], hill: [66, 100, 88], far: [124, 156, 146], haze: [236, 246, 242], star: 0.0, warm: 0.15 },
    { t: 0.72, top: [112, 124, 160], bot: [247, 166, 98], water: [172, 150, 136], deep: [94, 90, 94], sun: [255, 198, 124], hill: [54, 62, 64], far: [112, 104, 102], haze: [250, 198, 148], star: 0.0, warm: 1.0 },
    { t: 0.86, top: [58, 52, 92], bot: [233, 126, 92], water: [98, 96, 122], deep: [42, 50, 76], sun: [255, 150, 112], hill: [30, 34, 52], far: [70, 66, 92], haze: [230, 140, 120], star: 0.55, warm: 0.85 },
    { t: 1.00, top: [18, 36, 98], bot: [56, 84, 150], water: [32, 58, 112], deep: [16, 34, 78], sun: [236, 240, 224], hill: [20, 36, 76], far: [44, 66, 120], haze: [96, 124, 184], star: 1.0, warm: 0.55 }
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

  /* a ripple that reaches the boatman or the fisherman rocks his boat */
  var rockB = { amp: 0, t0: 0, dir: 1 }, rockF = { amp: 0, t0: 0, dir: 1 }, boatPos = { x: -999, y: -999 }, fishPos = { x: -999, y: -999 };
  function rockOf(r) { var k = time - r.t0; return k < 0 ? 0 : r.amp * r.dir * Math.sin(k * 12) * Math.exp(-k * 1.35); }
  function stir(r, pos, cx, cy, reach) {
    var d = Math.hypot(cx - pos.x, (cy - pos.y) * 1.8);
    if (d > reach) return false;
    var resid = Math.abs(rockOf(r)) * 0.6;
    r.amp = Math.min(1, resid + 0.9 * (1 - d / reach) + 0.15);
    r.dir = cx < pos.x ? 1 : -1;
    r.t0 = time + d * 0.0016;                        /* the wave takes a moment to arrive */
    setTimeout(function () { ripples.push({ x: pos.x, y: pos.y + 14, t: 0 }); if (window.Ambient && window.Ambient.oar) window.Ambient.oar(0.3); }, d * 1.6);
    return true;
  }
  function stirBoats(cx, cy) {
    var reach = Math.max(160, W * 0.2);
    stir(rockB, boatPos, cx, cy, reach);
    stir(rockF, fishPos, cx, cy, reach);
  }

  function drawBoat(p) {
    var hz = horizonY();
    var t = time;
    var bx = W * (0.60 + 0.035 * Math.sin(t * 0.10)) + pX * 8;
    var by = hz + (H - hz) * 0.22 + Math.sin(t * 0.9) * 2.4;
    var s = Math.min(W, H) * 0.00042;
    var scale = clamp(Math.min(W, H) / 900, 0.55, 1.35);
    var dark = mix(p.hill, [10, 14, 16], 0.55);

    boatPos.x = bx; boatPos.y = by + curBob;
    var rk = rockOf(rockB);
    ctx.save();
    ctx.translate(bx + rk * 9, by + Math.abs(rk) * 3);
    ctx.rotate(rk * 0.22);
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
  /* ── the temple bells, hung under the chhatri on the ghat ───────── */
  var bellState = [{ a: 0, ph: 0 }, { a: 0, ph: 1.3 }, { a: 0, ph: 2.6 }], bellHits = [], curBob = 0, lastBellAt = 0;

  function drawTempleBells(px0, py0, pw, ph, stone, p) {
    var y0 = py0 - ph * 0.72 + 1, L = ph * 0.2, r = clamp(Math.min(W, H) / 900, 0.6, 1.4) * 7.5;
    var brass = mix([222, 170, 70], p.hill, 0.12);
    bellHits = [];
    for (var i = 0; i < 3; i++) {
      var x = px0 + pw * (0.2 + i * 0.3), b = bellState[i];
      b.a *= 0.985;
      var ang = b.a * Math.sin(time * 9 + b.ph) * 0.9;
      var glint = 0.5 + 0.5 * Math.sin(time * 1.5 + i * 1.7);
      ctx.save();
      ctx.translate(x, y0); ctx.rotate(ang);
      ctx.strokeStyle = rgba(stone, 0.8); ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, L); ctx.stroke();
      if (b.a > 0.05 || glint > 0.9) {
        var gl = ctx.createRadialGradient(0, L + r, 0, 0, L + r, r * 3.4);
        gl.addColorStop(0, 'rgba(255,214,140,' + (0.1 + b.a * 0.5 + (glint > 0.9 ? 0.14 : 0)) + ')'); gl.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, L + r, r * 3.4, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = rgba(brass);
      ctx.beginPath(); ctx.arc(0, L + r * 0.6, r, Math.PI, 0); ctx.lineTo(r * 1.2, L + r * 1.5); ctx.lineTo(-r * 1.2, L + r * 1.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba(mix(brass, [120, 80, 30], 0.4)); ctx.fillRect(-r * 1.2, L + r * 1.4, r * 2.4, r * 0.28);
      ctx.fillStyle = rgba(mix(brass, [255, 240, 200], 0.4), 0.8);
      ctx.beginPath(); ctx.ellipse(-r * 0.35, L + r * 0.2, r * 0.18, r * 0.5, 0.2, 0, 6.283); ctx.fill();
      ctx.restore();
      bellHits.push({ x: x + pX * 20, y: y0 + L + r + pY * 10 + curBob, r: Math.max(26, r * 3.4) });
    }
  }

  function ringBell(i, amp) {
    bellState[i].a = Math.max(bellState[i].a, amp || 0.8);
    if (window.Ambient && window.Ambient.templeBell) window.Ambient.templeBell(i * 2 + Math.floor(Math.random() * 2));
  }
  function ringAllBells() {
    var now = performance.now();
    if (now - lastBellAt < 700) return;
    lastBellAt = now;
    [0, 1, 2].forEach(function (i) { setTimeout(function () { ringBell(i, 0.9); }, i * 140 + Math.random() * 50); });
  }
  function bellAt(x, y) {
    for (var i = 0; i < bellHits.length; i++) {
      var h = bellHits[i];
      if (Math.hypot(x - h.x, y - h.y) < h.r) { ringBell(i, 0.85); return true; }
    }
    return false;
  }

  /* shake the phone: a sharp swing of the accelerometer rings every bell */
  var shakeOn = false, lastAcc = null;
  function onMotion(e) {
    var a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    if (lastAcc) {
      var d = Math.abs(a.x - lastAcc.x) + Math.abs(a.y - lastAcc.y) + Math.abs(a.z - lastAcc.z);
      if (d > 24) ringAllBells();
    }
    lastAcc = { x: a.x, y: a.y, z: a.z };
  }
  function enableShake() {
    if (shakeOn || typeof DeviceMotionEvent === 'undefined') return;
    var go = function () { shakeOn = true; window.addEventListener('devicemotion', onMotion); };
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(function (s) { if (s === 'granted') go(); }).catch(function () {});
    } else go();
  }
  window.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') enableShake(); }, { once: true, passive: true });

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
    drawTempleBells(px0, py0, pw, ph, stone, p);

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
  /* ── three boys, one football: a proper game of passes ───────── */
  var fb = { holder: 0, target: 1, phase: 'hold', t0: -1, passes: 0, cheer: 0, puffs: [], spin: 0 };
  var KIDCOL = [[196, 84, 70], [70, 112, 168], [226, 178, 66]];
  var lastKidsT = 0;
  var WALKERS = [
    { ph: 0.00, sp: 0.020, lane: 0.030, col: [190, 70, 90], item: 'pot', v: 2 },
    { ph: 0.30, sp: 0.016, lane: 0.052, col: [70, 120, 96], item: 'bag', v: 0 },
    { ph: 0.55, sp: 0.022, lane: 0.040, col: [214, 150, 60], v: 1 },
    { ph: 0.78, sp: 0.014, lane: 0.075, col: [96, 90, 160], item: 'pot', v: 2 },
    { ph: 0.12, sp: 0.018, lane: 0.095, col: [180, 60, 60], v: 0 },
    { ph: 0.66, sp: 0.012, lane: 0.115, col: [60, 100, 140], item: 'bag', v: 1 },
    { ph: 0.90, sp: 0.017, lane: 0.062, col: [226, 190, 90], item: 'pot', v: 2 }
  ];

  function drawKid(x, y, s, ph, dark, o) {
    o = o || {};
    var dir = o.dir || 1, kick = o.kick || 0, cheer = o.cheer || 0, moving = o.moving ? 1 : 0;
    var sp = o.fast ? 12 : 6, scared = !!o.scared;
    var sw = Math.sin(time * sp + ph) * (moving ? 1 : 0.25);
    var jump = cheer ? Math.abs(Math.sin(time * 9 + ph)) * 6 : (moving ? Math.abs(Math.sin(time * sp + ph)) * (o.fast ? 3 : 2.2) : 0);
    var shirt = rgba(mix(dark, o.col || KIDCOL[o.v || 0], 0.5), 0.97), shorts = rgba(mix(dark, [240, 236, 224], 0.18), 0.97);
    var skin = rgba(mix(dark, [150, 98, 64], 0.45), 0.97);

    /* shadow */
    ctx.save();
    ctx.globalAlpha *= 0.28; ctx.fillStyle = rgba(dark);
    ctx.beginPath(); ctx.ellipse(x, y + 1.5, 9 * s, 2.6 * s, -0.17, 0, 6.283); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y - jump * s);
    ctx.scale(dir * s, s);
    ctx.lineCap = 'round';

    /* legs: planted + swinging or kicking */
    ctx.strokeStyle = skin; ctx.lineWidth = 3.6;
    var fx = kick > 0 ? 3 + kick * 9 : sw * 4.4, fy = kick > 0 ? 4.2 - kick * 5 : 4.5;
    ctx.beginPath();
    ctx.moveTo(1, -6); ctx.lineTo(kick > 0 ? -2 : -sw * 4.4, 4.5);
    ctx.moveTo(1, -6); ctx.lineTo(fx, fy);
    ctx.stroke();
    /* boots */
    ctx.fillStyle = rgba(dark, 0.98);
    ctx.beginPath(); ctx.ellipse(kick > 0 ? -2 : -sw * 4.4, 4.9, 2.4, 1.3, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx + 0.6, fy + 0.5, 2.4, 1.3, kick * 0.8, 0, 6.283); ctx.fill();

    /* shorts and shirt */
    ctx.fillStyle = shorts;
    ctx.beginPath(); ctx.moveTo(-3.2, -9.5); ctx.lineTo(3.8, -9.5); ctx.lineTo(4.2, -4.6); ctx.lineTo(-3.6, -4.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.moveTo(-3.2, -17); ctx.quadraticCurveTo(0.4, -19, 3.6, -17);
    ctx.lineTo(3.6, -9.2); ctx.lineTo(-3.2, -9.2); ctx.closePath(); ctx.fill();
    /* a stripe on the shirt */
    ctx.strokeStyle = rgba(mix(shirt.match ? [255, 255, 255] : [255, 255, 255], KIDCOL[o.v || 0], 0.2), 0.55); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3, -13.4); ctx.lineTo(3.4, -13.4); ctx.stroke();

    /* arms */
    ctx.strokeStyle = skin; ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (cheer || scared) {
      ctx.moveTo(-2.4, -16); ctx.lineTo(-7, -24 - Math.sin(time * 12 + ph) * 1.5);
      ctx.moveTo(3, -16); ctx.lineTo(8, -24 + Math.sin(time * 12 + ph) * 1.5);
    } else if (kick > 0) {
      ctx.moveTo(-2.4, -16); ctx.lineTo(-7 - kick * 2, -13);
      ctx.moveTo(3, -16); ctx.lineTo(7 + kick * 3, -19 - kick * 2);
    } else {
      ctx.moveTo(-2.4, -16); ctx.lineTo(-5.5 - sw * 3, -12 + sw * 1.8);
      ctx.moveTo(3, -16); ctx.lineTo(6 + sw * 3, -12 - sw * 1.8);
    }
    ctx.stroke();

    if (o.item === 'pot') {
      ctx.fillStyle = rgba(mix([200, 140, 60], dark, 0.25), 0.98);
      ctx.beginPath(); ctx.arc(7.5, -9.5, 2.6, 0, 6.283); ctx.fill();
      ctx.fillRect(6.4, -13, 2.2, 2);
    } else if (o.item === 'bag') {
      ctx.fillStyle = rgba(mix([120, 90, 60], dark, 0.3), 0.98);
      ctx.fillRect(5, -12, 4.4, 5.4);
    }

    /* head, hair or cap */
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0.6, -22.2, 3.7, 0, 6.283); ctx.fill();
    if (o.v === 1) {                                   /* a cap */
      ctx.fillStyle = rgba(mix(dark, [240, 232, 210], 0.4), 0.98);
      ctx.beginPath(); ctx.arc(0.4, -23, 3.8, Math.PI, 0); ctx.fill();
      ctx.fillRect(1, -23.4, 5, 1.5);
    } else {
      ctx.fillStyle = rgba(dark, 0.98);
      ctx.beginPath(); ctx.arc(0.2, -23.2, 3.9, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
      if (o.v === 2) { ctx.beginPath(); ctx.arc(-2.6, -21.4, 1.8, 0, 6.283); ctx.fill(); }
    }
    ctx.restore();
  }

  /* ── the children follow the weather: they walk, they do not teleport ── */
  var kidS = [0, 1, 2].map(function () { return { x: 0, y: 0, init: false, moving: false, dir: 1, switchAt: 0, fromFlee: false }; });
  var xKids = [0, 1, 2, 3].map(function () { return { x: 0, y: 0, init: false, moving: false, dir: 1, switchAt: 0 }; });
  var kidMode = 'play', walkA = 0;

  function drawKids(p, a) {
    if (a < 0.01) return;
    var dark = figureInk(p);
    var sc = clamp(Math.min(W, H) / 900, 0.55, 1.5) * 1.5;
    var base = [0.648, 0.716, 0.784];
    var HOLD = 1.1, PASS = 0.9;
    if (fb.t0 < 0) fb.t0 = time;
    var dtk = lastKidsT ? Math.min(0.1, Math.max(0, time - lastKidsT)) : 0; lastKidsT = time;
    var hz = horizonY(), bar = BARS[3], bdep = 0.55 + bar[1] * 0.9;
    var barC = { x: bar[0] * W + pX * 10 * bdep, y: hz + (H - hz) * bar[1] };
    var barRx = W * bar[2] * 0.5 * Math.max(sum, 0.25);
    var edgeX = W * 1.12, edgeYof = function (x) { return ghatEdgeY(clamp(x / W, 0, 1)); };

    /* what the sky asks of them (with a little hysteresis so they do not dither) */
    var want = kidMode;
    if (mon > 0.3) want = 'flee';
    else if (mon >= 0.12) { if (kidMode === 'wade') want = 'play'; }
    else if (sum > 0.4) want = 'wade';
    else if (sum < 0.2) want = 'play';
    else if (kidMode === 'flee') want = 'play';
    if (want !== kidMode) {
      kidMode = want;
      kidS.forEach(function (k, i) { k.switchAt = time + 0.2 + i * 0.5 + Math.random() * 0.25; if (kidMode === 'flee') k.fromFlee = true; });
      xKids.forEach(function (k, i) { k.switchAt = time + 0.8 + i * 1.1; });
    }

    var step = function (k, tx, ty, speed, snapY) {
      if (time < k.switchAt) { k.moving = false; return; }
      var dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy), mv = Math.min(d, speed * dtk);
      if (d > 0.01) { k.x += dx / d * mv; k.y += dy / d * mv; }
      k.moving = d > 3;
      if (k.moving && Math.abs(dx) > 1.5) k.dir = dx > 0 ? 1 : -1;
    };

    /* the three boys */
    kidS.forEach(function (k, i) {
      var hx = W * base[i] + Math.sin(time * 0.9 + i * 2.1) * W * 0.0025, hy = ghatEdgeY(base[i]) + H * (0.008 + i * 0.002);
      if (!k.init) { k.x = hx; k.y = hy; k.init = true; }
      if (kidMode === 'flee') {
        step(k, edgeX, 0, W * 0.17);
        k.y = edgeYof(k.x) + H * (0.008 + i * 0.002);
      } else if (kidMode === 'wade') {
        step(k, barC.x + (i - 1) * barRx * 0.5, barC.y + H * (i === 1 ? -0.006 : 0.008), W * 0.04);
      } else if (k.fromFlee) {
        step(k, hx, hy, W * 0.07);
        k.y = edgeYof(k.x) + H * (0.008 + i * 0.002);
        if (!k.moving && time >= k.switchAt) k.fromFlee = false;
      } else {
        step(k, hx, hy, W * 0.05);
      }
    });
    var anyMoving = kidS.some(function (k) { return k.moving; });
    var away = kidMode === 'flee' || anyMoving || time < kidS[2].switchAt;
    var gone = kidMode === 'flee' && kidS.every(function (k) { return k.x > W * 1.03; });

    /* the football waits for them */
    if (away) {
      fb.t0 += dtk;
      if (fb.phase === 'pass') { fb.holder = fb.target; fb.phase = 'hold'; fb.t0 = time; }
    }
    var el = time - fb.t0;
    if (!away) {
      if (fb.phase === 'hold' && el > HOLD) {
        var others = [0, 1, 2].filter(function (i) { return i !== fb.holder; });
        fb.target = others[Math.random() < 0.5 ? 0 : 1];
        fb.phase = 'pass'; fb.t0 = time; el = 0;
      } else if (fb.phase === 'pass' && el > PASS) {
        fb.holder = fb.target; fb.phase = 'hold'; fb.t0 = time; el = 0; fb.passes++;
        if (fb.passes % 6 === 0) fb.cheer = time + 1.7;
      }
    }
    var cheering = time < fb.cheer && !away;

    var pos = kidS.map(function (k) { return { x: k.x, y: k.y }; });
    var lead = fb.phase === 'pass' ? fb.target : fb.holder;
    if (!away) pos[lead].x += W * 0.006 * Math.sin(time * 1.6);

    /* where the ball is */
    var foot = function (i, d) { return { x: pos[i].x + d * 9 * sc, y: pos[i].y + 0.5 }; };
    var bp, br = 4.3 * sc;
    var from = foot(fb.holder, pos[fb.target].x >= pos[fb.holder].x ? 1 : -1);
    if (fb.phase === 'hold') {
      var d1 = (pos[(fb.holder + 1) % 3].x > pos[fb.holder].x) ? 1 : -1;
      bp = foot(fb.holder, d1);
      bp.y -= Math.abs(Math.sin(time * 8)) * 3.4 * sc * (away ? 0.3 : 1) + br * 0.4;
    } else {
      var u = el / PASS, dst = foot(fb.target, pos[fb.holder].x >= pos[fb.target].x ? 1 : -1);
      bp = { x: lerp(from.x, dst.x, u), y: lerp(from.y, dst.y, u) - H * 0.075 * Math.sin(Math.PI * u) * (1 - 0.3 * u) - br * 0.4 };
    }
    if (kidMode === 'flee') {                           /* left behind on the steps */
      if (!fb.rest) fb.rest = { x: bp.x, y: bp.y + br * 0.4 };
      bp = { x: fb.rest.x, y: fb.rest.y - br * 0.4 };
    } else if (fb.rest) {                               /* picked up again, gently */
      fb.rest.x += (bp.x - fb.rest.x) * Math.min(1, dtk * 5); fb.rest.y += ((bp.y + br * 0.4) - fb.rest.y) * Math.min(1, dtk * 5);
      if (Math.hypot(bp.x - fb.rest.x, bp.y + br * 0.4 - fb.rest.y) < 6) fb.rest = null;
      else bp = { x: fb.rest.x, y: fb.rest.y - br * 0.4 };
    }
    fb.spin += (fb.phase === 'pass' ? 0.4 : 0.12);

    var kicker = fb.holder, kk = 0;
    if (away) kk = 0;
    else if (fb.phase === 'hold' && el > HOLD - 0.28) kk = (el - (HOLD - 0.28)) / 0.28;
    else if (fb.phase === 'pass' && el < 0.22) kk = 1 - el / 0.22;
    if (!away && fb.phase === 'pass' && el < 0.04 && (!fb.puffs.length || time - fb.puffs[fb.puffs.length - 1].t > 0.5)) {
      fb.puffs.push({ x: from.x, y: from.y + 3, t: time });
      if (fb.puffs.length > 5) fb.puffs.shift();
    }

    /* the walkers fade in and out slowly, so the crowd changes gently */
    var clearNow = kidMode === 'play' && mon < 0.12 && sum < 0.12 ? 1 : 0;
    walkA += (clearNow - walkA) * Math.min(1, dtk * 0.55);

    ctx.save();
    ctx.globalAlpha = a;

    if (walkA > 0.02) {
      ctx.save();
      WALKERS.map(function (w) {
        var f = (time * w.sp + w.ph) % 1, uu = f < 0.5 ? f * 2 : 2 - f * 2, xn = 0.585 + 0.395 * uu;
        return { w: w, dir: f < 0.5 ? 1 : -1, x: W * xn, y: ghatEdgeY(xn) + H * w.lane };
      }).sort(function (m, n) { return m.y - n.y; }).forEach(function (q) {
        ctx.globalAlpha = a * walkA;
        drawKid(q.x, q.y, sc * (1.18 + q.w.lane * 1.6), q.w.ph * 9, dark, { v: q.w.v, col: q.w.col, item: q.w.item, dir: q.dir, moving: true });
      });
      ctx.restore();
    }

    /* a long evening shadow across the steps */
    if (!gone) {
      ctx.globalAlpha = a * 0.18; ctx.fillStyle = rgba(dark);
      ctx.beginPath(); ctx.ellipse((pos[0].x + pos[2].x) / 2, (pos[0].y + pos[2].y) / 2 + 5, W * 0.1, 4, -0.17, 0, 6.283); ctx.fill();
      ctx.globalAlpha = a;
    }

    /* dust kicked up */
    for (var i = fb.puffs.length - 1; i >= 0; i--) {
      var pf = fb.puffs[i], kq = (time - pf.t) / 0.7;
      if (kq > 1) { fb.puffs.splice(i, 1); continue; }
      ctx.globalAlpha = a * (1 - kq) * 0.35;
      ctx.fillStyle = rgba(mix(p.haze, [230, 214, 190], 0.4));
      ctx.beginPath(); ctx.ellipse(pf.x - kq * 6, pf.y - kq * 7, 4 + kq * 12, 2 + kq * 5, 0, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = a;

    /* the ball's shadow stays on the ground */
    var gy0 = (away ? bp.y + br * 0.4 : (fb.phase === 'hold' ? pos[fb.holder].y : lerp(from.y, foot(fb.target, 1).y, (time - fb.t0) / PASS))) + 3;
    var hAbove = clamp((gy0 - bp.y) / (H * 0.08), 0, 1);
    ctx.globalAlpha = a * (0.3 - hAbove * 0.18); ctx.fillStyle = rgba(dark);
    ctx.beginPath(); ctx.ellipse(bp.x, gy0, br * (1.1 - hAbove * 0.4), br * 0.34, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = a;

    /* the boys, back to front */
    var inWater = function (x, y) {
      var onBar = sum > 0.3 && Math.abs(x - barC.x) < barRx && Math.abs(y - barC.y) < H * 0.05;
      return !onBar && y < ghatEdgeY(clamp(x / W, 0, 1)) - H * 0.014;
    };
    [0, 1, 2].sort(function (m, n) { return pos[m].y - pos[n].y; }).forEach(function (i) {
      var k = kidS[i], q = pos[i];
      if (q.x > W * 1.04) return;                       /* up the steps and gone */
      var fleeing = kidMode === 'flee' && k.moving, faceX = k.moving ? k.dir : (bp.x >= q.x ? 1 : -1);
      var receiving = fb.phase === 'pass' && i === fb.target;
      var ks = lerp(1, 0.8, clamp((ghatEdgeY(base[i]) - q.y) / (H * 0.1), 0, 1));
      if (k.moving && inWater(q.x, q.y)) {              /* ripples round the ankles */
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = rgba(mix(p.haze, [255, 255, 255], 0.5)); ctx.lineWidth = 1;
        var rr = (time * 1.6 + i) % 1;
        ctx.beginPath(); ctx.ellipse(q.x, q.y + 2, 6 + rr * 12, 2 + rr * 4, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = a;
      }
      drawKid(q.x, q.y, sc * (1 - i * 0.03) * ks, i * 2.3 + 0.4, dark, {
        v: i, dir: faceX, kick: i === kicker ? kk : 0, cheer: cheering,
        scared: fleeing, fast: fleeing, moving: k.moving || (!cheering && (receiving || (fb.phase === 'hold' && i === fb.holder)))
      });
    });

    /* summer: more children wade out across the shallows to join them */
    xKids.forEach(function (k, i) {
      var sx = W * 1.06, sy = edgeYof(W * 0.95);
      if (!k.init) { k.x = sx; k.y = sy; k.init = true; }
      var ang = time * (0.55 + i * 0.1) + i * 1.9;
      var gx = barC.x + Math.cos(ang) * barRx * (0.7 + 0.15 * (i % 2)), gyy = barC.y + Math.sin(ang * 1.3) * H * 0.012 + H * 0.01;
      if (kidMode === 'wade') step(k, gx, gyy, W * 0.045);
      else step(k, sx, sy, W * 0.05);
      var arrived = kidMode === 'wade' && Math.hypot(gx - k.x, gyy - k.y) < 24;
      if (k.x > W * 1.03) return;
      var fadeIn = smooth(W * 1.03, W * 0.98, k.x);
      ctx.globalAlpha = a * fadeIn;
      if (k.moving && inWater(k.x, k.y)) {
        ctx.strokeStyle = rgba(mix(p.haze, [255, 255, 255], 0.5)); ctx.lineWidth = 1; ctx.globalAlpha = a * fadeIn * 0.5;
        var r2 = (time * 1.8 + i) % 1; ctx.beginPath(); ctx.ellipse(k.x, k.y + 2, 6 + r2 * 12, 2 + r2 * 4, 0, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = a * fadeIn;
      }
      drawKid(k.x, k.y, sc * 0.78 * (0.94 - i * 0.02), i * 1.7 + 3, dark, {
        v: (i + 1) % 3, col: [[90, 160, 120], [214, 110, 150], [120, 120, 200], [230, 140, 70]][i],
        dir: k.moving ? k.dir : (Math.cos(ang) > 0 ? -1 : 1), moving: k.moving || arrived, cheer: arrived && Math.sin(time * 0.8 + i * 2) > 0.7
      });
    });
    ctx.globalAlpha = a;

    /* the ball: a glow, a trail, a white ball with turning patches */
    var glow = ctx.createRadialGradient(bp.x, bp.y, 0, bp.x, bp.y, br * 4);
    glow.addColorStop(0, 'rgba(255,218,150,0.32)'); glow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bp.x, bp.y, br * 4, 0, 6.283); ctx.fill();
    if (fb.phase === 'pass' && !away) {
      for (var t = 1; t <= 4; t++) {
        var uu2 = clamp((time - fb.t0) / PASS - t * 0.035, 0, 1);
        var tx = lerp(from.x, foot(fb.target, pos[fb.holder].x >= pos[fb.target].x ? 1 : -1).x, uu2);
        var ty = lerp(from.y, foot(fb.target, 1).y, uu2) - H * 0.075 * Math.sin(Math.PI * uu2) * (1 - 0.3 * uu2) - br * 0.4;
        ctx.globalAlpha = a * (0.22 - t * 0.045); ctx.fillStyle = rgba([255, 244, 220]);
        ctx.beginPath(); ctx.arc(tx, ty, br * (1 - t * 0.12), 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = a;
    }
    ctx.save();
    ctx.translate(bp.x, bp.y); ctx.rotate(fb.spin);
    ctx.fillStyle = rgba(mix([246, 242, 228], p.sun, 0.2));
    ctx.beginPath(); ctx.arc(0, 0, br, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgba(mix([40, 40, 46], p.hill, 0.3), 0.85);
    ctx.beginPath(); ctx.arc(0, 0, br * 0.36, 0, 6.283); ctx.fill();
    for (var q2 = 0; q2 < 5; q2++) {
      var an = q2 * 1.2566; ctx.beginPath(); ctx.arc(Math.cos(an) * br * 0.78, Math.sin(an) * br * 0.78, br * 0.2, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = sunRim(p, 0.55); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(bp.x, bp.y, br, -0.9, 0.9); ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ── bathers and a diver in the Ganga (summer and clear days) ──────── */
  var bathVis = 0, lastBathT = 0, splashP = [];
  var dive = { phase: 'idle', t0: 0, nextAt: 3 };
  var BATH = [
    { xn: 0.598, kind: 'pour', ph: 0.4, col: null, lift: 0.032 },
    { xn: 0.640, kind: 'pray', ph: 2.1, col: [196, 84, 110], lift: 0.034 },
    { xn: 0.676, kind: 'dunk', ph: 4.0, col: null, lift: 0.036 },
    { xn: 0.612, kind: 'scrub', ph: 5.2, col: [70, 120, 150], lift: 0.062 }
  ];

  function bathSpot(b) { return { x: W * b.xn, y: ghatEdgeY(b.xn) - H * b.lift }; }

  function drawBather(x, y, s, dark, a, o) {
    var skin = rgba(mix(dark, [150, 98, 64], 0.5), 0.97), t = time + o.ph;
    var dunk = o.kind === 'dunk' ? smooth(0.55, 0.9, Math.sin(t * 0.7)) : 0;       /* ducks right under */
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 40 * s, y - 70 * s, 80 * s, 70 * s); ctx.clip();
    ctx.translate(x, y + dunk * 30 * s);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    var torso = o.col ? rgba(mix(dark, o.col, 0.5), 0.97) : skin;
    ctx.fillStyle = torso;
    ctx.beginPath(); ctx.moveTo(-4.4, 2); ctx.lineTo(-4, -16); ctx.quadraticCurveTo(0, -19, 4.4, -16); ctx.lineTo(4.6, 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = skin; ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (o.kind === 'pour') {
      var tilt = 0.5 + 0.5 * Math.sin(t * 1.3);
      ctx.moveTo(-3, -15); ctx.lineTo(-6, -9); ctx.moveTo(3, -15); ctx.lineTo(8, -26);
      ctx.stroke();
      ctx.fillStyle = rgba(mix([210, 150, 70], dark, 0.2), 0.98);
      ctx.beginPath(); ctx.ellipse(8.5, -29, 3, 2.6, 0.4 + tilt * 0.8, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(210,235,245,' + (0.35 + 0.35 * tilt) + ')'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(7, -27.5); ctx.quadraticCurveTo(5, -24, 1.5, -21); ctx.stroke();
    } else if (o.kind === 'pray') {
      var sway = Math.sin(t * 0.8) * 1.2;
      ctx.moveTo(-3, -15); ctx.lineTo(-3.5 + sway, -26); ctx.lineTo(0 + sway, -34);
      ctx.moveTo(3, -15); ctx.lineTo(3.5 + sway, -26); ctx.lineTo(0 + sway, -34);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,224,160,' + (0.4 + 0.3 * Math.sin(t * 2.2)) + ')';
      ctx.beginPath(); ctx.arc(0 + sway, -35.5, 2.2, 0, 6.283); ctx.fill();
    } else if (o.kind === 'scrub') {
      var sw2 = Math.sin(t * 5);
      ctx.moveTo(-3, -15); ctx.lineTo(-7, -22); ctx.lineTo(-2 + sw2 * 3, -27);
      ctx.moveTo(3, -15); ctx.lineTo(7, -22); ctx.lineTo(2 - sw2 * 3, -27);
      ctx.stroke();
    } else {
      ctx.moveTo(-3, -15); ctx.lineTo(-9, -11 + Math.sin(t * 2) * 2); ctx.moveTo(3, -15); ctx.lineTo(9, -11 - Math.sin(t * 2) * 2);
      ctx.stroke();
    }
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, -21.6, 3.8, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgba(dark, 0.98);
    ctx.beginPath(); ctx.arc(0, -22.6, 4, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    if (o.col) { ctx.beginPath(); ctx.arc(-3, -21, 1.9, 0, 6.283); ctx.fill(); }
    ctx.restore();
    /* the water line round the waist, and rings spreading */
    ctx.save();
    ctx.globalAlpha = a * 0.55; ctx.strokeStyle = rgba(mix([255, 255, 255], dark, 0.1)); ctx.lineWidth = 1.1;
    for (var r = 0; r < 2; r++) {
      var rr = (time * 0.7 + r * 0.5 + o.ph) % 1;
      ctx.globalAlpha = a * 0.5 * (1 - rr);
      ctx.beginPath(); ctx.ellipse(x, y + 1, (8 + rr * 20) * s, (2.4 + rr * 6) * s, 0, 0, 6.283); ctx.stroke();
    }
    ctx.restore();
    if (dunk > 0.5) {                                      /* bubbles where he went under */
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (var bb = 0; bb < 3; bb++) { ctx.beginPath(); ctx.arc(x + Math.sin(time * 3 + bb) * 4 * s, y - ((time * 12 + bb * 5) % 14) * s * 0.5, 1.4 * s, 0, 6.283); ctx.fill(); }
    }
  }

  function drawBathers(p, dayA) {
    var dt = lastBathT ? Math.min(0.1, Math.max(0, time - lastBathT)) : 0; lastBathT = time;
    var target = (mon < 0.12 ? 1 : 0) * dayA;
    bathVis += (target - bathVis) * Math.min(1, dt * 0.7);
    if (bathVis < 0.02 && splashP.length === 0) return;
    var dark = figureInk(p), sc = clamp(Math.min(W, H) / 900, 0.55, 1.5) * 1.5, a = bathVis;

    ctx.save();
    ctx.globalAlpha = a;
    BATH.forEach(function (b, i) {
      var q = bathSpot(b);
      drawBather(q.x + Math.sin(time * 0.5 + b.ph) * 1.2, q.y + Math.sin(time * 1.1 + b.ph) * 0.8, sc * (0.95 - i * 0.02), dark, a, b);
    });
    ctx.restore();

    /* a boy dives from the steps now and then */
    var S = { x: W * 0.745, y: ghatEdgeY(0.745) - H * 0.004 }, E = { x: W * 0.662, y: ghatEdgeY(0.662) - H * 0.036 };
    var el = time - dive.t0;
    if (dive.phase === 'idle' && time > dive.nextAt && a > 0.6) { dive.phase = 'run'; dive.t0 = time; el = 0; }
    else if (dive.phase === 'run' && el > 0.55) { dive.phase = 'jump'; dive.t0 = time; el = 0; }
    else if (dive.phase === 'jump' && el > 1.0) {
      dive.phase = 'under'; dive.t0 = time; el = 0;
      for (var k = 0; k < 16; k++) splashP.push({ x: E.x + (Math.random() - 0.5) * 8, y: E.y, vx: (Math.random() - 0.5) * 70, vy: -50 - Math.random() * 70, life: 0.8 + Math.random() * 0.4 });
      ripples.push({ x: E.x, y: E.y + 3, t: 0 }); setTimeout(function () { ripples.push({ x: E.x + 6, y: E.y + 5, t: 0 }); }, 180);
      if (window.Ambient && window.Ambient.splash) window.Ambient.splash(1);
    }
    else if (dive.phase === 'under' && el > 1.4) { dive.phase = 'surf'; dive.t0 = time; el = 0; ripples.push({ x: E.x - W * 0.028, y: E.y + 2, t: 0 }); if (window.Ambient && window.Ambient.splash) window.Ambient.splash(0.4); }
    else if (dive.phase === 'surf' && el > 2.6) { dive.phase = 'idle'; dive.nextAt = time + 6 + Math.random() * 4; }

    var ds = sc * 0.95;
    if (dive.phase === 'run' || dive.phase === 'jump') {
      var u = dive.phase === 'run' ? 0 : el / 1.0, jx, jy, ang;
      if (dive.phase === 'run') { jx = S.x + Math.sin(el * 18) * 0.5; jy = S.y; ang = 0; }
      else {
        jx = lerp(S.x, E.x, u); jy = lerp(S.y, E.y, u * u) - H * 0.1 * Math.sin(Math.PI * u) * (1 - 0.25 * u);
        ang = -2.5 * smooth(0.25, 0.95, u);
      }
      ctx.save();
      ctx.globalAlpha = bathVis;
      ctx.translate(jx, jy); ctx.scale(ds, ds); ctx.rotate(ang); ctx.lineCap = 'round';
      var skin = rgba(mix(dark, [150, 98, 64], 0.5), 0.97);
      ctx.strokeStyle = skin; ctx.lineWidth = 3;
      var tuck = dive.phase === 'jump' ? 1 : 0;
      ctx.beginPath();                                    /* legs */
      ctx.moveTo(0, -4); ctx.lineTo(-1 - tuck * 2, 7); ctx.moveTo(1, -4); ctx.lineTo(1 + tuck * 1, 7);
      ctx.stroke();
      ctx.fillStyle = rgba(mix(dark, [235, 235, 225], 0.2), 0.97);   /* shorts */
      ctx.fillRect(-3, -9, 6.4, 6);
      ctx.fillStyle = skin;                                /* torso */
      ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-3.4, -17); ctx.quadraticCurveTo(0, -19, 3.6, -17); ctx.lineTo(3.4, -9); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.beginPath();                                    /* arms: up and forward for the dive */
      if (dive.phase === 'jump') { ctx.moveTo(-2, -16); ctx.lineTo(-1, -30); ctx.moveTo(2, -16); ctx.lineTo(1, -30); }
      else { ctx.moveTo(-2, -16); ctx.lineTo(-6, -11); ctx.moveTo(2, -16); ctx.lineTo(6, -11); }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -22, 3.7, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(dark, 0.98); ctx.beginPath(); ctx.arc(0, -23, 3.9, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
      ctx.restore();
    } else if (dive.phase === 'under') {
      var uu = el / 1.4, ux = E.x - W * 0.03 * uu, uy = E.y + 6;
      ctx.save();
      ctx.globalAlpha = bathVis * 0.28 * Math.sin(Math.PI * Math.min(1, uu * 1.1));
      ctx.fillStyle = rgba(dark);
      ctx.beginPath(); ctx.ellipse(ux, uy, 16 * ds, 4.5 * ds, -0.05, 0, 6.283); ctx.fill();
      ctx.globalAlpha = bathVis * 0.6; ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (var bq = 0; bq < 4; bq++) { ctx.beginPath(); ctx.arc(ux + 8 * ds - bq * 7 * ds, uy - ((time * 14 + bq * 6) % 16), 1.5, 0, 6.283); ctx.fill(); }
      ctx.restore();
    } else if (dive.phase === 'surf') {
      var fa = Math.min(1, el / 0.3, (2.6 - el) / 0.5);
      ctx.save(); ctx.globalAlpha = bathVis * fa;
      drawBather(E.x - W * 0.03, E.y + 5, ds, dark, bathVis * fa, { kind: 'scrub', ph: 1.7, col: null });
      ctx.restore();
    }

    /* droplets */
    for (var i2 = splashP.length - 1; i2 >= 0; i2--) {
      var sp = splashP[i2];
      sp.life -= dt; sp.vy += 220 * dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt;
      if (sp.life <= 0) { splashP.splice(i2, 1); continue; }
      ctx.globalAlpha = Math.min(1, sp.life * 2) * 0.8; ctx.fillStyle = 'rgba(235,246,250,1)';
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.8, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFisherman(p, a) {
    if (a < 0.01) return;
    var dark = figureInk(p);
    var u = clamp(Math.min(W, H) / 900, 0.55, 1.45) * 1.15;
    var bob = Math.sin(time * 0.82) * 2.2;
    var x = W * 0.485, y = H * 0.845 + bob;
    var cyc = (time % 7.4) / 7.4;
    fishPos.x = x; fishPos.y = y + curBob;
    var rf = rockOf(rockF);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x + rf * 8, y + Math.abs(rf) * 3);
    ctx.rotate(rf * 0.2);
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
    drawBathers(p, dayA);
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
    applySeason(P);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* slight vertical drift, like breathing */
    var bob = Math.sin(now * 0.22) * 2.2;
    curBob = bob;

    drawSky(P);
    drawBodies(P);
    drawClouds(P);
    drawStorm(P);
    ctx.save();
    ctx.translate(0, bob);
    drawHills(P);
    drawSkyline(P, 1, false);
    drawBirds(P);
    drawMist(P);
    drawWater(P);
    drawSandbars(P);
    drawBoat(P);
    drawWildlife(P);
    drawRipples();
    drawDiyas();
    drawGhat(P);
    drawGhatLife(P);
    drawFlood(P);
    drawMotes(P);
    drawReeds(P);
    drawBranch(P);
    drawRain();
    drawLightning();
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

    updateNature(dt / 1000);
    draw(now / 1000);
    raf = requestAnimationFrame(loop);
  }


  /* ── seasons: summer sandbars, monsoon rain and flood ─────────── */
  var season = 0.5, seasonTarget = 0.5, mon = 0, sum = 0;
  var drops = [], splashes = [], bolt = null, flashA = 0, nextBolt = 5;
  var wildlife = [], nextWild = 7;

  function R(a, b) { return a + Math.random() * (b - a); }
  function lum(c) { return (c[0] + c[1] + c[2]) / 3; }
  function greyer(c, m) { var g = lum(c); return mix(c, [g * 0.84 + 4, g * 0.92 + 9, g + 17], m); }
  function muddier(c, m) { var g = lum(c); return mix(c, [g * 1.05 + 20, g * 0.82 + 12, g * 0.55 + 6], m); }

  function applySeason(p) {
    mon = clamp((season - 0.5) * 2, 0, 1);
    sum = clamp((0.5 - season) * 2, 0, 1);
    if (mon > 0.001) {
      var m = mon * 0.62;
      p.top = greyer(p.top, m); p.bot = greyer(p.bot, m); p.haze = greyer(p.haze, m);
      p.far = greyer(p.far, m * 0.8); p.sun = greyer(p.sun, m);
      p.water = muddier(p.water, mon * 0.7); p.deep = muddier(p.deep, mon * 0.6);
      p.star *= 1 - mon * 0.85; p.warm *= 1 - mon * 0.7;
    }
    if (sum > 0.001) {
      var dayness = 1 - p.star;
      p.bot = mix(p.bot, [255, 214, 150], sum * 0.22 * dayness);
      p.haze = mix(p.haze, [255, 226, 176], sum * 0.3 * dayness);
      p.water = mix(p.water, [150, 190, 176], sum * 0.18 * dayness);
    }
  }

  /* the river shrinks: pale sandbars rise out of it */
  var BARS = [[0.22, 0.26, 0.22, 0.032], [0.50, 0.40, 0.28, 0.042], [0.30, 0.60, 0.32, 0.058], [0.76, 0.50, 0.20, 0.046], [0.10, 0.82, 0.24, 0.052]];
  function drawSandbars(p) {
    if (sum < 0.02) return;
    var hz = horizonY();
    var sand = mix(mix([226, 202, 156], p.haze, 0.18), p.deep, p.star * 0.78);
    var hi = mix(sand, [255, 244, 214], 0.35);
    /* a dry strip under the far bank */
    var sg = ctx.createLinearGradient(0, hz, 0, hz + H * 0.03);
    sg.addColorStop(0, rgba(sand, 0.0));
    sg.addColorStop(0.3, rgba(sand, 0.55 * sum));
    sg.addColorStop(1, rgba(sand, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(0, hz, W, H * 0.03);
    for (var i = 0; i < BARS.length; i++) {
      var b = BARS[i];
      var depth = 0.55 + b[1] * 0.9;
      var cx = b[0] * W + pX * 10 * depth;
      var cy = hz + (H - hz) * b[1];
      var rx = W * b[2] * 0.5 * sum, ry = H * b[3] * sum * depth;
      var g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
      g.addColorStop(0, rgba(hi, 0.96));
      g.addColorStop(1, rgba(sand, 0.96));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgba(mix(p.haze, [255, 255, 255], 0.4), 0.3 * sum);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 1, rx * 1.03, ry * 1.12, 0, 0.1, Math.PI - 0.1); ctx.stroke();
      /* sedge tufts */
      ctx.strokeStyle = rgba(mix([96, 120, 72], p.deep, p.star * 0.7), 0.85 * sum);
      ctx.lineWidth = 1.1;
      for (var k = 0; k < 6; k++) {
        var tx = cx + (k - 2.5) * rx * 0.26, ty = cy - ry * 0.35 + (k % 2) * ry * 0.3;
        ctx.beginPath();
        ctx.moveTo(tx, ty); ctx.lineTo(tx - 2, ty - 7 * depth);
        ctx.moveTo(tx, ty); ctx.lineTo(tx + 2.5, ty - 6 * depth);
        ctx.stroke();
      }
    }
  }

  /* the monsoon river climbs the ghat steps */
  function drawFlood(p) {
    if (mon < 0.02) return;
    var yl = H + 4 - H * 0.415 * (0.10 + 0.62 * mon);
    ctx.save();
    ctx.translate(pX * 20, pY * 10);
    var baseX = W * 0.60;
    ctx.beginPath();
    ctx.moveTo(baseX - W * 0.04, H + 4); ctx.lineTo(W + 4, H * 0.585); ctx.lineTo(W + 4, H + 4); ctx.closePath();
    ctx.clip();
    var col = muddier(mix(p.water, p.deep, 0.15), 0.75);
    var g = ctx.createLinearGradient(0, yl, 0, H);
    g.addColorStop(0, rgba(col, 0.9));
    g.addColorStop(1, rgba(mix(col, p.deep, 0.5), 0.96));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H + 8);
    for (var x = 0; x <= W + 8; x += 14) {
      ctx.lineTo(x, yl + Math.sin(x * 0.021 + time * 1.7) * 3 + Math.sin(x * 0.047 - time * 2.3) * 1.6);
    }
    ctx.lineTo(W + 8, H + 8);
    ctx.closePath();
    ctx.fill();
    /* foam and swirl */
    ctx.strokeStyle = rgba(mix(p.haze, [255, 255, 255], 0.5), 0.34);
    ctx.lineWidth = 1.2;
    for (var f = 0; f < 9; f++) {
      var fx = ((f * 0.131 + time * 0.035) % 1.1) * W;
      var fy = yl + 8 + (f % 4) * 15;
      ctx.beginPath();
      ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + 14, fy - 3, fx + 30, fy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStorm(p) {
    if (mon < 0.02) return;
    var hz = horizonY();
    var g = ctx.createLinearGradient(0, 0, 0, hz + 4);
    g.addColorStop(0, rgba([34, 42, 58], 0.64 * mon));
    g.addColorStop(1, rgba([76, 86, 102], 0.14 * mon));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, hz + 4);
  }

  function drawRain() {
    if (mon < 0.02) return;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(214,226,240,1)';
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      ctx.globalAlpha = d.a * mon;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * 0.18, d.y + d.len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(230,238,248,1)';
    for (var j = 0; j < splashes.length; j++) {
      var s = splashes[j];
      ctx.globalAlpha = (1 - s.t) * 0.45 * mon;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 2 + s.t * 9, 0.8 + s.t * 3, 0, 0, 6.283);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function strike() {
    flashA = 1;
    var x = R(0.12, 0.88) * W, y = 0, pts = [[x, 0]];
    var end = horizonY() * R(0.8, 1.0);
    while (y < end) { y += R(14, 34); x += R(-22, 22); pts.push([x, y]); }
    bolt = pts;
    nextBolt = R(5, 12);
    setTimeout(function () { if (window.Ambient && window.Ambient.thunder) window.Ambient.thunder(); }, R(350, 1500));
  }

  function drawLightning() {
    if (flashA <= 0.01) return;
    var f = flashA * (0.72 + 0.28 * Math.sin(time * 70));
    ctx.fillStyle = 'rgba(214,226,255,' + (0.36 * f) + ')';
    ctx.fillRect(0, 0, W, H);
    if (bolt && flashA > 0.4) {
      ctx.lineJoin = 'round';
      [[7, 0.14], [3.2, 0.35], [1.4, 0.95]].forEach(function (o) {
        ctx.strokeStyle = 'rgba(236,242,255,' + (o[1] * flashA) + ')';
        ctx.lineWidth = o[0];
        ctx.beginPath();
        ctx.moveTo(bolt[0][0], bolt[0][1]);
        for (var i = 1; i < bolt.length; i++) ctx.lineTo(bolt[i][0], bolt[i][1]);
        ctx.stroke();
      });
    }
  }

  /* ── wildlife: Gangetic dolphin, bar-headed geese, ruddy shelduck ── */
  function wk() { return clamp(Math.min(W, H) / 900, 0.6, 1.3); }

  function spawnWild(id) {
    var hz = horizonY(), dir = Math.random() < 0.5 ? -1 : 1;
    var r = Math.random();
    if (!id) id = r < 0.42 ? 'dolphin' : r < 0.74 ? 'geese' : 'ducks';
    var u = (H - hz);
    if (id === 'dolphin') {
      var f = R(0.30, 0.58);
      wildlife.push({ id: id, t: 0, dur: R(1.5, 1.9), dir: dir, x0: (dir > 0 ? R(0.12, 0.58) : R(0.42, 0.86)) * W, yb: hz + u * f, k: wk() * (0.7 + f * 0.7), in: false, out: false, hx: -999, hy: -999, vis: false });
    } else if (id === 'geese') {
      wildlife.push({ id: id, t: 0, dur: R(17, 23), dir: dir, y: R(0.10, 0.26) * H, n: 5 + Math.floor(R(0, 3)), pts: [] });
    } else {
      var f2 = R(0.2, 0.5);
      wildlife.push({ id: 'ducks', t: 0, dur: R(22, 28), dir: dir, yb: hz + u * f2, k: wk() * (0.7 + f2 * 0.7), n: 3 + Math.floor(R(0, 2)), pts: [] });
    }
  }

  function updateNature(dt) {
    season += (seasonTarget - season) * Math.min(1, dt * 1.1);
    if (Math.abs(seasonTarget - season) < 0.002) season = seasonTarget;

    var m = clamp((season - 0.5) * 2, 0, 1);
    var want = Math.floor(230 * m);
    while (drops.length < want) drops.push({ x: R(-0.1, 1.1) * W, y: R(-H, H), v: R(900, 1350), len: R(11, 22), a: R(0.18, 0.42) });
    while (drops.length > want) drops.pop();
    var hz = horizonY();
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt; d.x -= d.v * 0.18 * dt;
      if (d.y > H) {
        d.y = R(-60, -10); d.x = R(0, 1.2) * W;
        if (splashes.length < 70 && Math.random() < 0.45) splashes.push({ x: R(0, 1) * W, y: hz + R(0.05, 0.95) * (H - hz), t: 0 });
      }
    }
    for (var j = splashes.length - 1; j >= 0; j--) {
      splashes[j].t += dt * 2.2;
      if (splashes[j].t >= 1) splashes.splice(j, 1);
    }
    if (m > 0.6) { nextBolt -= dt; if (nextBolt <= 0) strike(); }
    flashA = Math.max(0, flashA - dt * 1.9);

    /* wildlife */
    nextWild -= dt;
    if (nextWild <= 0) {
      if (wildlife.length < 3) spawnWild();
      nextWild = R(14, 28);
    }
    for (var w = wildlife.length - 1; w >= 0; w--) {
      var a = wildlife[w];
      a.t += dt;
      if (a.t >= a.dur) wildlife.splice(w, 1);
    }
  }

  function wildInk(p, a) {
    return rgba(mix(mix([226, 228, 234], p.hill, 0.2), p.deep, p.star * 0.6), a === undefined ? 1 : a);
  }

  function drawDolphin(p, a) {
    var u = a.t / a.dur, k = a.k;
    var span = W * 0.11, ah = H * 0.05 * (0.7 + k * 0.3);
    var x = a.x0 + a.dir * u * span;
    var y = a.yb - Math.sin(Math.PI * u) * ah;
    var ang = Math.atan2(-Math.cos(Math.PI * u) * Math.PI * ah, span);
    if (!a.in && u > 0.05) { a.in = true; ripples.push({ x: a.x0 + a.dir * 0.05 * span, y: a.yb, t: 0 }); if (window.Ambient && window.Ambient.splash) window.Ambient.splash(0.7); }
    if (!a.out && u > 0.95) { a.out = true; ripples.push({ x: a.x0 + a.dir * span, y: a.yb, t: 0 }); if (window.Ambient && window.Ambient.splash) window.Ambient.splash(1); }
    a.hx = x; a.hy = y; a.vis = u > 0.06 && u < 0.94;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, a.yb + 1); ctx.clip();
    ctx.translate(x, y);
    ctx.scale(a.dir, 1);
    ctx.rotate(ang);
    var body = mix(mix([104, 112, 120], p.hill, 0.2), p.deep, p.star * 0.55);
    ctx.fillStyle = rgba(body);
    ctx.beginPath(); ctx.ellipse(0, 0, 16 * k, 5.6 * k, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14 * k, -1.4 * k); ctx.lineTo(31 * k, 0.2 * k); ctx.lineTo(14 * k, 2.6 * k); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3 * k, -4.8 * k); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-10.5 * k, -3.6 * k); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14 * k, 0); ctx.lineTo(-25 * k, -5.5 * k); ctx.lineTo(-22 * k, 0); ctx.lineTo(-25 * k, 5.5 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(mix(body, [236, 232, 226], 0.35), 0.8);
    ctx.beginPath(); ctx.ellipse(1 * k, 2.4 * k, 12 * k, 2.2 * k, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(20,24,26,0.8)';
    ctx.beginPath(); ctx.arc(11 * k, -1.4 * k, 0.9 * k, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function drawGeese(p, a) {
    var u = a.t / a.dur, k = wk();
    var x = a.dir > 0 ? -0.08 * W + u * 1.16 * W : 1.08 * W - u * 1.16 * W;
    var y = a.y + Math.sin(u * 7) * H * 0.008;
    a.pts = [];
    ctx.strokeStyle = wildInk(p, 0.92);
    ctx.fillStyle = wildInk(p, 0.92);
    ctx.lineCap = 'round';
    for (var i = 0; i < a.n; i++) {
      var rank = Math.ceil(i / 2), side = i === 0 ? 0 : (i % 2 ? 1 : -1);
      var bx = x - a.dir * rank * W * 0.017;
      var by = y + side * rank * H * 0.013 + Math.sin(time * 1.3 + i) * 1.5;
      a.pts.push([bx, by]);
      var fl = Math.sin(time * 5.2 + i * 0.9) * 0.55;
      var wl = 9 * k;
      ctx.lineWidth = 1.7 * k;
      ctx.beginPath();
      ctx.moveTo(bx - wl, by - fl * wl);
      ctx.quadraticCurveTo(bx - wl * 0.4, by - fl * wl * 0.5 - 1.5, bx, by);
      ctx.quadraticCurveTo(bx + wl * 0.4, by - fl * wl * 0.5 - 1.5, bx + wl, by - fl * wl);
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx, by, 2.8 * k, 1.5 * k, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + a.dir * 3.6 * k, by - 0.6 * k, 1.1 * k, 0, 6.283); ctx.fill();
    }
  }

  function drawDucks(p, a) {
    var u = a.t / a.dur, k = a.k;
    var x = a.dir > 0 ? -0.06 * W + u * 1.12 * W : 1.06 * W - u * 1.12 * W;
    a.pts = [];
    var fade = Math.min(1, u * 8, (1 - u) * 8);
    var orange = mix([204, 112, 52], p.deep, p.star * 0.6);
    var cream = mix([228, 196, 152], p.deep, p.star * 0.6);
    for (var i = 0; i < a.n; i++) {
      var bx = x - a.dir * i * 20 * k;
      var by = a.yb + (i % 2 ? 7 : -3) * k + Math.sin(time * 1.8 + i * 1.4) * 1.2;
      a.pts.push([bx, by - 3 * k]);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = rgba(mix(p.haze, [255, 255, 255], 0.4), 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - a.dir * 8 * k, by + 1.5 * k); ctx.lineTo(bx - a.dir * (20 + i * 2) * k, by - 1 * k);
      ctx.moveTo(bx - a.dir * 8 * k, by + 2.5 * k); ctx.lineTo(bx - a.dir * (20 + i * 2) * k, by + 5 * k);
      ctx.stroke();
      ctx.fillStyle = rgba(orange, 0.95);
      ctx.beginPath(); ctx.ellipse(bx, by, 7.4 * k, 3.6 * k, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + a.dir * 6.4 * k, by - 3.4 * k, 2.5 * k, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(cream, 0.95);
      ctx.beginPath(); ctx.arc(bx + a.dir * 7 * k, by - 3.8 * k, 1.6 * k, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(30,26,22,0.9)';
      ctx.beginPath(); ctx.ellipse(bx - a.dir * 6 * k, by - 0.4 * k, 1.8 * k, 1.5 * k, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.18 * fade;
      ctx.fillStyle = rgba(orange);
      ctx.beginPath(); ctx.ellipse(bx, by + 5 * k, 6 * k, 1.6 * k, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawWildlife(p) {
    for (var i = 0; i < wildlife.length; i++) {
      var a = wildlife[i];
      if (a.id === 'dolphin') drawDolphin(p, a);
      else if (a.id === 'geese') drawGeese(p, a);
      else drawDucks(p, a);
    }
  }

  /* a tap that lands on an animal logs it in the field journal */
  function spotAt(x, y) {
    for (var i = wildlife.length - 1; i >= 0; i--) {
      var a = wildlife[i], hit = false, r = 40 * wk();
      if (a.id === 'dolphin') {
        hit = a.vis && Math.hypot(x - a.hx, y - a.hy) < r * 1.1;
      } else {
        var pts = a.pts || [];
        for (var q = 0; q < pts.length; q++) { if (Math.hypot(x - pts[q][0], y - pts[q][1]) < r * 0.8) { hit = true; break; } }
      }
      if (hit) {
        ripples.push({ x: x, y: y, t: 0 });
        document.dispatchEvent(new CustomEvent('gzp:spot', { detail: { id: a.id } }));
        return true;
      }
    }
    return false;
  }

  /* ── public ───────────────────────────────────────────────── */
  var api = {
    setTime: function (t) {
      target = clamp(t, 0, 1);
      if (reduced) { time = target; draw(performance.now() / 1000); }
    },
    setScroll: function (p) { scrollProg = p; },
    setSeason: function (name) {
      seasonTarget = name === 'summer' ? 0 : name === 'monsoon' ? 1 : 0.5;
      if (reduced) { season = seasonTarget; draw(performance.now() / 1000); }
      else if (name === 'monsoon') nextBolt = Math.min(nextBolt, 3.5);
    },
    getSeason: function () { return seasonTarget === 0 ? 'summer' : seasonTarget === 1 ? 'monsoon' : 'normal'; },
    callWild: function (id) { spawnWild(id); },
    ringBells: ringAllBells,
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

  /* water click: drip.mp3, a fresh clone each time so rapid clicks overlap */
  var dripSrc = 'assets/audio/drip.mp3', dripBase = null;
  function dripSound() {
    var A = window.Ambient;
    if (A && A.sfxEnabled && !A.sfxEnabled()) return;
    try {
      if (!dripBase) { dripBase = new Audio(dripSrc); dripBase.preload = 'auto'; }
      var a = dripBase.cloneNode();
      var m = A && A.getMaster ? A.getMaster() : 0.7;
      a.volume = Math.max(0.25, Math.min(1, m + 0.15));
      var pr = a.play(); if (pr && pr.catch) pr.catch(function () {});
    } catch (err) {}
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('a,button,input,label,select,textarea,[data-no-ripple]');
    if (el) return;
    if (bellAt(e.clientX, e.clientY)) return;
    if (spotAt(e.clientX, e.clientY)) { if (window.Ambient && window.Ambient.coin) window.Ambient.coin(); return; }
    var y = e.clientY;
    if (y > horizonY() * 0.92) {
      api.ripple(e.clientX, y);
      stirBoats(e.clientX, y);
      dripSound();
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
