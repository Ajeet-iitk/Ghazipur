/* ══════════════════════════════════════════════════════════════
   EIGHT RIVERS, ONE SLOW CURRENT — a river system seen from above,
   edge to edge. The Ganga crosses the whole page; the other rivers flow in
   from the plain. Hover or tap a river and it wakes: boats and lamps ride
   the water, and a ferry crosses at Ghazipur.
   Positions are illustrative, not a survey; names and notes come from the
   district records already on this page.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var W = 1600, H = 540;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var host = null, svg = null, scroller = null, cur = 0, auto = true, autoTimer = null, built = false, visible = false;
  var CITY_X = 880;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function pick(o) { return !o ? '' : typeof o === 'string' ? o : (o[lang()] || o.en || ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* the Ganga's centre line */
  function gy(x) { return 300 + 24 * Math.sin(x / 190) + 13 * Math.sin(x / 71 + 1); }
  function gangaPath(w) {
    var d = '', x;
    for (x = -40; x <= W + 40; x += 20) d += (x === -40 ? 'M' : 'L') + x + ' ' + gy(x).toFixed(1);
    return d;
  }

  /* the others: source on the plain, mouth on the Ganga (illustrative) */
  var RIV = [
    null,
    { ex: 430, sx: 230, sy: -20, w: 11, side: -1, wob: 1 },     /* Gomti */
    { ex: 1110, sx: 1260, sy: -20, w: 6, side: -1, wob: -1 },   /* Gaangi */
    { ex: 730, sx: 600, sy: -20, w: 6, side: -1, wob: 1 },      /* Beson */
    { ex: 640, sx: 520, sy: H + 20, w: 6, side: 1, wob: -1 },   /* Magai */
    { ex: 1010, sx: 1140, sy: H + 20, w: 6, side: 1, wob: 1 },  /* Bhainsai */
    { ex: 300, sx: 110, sy: H + 20, w: 11, side: 1, wob: 1 },   /* Tons */
    { ex: 1440, sx: 1580, sy: H + 20, w: 12, side: 1, wob: -1 } /* Karmanasa */
  ];
  var COLORS = ['#3f8a99', '#4f9bb0', '#6aa7a0', '#5a95bd', '#7aa89a', '#6a9fa8', '#4a8ea8', '#7a9bc0'];

  function tribPath(r) {
    var ex = r.ex, ey = gy(r.ex), sx = r.sx, sy = r.sy;
    var dy = ey - sy, dx = ex - sx;
    var c1x = sx + dx * 0.15 + r.wob * 90, c1y = sy + dy * 0.34;
    var c2x = ex - dx * 0.1 - r.wob * 80, c2y = sy + dy * 0.7;
    return 'M' + sx + ' ' + sy + ' C' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + ex + ' ' + ey.toFixed(1);
  }

  function particle(pathId, dur, begin, kind, color) {
    if (reduced) return '';
    var shape = kind === 'boat'
      ? '<path d="M-7 0q7 5 14 0l-3 -3h-8z" fill="#3a2a22"/><path d="M0 -3v-7l5 5z" fill="#f1d9b0"/>'
      : '<circle r="3.2" fill="' + (color || '#ffd27a') + '"/><circle class="rs-glowc" r="9" fill="#ffd27a" opacity=".35"/>';
    return '<g class="rs-part"><animateMotion dur="' + dur + 's" begin="-' + begin + 's" repeatCount="indefinite" rotate="auto"><mpath href="#' + pathId + '"/></animateMotion>' + shape + '</g>';
  }

  function bird(y, d, t) {
    return '<g class="rs-bird" style="animation-delay:-' + d + 's;animation-duration:' + t + 's"><g transform="translate(0,' + y + ')"><path class="rs-wing" d="M0 0q7-9 14 0q7-9 14 0" stroke="#4a3a30" stroke-width="2" fill="none"/></g></g>';
  }

  function scene(data) {
    var r = rng(41), i, s = '';
    s += '<defs>' +
      '<linearGradient id="rsG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--rs-w1)"/><stop offset=".5" stop-color="var(--rs-w2)"/><stop offset="1" stop-color="var(--rs-w1)"/></linearGradient>' +
      '<radialGradient id="rsGlow"><stop offset="0" stop-color="#ffd79a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd79a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rsMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" class="rs-land"/>';
    /* the plain: patchwork fields, villages, groves */
    for (i = 0; i < 90; i++) {
      var fx = r() * W, fy = r() * H, fw = 40 + r() * 110, fh = 24 + r() * 70, k = Math.floor(r() * 4);
      if (Math.abs(fy - gy(fx)) < 50) continue;
      s += '<rect class="rs-f rs-f' + k + '" x="' + fx.toFixed(0) + '" y="' + fy.toFixed(0) + '" width="' + fw.toFixed(0) + '" height="' + fh.toFixed(0) + '" rx="6" transform="rotate(' + ((r() * 14 - 7).toFixed(1)) + ' ' + fx.toFixed(0) + ' ' + fy.toFixed(0) + ')"/>';
    }
    for (i = 0; i < 110; i++) {
      var tx = r() * W, ty = r() * H;
      if (Math.abs(ty - gy(tx)) < 44) continue;
      s += '<circle class="rs-tree" cx="' + tx.toFixed(0) + '" cy="' + ty.toFixed(0) + '" r="' + (3 + r() * 5).toFixed(1) + '"/>';
    }
    for (i = 0; i < 26; i++) {
      var vx = r() * W, vy = r() * H;
      if (Math.abs(vy - gy(vx)) < 56) continue;
      s += '<g class="rs-vil" transform="translate(' + vx.toFixed(0) + ',' + vy.toFixed(0) + ')"><rect x="-6" y="-4" width="12" height="8" rx="1.5"/><circle class="rs-lit" cx="0" cy="0" r="14"/></g>';
    }
    /* the tributaries (under the Ganga) */
    for (i = 1; i < data.length; i++) {
      var rv = RIV[i], d = tribPath(rv);
      s += '<g class="rs-r" data-i="' + i + '">' +
        '<path class="rs-bank" d="' + d + '" stroke-width="' + (rv.w + 6) + '"/>' +
        '<path class="rs-water" id="rsP' + i + '" d="' + d + '" stroke-width="' + rv.w + '" style="stroke:' + COLORS[i] + '"/>' +
        '<path class="rs-flow" d="' + d + '" stroke-width="' + Math.max(1.4, rv.w * 0.22) + '"/>' +
        particle('rsP' + i, 11 + i * 1.3, i * 1.7, i % 2 ? 'diya' : 'boat') +
        '<path class="rs-hit" d="' + d + '"/>' +
        '<text class="rs-name" x="' + (rv.sx + (rv.sx > W - 120 ? -16 : 14)) + '" y="' + (rv.sy < 0 ? 34 : H - 22) + '" text-anchor="' + (rv.sx > W - 120 ? 'end' : 'start') + '">' + esc(lang() === 'hi' ? data[i].hi : data[i].n) + '</text></g>';
    }
    /* the Ganga */
    var gp = gangaPath();
    s += '<g class="rs-r is-on" data-i="0"><path class="rs-bank" d="' + gp + '" stroke-width="78"/><path class="rs-gw" id="rsP0" d="' + gp + '" stroke-width="64" stroke="url(#rsG)"/>' +
      '<path class="rs-gflow rs-gf1" d="' + gp + '" stroke-width="3"/><path class="rs-gflow rs-gf2" d="' + gp + '" stroke-width="2" style="transform:translateY(12px)"/><path class="rs-gflow rs-gf3" d="' + gp + '" stroke-width="2" style="transform:translateY(-13px)"/>' +
      '<path class="rs-hit rs-hit-g" d="' + gp + '"/>' +
      '<text class="rs-name rs-name-g" x="120" y="' + (gy(120) - 52).toFixed(0) + '">' + esc(lang() === 'hi' ? data[0].hi : data[0].n) + '</text></g>';
    /* lamps and boats riding the Ganga */
    for (i = 0; i < 7; i++) s += particle('rsP0', 34 + i * 3, i * 5, i % 3 === 0 ? 'boat' : 'diya');
    /* Ghazipur on the bank, and its ferry */
    var cy = gy(CITY_X) - 58;
    s += '<g class="rs-city" transform="translate(' + CITY_X + ',' + cy.toFixed(0) + ')"><circle class="rs-citylit" r="46" fill="url(#rsGlow)"/>';
    for (i = -4; i <= 4; i++) s += '<rect class="rs-b" x="' + (i * 9 - 4) + '" y="' + (-6 - Math.abs(i % 3) * 4) + '" width="8" height="' + (10 + Math.abs(i % 3) * 4) + '"/>';
    s += '<path class="rs-b" d="M-3 -16a6 6 0 0 1 12 0z" transform="translate(-3,-6)"/><text class="rs-cityname" x="0" y="-30" text-anchor="middle">' + esc(L('rs.city')) + '</text></g>';
    s += '<path id="rsFerry" d="M' + (CITY_X + 40) + ' ' + (gy(CITY_X + 40) - 40).toFixed(0) + 'L' + (CITY_X + 40) + ' ' + (gy(CITY_X + 40) + 40).toFixed(0) + '" fill="none"/>' +
      (reduced ? '' : '<g class="rs-part"><animateMotion dur="14s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#rsFerry"/></animateMotion>' +
        '<path d="M-10 0q10 7 20 0l-4 -4h-12z" fill="#3a2a22"/><path d="M-6 -4q6 -9 12 0z" fill="#d68a50"/></g>');
    /* mist and birds across the full width */
    s += '<rect class="rs-mist" x="-200" y="' + (gy(0) - 120) + '" width="' + (W + 400) + '" height="120" fill="url(#rsMist)"/>' +
      '<rect class="rs-mist rs-mist2" x="-200" y="' + (gy(0) + 60) + '" width="' + (W + 400) + '" height="100" fill="url(#rsMist)"/>';
    s += bird(120, 0, 26) + bird(150, 7, 31) + bird(96, 13, 36) + bird(430, 4, 29);
    return s;
  }

  function build() {
    host = document.getElementById('rivers');
    if (!host || !window.DATA) return;
    var data = window.DATA.rivers;
    host.innerHTML =
      '<div class="rs-title"><h3>' + esc(L('river.riversTitle')) + '</h3><p>' + esc(L('rs.hint')) + '</p></div>' +
      '<div class="rs-scroll" id="rsScroll"><svg class="rs-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(L('rs.alt')) + '">' + scene(data) + '</svg></div>' +
      '<div class="rs-bar"><div class="rs-chips" id="rsChips" role="group" aria-label="' + esc(L('river.riversTitle')) + '">' +
      data.map(function (r, i) {
        return '<button type="button" class="rs-chip' + (i === cur ? ' is-on' : '') + '" data-i="' + i + '"><i style="background:' + COLORS[i] + '"></i>' + esc(lang() === 'hi' ? r.hi : r.n) + '</button>';
      }).join('') + '</div>' +
      '<p class="rs-now" id="rsNow" aria-live="polite"></p>' +
      '<p class="fine rs-fine">' + esc(L('rs.fine')) + '</p></div>';
    svg = host.querySelector('.rs-svg');
    scroller = host.querySelector('#rsScroll');
    built = true;
    mark();
    bind();
    setTimeout(function () { reveal(cur, false); }, 40);
  }

  function mark() {
    if (!built) return;
    Array.prototype.forEach.call(svg.querySelectorAll('.rs-r'), function (g) { g.classList.toggle('is-on', +g.getAttribute('data-i') === cur); });
    Array.prototype.forEach.call(host.querySelectorAll('.rs-chip'), function (b) { b.classList.toggle('is-on', +b.getAttribute('data-i') === cur); });
    svg.classList.add('has-sel');
    var r = window.DATA.rivers[cur];
    var now = host.querySelector('#rsNow');
    if (now) now.innerHTML = '<b>' + esc(lang() === 'hi' ? r.hi : r.n) + '</b> — ' + esc(pick(r.t));
  }

  /* on a phone the panorama is a swipeable strip: glide it to the river you picked */
  function focusX(i) { return i === 0 ? 800 : RIV[i].ex; }
  function reveal(i, smooth) {
    if (!scroller || !svg || scroller.scrollWidth <= scroller.clientWidth + 2) return;
    var scale = svg.getBoundingClientRect().width / W;
    var left = focusX(i) * scale - scroller.clientWidth / 2;
    try { scroller.scrollTo({ left: left, behavior: smooth && !reduced ? 'smooth' : 'auto' }); } catch (e) { scroller.scrollLeft = left; }
  }

  function select(i, user) {
    cur = i;
    if (user) { auto = false; clearInterval(autoTimer); }
    mark();
    reveal(i, true);
  }

  function bind() {
    svg.addEventListener('pointerover', function (e) {
      if (e.pointerType === 'touch') return;
      var g = e.target.closest('.rs-r'); if (g && +g.getAttribute('data-i') !== cur) select(+g.getAttribute('data-i'), true);
    });
    scroller.addEventListener('pointerdown', function () { auto = false; clearInterval(autoTimer); }, { passive: true });
    window.addEventListener('resize', function () { reveal(cur, false); });
    svg.addEventListener('click', function (e) {
      var g = e.target.closest('.rs-r'); if (g) { select(+g.getAttribute('data-i'), true); if (window.Ambient && window.Ambient.splash) window.Ambient.splash(0.4); }
    });
    host.querySelector('#rsChips').addEventListener('click', function (e) {
      var b = e.target.closest('.rs-chip'); if (b) { select(+b.getAttribute('data-i'), true); if (window.Ambient && window.Ambient.splash) window.Ambient.splash(0.4); }
    });
  }

  function startAuto() {
    clearInterval(autoTimer);
    if (reduced || !auto) return;
    autoTimer = setInterval(function () { if (visible && auto) select((cur + 1) % window.DATA.rivers.length, false); }, 3800);
  }

  window.Rivers = {
    build: function () {
      build();
      if ('IntersectionObserver' in window && host && !host._io) {
        host._io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.2 });
        host._io.observe(host);
      } else if (!('IntersectionObserver' in window)) visible = true;
      startAuto();
    }
  };
})();
