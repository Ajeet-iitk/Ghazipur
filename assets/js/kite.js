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
  var rivals = [], parts = [], fall = [];
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
    return { i: i, x: W * (0.1 + i * 0.2), y: H * 0.4, vx: 0, vy: 0, ax: W * (0.08 + i * 0.17), ay: H * 0.97, cols: c, dive: 0, nextDive: rnd(4, 8), ph: rnd(0, 6), alive: true, respawn: 0, speed: 0, ang: 0, fresh: 1 };
  }
  function reset() {
    score = 0; lives = 3; over = false; grind = null; clock = 0; parts = []; fall = [];
    P.x = W * 0.6; P.y = H * 0.38; P.vx = P.vy = 0; P.alive = true; tgt.x = P.x; tgt.y = P.y;
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
      var ps = string(A.x, A.y, P.x, P.y, H * 0.05), hit = null;
      rivals.forEach(function (r) {
        if (!r.alive || hit) return;
        var rs = string(r.ax, r.ay, r.x, r.y, H * 0.05);
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
    fall.forEach(function (f) { f.t += dt; f.vy += 520 * dt; f.vx += w * 0.4 * dt; f.x += f.vx * dt; f.y += f.vy * dt * 0.6; f.ang += f.vr * dt; f.life -= dt; });
    fall = fall.filter(function (f) { return f.life > 0 && f.y < H + 60; });
    parts.forEach(function (p) { p.life -= dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    flash = Math.max(0, flash - dt * 2.4);
  }
  function cutRival(r, x, y) {
    r.alive = false; r.respawn = 3; falling(r, r.cols); spark(x, y, 26, '#fff'); score++; flash = 0.35; snd('coin'); snd('splash', 0.4); updateHud();
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
  }
  function cutPlayer(x, y) {
    P.alive = false; P.respawn = 1.6; falling(P, COLS[0]); spark(x, y, 26, '#ff8a5c'); lives--; snd('thud'); updateHud();
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

  function drawKite(x, y, ang, cols, s, alpha) {
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = alpha === undefined ? 1 : alpha;
    var u = s;
    g.fillStyle = cols[0]; g.beginPath(); g.moveTo(0, -20 * u); g.lineTo(13 * u, 0); g.lineTo(0, 22 * u); g.lineTo(-13 * u, 0); g.closePath(); g.fill();
    g.fillStyle = cols[1]; g.beginPath(); g.moveTo(0, -20 * u); g.lineTo(13 * u, 0); g.lineTo(0, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, 22 * u); g.lineTo(-13 * u, 0); g.lineTo(0, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,248,230,.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -20 * u); g.lineTo(0, 22 * u); g.moveTo(-13 * u, 0); g.lineTo(13 * u, 0); g.stroke();
    g.strokeStyle = cols[0]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 22 * u);
    for (var i = 1; i <= 8; i++) g.lineTo(Math.sin(clock * 5 + i) * (2 + i) * u, (22 + i * 7) * u);
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
      drawString(string(r.ax, r.ay, r.x, r.y, H * 0.05), 'rgba(250,244,230,.85)', 1.1);
      drawKite(r.x, r.y, r.ang, r.cols, 0.9);
      if (r.dive > 0) { g.fillStyle = 'rgba(255,90,60,.9)'; g.font = '700 16px sans-serif'; g.fillText('!', r.x - 3, r.y - 28); }
    });
    if (P.alive) {
      drawString(string(A.x, A.y, P.x, P.y, H * 0.05), 'rgba(255,236,190,.95)', 1.5);
      drawKite(P.x, P.y, P.ang, COLS[0], 1.15);
      /* a ring that shows the contact being ground through */
      if (grind) { g.strokeStyle = 'rgba(255,214,120,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(grind.x, grind.y, 8 + grind.t * 40, 0, 6.283); g.stroke(); }
    }
    /* the hand at the anchor */
    g.fillStyle = 'rgba(20,16,14,.8)'; g.beginPath(); g.arc(A.x, A.y, 5, 0, 6.283); g.fill();
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
