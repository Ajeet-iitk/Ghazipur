/* ══════════════════════════════════════════════════════════════
   THE ARTISTS' CORNER — a small easter egg in the Living chapter.
   Peek inside and three hands are at work: a floor artist drawing a chowk
   (draw your own: your lines repeat eight ways), a still turning roses into
   rose water, and a weaver making a bamboo soop for Chhath.
   The scenes are illustrations of crafts of the Bhojpuri belt, drawn for
   this page; they are not portraits of particular workshops.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var host = document.getElementById('artNook');
  if (!host) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var st = { open: false, tab: 'chowk', built: false, raf: 0, visible: false };
  var cv, g, dpr = 1, SIZE = 300, col = '#fff4dc', drawing = false, last = null, demo = null, touched = false;
  var SWATCH = ['#fff4dc', '#f2a63b', '#e5557a', '#7fc8a0', '#8fb4e8'];

  /* ── the shell ────────────────────────────────────────────── */
  function build() {
    host.innerHTML =
      '<button type="button" class="an-head" id="anHead" aria-expanded="false" aria-controls="anBody">' +
      '<span class="an-ic" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24"><path class="an-i1" d="M3 17q4-12 9-4t9-10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '<svg viewBox="0 0 24 24"><path d="M12 3q5 7 5 11a5 5 0 0 1-10 0q0-4 5-11z" fill="currentColor" class="an-i2"/></svg>' +
      '<svg viewBox="0 0 24 24" class="an-i3"><path d="M3 8h18M3 12h18M3 16h18M8 3v18M12 3v18M16 3v18" stroke="currentColor" stroke-width="1.3" fill="none"/></svg></span>' +
      '<span class="an-txt"><i></i><b></b><em></em></span><span class="an-plus" aria-hidden="true"></span></button>' +
      '<div class="an-body" id="anBody"><div class="an-in">' +
      '<div class="an-tabs" role="tablist"></div>' +
      '<div class="an-stage">' +
      '<div class="an-pane" data-pane="chowk"><div class="an-canvas"><canvas id="anCanvas" aria-label=""></canvas></div>' +
      '<div class="an-tools"><span class="an-sw"></span><button type="button" class="an-btn" data-an="demo"></button><button type="button" class="an-btn" data-an="clear"></button><button type="button" class="an-btn" data-an="save"></button></div></div>' +
      '<div class="an-pane" data-pane="still"><svg class="an-svg" id="anStill" viewBox="0 0 320 220"></svg></div>' +
      '<div class="an-pane" data-pane="soop"><svg class="an-svg" id="anSoop" viewBox="0 0 320 220"></svg></div>' +
      '</div><p class="an-hint"></p><p class="an-note"></p></div></div>';

    buildStill(); buildSoop();
    var tabs = host.querySelector('.an-tabs');
    ['chowk', 'still', 'soop'].forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'an-tab'; b.setAttribute('role', 'tab'); b.setAttribute('data-tab', k);
      tabs.appendChild(b);
    });
    var sw = host.querySelector('.an-sw');
    SWATCH.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'an-swb' + (i === 0 ? ' is-on' : ''); b.style.background = c; b.setAttribute('data-c', c); b.setAttribute('aria-label', c);
      sw.appendChild(b);
    });
    cv = host.querySelector('#anCanvas'); g = cv.getContext('2d');
    bind();
    labels();
    st.built = true;
  }

  function labels() {
    host.querySelector('.an-txt i').textContent = L('art.kicker');
    host.querySelector('.an-txt b').textContent = L('art.title');
    host.querySelector('.an-txt em').textContent = L('art.lede');
    Array.prototype.forEach.call(host.querySelectorAll('.an-tab'), function (b) {
      var k = b.getAttribute('data-tab');
      b.textContent = L('art.' + k); b.classList.toggle('is-on', k === st.tab); b.setAttribute('aria-selected', k === st.tab ? 'true' : 'false');
    });
    host.querySelector('[data-an="demo"]').textContent = L('art.demo');
    host.querySelector('[data-an="clear"]').textContent = L('art.clear');
    host.querySelector('[data-an="save"]').textContent = L('art.save');
    host.querySelector('.an-hint').textContent = L('art.' + st.tab + 'Hint');
    host.querySelector('.an-note').textContent = L('art.note');
    cv.setAttribute('aria-label', L('art.canvas'));
  }

  /* ── the chowk: a floor drawn in rice flour, mirrored eight ways ── */
  function sizeCanvas() {
    var r = cv.parentNode.getBoundingClientRect();
    if (!r.width) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    SIZE = r.width;
    cv.width = Math.round(SIZE * dpr); cv.height = Math.round(SIZE * dpr);
    cv.style.width = SIZE + 'px'; cv.style.height = SIZE + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintFloor();
    return true;
  }
  function paintFloor() {
    var s = SIZE, c = s / 2;
    var gr = g.createRadialGradient(c, c, s * 0.05, c, c, s * 0.75);
    gr.addColorStop(0, '#c4673f'); gr.addColorStop(1, '#9a4a2f');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(60,24,10,.12)';
    for (var i = 0; i < 160; i++) g.fillRect((i * 97.3) % s, (i * 53.7) % s, 1.6, 1.6);
    g.strokeStyle = 'rgba(255,230,190,.16)'; g.lineWidth = 1;
    [0.16, 0.3, 0.44].forEach(function (r) { g.beginPath(); g.arc(c, c, s * r, 0, 6.283); g.stroke(); });
    g.fillStyle = 'rgba(255,230,190,.3)';
    for (var a = 0; a < 8; a++) { g.beginPath(); g.arc(c + Math.cos(a * 0.7854) * s * 0.44, c + Math.sin(a * 0.7854) * s * 0.44, 1.6, 0, 6.283); g.fill(); }
    g.beginPath(); g.arc(c, c, 2.4, 0, 6.283); g.fill();
  }
  function seg(a, b, color, w) {
    var c = SIZE / 2;
    g.save(); g.translate(c, c); g.strokeStyle = color; g.lineWidth = w || 3; g.lineCap = 'round';
    g.shadowColor = color; g.shadowBlur = 5;
    for (var k = 0; k < 8; k++) {
      for (var m = -1; m <= 1; m += 2) {
        g.save(); g.rotate(k * Math.PI / 4); g.scale(m, 1);
        g.beginPath(); g.moveTo(a.x - c, a.y - c); g.lineTo(b.x - c, b.y - c); g.stroke();
        g.restore();
      }
    }
    g.restore();
  }
  function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * SIZE, y: (e.clientY - r.top) / r.height * SIZE }; }

  /* a pattern for the artist to draw first, one wedge of it */
  function demoPath() {
    var R = SIZE * 0.44, c = SIZE / 2, out = [], t, n = 120;
    function P(r, th) { return { x: c + Math.cos(th) * r, y: c + Math.sin(th) * r }; }
    var layers = [
      { color: '#fff4dc', f: function (u) { return P(R * (0.28 + 0.62 * Math.abs(Math.sin(u * Math.PI * 2))), u * Math.PI / 4); } },
      { color: '#f2a63b', f: function (u) { return P(R * (0.16 + 0.05 * Math.sin(u * Math.PI * 6)), u * Math.PI / 4); } },
      { color: '#e5557a', f: function (u) { return P(R * (0.94 + 0.05 * Math.sin(u * Math.PI * 8)), u * Math.PI / 4); } },
      { color: '#7fc8a0', f: function (u) { return P(R * (0.5 + 0.12 * Math.sin(u * Math.PI * 4 + 1)), u * Math.PI / 4); } }
    ];
    layers.forEach(function (L2) { for (t = 0; t <= n; t++) out.push({ p: L2.f(t / n), color: L2.color, start: t === 0 }); });
    return out;
  }
  function runDemo() {
    cancelAnimationFrame(demo && demo.raf);
    paintFloor();
    var path = demoPath(), i = 0;
    demo = { raf: 0 };
    if (reduced) { for (var k = 1; k < path.length; k++) if (!path[k].start) seg(path[k - 1].p, path[k].p, path[k].color, 3); return; }
    (function step() {
      if (!demo || !st.open || st.tab !== 'chowk') { demo = null; return; }
      for (var n = 0; n < 3 && i < path.length; n++, i++) if (i > 0 && !path[i].start) seg(path[i - 1].p, path[i].p, path[i].color, 3);
      if (i < path.length) demo.raf = requestAnimationFrame(step); else demo = null;
    })();
  }
  function stopDemo() { if (demo) { cancelAnimationFrame(demo.raf); demo = null; } }

  /* ── the rose still: petals in, rose water out ────────────── */
  var still = { fill: 0.12, items: {} };
  function el(name, attrs, parent) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function buildStill() {
    var s = host.querySelector('#anStill');
    s.innerHTML =
      '<defs><linearGradient id="anCu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4a22"/><stop offset=".45" stop-color="#e6a05a"/><stop offset="1" stop-color="#9a5628"/></linearGradient>' +
      '<clipPath id="anBot"><path d="M258 118h22v20q10 8 10 22v32q0 8-8 8h-26q-8 0-8-8v-32q0-14 10-22z"/></clipPath></defs>' +
      '<rect width="320" height="220" fill="#f4dcc2"/><rect y="190" width="320" height="30" fill="#b98a62"/>' +
      '<path d="M0 190q80-14 160-6t160-6V190z" fill="#cfa77a" opacity=".5"/>' +
      /* hearth and fire */
      '<g transform="translate(104,190)"><path d="M-46 0l6-20h80l6 20z" fill="#6a5a50"/><path d="M-30 -20h60" stroke="#4a3d36" stroke-width="2"/>' +
      '<g class="an-fire"><path d="M-10 -20q-6-16 4-28 2 10 10 12 8 4 4 16z" fill="#ff9a3c"/><path d="M-3 -20q-3-10 3-18 6 6 2 18z" fill="#ffe08a"/></g></g>' +
      /* the pot, lid and neck */
      '<g transform="translate(104,138)"><path d="M-40 36Q-52 -4 -22 -22h44q30 18 18 58z" fill="url(#anCu)"/><path d="M-26 -22q26-14 52 0" fill="#a95f2c"/><rect x="-8" y="-38" width="16" height="18" rx="3" fill="#c98040"/>' +
      '<path d="M-24 -4q24 8 48 0" stroke="#fff" stroke-width="1.4" opacity=".35" fill="none"/></g>' +
      /* bamboo pipe to the cooling tub, and the tub */
      '<path d="M112 100q40-14 82 6v26" stroke="#c9a96a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M112 100q40-14 82 6v26" stroke="#8a7240" stroke-width="1" fill="none" stroke-dasharray="6 5"/>' +
      '<g transform="translate(194,150)"><path d="M-30 0l4 38h52l4-38z" fill="#8a7a6a"/><ellipse rx="30" ry="6" fill="#6aa8b4"/><path class="an-wv" d="M-22 0q5-3 10 0t10 0t10 0t10 0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6"/></g>' +
      '<path d="M222 160q22 0 36 -34" stroke="#c9a96a" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      /* the bottle fills */
      '<path d="M258 118h22v20q10 8 10 22v32q0 8-8 8h-26q-8 0-8-8v-32q0-14 10-22z" fill="#eaf4f2" opacity=".7"/>' +
      '<g clip-path="url(#anBot)"><rect id="anFill" x="244" y="214" width="60" height="0" fill="#f3b3c0"/><path id="anFillTop" d="" fill="#f8d0d8" opacity=".8"/></g>' +
      '<path d="M258 118h22v20q10 8 10 22v32q0 8-8 8h-26q-8 0-8-8v-32q0-14 10-22z" fill="none" stroke="#9ab" stroke-width="1.4"/>' +
      '<circle class="an-drop" cx="269" cy="112" r="2.4" fill="#f3b3c0"/>' +
      /* steam */
      '<g class="an-steam"><circle cx="102" cy="92" r="5" fill="#fff"/><circle class="s2" cx="106" cy="92" r="4" fill="#fff"/><circle class="s3" cx="98" cy="92" r="4.5" fill="#fff"/></g>' +
      /* the maker, feeding the fire */
      '<g transform="translate(40,190)"><ellipse cy="2" rx="22" ry="4" fill="#000" opacity=".15"/><path d="M-12 -2q0 -22 8 -36h12q8 14 8 36z" fill="#c0504a"/><circle cx="2" cy="-46" r="9" fill="#a56d47"/><path d="M-8 -52q10-12 20 0z" fill="#2b2420"/>' +
      '<g class="an-arm"><path d="M6 -34L34 -16" stroke="#a56d47" stroke-width="5" stroke-linecap="round"/><path d="M34 -16L52 -8" stroke="#7a5a3a" stroke-width="4" stroke-linecap="round"/></g></g>' +
      '<g id="anPetals"></g>';
    still.items.fill = s.querySelector('#anFill'); still.items.top = s.querySelector('#anFillTop'); still.items.petals = s.querySelector('#anPetals');
    s.addEventListener('pointerdown', function (e) {
      var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 320;
      dropPetals(x);
    });
    setFill();
  }
  function setFill() {
    var h = 82 * clamp(still.fill, 0, 1), y = 214 - h, t = still.items.top;
    still.items.fill.setAttribute('y', y); still.items.fill.setAttribute('height', h + 2);
    var ph = performance.now() / 500;
    t.setAttribute('d', 'M244 ' + y + 'q8 ' + (Math.sin(ph) * 2.4) + ' 15 0t15 0t15 0t15 0v4h-60z');
  }
  function dropPetals(x) {
    var s = host.querySelector('#anStill');
    for (var i = 0; i < 7; i++) {
      var p = el('ellipse', { class: 'an-petal', cx: 104 + (Math.random() - 0.5) * 36, cy: 20, rx: 4, ry: 2.4, fill: ['#e5557a', '#f27a9a', '#d6416a'][i % 3] }, still.items.petals);
      p.style.animationDelay = (i * 0.07) + 's';
      (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1500); })(p);
    }
    still.fill += 0.1;
    if (still.fill > 1) { still.fill = 0.1; snd('bell'); } else snd('coin');
  }

  /* ── the soop: a bamboo tray woven strip by strip ─────────── */
  var soop = { n: 0, t: 0, hold: 0, rows: [], hands: [] };
  var ROWS = 14, SX = 160, SY = 112, SR = 78;
  function buildSoop() {
    var s = host.querySelector('#anSoop');
    s.innerHTML =
      '<defs><clipPath id="anTray"><circle cx="' + SX + '" cy="' + SY + '" r="' + (SR - 5) + '"/></clipPath>' +
      '<radialGradient id="anBam" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f0d9a0"/><stop offset="1" stop-color="#c9a45e"/></radialGradient></defs>' +
      '<rect width="320" height="220" fill="#efe0c4"/><rect y="196" width="320" height="24" fill="#b98a62"/>' +
      '<ellipse cx="' + SX + '" cy="' + (SY + SR + 8) + '" rx="' + (SR + 6) + '" ry="7" fill="#000" opacity=".16"/>' +
      '<circle cx="' + SX + '" cy="' + SY + '" r="' + SR + '" fill="#a07a3c"/><circle cx="' + SX + '" cy="' + SY + '" r="' + (SR - 5) + '" fill="url(#anBam)"/>' +
      '<g clip-path="url(#anTray)"><g id="anWarp"></g><g id="anWeft"></g><g id="anOffer"></g></g>' +
      '<circle cx="' + SX + '" cy="' + SY + '" r="' + (SR - 2) + '" fill="none" stroke="#7a5a2c" stroke-width="4"/>' +
      '<g id="anHands"></g>';
    var warp = s.querySelector('#anWarp');
    for (var i = -7; i <= 7; i++) el('rect', { x: SX + i * 10 - 1.6, y: SY - SR, width: 3.2, height: SR * 2, fill: '#d8bd7a', opacity: .9 }, warp);
    var weft = s.querySelector('#anWeft'), step = (SR * 2 - 8) / ROWS;
    for (var r = 0; r < ROWS; r++) {
      var y = SY - SR + 6 + r * step;
      var rr = el('g', { class: 'an-row', opacity: 0 }, weft);
      el('rect', { x: SX - SR, y: y, width: SR * 2, height: step - 1.4, fill: r % 2 ? '#e8cf92' : '#b88a46' }, rr);
      for (var k = -7; k <= 7; k++) if ((k + r) % 2 === 0) el('rect', { x: SX + k * 10 - 1.6, y: y, width: 3.2, height: step - 1.4, fill: '#d8bd7a' }, rr);
      soop.rows.push(rr);
    }
    var off = s.querySelector('#anOffer');
    [[-26, -6, '#f2a63b'], [0, 8, '#e5557a'], [24, -4, '#7fc8a0'], [-6, -26, '#f2a63b'], [14, 28, '#e5557a']].forEach(function (o, i) {
      var f = el('g', { class: 'an-off', style: 'animation-delay:' + (i * 0.12) + 's' }, off);
      el('circle', { cx: SX + o[0], cy: SY + o[1], r: 9, fill: o[2] }, f);
      el('circle', { cx: SX + o[0] - 2.5, cy: SY + o[1] - 2.5, r: 3, fill: '#fff', opacity: .35 }, f);
    });
    var hands = s.querySelector('#anHands');
    [-1, 1].forEach(function (d) {
      var h = el('g', { class: 'an-hand' }, hands);
      el('path', { d: 'M0 0q' + (d * 14) + ' -8 ' + (d * 30) + ' -2l' + (d * 4) + ' 10q' + (-d * 18) + ' 10 ' + (-d * 34) + ' 0z', fill: '#a56d47' }, h);
      el('path', { d: 'M' + (d * 28) + ' -2l' + (d * 10) + ' -2M' + (d * 30) + ' 3l' + (d * 11) + ' 1M' + (d * 28) + ' 8l' + (d * 9) + ' 5', stroke: '#a56d47', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, h);
      soop.hands.push({ g: h, d: d });
    });
    s.addEventListener('pointerdown', function () { addRow(); snd('tick'); });
    paintSoop();
  }
  function addRow() {
    if (soop.n >= ROWS) return;
    soop.n++; soop.t = 0; paintSoop();
    if (soop.n >= ROWS) { soop.hold = 3.2; snd('chime'); }
  }
  function paintSoop() {
    soop.rows.forEach(function (r, i) { r.setAttribute('opacity', i < soop.n ? 1 : 0); });
    var s = host.querySelector('#anSoop');
    s.classList.toggle('is-full', soop.n >= ROWS);
    var step = (SR * 2 - 8) / ROWS, y = SY - SR + 6 + clamp(soop.n, 0, ROWS - 1) * step + step / 2;
    soop.hands.forEach(function (h) { h.y = y; });
  }
  function tickSoop(dt) {
    var tt = performance.now() / 1000;
    if (soop.n >= ROWS) { soop.hold -= dt; if (soop.hold <= 0) { soop.n = 0; paintSoop(); } }
    else { soop.t += dt; if (soop.t > 0.85) addRow(); }
    soop.hands.forEach(function (h) {
      var sway = Math.sin(tt * 7 + h.d) * 5, edge = SX + h.d * (SR + 2 - Math.abs(sway) * 0.4);
      h.g.setAttribute('transform', 'translate(' + (edge - h.d * 18 + sway * h.d * 0.4) + ',' + (h.y + Math.sin(tt * 3.5) * 1.5) + ')');
    });
  }

  /* ── one small loop for the two svg scenes, only while visible ── */
  var lastT = 0;
  function loop(now) {
    if (!st.visible || !st.open) { st.raf = 0; return; }
    var dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0; lastT = now;
    if (st.tab === 'still') { still.fill = Math.min(1, still.fill + dt * 0.012); setFill(); }
    else if (st.tab === 'soop') tickSoop(dt);
    st.raf = requestAnimationFrame(loop);
  }
  function kick() { lastT = 0; if (!st.raf && st.visible && st.open && !reduced) st.raf = requestAnimationFrame(loop); }

  /* ── events ───────────────────────────────────────────────── */
  function setTab(k) {
    st.tab = k;
    Array.prototype.forEach.call(host.querySelectorAll('.an-pane'), function (p) { p.classList.toggle('is-on', p.getAttribute('data-pane') === k); });
    labels();
    if (k === 'chowk') { if (sizeCanvas() && !touched) runDemo(); }
    else stopDemo();
    kick();
  }
  function toggle(open) {
    st.open = open;
    host.classList.toggle('is-open', open);
    host.querySelector('#anHead').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { snd('chime'); setTimeout(function () { setTab(st.tab); }, 80); } else stopDemo();
    kick();
  }
  function bind() {
    host.querySelector('#anHead').addEventListener('click', function () { toggle(!st.open); });
    host.querySelector('.an-tabs').addEventListener('click', function (e) { var b = e.target.closest('.an-tab'); if (b) { setTab(b.getAttribute('data-tab')); snd('tick'); } });
    host.querySelector('.an-sw').addEventListener('click', function (e) {
      var b = e.target.closest('.an-swb'); if (!b) return;
      col = b.getAttribute('data-c');
      Array.prototype.forEach.call(host.querySelectorAll('.an-swb'), function (x) { x.classList.toggle('is-on', x === b); });
    });
    host.querySelector('.an-tools').addEventListener('click', function (e) {
      var b = e.target.closest('[data-an]'); if (!b) return;
      var a = b.getAttribute('data-an');
      if (a === 'clear') { stopDemo(); paintFloor(); touched = true; }
      else if (a === 'demo') { touched = false; runDemo(); }
      else if (a === 'save') {
        var link = document.createElement('a'); link.download = 'ghazipur-chowk.png'; link.href = cv.toDataURL('image/png'); link.click();
      }
    });
    cv.addEventListener('pointerdown', function (e) {
      stopDemo(); touched = true; drawing = true; last = pt(e);
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      seg(last, { x: last.x + 0.1, y: last.y + 0.1 }, col, 3.4);
      e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pt(e); seg(last, p, col, 3.4); last = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { cv.addEventListener(n, function () { drawing = false; }); });
    window.addEventListener('resize', function () { if (st.open && st.tab === 'chowk' && cv.parentNode.getBoundingClientRect().width) { var had = touched; sizeCanvas(); if (!had) runDemo(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { st.visible = es[0].isIntersecting; if (st.visible) kick(); }, { threshold: 0.1 }).observe(host);
    else st.visible = true;
  }

  window.ArtNook = { build: function () { if (!st.built) build(); else labels(); } };
  window.ArtNook.build();
})();
