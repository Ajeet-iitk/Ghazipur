/* ══════════════════════════════════════════════════════════════
   KITE FIGHT — a Makar Sankranti nod, played over the eye view.
   Steer your kite with the pointer or a finger. The wind gusts and drags it;
   your string sags and pulls. Sweep it across a rival's string, faster than
   the rival moves, and cut it loose. Three cuts against you and the fight ends.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var btn = document.getElementById('viewKite');
  if (!btn) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) { var d = window.I18N && (window.I18N[lang()] || window.I18N.en); return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k; }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var cv, g, W = 0, H = 0, dpr = 1, raf = 0, last = 0, on = false, hud = null;
  var A = { x: 0, y: 0 };                       /* the player's anchor: a hand on the ghat */
  var P = { x: 0, y: 0, vx: 0, vy: 0, ang: 0, alive: true, respawn: 0, speed: 0 };
  var tgt = { x: 0, y: 0 }, wind = 0, windT = 0, clock = 0;
  var rivals = [], parts = [], fall = [], pKid = { cheer: 0, sad: 0 }, pTail = [];
  var score = 0, lives = 3, best = parseInt(store.get('gzp.kite.best') || '0', 10) || 0, over = false, grind = null, flash = 0;
  var COLS = [['#d8433a', '#f2b73f'], ['#2f7fb5', '#f4ead2'], ['#3f9a6a', '#f2b73f'], ['#8a4aa8', '#f4ead2']];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    A.x = W * 0.8; A.y = H * 0.9;
  }

  function mkRival(i) {
    var c = COLS[(i + 1) % COLS.length];
    return { i: i, x: W * (0.1 + i * 0.2), y: H * 0.4, vx: 0, vy: 0, ax: W * (0.12 + i * 0.17), ay: H * 0.88, cheer: 0, sad: 0, tail: [], cols: c, dive: 0, nextDive: rnd(4, 8), ph: rnd(0, 6), alive: true, respawn: 0, speed: 0, ang: 0, fresh: 1 };
  }
  function reset() {
    score = 0; lives = 3; over = false; grind = null; clock = 0; parts = []; fall = [];
    P.x = W * 0.6; P.y = H * 0.38; P.vx = P.vy = 0; P.alive = true; tgt.x = P.x; tgt.y = P.y; pKid.cheer = pKid.sad = 0; pTail = [];
    rivals = [mkRival(0), mkRival(1)];
    if (hud) { hud.querySelector('.kg-over').hidden = true; }
    updateHud();
  }

  /* the string: a sagging curve from the hand to the kite, sampled as a polyline */
  function string(ax, ay, kx, ky, sag) {
    var pts = [], mx = (ax + kx) / 2, my = (ay + ky) / 2 + sag;
    for (var t = 0; t <= 1.0001; t += 1 / 14) {
      var u = 1 - t;
      pts.push({ x: u * u * ax + 2 * u * t * mx + t * t * kx, y: u * u * ay + 2 * u * t * my + t * t * ky });
    }
    return pts;
  }
  function cross(a, b, c, d) {
    var s1x = b.x - a.x, s1y = b.y - a.y, s2x = d.x - c.x, s2y = d.y - c.y, den = (-s2x * s1y + s1x * s2y);
    if (Math.abs(den) < 1e-6) return null;
    var s = (-s1y * (a.x - c.x) + s1x * (a.y - c.y)) / den, t = (s2x * (a.y - c.y) - s2y * (a.x - c.x)) / den;
    return (s >= 0 && s <= 1 && t >= 0 && t <= 1) ? { x: a.x + t * s1x, y: a.y + t * s1y } : null;
  }

  function spark(x, y, n, col) { for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-90, 90), vy: rnd(-110, 30), life: rnd(0.3, 0.8), col: col || '#ffd27a' }); }
  function falling(k, cols) { fall.push({ x: k.x, y: k.y, vx: k.vx * 0.3, vy: 0, ang: k.ang, vr: rnd(-3, 3), cols: cols, life: 5, t: 0 }); }

  function update(dt) {
    clock += dt;
    /* wind: a slow swell plus gusts, stronger as the fight goes on */
    windT -= dt;
    if (windT <= 0) { windT = rnd(2, 4.5); wind = rnd(-1, 1) * (60 + Math.min(90, clock * 1.4)); }
    var w = wind * (0.6 + 0.4 * Math.sin(clock * 1.7));

    /* the player's kite */
    if (P.alive) {
      var kx = 9 * 1, ax = kx * (tgt.x - P.x) + w * 1.4 - 3.2 * P.vx, ay = kx * (tgt.y - P.y) + Math.sin(clock * 2.1) * 26 - 3.2 * P.vy;
      P.vx += ax * dt * 4; P.vy += ay * dt * 4;
      P.x += P.vx * dt; P.y += P.vy * dt;
      var dx = P.x - A.x, dy = P.y - A.y, d = Math.hypot(dx, dy), Lmax = H * 0.9;
      if (d > Lmax) { P.x = A.x + dx / d * Lmax; P.y = A.y + dy / d * Lmax; P.vx *= 0.6; P.vy *= 0.6; }
      P.y = clamp(P.y, H * 0.06, H * 0.82); P.x = clamp(P.x, W * 0.04, W * 0.97);
      P.speed += (Math.hypot(P.vx, P.vy) - P.speed) * Math.min(1, dt * 6);
      P.ang += ((P.vx * 0.0016) - P.ang) * Math.min(1, dt * 5);
    } else {
      P.respawn -= dt;
      if (P.respawn <= 0 && !over) { P.alive = true; P.x = tgt.x; P.y = H * 0.4; P.vx = P.vy = 0; }
    }

    /* the rivals: wander, and now and then dive at you */
    rivals.forEach(function (r) {
      if (!r.alive) { r.respawn -= dt; if (r.respawn <= 0) { Object.assign(r, mkRival(r.i), { fresh: 1 }); } return; }
      r.nextDive -= dt;
      if (r.nextDive <= 0) { r.dive = 1.4; r.nextDive = rnd(5, 9) - Math.min(3, clock * 0.04); }
      r.dive = Math.max(0, r.dive - dt);
      var tx, ty;
      if (r.dive > 0 && P.alive) { tx = P.x + rnd(-20, 20); ty = P.y; }
      else { tx = W * (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(clock * 0.31 + r.ph))) + r.i * 30; ty = H * (0.22 + 0.2 * (0.5 + 0.5 * Math.sin(clock * 0.47 + r.ph * 2))); }
      var f = r.dive > 0 ? 7 : 2.6;
      r.vx += ((tx - r.x) * f + w * 0.9 - 3 * r.vx) * dt * 3.6; r.vy += ((ty - r.y) * f + Math.sin(clock * 1.6 + r.ph) * 22 - 3 * r.vy) * dt * 3.6;
      r.x += r.vx * dt; r.y += r.vy * dt;
      r.y = clamp(r.y, H * 0.06, H * 0.8); r.x = clamp(r.x, W * 0.03, W * 0.96);
      r.speed += (Math.hypot(r.vx, r.vy) * (r.dive > 0 ? 1.15 : 1) - r.speed) * Math.min(1, dt * 6);
      r.ang += ((r.vx * 0.0016) - r.ang) * Math.min(1, dt * 5);
    });
    if (rivals.length < 3 && clock > 25 && rivals.length === 2) rivals.push(mkRival(2));

    /* where the strings cross, and who wins the cut */
    if (!over && P.alive) {
      var ps = string(A.x, A.y - 22, P.x, P.y, H * 0.05), hit = null;
      rivals.forEach(function (r) {
        if (!r.alive || hit) return;
        var rs = string(r.ax, r.ay - 22, r.x, r.y, H * 0.05);
        for (var i = 0; i < ps.length - 1 && !hit; i++) for (var j = 0; j < rs.length - 1; j++) {
          var c = cross(ps[i], ps[i + 1], rs[j], rs[j + 1]);
          if (c) { hit = { r: r, x: c.x, y: c.y }; break; }
        }
      });
      if (hit) {
        if (!grind || grind.r !== hit.r) { grind = { r: hit.r, t: 0 }; snd('tick'); }
        grind.t += dt; grind.x = hit.x; grind.y = hit.y;
        if (Math.random() < dt * 40) spark(hit.x, hit.y, 1);
        if (grind.t > 0.32) {
          var mine = P.speed * 1.3 + 30, theirs = hit.r.speed * (hit.r.dive > 0 ? 1.4 : 1) + 30;
          if (mine >= theirs) { cutRival(hit.r, hit.x, hit.y); } else { cutPlayer(hit.x, hit.y); }
          grind = null;
        }
      } else grind = null;
    }
    function tailStep(k, tail, w, n) {
      if (!tail.length) for (var i = 0; i < n; i++) tail.push({ x: k.x, y: k.y + 20 + i * 7 });
      var hx = k.x - Math.sin(k.ang) * 22, hy = k.y + Math.cos(k.ang) * 22; tail[0].x += (hx - tail[0].x) * 0.7; tail[0].y += (hy - tail[0].y) * 0.7;
      for (var j = 1; j < n; j++) {
        var a = tail[j - 1], b = tail[j]; b.x += w * 0.5 * dt + Math.sin(clock * 3 + j) * 12 * dt; b.y += 70 * dt;
        var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, L = 7.5; b.x = a.x + dx / d * L; b.y = a.y + dy / d * L;
      }
    }
    if (P.alive) tailStep(P, pTail, w, 11);
    rivals.forEach(function (r) { if (r.alive) tailStep(r, r.tail, w, 9); r.cheer = Math.max(0, r.cheer - dt); r.sad = Math.max(0, r.sad - dt); });
    pKid.cheer = Math.max(0, pKid.cheer - dt); pKid.sad = Math.max(0, pKid.sad - dt);
    fall.forEach(function (f) { f.t += dt; f.vy += 520 * dt; f.vx += w * 0.4 * dt; f.x += f.vx * dt; f.y += f.vy * dt * 0.6; f.ang += f.vr * dt; f.life -= dt; });
    fall = fall.filter(function (f) { return f.life > 0 && f.y < H + 60; });
    parts.forEach(function (p) { p.life -= dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    flash = Math.max(0, flash - dt * 2.4);
  }
  function cutRival(r, x, y) {
    r.alive = false; r.respawn = 3; r.sad = 2.2; pKid.cheer = 1.6; falling(r, r.cols); spark(x, y, 26, '#fff'); score++; flash = 0.35; snd('coin'); snd('splash', 0.4); updateHud();
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
  }
  function cutPlayer(x, y) {
    P.alive = false; P.respawn = 1.6; pKid.sad = 1.8; rivals.forEach(function (q) { if (q.alive) q.cheer = 1.6; }); falling(P, COLS[0]); spark(x, y, 26, '#ff8a5c'); lives--; snd('thud'); updateHud();
    if (navigator.vibrate) try { navigator.vibrate([40, 40, 40]); } catch (e) {}
    if (lives <= 0) endGame();
  }
  function endGame() {
    over = true;
    var nb = score > best; if (nb) { best = score; store.set('gzp.kite.best', String(best)); }
    var o = hud.querySelector('.kg-over'); o.hidden = false;
    o.querySelector('b').textContent = L('kite.over');
    o.querySelector('p').textContent = (L('kite.score') + ': ' + score) + (nb ? ' · ' + L('kite.newbest') : ' · ' + L('kite.best') + ': ' + best);
    updateHud();
  }

  function drawKite(x, y, ang, cols, s, alpha, tail) {
    g.save(); g.globalAlpha = alpha === undefined ? 1 : alpha;
    /* the tail: bows on a lagging chain */
    if (tail && tail.length) {
      g.strokeStyle = 'rgba(255,248,230,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(tail[0].x, tail[0].y);
      for (var t = 1; t < tail.length; t++) g.lineTo(tail[t].x, tail[t].y); g.stroke();
      for (var u = 1; u < tail.length; u += 2) {
        var q = tail[u], tc = u % 4 === 1 ? cols[1] : cols[0], w2 = 6 * s;
        g.fillStyle = tc; g.save(); g.translate(q.x, q.y); g.rotate(Math.sin(clock * 6 + u) * 0.6);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(-w2, -3 * s); g.lineTo(-w2, 3 * s); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, 0); g.lineTo(w2, -3 * s); g.lineTo(w2, 3 * s); g.closePath(); g.fill(); g.restore();
      }
    }
    g.translate(x, y); g.rotate(ang + Math.sin(clock * 9 + x * 0.01) * 0.05);
    var h = 22 * s, wd = 14 * s, flutter = Math.sin(clock * 11 + x * 0.02) * 0.9 * s;
    var f4 = [[0, -h], [wd + flutter, -2 * s], [0, h * 1.08], [-wd - flutter, -2 * s]];
    /* four panels: alternating colours, a little shading toward the bottom */
    function panel(a, b, c, col) { g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fill(); }
    var cen = [0, -2 * s];
    panel(f4[0], f4[1], cen, cols[0]); panel(f4[1], f4[2], cen, cols[1]); panel(f4[2], f4[3], cen, cols[0]); panel(f4[3], f4[0], cen, cols[1]);
    var sh = g.createLinearGradient(0, -h, 0, h); sh.addColorStop(0, 'rgba(255,255,255,.28)'); sh.addColorStop(1, 'rgba(0,0,0,.2)');
    g.fillStyle = sh; g.beginPath(); g.moveTo(f4[0][0], f4[0][1]); g.lineTo(f4[1][0], f4[1][1]); g.lineTo(f4[2][0], f4[2][1]); g.lineTo(f4[3][0], f4[3][1]); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,250,235,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h * 1.08); g.moveTo(-wd, -2 * s); g.quadraticCurveTo(0, -6 * s, wd, -2 * s); g.stroke();
    g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(f4[0][0], f4[0][1]); g.lineTo(f4[1][0], f4[1][1]); g.lineTo(f4[2][0], f4[2][1]); g.lineTo(f4[3][0], f4[3][1]); g.closePath(); g.stroke();
    g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(0, -2 * s, 2.2 * s, 0, 6.283); g.fill();
    g.restore();
  }
  /* a boy holding the string, with his reel: cheering, sad, or just concentrating */
  function drawBoy(x, y, kx, ky, col, mood, s, boat) {
    g.save(); g.translate(x, y);
    if (boat) {
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 40 * s, 34 * s, 5 * s, 0, 0, 6.283); g.fill();
      g.fillStyle = '#3a2a22'; g.beginPath(); g.moveTo(-34 * s, 28 * s); g.quadraticCurveTo(0, 46 * s, 34 * s, 28 * s); g.lineTo(26 * s, 22 * s); g.lineTo(-26 * s, 22 * s); g.closePath(); g.fill();
      g.strokeStyle = '#8a6a52'; g.lineWidth = 2; g.beginPath(); g.moveTo(-22 * s, 18 * s); g.lineTo(-32 * s, 34 * s); g.stroke();
    } else { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 38 * s, 16 * s, 4 * s, 0, 0, 6.283); g.fill(); }
    var jump = mood > 0 ? Math.abs(Math.sin(clock * 12)) * 8 * s : 0, droop = mood < 0 ? 3 * s : 0;
    g.translate(0, -jump + droop);
    g.strokeStyle = '#3a2a22'; g.lineWidth = 5 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-4 * s, 22 * s); g.lineTo(-5 * s, 38 * s); g.moveTo(4 * s, 22 * s); g.lineTo(5 * s, 38 * s); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(-9 * s, 6 * s); g.lineTo(9 * s, 6 * s); g.lineTo(8 * s, 24 * s); g.lineTo(-8 * s, 24 * s); g.closePath(); g.fill();
    var look = Math.atan2(ky - y, kx - x), hx = Math.cos(look) * 2.4 * s;
    /* arms up to the hands at the anchor, with a reel */
    g.strokeStyle = '#a56d47'; g.lineWidth = 3.6 * s; g.beginPath();
    var armUp = mood > 0 ? -22 * s : -10 * s;
    g.moveTo(-7 * s, 8 * s); g.lineTo(-8 * s + hx, armUp); g.moveTo(7 * s, 8 * s); g.lineTo(8 * s + hx, armUp + 2 * s); g.stroke();
    g.fillStyle = '#e8d6a8'; g.beginPath(); g.arc(hx, armUp - 1 * s, 5 * s, 0, 6.283); g.fill(); g.strokeStyle = '#8a6a42'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx - 4 * s, armUp - 1 * s); g.lineTo(hx + 4 * s, armUp - 1 * s); g.stroke();
    g.fillStyle = '#a56d47'; g.beginPath(); g.arc(hx * 0.6, -2 * s, 7 * s, 0, 6.283); g.fill();
    g.fillStyle = '#2b2420'; g.beginPath(); g.arc(hx * 0.6, -4 * s, 7.4 * s, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.fillStyle = '#1c1512'; g.beginPath(); g.arc(hx * 0.6 - 2.4 * s, -2 * s, 1 * s, 0, 6.283); g.arc(hx * 0.6 + 2.4 * s, -2 * s, 1 * s, 0, 6.283); g.fill();
    g.strokeStyle = '#7a2a1e'; g.lineWidth = 1.2; g.beginPath();
    if (mood > 0) { g.arc(hx * 0.6, 1.2 * s, 2.6 * s, 0.1, 3.04); } else if (mood < 0) { g.arc(hx * 0.6, 4 * s, 2.2 * s, 3.3, 6.1); } else { g.moveTo(hx * 0.6 - 2 * s, 2.6 * s); g.lineTo(hx * 0.6 + 2 * s, 2.6 * s); }
    g.stroke();
    g.restore();
  }
  function drawString(pts, col, w) {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y); g.stroke();
  }
  function draw() {
    g.clearRect(0, 0, W, H);
    if (flash > 0) { g.fillStyle = 'rgba(255,255,255,' + flash * 0.25 + ')'; g.fillRect(0, 0, W, H); }
    rivals.forEach(function (r) {
      if (!r.alive) return;
      drawString(string(r.ax, r.ay - 22, r.x, r.y, H * 0.05), 'rgba(250,244,230,.85)', 1.1);
      drawKite(r.x, r.y, r.ang, r.cols, 0.95, 1, r.tail);
      if (r.dive > 0) { g.fillStyle = 'rgba(255,90,60,.9)'; g.font = '700 16px sans-serif'; g.fillText('!', r.x - 3, r.y - 28); }
    });
    if (P.alive) {
      drawString(string(A.x, A.y - 22, P.x, P.y, H * 0.05), 'rgba(255,236,190,.95)', 1.5);
      drawKite(P.x, P.y, P.ang, COLS[0], 1.2, 1, pTail);
      /* a ring that shows the contact being ground through */
      if (grind) { g.strokeStyle = 'rgba(255,214,120,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(grind.x, grind.y, 8 + grind.t * 40, 0, 6.283); g.stroke(); }
    }
    /* the boys: yours on the ghat, the rivals in their boats */
    rivals.forEach(function (r) { drawBoy(r.ax, r.ay, r.x, r.y, r.cols[0], r.cheer > 0 ? 1 : (r.sad > 0 ? -1 : 0), 0.9, true); });
    drawBoy(A.x, A.y, P.x, P.y, '#c0504a', pKid.cheer > 0 ? 1 : (pKid.sad > 0 ? -1 : 0), 1.05, false);
    fall.forEach(function (f) { drawKite(f.x, f.y, f.ang, f.cols, 1, clamp(f.life / 2, 0, 1)); });
    parts.forEach(function (p) { g.globalAlpha = clamp(p.life * 2, 0, 1); g.fillStyle = p.col; g.fillRect(p.x, p.y, 2.4, 2.4); }); g.globalAlpha = 1;
    /* the wind */
    var wx = W / 2, wy = 28, wv = clamp(wind / 150, -1, 1);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx - wv * 36, wy); g.lineTo(wx + wv * 36, wy); g.stroke();
    g.beginPath(); g.moveTo(wx + wv * 36, wy); g.lineTo(wx + wv * 28, wy - 5); g.moveTo(wx + wv * 36, wy); g.lineTo(wx + wv * 28, wy + 5); g.stroke();
  }

  function frame(now) {
    if (!on) return;
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) update(dt); else { fall.forEach(function (f) { f.life -= dt; f.y += 80 * dt; }); parts.forEach(function (p) { p.life -= dt; }); }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function updateHud() {
    if (!hud) return;
    hud.querySelector('.kg-score').textContent = score;
    hud.querySelector('.kg-lives').textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
    hud.querySelector('.kg-best').textContent = best;
  }
  function build() {
    cv = document.createElement('canvas'); cv.id = 'kiteGame'; cv.className = 'kite-canvas'; g = cv.getContext('2d');
    hud = document.createElement('div'); hud.className = 'kite-hud'; hud.hidden = true;
    hud.innerHTML = '<div class="kg-stats"><span><i></i><b class="kg-score">0</b></span><span class="kg-lives"></span><span class="kg-bst"><i></i><b class="kg-best">0</b></span></div>' +
      '<button type="button" class="kg-exit"></button><p class="kg-tip"></p>' +
      '<div class="kg-over" hidden><b></b><p></p><div><button type="button" class="kg-again"></button><button type="button" class="kg-quit"></button></div></div>';
    cv.hidden = true;
    document.body.appendChild(cv); document.body.appendChild(hud);
    hud.querySelector('.kg-exit').addEventListener('click', stop);
    hud.querySelector('.kg-quit').addEventListener('click', stop);
    hud.querySelector('.kg-again').addEventListener('click', function () { reset(); });
    function mv(e) { tgt.x = e.clientX; tgt.y = clamp(e.clientY, H * 0.08, H * 0.78); }
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerdown', function (e) { mv(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    window.addEventListener('resize', function () { if (on) resize(); });
    window.addEventListener('keydown', function (e) { if (on && e.key === 'Escape') { e.stopPropagation(); stop(); } }, true);
  }
  function labels() {
    if (!hud) return;
    hud.querySelector('.kg-exit').textContent = L('kite.exit'); hud.querySelector('.kg-tip').textContent = L('kite.tip');
    hud.querySelector('.kg-again').textContent = L('kite.again'); hud.querySelector('.kg-quit').textContent = L('kite.exit');
    hud.querySelectorAll('.kg-stats i')[0].textContent = L('kite.score'); hud.querySelectorAll('.kg-stats i')[1].textContent = L('kite.best');
  }
  function start() {
    if (on) return;
    if (!cv) build();
    on = true; cv.hidden = false; hud.hidden = false; document.body.classList.add('kite-on');
    resize(); reset(); labels(); last = 0; raf = requestAnimationFrame(frame);
    var tip = hud.querySelector('.kg-tip'); tip.classList.add('is-on'); setTimeout(function () { tip.classList.remove('is-on'); }, 6000);
    snd('chime');
  }
  function stop() {
    if (!on) return;
    on = false; cancelAnimationFrame(raf); cv.hidden = true; hud.hidden = true; document.body.classList.remove('kite-on');
  }
  btn.addEventListener('click', function () { if (btn.disabled) return; start(); });
  /* the kite only flies in clear weather and summer */
  function sync() {
    var m = window.Scene && window.Scene.getSeason ? window.Scene.getSeason() : 'normal';
    var ok = m !== 'monsoon';
    btn.disabled = !ok; btn.classList.toggle('is-off', !ok); btn.title = ok ? L('kite.btn') : L('kite.rain');
    btn.setAttribute('aria-label', ok ? L('kite.btn') : L('kite.rain'));
    if (!ok && on) stop();
  }
  setInterval(function () { if (document.body.classList.contains('view-mode')) sync(); }, 600);
  document.addEventListener('click', function (e) { if (e.target.closest('[data-vs], #viewBtn, #heroEye')) setTimeout(sync, 120); });
  new MutationObserver(function () { if (!document.body.classList.contains('view-mode') && on) stop(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.Kite = { start: start, stop: stop, refresh: labels };
  sync();
})();
