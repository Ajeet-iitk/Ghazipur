/* ══════════════════════════════════════════════════════════════
   THE MANGO GROVE — a hidden card with a slingshot game.
   Drag back the slingshot, aim by the dotted arc, let go. Knock ripe mangoes
   from the tree and a barefoot kid runs to catch them; but when the watchman
   stirs and looks your way, hold your fire. Three times spotted and the grove
   is closed for the day.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var card = document.getElementById('mangoNook'), head = document.getElementById('mgHead'), box = document.getElementById('mgBox');
  if (!card || !head || !box) return;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) { var d = window.I18N && (window.I18N[lang()] || window.I18N.en); return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k; }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var VW = 640, VH = 400, GROUND = 340, SLING = { x: 92, y: 282 }, MAXPULL = 90, POWER = 10.5, tut = 0, BASKET = { x: 34, y: GROUND };
  var cv, g, built = false, open = false, visible = false, raf = 0, last = 0, dpr = 1, scale = 1;
  var mangoes = [], stone = null, pull = null, kid, watch, score = 0, lives = 3, time = 60, over = false, started = false, best = parseInt(store.get('gzp.mango.best') || '0', 10) || 0, msgT = 0, msg = '', sway = 0, parts = [];
  var statusEl = null, bonks = 0, turban = null;

  function mkMangoes() {
    var spots = [[452, 120], [500, 96], [548, 132], [478, 168], [530, 176], [584, 110], [436, 150], [566, 160]];
    mangoes = spots.map(function (s, i) { return { x: s[0], y: s[1], hx: s[0], hy: s[1], r: 11, ripe: Math.random(), state: 'hang', vx: 0, vy: 0, bounce: 0, ph: i * 1.3 }; });
  }
  function reset() {
    bonks = 0; turban = null; score = 0; lives = 3; time = 60; over = false; started = false; stone = null; pull = null; parts = []; msg = ''; msgT = 0;
    mkMangoes();
    kid = { x: 90, y: GROUND, dir: 1, carry: null, target: null, wob: 0 };
    watch = { x: 400, y: GROUND, dir: 1, state: 'doze', t: rnd(3, 5), stir: 0, step: 0 };
    hud();
    var o = box.querySelector('.mg-over'); if (o) o.hidden = true;
  }
  function hud() {
    if (!built) return;
    box.querySelector('.mg-score').textContent = score; box.querySelector('.mg-time').textContent = Math.ceil(time) + 's';
    box.querySelector('.mg-lives').textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
    box.querySelector('.mg-best').textContent = best;
  }

  function sizeCanvas() {
    var r = cv.getBoundingClientRect(); if (!r.width) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1); scale = r.width / VW;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.width * dpr * VH / VW);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    return true;
  }
  function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * VH }; }

  function build() {
    box.innerHTML = '<div class="mg-hud"><span><i></i><b class="mg-score">0</b></span><span><i></i><b class="mg-time">60s</b></span><span class="mg-lives"></span><span class="mg-bst"><i></i><b class="mg-best">0</b></span></div>' +
      '<div class="mg-wrap"><canvas id="mgCanvas" aria-label=""></canvas><div class="mg-over" hidden><b></b><p></p><button type="button" class="an-btn mg-again"></button></div></div><p class="mg-status" aria-live="polite"></p><p class="an-hint"></p>';
    cv = box.querySelector('#mgCanvas'); g = cv.getContext('2d'); statusEl = box.querySelector('.mg-status');
    box.querySelector('.mg-again').addEventListener('click', function () { reset(); });
    cv.addEventListener('pointerdown', function (e) {
      if (over) return; var p = pt(e);
      if (p.x < VW * 0.58 && !stone) { pull = { x: p.x, y: p.y }; started = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); }
    });
    cv.addEventListener('pointermove', function (e) { if (!pull) return; var p = pt(e); pull.x = p.x; pull.y = p.y; e.preventDefault(); });
    function release() {
      if (!pull) return;
      var dx = SLING.x - pull.x, dy = SLING.y - pull.y, d = Math.hypot(dx, dy);
      if (d > 14) {
        var k = Math.min(d, MAXPULL) / d; dx *= k; dy *= k;
        stone = { x: SLING.x - dx, y: SLING.y - dy, vx: dx * POWER, vy: dy * POWER, life: 3 }; tut = 99;
        snd('tick'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {}
        if (watch.state === 'watch') spotted();
      }
      pull = null;
    }
    cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', function () { pull = null; });
    window.addEventListener('resize', function () { if (open) sizeCanvas(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: 0.1 }).observe(card); else visible = true;
    built = true; labels(); reset();
  }
  function labels() {
    if (!built) return;
    cv.setAttribute('aria-label', L('mango.canvas')); box.querySelector('.an-hint').textContent = L('mango.hint');
    box.querySelector('.mg-again').textContent = L('mango.again');
    var is = box.querySelectorAll('.mg-hud i'); is[0].textContent = L('mango.score'); is[1].textContent = L('mango.time'); is[2].textContent = L('mango.best');
    statusEl.textContent = L('mango.ready');
  }
  function say(t) { msg = t; msgT = 1.6; statusEl.textContent = t; }
  function spotted() {
    lives--; say(L('mango.spotted')); snd('thud'); watch.state = 'chase'; watch.t = 1.2; hud();
    if (navigator.vibrate) try { navigator.vibrate([40, 30, 40]); } catch (x) {}
    if (lives <= 0) finish();
  }
  function finish() {
    over = true; var nb = score > best; if (nb) { best = score; store.set('gzp.mango.best', String(best)); }
    var o = box.querySelector('.mg-over'); o.hidden = false;
    o.querySelector('b').textContent = lives <= 0 ? L('mango.caught') : L('mango.done');
    o.querySelector('p').textContent = L('mango.score') + ': ' + score + (nb ? ' · ' + L('mango.newbest') : ' · ' + L('mango.best') + ': ' + best);
    hud();
  }

  function update(dt) {
    if (!started || over) { sway += dt; }
    else { time -= dt; if (time <= 0) { time = 0; finish(); } hud(); }
    sway += dt;
    /* the watchman: dozes, stirs (a warning), watches (do not fire), then wanders */
    watch.t -= dt;
    if (watch.state === 'doze' && watch.t <= 0) { watch.state = 'stir'; watch.t = 0.9; }
    else if (watch.state === 'stir' && watch.t <= 0) { watch.state = 'watch'; watch.t = rnd(1.6, 2.6); }
    else if (watch.state === 'watch' && watch.t <= 0) { watch.state = 'walk'; watch.t = rnd(2, 3.5); watch.dir = Math.random() < 0.5 ? -1 : 1; }
    else if (watch.state === 'walk' && watch.t <= 0) { watch.state = 'doze'; watch.t = rnd(3, 5.5); }
    else if (watch.state === 'chase' && watch.t <= 0) { watch.state = 'walk'; watch.t = 2; }
    else if (watch.state === 'dazed' && watch.t <= 0) { watch.state = 'walk'; watch.t = 2.5; watch.dir = Math.random() < 0.5 ? -1 : 1; }
    if (watch.state === 'walk' || watch.state === 'chase') {
      watch.x += watch.dir * (watch.state === 'chase' ? 70 : 34) * dt; watch.step += dt * 8;
      if (watch.x < 330) { watch.x = 330; watch.dir = 1; } if (watch.x > 560) { watch.x = 560; watch.dir = -1; }
    }
    /* the stone */
    if (stone) {
      stone.vy += 620 * dt; stone.x += stone.vx * dt; stone.y += stone.vy * dt; stone.life -= dt;
      mangoes.forEach(function (m) {
        if (m.state !== 'hang' || !stone) return;
        if (Math.hypot(stone.x - m.x, stone.y - m.y) < m.r + 10) {
          m.state = 'fall'; m.vx = stone.vx * 0.12 + rnd(-12, 12); m.vy = -40; stone = null; snd('coin');
          for (var i = 0; i < 8; i++) parts.push({ x: m.x, y: m.y, vx: rnd(-80, 80), vy: rnd(-90, 20), life: rnd(0.3, 0.7), c: '#3f8f3a' });
        }
      });
      if (stone && Math.abs(stone.x - watch.x) < 15 && stone.y > GROUND - 60 && stone.y < GROUND + 2 && watch.state !== 'dazed') {
        watch.state = 'dazed'; watch.t = 3.6; score += 2; bonks++; say(bonks > 2 ? L('mango.bonk3') : L('mango.bonk')); snd('thud'); snd('coin'); hud();
        for (var q = 0; q < 10; q++) parts.push({ x: stone.x, y: stone.y - 10, vx: rnd(-90, 90), vy: rnd(-120, -20), life: rnd(0.4, 0.9), c: '#ffd27a' });
        turban = { x: watch.x, y: watch.y - 52, vx: rnd(-60, 60), vy: -150, rot: 0, on: true }; stone = null;
        if (navigator.vibrate) try { navigator.vibrate(25); } catch (x) {}
      }
      if (stone && (stone.y > GROUND + 4 || stone.x > VW + 20 || stone.life <= 0)) stone = null;
    }
    /* falling mangoes, then the kid fetches them */
    mangoes.forEach(function (m) {
      if (m.state === 'fall') {
        m.vy += 620 * dt; m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.y > GROUND - m.r) { m.y = GROUND - m.r; m.vy *= -0.38; m.vx *= 0.7; m.bounce++; if (m.bounce > 2 || Math.abs(m.vy) < 40) { m.state = 'ground'; m.vy = 0; m.vx = 0; } }
      }
    });
    if (!kid.carry) {
      if (!kid.target || kid.target.state === 'gone') kid.target = mangoes.filter(function (m) { return m.state === 'ground' || m.state === 'fall'; })[0] || null;
      var tx = kid.target ? kid.target.x : 120;
      var dx = tx - kid.x; if (Math.abs(dx) > 2) { kid.dir = dx > 0 ? 1 : -1; kid.x += kid.dir * Math.min(Math.abs(dx), 300 * dt); kid.wob += dt * 14; }
      if (kid.target && kid.target.state === 'ground' && Math.abs(dx) < 10) { kid.carry = kid.target; kid.target.state = 'carried'; }
    } else {
      var d2 = BASKET.x + 20 - kid.x; kid.dir = d2 > 0 ? 1 : -1; kid.x += kid.dir * Math.min(Math.abs(d2), 300 * dt); kid.wob += dt * 14;
      kid.carry.x = kid.x + kid.dir * 6; kid.carry.y = GROUND - 26;
      if (Math.abs(d2) < 6) {
        var pts = kid.carry.ripe > 0.66 ? 3 : kid.carry.ripe > 0.33 ? 2 : 1; score += pts; kid.carry.state = 'gone'; kid.carry = null; kid.target = null; snd('bell'); say('+' + pts); hud();
      }
    }
    if (turban && turban.on) { turban.vy += 620 * dt; turban.x += turban.vx * dt; turban.y += turban.vy * dt; turban.rot += 6 * dt; if (turban.y > GROUND - 4) { turban.y = GROUND - 4; turban.vx = 0; turban.vy = 0; if (watch.state !== 'dazed') turban.on = false; } }
    msgT = Math.max(0, msgT - dt); tut += dt;
    parts.forEach(function (p) { p.life -= dt; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); parts = parts.filter(function (p) { return p.life > 0; });
    if (mangoes.every(function (m) { return m.state === 'gone'; })) mkMangoes();
  }

  function mangoCol(r) { return r > 0.66 ? ['#f2a63b', '#e07a2a'] : r > 0.33 ? ['#e6cf4a', '#c9a62a'] : ['#7db048', '#4f8a32']; }
  function person(x, y, col, dir, walking, stepT, tall) {
    g.save(); g.translate(x, y); g.scale(dir, 1); var s = tall ? 1.25 : 1, sw = walking ? Math.sin(stepT) * 5 : 0;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 1, 12 * s, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#8a5a3a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-2, -14 * s); g.lineTo(-2 + sw, 0); g.moveTo(2, -14 * s); g.lineTo(2 - sw, 0); g.stroke();
    g.fillStyle = col; g.fillRect(-6 * s, -30 * s, 12 * s, 17 * s);
    g.fillStyle = '#a56d47'; g.beginPath(); g.arc(0, -36 * s, 6 * s, 0, 6.283); g.fill();
    g.restore();
  }
  function draw() {
    g.clearRect(0, 0, VW, VH);
    var sg = g.createLinearGradient(0, 0, 0, GROUND); sg.addColorStop(0, '#8ec5df'); sg.addColorStop(1, '#f6e3b8'); g.fillStyle = sg; g.fillRect(0, 0, VW, VH);
    g.fillStyle = 'rgba(255,255,255,.7)'; [[120, 50, 40], [330, 36, 52], [560, 62, 34]].forEach(function (c) { g.beginPath(); g.ellipse(c[0] + Math.sin(sway * 0.2 + c[0]) * 10, c[1], c[2], 10, 0, 0, 6.283); g.fill(); });
    g.fillStyle = '#b9c88a'; g.beginPath(); g.moveTo(0, GROUND - 20); g.quadraticCurveTo(160, GROUND - 60, 320, GROUND - 22); g.quadraticCurveTo(480, GROUND - 52, 640, GROUND - 24); g.lineTo(640, GROUND); g.lineTo(0, GROUND); g.fill();
    g.fillStyle = '#8f7a4a'; g.fillRect(0, GROUND, VW, VH - GROUND);
    g.fillStyle = '#7a6640'; for (var i = 0; i < 30; i++) g.fillRect((i * 37) % VW, GROUND + 8 + (i * 13) % 40, 8, 2);
    /* the tree */
    var sw = Math.sin(sway * 0.9) * 2;
    g.fillStyle = '#5a4030'; g.beginPath(); g.moveTo(490, GROUND); g.quadraticCurveTo(496, 250, 486, 190); g.lineTo(524, 190); g.quadraticCurveTo(522, 250, 536, GROUND); g.fill();
    g.save(); g.translate(sw, 0);
    [[510, 130, 96], [440, 160, 62], [580, 150, 66], [500, 80, 60], [560, 100, 54]].forEach(function (c, k) { g.fillStyle = k % 2 ? '#3f7a3a' : '#4d8f42'; g.beginPath(); g.arc(c[0], c[1], c[2], 0, 6.283); g.fill(); });
    g.restore();
    /* mangoes */
    mangoes.forEach(function (m) {
      if (m.state === 'gone') return; var c = mangoCol(m.ripe), x = m.x + (m.state === 'hang' ? sw + Math.sin(sway * 1.4 + m.ph) * 1.4 : 0), y = m.y;
      g.strokeStyle = '#4a6a30'; g.lineWidth = 1.5; if (m.state === 'hang') { g.beginPath(); g.moveTo(x, y - m.r); g.lineTo(x, y - m.r - 8); g.stroke(); }
      g.fillStyle = c[0]; g.beginPath(); g.ellipse(x, y, m.r, m.r * 1.15, 0.4, 0, 6.283); g.fill();
      g.fillStyle = c[1]; g.beginPath(); g.ellipse(x + 3, y + 3, m.r * 0.5, m.r * 0.6, 0.4, 0, 6.283); g.globalAlpha = .5; g.fill(); g.globalAlpha = 1;
    });
    /* basket */
    g.fillStyle = '#9a6a3a'; g.fillRect(BASKET.x - 22, GROUND - 16, 44, 16); g.strokeStyle = '#6a4a28'; g.lineWidth = 1.4; for (var b = -18; b < 22; b += 8) { g.beginPath(); g.moveTo(BASKET.x + b, GROUND - 16); g.lineTo(BASKET.x + b, GROUND); g.stroke(); }
    var inB = Math.min(6, Math.floor(score / 2)); for (var q = 0; q < inB; q++) { g.fillStyle = '#f2a63b'; g.beginPath(); g.arc(BASKET.x - 12 + (q % 3) * 12, GROUND - 17 - Math.floor(q / 3) * 7, 6, 0, 6.283); g.fill(); }
    /* the watchman */
    var ws = watch.state, dz = ws === 'dazed';
    g.save(); if (dz) { g.translate(watch.x + Math.sin(sway * 30) * 1.6, watch.y); g.rotate(Math.sin(sway * 5) * 0.18); g.translate(-watch.x, -watch.y); }
    person(watch.x, watch.y, '#2f4f6f', watch.dir, ws === 'walk' || ws === 'chase', watch.step, true);
    if (!(turban && turban.on)) { g.fillStyle = '#e9dcc0'; g.beginPath(); g.ellipse(watch.x, watch.y - 52, 8, 4, 0, 0, 6.283); g.fill(); }
    g.restore();
    if (turban && turban.on) { g.save(); g.translate(turban.x, turban.y); g.rotate(turban.rot); g.fillStyle = '#e9dcc0'; g.beginPath(); g.ellipse(0, 0, 9, 4.5, 0, 0, 6.283); g.fill(); g.restore(); }
    if (dz) { for (var st = 0; st < 4; st++) { var sa = sway * 5 + st * 1.57; g.fillStyle = '#ffd24a'; g.font = '700 13px sans-serif'; g.fillText('★', watch.x - 6 + Math.cos(sa) * 14, watch.y - 62 + Math.sin(sa) * 5); } }
    g.font = '700 18px sans-serif'; g.textAlign = 'center';
    if (ws === 'doze') { g.fillStyle = 'rgba(40,40,60,.7)'; g.fillText('z', watch.x + 10, watch.y - 58 - ((sway * 14) % 12)); g.fillText('Z', watch.x + 18, watch.y - 66 - ((sway * 14) % 12)); }
    if (ws === 'stir') { g.fillStyle = '#e8a020'; g.fillText('?', watch.x, watch.y - 64); }
    if (ws === 'watch') { g.fillStyle = '#d8433a'; g.fillText('!', watch.x, watch.y - 64); g.strokeStyle = 'rgba(216,67,58,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(watch.x, watch.y - 40); g.lineTo(SLING.x, SLING.y); g.stroke(); }
    g.textAlign = 'left';
    /* the kid */
    person(kid.x, kid.y, '#3f8f6a', kid.dir, true, kid.wob, false);
    if (kid.carry) { var c2 = mangoCol(kid.carry.ripe); g.fillStyle = c2[0]; g.beginPath(); g.arc(kid.carry.x, kid.carry.y, 8, 0, 6.283); g.fill(); }
    /* the slingshot */
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(SLING.x, GROUND); g.lineTo(SLING.x, SLING.y + 20); g.moveTo(SLING.x, SLING.y + 20); g.lineTo(SLING.x - 16, SLING.y - 6); g.moveTo(SLING.x, SLING.y + 20); g.lineTo(SLING.x + 16, SLING.y - 6); g.stroke();
    var px = pull ? SLING.x + clamp(pull.x - SLING.x, -MAXPULL, MAXPULL) : SLING.x, py = pull ? SLING.y + clamp(pull.y - SLING.y, -MAXPULL, MAXPULL) : SLING.y - 2;
    if (pull) { var dd = Math.hypot(px - SLING.x, py - SLING.y); if (dd > MAXPULL) { px = SLING.x + (px - SLING.x) / dd * MAXPULL; py = SLING.y + (py - SLING.y) / dd * MAXPULL; } }
    g.strokeStyle = '#2b2018'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(SLING.x - 16, SLING.y - 6); g.lineTo(px, py); g.lineTo(SLING.x + 16, SLING.y - 6); g.stroke();
    if (!stone) { g.fillStyle = '#6a6a72'; g.beginPath(); g.arc(px, py, 5, 0, 6.283); g.fill(); }
    if (pull) {          /* the aim: a dotted arc */
      var ddx = SLING.x - px, ddy = SLING.y - py, vx = ddx * POWER, vy = ddy * POWER, x = px, y = py;
      g.fillStyle = 'rgba(40,30,20,.55)';
      for (var t = 0, n = 0; n < 26; n++, t += 0.06) { x = px + vx * t; y = py + vy * t + 0.5 * 620 * t * t; if (y > GROUND) break; g.beginPath(); g.arc(x, y, Math.max(1, 2.6 - n * 0.06), 0, 6.283); g.fill(); }
    }
    if (stone) { g.fillStyle = '#4a4a52'; g.beginPath(); g.arc(stone.x, stone.y, 5, 0, 6.283); g.fill(); }
    parts.forEach(function (p) { g.globalAlpha = clamp(p.life * 2, 0, 1); g.fillStyle = p.c || '#fff'; g.fillRect(p.x, p.y, 3, 3); }); g.globalAlpha = 1;
    /* a first-time hint: a little hand shows the drag */
    if (!started && !pull && !over) {
      var ph = (sway * 0.8) % 1.6, f2 = Math.min(1, ph / 1.0), hx2 = SLING.x - 62 * f2, hy2 = SLING.y + 30 * f2 + 8;
      g.globalAlpha = 0.9 - (ph > 1.2 ? (ph - 1.2) * 2 : 0); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(hx2, hy2, 11, 0, 6.283); g.fill();
      g.strokeStyle = 'rgba(40,30,20,.5)'; g.lineWidth = 2; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(SLING.x, SLING.y); g.lineTo(hx2, hy2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    if (pull) { var pw = Math.min(1, Math.hypot(px - SLING.x, py - SLING.y) / MAXPULL); g.fillStyle = 'rgba(40,30,20,.2)'; g.fillRect(SLING.x - 30, SLING.y + 52, 60, 7); g.fillStyle = pw > 0.85 ? '#d8433a' : '#e08a3c'; g.fillRect(SLING.x - 30, SLING.y + 52, 60 * pw, 7); }
    if (msgT > 0) { g.font = '700 22px serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(40,20,10,' + Math.min(1, msgT) + ')'; g.fillText(msg, VW / 2, 60 - (1.6 - msgT) * 14); g.textAlign = 'left'; }
  }
  function frame(now) {
    if (!open || !visible) { raf = 0; return; }
    if (!last) last = now; var dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw(); raf = requestAnimationFrame(frame);
  }
  function kick() { last = 0; if (!raf && open && visible) raf = requestAnimationFrame(frame); }
  head.addEventListener('click', function () {
    open = !card.classList.contains('is-open');
    card.classList.toggle('is-open', open); head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { if (!built) build(); setTimeout(function () { sizeCanvas(); kick(); }, 120); snd('chime'); }
  });
  window.Mango = { _dbg: function () { return { stone: stone ? [Math.round(stone.x), Math.round(stone.y)] : null, watch: [Math.round(watch.x), watch.state], score: score, bonks: bonks }; }, open: function () { if (!card.classList.contains('is-open')) head.click(); }, refresh: labels };
})();
