/* ══════════════════════════════════════════════════════════════
   NAAV — a small boat on the Ganga.
   A self-contained canvas game: row, steer, gather diyas.
   Drawing and physics are hand-made; sound comes from Ambient.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.getElementById('naav');
  var stage = document.getElementById('naavStage');
  var canvas = document.getElementById('naavCanvas');
  if (!root || !stage || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var $ = function (s) { return root.querySelector(s); };
  var el = {
    time: $('#naavTime'),
    dist: $('#naavDist'),
    score: $('#naavScore'),
    best: $('#naavBest'),
    tip: $('#naavTip'),
    over: $('#naavOver'),
    result: $('#naavResult'),
    bestLine: $('#naavBestLine'),
    close: $('#naavClose'),
    again: $('#naavAgain'),
    quit: $('#naavQuit')
  };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var open = false, running = false, over = false;
  var raf = 0, last = 0, clock = 0;
  var W = 0, H = 0, DPR = 1;

  var DURATION = 75;
  var timeLeft = DURATION;
  var score = 0, dist = 0;
  var night = store.get('gzp.naav.level') === 'night';
  function bestKey() { return night ? 'gzp.naav.best.night' : 'gzp.naav.best'; }
  function loadBest() { return parseInt(store.get(bestKey()) || (night ? '0' : store.get('gzp.naav.best')) || '0', 10) || 0; }
  var best = loadBest();
  var currents = [], cT = 6;

  var boat = { x: 0.5, speed: 0, heading: 0, stroke: 0, cool: 0, bob: 0 };
  var steer = 0, rowHeld = false;
  var spawnT = 0, logT = 0, fishT = 0, wakeT = 0, hudT = 0;
  var shake = 0, flash = 0;
  var diyas = [], logs = [], rings = [], sparks = [], fishes = [];
  var tipTimer = null;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || '';
  }
  function tpl(s, o) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ── size ─────────────────────────────────────────────────── */
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(320, r.width);
    H = Math.max(360, r.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ── state ────────────────────────────────────────────────── */
  function reset() {
    timeLeft = DURATION;
    score = 0;
    dist = 0;
    clock = 0;
    over = false;
    shake = 0;
    flash = 0;
    boat.x = 0.5; boat.speed = 0; boat.heading = 0; boat.stroke = 0; boat.cool = 0;
    steer = 0; rowHeld = false;
    diyas = []; logs = []; rings = []; sparks = []; fishes = []; currents = [];
    spawnT = 0.4; logT = night ? 3.5 : 5; fishT = 2.5; wakeT = 0; hudT = 0; cT = night ? 4.5 : 7;
    best = loadBest();
    if (el.over) el.over.hidden = true;
    root.classList.remove('is-over');
    if (el.tip) {
      el.tip.textContent = L(night ? 'naav.tipNight' : 'naav.tip');
      el.tip.style.opacity = '';
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () {
        if (el.tip) el.tip.style.opacity = '0';
      }, 4200);
    }
    hud(true);
  }

  function showTip(text) {
    if (!el.tip) return;
    el.tip.textContent = text;
    el.tip.style.opacity = '1';
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { if (el.tip) el.tip.style.opacity = '0'; }, 3200);
  }

  function hud(force) {
    if (!force && hudT > 0) return;
    hudT = 0.1;
    if (el.time) el.time.textContent = Math.max(0, Math.ceil(timeLeft)) + L('naav.sec');
    if (el.dist) el.dist.textContent = Math.round(dist) + ' m';
    if (el.score) el.score.textContent = score;
    if (el.best) el.best.textContent = best;
  }

  function end() {
    over = true;
    rowHeld = false;
    steer = 0;
    boat.speed *= 0.4;
    var isBest = score > best;
    if (isBest) { best = score; store.set(bestKey(), String(best)); }
    if (el.result) el.result.textContent = tpl(L('naav.result'), { m: Math.round(dist), d: score });
    if (el.bestLine) {
      var line = tpl(L('naav.bestLine'), { d: best });
      if (isBest) line = L('naav.newBest') + ' ' + line;
      el.bestLine.textContent = line;
    }
    if (el.over) el.over.hidden = false;
    root.classList.add('is-over');
    hud(true);
    if (window.Ambient && window.Ambient.coin) window.Ambient.coin();
    if (el.again) setTimeout(function () { try { el.again.focus(); } catch (e) {} }, 60);
  }

  /* ── update ───────────────────────────────────────────────── */
  function update(dt) {
    clock += dt;
    if (!over) {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; end(); }
    }

    /* rowing: one stroke every 0.42 s while the button is held */
    boat.cool -= dt;
    if (rowHeld && !over && boat.cool <= 0) {
      boat.cool = 0.42;
      boat.stroke = 1;
      boat.speed = Math.min(340, boat.speed + 175);
      if (window.Ambient && window.Ambient.oar) window.Ambient.oar(0.9 + boat.speed / 340);
    }
    boat.stroke = Math.max(0, boat.stroke - dt * 3.2);
    boat.speed *= Math.max(0, 1 - 1.05 * dt);
    if (boat.speed < 3) boat.speed = 0;

    /* steering and drift */
    var drift = Math.sin(clock * 0.55) * 0.07;
    boat.x += (steer * (0.12 + boat.speed / 340 * 0.30) + drift * 0.16) * dt;
    boat.x = clamp(boat.x, 0.13, 0.87);
    var hTarget = steer * (0.16 + boat.speed / 340 * 0.13) + (boat.x - 0.5) * 0.12;
    boat.heading += (hTarget - boat.heading) * Math.min(1, dt * 4.2);
    boat.bob = Math.sin(clock * 1.5) * 2.2;

    if (!over) dist += boat.speed * dt * 0.062;

    /* wake and ripples */
    wakeT -= dt;
    if (boat.speed > 70 && wakeT <= 0) {
      wakeT = 0.14;
      rings.push({ x: boat.x * W + rnd(-8, 8), y: H * 0.72 + 34, r: 4, life: 1, alpha: 0.3 });
      if (!reduced) {
        sparks.push({ x: boat.x * W + rnd(-18, 18), y: H * 0.72 + 26, vx: rnd(-30, 30), vy: rnd(-10, 30), life: 0.5, r: rnd(1, 2.4) });
      }
    }

    /* diyas drift down the current */
    spawnT -= dt;
    if (spawnT <= 0 && !over) {
      spawnT = rnd(0.72, 1.15);
      diyas.push({
        x: rnd(0.16, 0.84) * W,
        y: -26,
        vy: 62 + rnd(0, 34) + boat.speed * 0.13,
        ph: rnd(0, 6.28),
        s: rnd(0.8, 1.2)
      });
    }
    var bx = boat.x * W, by = H * 0.72 + boat.bob;
    for (var i = diyas.length - 1; i >= 0; i--) {
      var d = diyas[i];
      d.y += d.vy * dt;
      d.x += Math.sin(clock * 1.2 + d.ph) * 12 * dt;
      if (d.y > H + 40) { diyas.splice(i, 1); continue; }
      var dx = d.x - bx, dy = d.y - by;
      if (!over && dx * dx + dy * dy < 34 * 34) {
        diyas.splice(i, 1);
        score++;
        flash = 0.5;
        rings.push({ x: d.x, y: d.y, r: 6, life: 1, alpha: 0.55 });
        for (var s = 0; s < 8; s++) {
          sparks.push({ x: d.x, y: d.y, vx: rnd(-60, 60), vy: rnd(-70, 10), life: rnd(0.4, 0.9), r: rnd(1, 2.6), warm: true });
        }
        if (window.Ambient && window.Ambient.coin) window.Ambient.coin();
        hud(true);
      }
    }

    /* the occasional drifting log */
    logT -= dt;
    if (logT <= 0 && !over) {
      logT = night ? rnd(3.6, 6.4) : rnd(5.5, 9);
      logs.push({ x: rnd(0.18, 0.82) * W, y: -40, vx: rnd(-14, 14), vy: 74 + boat.speed * 0.15, rot: rnd(-0.4, 0.4), len: rnd(38, 62) });
    }
    for (var j = logs.length - 1; j >= 0; j--) {
      var g = logs[j];
      g.y += g.vy * dt;
      g.x += g.vx * dt;
      g.rot += 0.22 * dt;
      if (g.y > H + 50) { logs.splice(j, 1); continue; }
      var gx = g.x - bx, gy = g.y - by;
      if (!over && gx * gx + gy * gy < 36 * 36) {
        logs.splice(j, 1);
        boat.speed *= 0.45;
        shake = 0.5;
        rings.push({ x: g.x, y: g.y, r: 8, life: 1, alpha: 0.4 });
        if (window.Ambient && window.Ambient.thud) window.Ambient.thud();
      }
    }

    /* cross-currents: a band of fast water that shoves the boat sideways */
    cT -= dt;
    if (cT <= 0 && !over) {
      cT = night ? rnd(5.5, 8.5) : rnd(8, 12);
      currents.push({ y: -70, h: rnd(84, 124), dir: Math.random() < 0.5 ? -1 : 1, str: rnd(0.17, 0.27) * (night ? 1.25 : 1), warned: false });
    }
    for (var ci = currents.length - 1; ci >= 0; ci--) {
      var cu = currents[ci];
      cu.y += (70 + boat.speed * 0.15) * dt;
      if (cu.y - cu.h > H + 20) { currents.splice(ci, 1); continue; }
      if (!cu.warned && cu.y > 30) {
        cu.warned = true;
        showTip(L('naav.current'));
      }
      if (!over && Math.abs(cu.y - by) < cu.h / 2) {
        var edge = 1 - Math.abs(cu.y - by) / (cu.h / 2) * 0.4;
        boat.x = clamp(boat.x + cu.dir * cu.str * edge * dt, 0.13, 0.87);
        boat.heading += cu.dir * 0.9 * dt;
        if (Math.random() < dt * 14) rings.push({ x: bx + rnd(-26, 26), y: by + rnd(10, 36), r: 3, life: 0.8, alpha: 0.4 });
      }
    }

    /* fish, now and then */
    fishT -= dt;
    if (fishT <= 0) {
      fishT = rnd(3.2, 6.5);
      fishes.push({ x: rnd(0.12, 0.88) * W, y: rnd(0.44, 0.66) * H, t: 0, dir: Math.random() < 0.5 ? -1 : 1, ph: rnd(0, 6.28) });
    }
    for (var f = fishes.length - 1; f >= 0; f--) {
      fishes[f].t += dt / 1.1;
      if (fishes[f].t >= 1) fishes.splice(f, 1);
    }

    /* particles & rings */
    for (var p = sparks.length - 1; p >= 0; p--) {
      var q = sparks[p];
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 60 * dt;
      q.life -= dt;
      if (q.life <= 0) sparks.splice(p, 1);
    }
    for (var r = rings.length - 1; r >= 0; r--) {
      rings[r].r += 26 * dt;
      rings[r].life -= dt * 0.9;
      if (rings[r].life <= 0) rings.splice(r, 1);
    }

    shake = Math.max(0, shake - dt * 2.4);
    flash = Math.max(0, flash - dt * 3);
    hudT -= dt;
    hud(false);
  }

  /* ── drawing ──────────────────────────────────────────────── */
  function drawSky() {
    var hz = H * 0.30;
    var g = ctx.createLinearGradient(0, 0, 0, hz + 6);
    if (night) {
      g.addColorStop(0, '#0b1535');
      g.addColorStop(0.5, '#1c2e68');
      g.addColorStop(0.85, '#3a5594');
      g.addColorStop(1, '#6a86bc');
    } else {
      g.addColorStop(0, '#20303c');
      g.addColorStop(0.45, '#6c4d5a');
      g.addColorStop(0.78, '#cf835c');
      g.addColorStop(1, '#f2bd82');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, hz + 6);

    /* the last star */
    ctx.fillStyle = 'rgba(255,246,224,0.5)';
    var ns = night ? 64 : 18;
    for (var i = 0; i < ns; i++) {
      var x = ((i * 0.173 + 0.03) % 1) * W;
      var y = (0.03 + (i * 0.061) % 0.17) * H;
      ctx.globalAlpha = (night ? 0.4 : 0.25) + 0.4 * Math.abs(Math.sin(clock * 0.8 + i));
      ctx.fillRect(x, y, night ? 1.9 : 1.4, night ? 1.9 : 1.4);
    }
    ctx.globalAlpha = 1;

    /* the low sun */
    var sx = W * 0.74, sy = hz - H * 0.055;
    var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.min(W, H) * 0.30);
    sg.addColorStop(0, night ? 'rgba(206,224,255,0.50)' : 'rgba(255,226,168,0.55)');
    sg.addColorStop(0.3, night ? 'rgba(150,180,240,0.16)' : 'rgba(255,190,124,0.16)');
    sg.addColorStop(1, night ? 'rgba(130,160,230,0)' : 'rgba(255,180,110,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, hz + 10);
    ctx.fillStyle = night ? 'rgba(238,244,255,0.92)' : 'rgba(255,228,172,0.85)';
    ctx.beginPath(); ctx.arc(sx, sy, Math.min(W, H) * 0.035, 0, 6.283); ctx.fill();
  }

  function drawBank() {
    var hz = H * 0.30;
    var off = (dist * 2.4) % W;

    /* far bank: domes, a temple, a low ridge */
    ctx.save();
    ctx.fillStyle = night ? 'rgba(12,18,42,0.95)' : 'rgba(52,40,40,0.92)';
    ctx.beginPath();
    ctx.moveTo(-60, hz + 6);
    for (var x = -60; x < W + 80; x += 52) {
      var h = 7 + Math.abs(Math.sin((x + off) * 0.013)) * 16;
      ctx.lineTo(x, hz - h);
      ctx.lineTo(x + 28, hz - h * 0.55);
    }
    ctx.lineTo(W + 80, hz + 8);
    ctx.closePath();
    ctx.fill();

    for (var i = 0; i < 9; i++) {
      var bx = ((i * 0.16 * W + off * 0.55) % (W + 180)) - 90;
      var bw = 26 + (i % 3) * 12;
      var bh = 20 + (i % 4) * 9;
      ctx.fillStyle = night ? 'rgba(10,15,36,0.97)' : 'rgba(44,35,36,0.95)';
      ctx.fillRect(bx, hz - bh, bw, bh);
      ctx.beginPath();
      ctx.arc(bx + bw / 2, hz - bh, bw * 0.42, Math.PI, 0);
      ctx.fill();
      if (i % 3 === 0) {
        ctx.fillRect(bx + bw * 0.47, hz - bh - bw * 0.7, 1.6, bw * 0.32);
        ctx.beginPath(); ctx.arc(bx + bw * 0.5, hz - bh - bw * 0.72, 2.2, 0, 6.283); ctx.fill();
      }
    }
    ctx.restore();

    /* mist at the join */
    var mg = ctx.createLinearGradient(0, hz - 12, 0, hz + 20);
    var mc = night ? '150,176,230' : '255,220,178';
    mg.addColorStop(0, 'rgba(' + mc + ',0)');
    mg.addColorStop(0.55, 'rgba(' + mc + ',0.20)');
    mg.addColorStop(1, 'rgba(' + mc + ',0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, hz - 12, W, 34);
  }

  function drawWater() {
    var hz = H * 0.30;
    var g = ctx.createLinearGradient(0, hz, 0, H);
    if (night) {
      g.addColorStop(0, '#5a76ac');
      g.addColorStop(0.18, '#2c4380');
      g.addColorStop(0.55, '#1a2a5c');
      g.addColorStop(1, '#0d1738');
    } else {
      g.addColorStop(0, '#d9a273');
      g.addColorStop(0.18, '#9c9790');
      g.addColorStop(0.55, '#536c6d');
      g.addColorStop(1, '#22383d');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, hz, W, H - hz);

    /* the sun's broken column */
    var sx = W * 0.74;
    for (var i = 0; i < 22; i++) {
      var q = i / 22;
      var y = hz + Math.pow(q, 1.6) * (H - hz) * 0.9;
      var ww = Math.min(W, H) * 0.03 * (1.2 - q) * (0.55 + 0.45 * Math.sin(i * 1.7 + clock * 2));
      ctx.globalAlpha = 0.22 * (1 - q * 0.8);
      ctx.fillStyle = night ? '#dfe9ff' : '#ffe6b4';
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(sx - ww / 2, y, ww, 1.8, 1.8); ctx.fill(); }
      else ctx.fillRect(sx - ww / 2, y, ww, 1.8);
    }
    ctx.globalAlpha = 1;

    /* current lines, moving toward the boat */
    var off = (dist * 6) % 80;
    for (var k = 0; k < 26; k++) {
      var f = k / 26;
      var yy = hz + Math.pow(f, 1.5) * (H - hz) + ((off + k * 37) % 70);
      if (yy > H) yy -= (H - hz);
      var len = W * (0.02 + (1 - f) * 0.07) * (0.5 + 0.5 * Math.sin(k * 2.1 + clock * 0.9));
      var xx = ((k * 0.173 + clock * 0.02) % 1.1) * W - len * 0.5;
      ctx.globalAlpha = (1 - f) * 0.16 + 0.02;
      ctx.strokeStyle = night ? '#bcd0ff' : '#ffeacc';
      ctx.lineWidth = Math.max(0.7, (1 - f) * 1.8);
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + len, yy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawGhat() {
    /* a stone bank on the right, seen from the river */
    var topX = W * 0.82;
    var topY = H * 0.42;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(W + 4, H * 0.34);
    ctx.lineTo(W + 4, H + 4);
    ctx.lineTo(topX - W * 0.10, H + 4);
    ctx.closePath();
    ctx.fillStyle = night ? 'rgba(24,28,52,0.95)' : 'rgba(58,60,56,0.92)';
    ctx.fill();

    ctx.strokeStyle = night ? 'rgba(170,190,240,0.14)' : 'rgba(240,226,200,0.16)';
    ctx.lineWidth = 1.2;
    for (var i = 1; i <= 7; i++) {
      var f = i / 8;
      var y = H - (H - topY) * f;
      ctx.beginPath();
      ctx.moveTo(lerp(topX - W * 0.10, topX, f), y);
      ctx.lineTo(W + 4, lerp(H, H * 0.34, f));
      ctx.stroke();
    }

    /* a pavilion, and a lamp */
    var px = W * 0.90, py = H * 0.53;
    ctx.fillStyle = 'rgba(34,36,34,0.94)';
    ctx.fillRect(px, py - H * 0.08, W * 0.05, H * 0.08);
    ctx.beginPath();
    ctx.arc(px + W * 0.025, py - H * 0.08, W * 0.033, Math.PI, 0);
    ctx.fill();

    var lg = ctx.createRadialGradient(px, py - H * 0.02, 0, px, py - H * 0.02, W * 0.06);
    lg.addColorStop(0, 'rgba(255,204,130,0.55)');
    lg.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(px, py - H * 0.02, W * 0.06, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ffdca0';
    ctx.beginPath(); ctx.arc(px, py - H * 0.02, 2.2, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function drawReeds() {
    var x0 = W * 0.02, y0 = H + 4;
    ctx.save();
    ctx.strokeStyle = 'rgba(20,30,26,0.8)';
    ctx.fillStyle = 'rgba(20,30,26,0.8)';
    for (var i = 0; i < 12; i++) {
      var x = x0 + i * W * 0.012;
      var h = H * (0.05 + (i % 5) * 0.024);
      var bend = Math.sin(clock * 0.8 + i) * 8;
      ctx.lineWidth = 1.2 + (i % 3) * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + bend * 0.4, y0 - h * 0.6, x + bend, y0 - h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDiyas() {
    for (var i = 0; i < diyas.length; i++) {
      var d = diyas[i];
      var fl = 0.76 + 0.24 * Math.sin(clock * 6 + d.ph) + 0.06 * Math.sin(clock * 17 + d.ph);
      var s = d.s;

      var g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, 42 * s);
      g.addColorStop(0, 'rgba(255,210,136,0.55)');
      g.addColorStop(0.4, 'rgba(255,164,80,0.18)');
      g.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, 42 * s, 0, 6.283); ctx.fill();

      /* the reflection under it */
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ffcf8a';
      ctx.beginPath(); ctx.ellipse(d.x, d.y + 8 * s, 8 * s, 2.4 * s, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#5a3626';
      ctx.beginPath(); ctx.ellipse(d.x, d.y, 8 * s, 3 * s, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#8a5634';
      ctx.beginPath(); ctx.ellipse(d.x, d.y - 1.4 * s, 8 * s, 1.9 * s, 0, 0, 6.283); ctx.fill();

      ctx.save();
      ctx.translate(d.x, d.y - 2 * s);
      ctx.scale(1, fl);
      var fg = ctx.createRadialGradient(0, -6 * s, 0, 0, -6 * s, 10 * s);
      fg.addColorStop(0, 'rgba(255,246,208,1)');
      fg.addColorStop(0.5, 'rgba(255,202,110,0.9)');
      fg.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(0, -6 * s, 3.4 * s, 6 * s, 0, 0, 6.283); ctx.fill();
      ctx.restore();
    }
  }

  function drawLogs() {
    for (var i = 0; i < logs.length; i++) {
      var g = logs[i];
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      ctx.fillStyle = '#3c2a20';
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(-g.len / 2, -7, g.len, 14, 7); ctx.fill(); }
      else ctx.ellipse(0, 0, g.len / 2, 7, 0, 0, 6.283), ctx.fill();
      ctx.strokeStyle = 'rgba(230,206,172,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-g.len / 2 + 6, -3); ctx.lineTo(g.len / 2 - 6, -3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-g.len / 2 + 8, 2); ctx.lineTo(g.len / 2 - 10, 2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawBoat() {
    var bx = boat.x * W;
    var by = H * 0.72 + boat.bob;
    var u = clamp(Math.min(W, H) / 620, 0.72, 1.45);
    var sp = boat.speed / 340;

    /* the wake behind the stern */
    if (sp > 0.06) {
      ctx.save();
      ctx.globalAlpha = 0.20 * sp;
      ctx.strokeStyle = '#ffeacb';
      ctx.lineWidth = 1.1;
      for (var w = 0; w < 4; w++) {
        var wy = by + 26 + w * 14;
        var ww = 12 + w * 9 + sp * 14;
        ctx.beginPath();
        ctx.moveTo(bx - ww * 0.4, wy);
        ctx.quadraticCurveTo(bx, wy + 5, bx + ww * 0.4, wy);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(boat.heading);

    /* shadow in the water */
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#1c2a2e';
    ctx.beginPath(); ctx.ellipse(0, 9, 20 * u, 35 * u, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;

    /* the oars, dipping with each stroke */
    var swing = Math.sin(clock * (6 + sp * 4)) * (0.18 + boat.stroke * 0.5);
    ctx.strokeStyle = '#8a6041';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.1 * u;
    ctx.beginPath();
    ctx.moveTo(-9 * u, -2 * u);
    ctx.lineTo(-30 * u, (16 + swing * 22) * u);
    ctx.moveTo(9 * u, -2 * u);
    ctx.lineTo(30 * u, (16 - swing * 22) * u);
    ctx.stroke();
    ctx.fillStyle = '#c9a06c';
    ctx.beginPath(); ctx.ellipse(-32 * u, (18 + swing * 22) * u, 4 * u, 10 * u, -0.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(32 * u, (18 - swing * 22) * u, 4 * u, 10 * u, 0.5, 0, 6.283); ctx.fill();

    /* hull, a leaf of wood */
    ctx.beginPath();
    ctx.moveTo(0, -42 * u);
    ctx.bezierCurveTo(19 * u, -26 * u, 22 * u, 4 * u, 11 * u, 30 * u);
    ctx.quadraticCurveTo(0, 38 * u, -11 * u, 30 * u);
    ctx.bezierCurveTo(-22 * u, 4 * u, -19 * u, -26 * u, 0, -42 * u);
    ctx.closePath();
    ctx.fillStyle = '#3d2a20';
    ctx.fill();
    ctx.strokeStyle = '#9a6a44';
    ctx.lineWidth = 1.3 * u;
    ctx.stroke();

    /* inner rim */
    ctx.beginPath();
    ctx.moveTo(0, -32 * u);
    ctx.bezierCurveTo(13 * u, -20 * u, 15 * u, 3 * u, 8 * u, 24 * u);
    ctx.quadraticCurveTo(0, 31 * u, -8 * u, 24 * u);
    ctx.bezierCurveTo(-15 * u, 3 * u, -13 * u, -20 * u, 0, -32 * u);
    ctx.closePath();
    ctx.fillStyle = '#543a28';
    ctx.fill();

    /* a woven mat */
    ctx.strokeStyle = 'rgba(230,196,144,0.30)';
    ctx.lineWidth = 0.8 * u;
    for (var m = -1; m <= 1; m++) {
      ctx.beginPath();
      ctx.moveTo(-7 * u, (6 + m * 6) * u);
      ctx.lineTo(7 * u, (6 + m * 6) * u);
      ctx.stroke();
    }

    /* the boatman, seen from above */
    ctx.fillStyle = '#e6c49a';
    ctx.beginPath(); ctx.arc(0, 2 * u, 7.2 * u, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2d2a24';
    ctx.beginPath(); ctx.arc(0, 1 * u, 7.4 * u, Math.PI * 1.04, Math.PI * 1.96); ctx.fill();
    ctx.fillStyle = '#b8503f';
    ctx.beginPath();
    ctx.ellipse(0, 12 * u, 8 * u, 9 * u, 0, 0, 6.283);
    ctx.fill();

    /* a lantern at the bow */
    var lg = ctx.createRadialGradient(0, -34 * u, 0, 0, -34 * u, 24 * u);
    lg.addColorStop(0, 'rgba(255,212,140,0.75)');
    lg.addColorStop(0.4, 'rgba(255,170,86,0.18)');
    lg.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(0, -34 * u, 24 * u, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ffdca0';
    ctx.beginPath(); ctx.arc(0, -34 * u, 2.1 * u, 0, 6.283); ctx.fill();

    ctx.restore();
  }

  function drawFish() {
    for (var i = 0; i < fishes.length; i++) {
      var f = fishes[i];
      var a = Math.sin(Math.PI * f.t);
      var x = f.x + f.dir * f.t * 26;
      var y = f.y - a * 34;
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      ctx.translate(x, y);
      ctx.rotate(f.dir * (-0.3 + f.t * 0.6));
      ctx.fillStyle = 'rgba(244,238,216,0.95)';
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.2, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-9, -2.6); ctx.lineTo(-9, 2.6); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles() {
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      ctx.globalAlpha = Math.max(0, r.life) * r.alpha;
      ctx.strokeStyle = r.warm ? '#ffd79a' : '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.34, 0, 0, 6.283);
      ctx.stroke();
    }
    for (var j = 0; j < sparks.length; j++) {
      var s = sparks[j];
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.warm ? '#ffdca0' : 'rgba(240,250,246,0.9)';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawCurrents() {
    for (var i = 0; i < currents.length; i++) {
      var c = currents[i];
      var top = c.y - c.h / 2;
      var g = ctx.createLinearGradient(0, top, 0, top + c.h);
      var col = night ? '170,200,255' : '255,238,208';
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(0.5, 'rgba(' + col + ',0.17)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, top, W, c.h);
      /* chevrons racing the way the water pushes */
      ctx.strokeStyle = 'rgba(' + col + ',0.5)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (var row = 0; row < 3; row++) {
        var yy = top + c.h * (0.28 + row * 0.22);
        for (var k = 0; k < 9; k++) {
          var xx = (((k * 0.125 + row * 0.04) * W + clock * c.dir * 130) % (W + 40) + (W + 40)) % (W + 40) - 20;
          ctx.beginPath();
          ctx.moveTo(xx - c.dir * 7, yy - 5);
          ctx.lineTo(xx, yy);
          ctx.lineTo(xx - c.dir * 7, yy + 5);
          ctx.stroke();
        }
      }
    }
  }

  function drawNightMask() {
    var u = clamp(Math.min(W, H) / 620, 0.72, 1.45);
    var bx = boat.x * W, by = H * 0.72 + boat.bob - 30 * u;
    var flick = 0.95 + 0.05 * Math.sin(clock * 7) + 0.025 * Math.sin(clock * 19);
    var r = Math.min(W, H) * 0.44 * flick;
    var g = ctx.createRadialGradient(bx, by, r * 0.1, bx, by, r);
    g.addColorStop(0, 'rgba(4,8,24,0)');
    g.addColorStop(0.55, 'rgba(4,8,24,0.46)');
    g.addColorStop(1, 'rgba(4,8,24,0.76)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawLanternGlow() {
    var u = clamp(Math.min(W, H) / 620, 0.72, 1.45);
    var bx = boat.x * W, by = H * 0.72 + boat.bob - 34 * u;
    var flick = 0.92 + 0.08 * Math.sin(clock * 9) + 0.04 * Math.sin(clock * 23);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(bx, by, 0, bx, by, 150 * u * flick);
    g.addColorStop(0, 'rgba(255,196,120,0.38)');
    g.addColorStop(0.5, 'rgba(255,150,70,0.10)');
    g.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, 150 * u, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (shake > 0) {
      ctx.translate(rnd(-1, 1) * shake * 5, rnd(-1, 1) * shake * 5);
    }
    drawSky();
    if (!reduced) {
      drawBank();
    } else {
      drawBank();
    }
    drawWater();
    drawCurrents();
    drawGhat();
    drawLogs();
    if (!night) drawDiyas();
    drawFish();
    drawBoat();
    if (night) { drawNightMask(); drawDiyas(); drawLanternGlow(); }
    drawParticles();
    drawReeds();

    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,220,160,' + (flash * 0.10) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    /* a soft vignette */
    var vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(2,10,12,0.36)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── loop ─────────────────────────────────────────────────── */
  function loop(now) {
    if (!running) return;
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ── input ────────────────────────────────────────────────── */
  function keyDown(e) {
    if (!open) return;
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { steer = -1; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { steer = 1; e.preventDefault(); }
    else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { rowHeld = true; e.preventDefault(); }
    else if (k === 'Escape') { close(); }
  }
  function keyUp(e) {
    if (!open) return;
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { if (steer < 0) steer = 0; }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { if (steer > 0) steer = 0; }
    else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { rowHeld = false; }
  }

  Array.prototype.forEach.call(root.querySelectorAll('[data-naav-steer]'), function (b) {
    var dir = parseInt(b.getAttribute('data-naav-steer'), 10);
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); steer = dir; });
    b.addEventListener('pointerup', function () { if (steer === dir) steer = 0; });
    b.addEventListener('pointerleave', function () { if (steer === dir) steer = 0; });
    b.addEventListener('pointercancel', function () { if (steer === dir) steer = 0; });
  });
  var rowBtn = root.querySelector('[data-naav-row]');
  if (rowBtn) {
    rowBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); rowHeld = true; });
    rowBtn.addEventListener('pointerup', function () { rowHeld = false; });
    rowBtn.addEventListener('pointerleave', function () { rowHeld = false; });
    rowBtn.addEventListener('pointercancel', function () { rowHeld = false; });
  }
  function setLevel(isNight) {
    night = !!isNight;
    store.set('gzp.naav.level', night ? 'night' : 'dusk');
    syncLevelUI();
    if (open) reset();
  }
  function syncLevelUI() {
    Array.prototype.forEach.call(root.querySelectorAll('[data-naav-level]'), function (b) {
      var on = (b.getAttribute('data-naav-level') === 'night') === night;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    });
    root.classList.toggle('is-night', night);
  }
  Array.prototype.forEach.call(root.querySelectorAll('[data-naav-level]'), function (b) {
    b.addEventListener('click', function () { setLevel(b.getAttribute('data-naav-level') === 'night'); });
  });
  syncLevelUI();
  if (el.close) el.close.addEventListener('click', close);
  if (el.quit) el.quit.addEventListener('click', close);
  if (el.again) el.again.addEventListener('click', function () { reset(); });
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('resize', function () { if (open) resize(); });

  /* ── public ───────────────────────────────────────────────── */
  function openGame() {
    if (open) return;
    open = true;
    root.hidden = false;
    document.body.classList.add('naav-open');
    if (window.Scene && window.Scene.pause) window.Scene.pause();
    resize();
    reset();
    running = true;
    last = 0;
    raf = requestAnimationFrame(loop);
    if (el.close) setTimeout(function () { try { el.close.focus(); } catch (e) {} }, 80);
    if (window.Ambient && window.Ambient.tick) window.Ambient.tick();
  }

  function close() {
    if (!open) return;
    open = false;
    running = false;
    cancelAnimationFrame(raf);
    root.hidden = true;
    document.body.classList.remove('naav-open');
    rowHeld = false; steer = 0;
    if (window.Scene && window.Scene.resume) window.Scene.resume();
    if (el.over) el.over.hidden = true;
  }

  function refresh() {
    if (el.tip && !over && clock < 4) el.tip.textContent = L(night ? 'naav.tipNight' : 'naav.tip');
    if (over) {
      if (el.result) el.result.textContent = tpl(L('naav.result'), { m: Math.round(dist), d: score });
      if (el.bestLine) el.bestLine.textContent = tpl(L('naav.bestLine'), { d: best });
    }
    hud(true);
  }

  window.Naav = {
    open: openGame,
    close: close,
    refresh: refresh,
    isOpen: function () { return open; }
  };
})();
