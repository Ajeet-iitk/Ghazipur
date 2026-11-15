/* ══════════════════════════════════════════════════════════════
   THE RIVERFRONT — nine ghats, drawn.
   One long hand-drawn panorama, seen from the water. Each ghat is its own
   little scene on a shared stone embankment. Tap one and the boatman rows to
   it, its lamps wake, and the strip glides to centre it. A ferry crosses to
   Tari Ghat; "Row the riverfront" tours them all.
   The scenes are illustrative: only the names and the short notes come from
   the district records on this page.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var W = 2200, H = 400, SLOT = 220, WALL = 250, WATER = 320;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cur = 0, playing = false, tourTimer = null, built = false;
  var host = null, frame = null, svg = null, boat = null;
  var moved = false;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function pick(o) { return !o ? '' : typeof o === 'string' ? o : (o[lang()] || o.en || ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cx(i) { return SLOT / 2 + SLOT * i; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ── shared pieces ────────────────────────────────────────── */
  function lamp(x, y, s) {
    s = s || 1;
    return '<g class="rf-lampg" transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<circle class="rf-lamp-halo" r="16"/><path class="rf-dark" d="M-1.4 0H1.4V30H-1.4z"/>' +
      '<rect class="rf-dark" x="-5" y="-6" width="10" height="9" rx="2"/><rect class="rf-lamp" x="-3" y="-4.5" width="6" height="6" rx="1"/></g>';
  }
  function diya(x, y) {
    return '<g class="rf-diya" transform="translate(' + x + ',' + y + ')"><ellipse class="rf-diya-b" rx="4.2" ry="1.7"/>' +
      '<path class="rf-lamp" d="M0 -2C-2 -4 -1 -7 0 -9 1 -7 2 -4 0 -2z"/></g>';
  }
  function stairs(i, wide) {
    var h = '', k, w, y;
    for (k = 0; k < 7; k++) {
      w = (wide ? 170 : 118) + k * (wide ? 6 : 9); y = k * 10;
      h += '<rect class="' + (k % 2 ? 'rf-stone' : 'rf-stone2') + '" x="' + (-w / 2) + '" y="' + y + '" width="' + w + '" height="10"/>' +
        '<path class="rf-edge" d="M' + (-w / 2) + ' ' + y + 'h' + w + '"/>';
    }
    return h;
  }
  function wireTop(x1, x2, y) {
    var d = 'M' + x1 + ' ' + y, x = x1, up = true;
    while (x < x2) { x += 6; d += 'L' + x + ' ' + (y + (up ? -6 : 0)); up = !up; }
    return '<path class="rf-wire" d="' + d + '"/><path class="rf-wire" d="M' + x1 + ' ' + y + 'H' + x2 + '"/>';
  }

  /* ── the nine scenes (local origin: centre of the ghat, top of the wall) ── */
  var ART = [
    /* 0 · Amghat — the opium works' wall and chimney */
    function () {
      return '<rect class="rf-brick" x="-100" y="-46" width="156" height="46"/>' +
        '<path class="rf-line" d="M-100 -31h156M-100 -16h156M-70 -46v15M-30 -31v15M10 -46v15M40 -31v15"/>' +
        wireTop(-100, 56, -54) +
        '<rect class="rf-brick-d" x="30" y="-132" width="17" height="86"/><rect class="rf-brick" x="26" y="-140" width="25" height="9"/>' +
        '<g class="rf-smoke"><circle cx="39" cy="-150" r="6"/><circle cx="43" cy="-166" r="8"/><circle cx="37" cy="-184" r="9"/></g>' +
        '<path class="rf-dark" d="M-38 0v-24a13 13 0 0 1 26 0v24z"/>' +
        lamp(-82, -78, 0.9);
    },
    /* 1 · Collector Ghat — the colonnaded steps and a flag */
    function () {
      var a = '', k;
      for (k = 0; k < 5; k++) a += '<path class="rf-dark" d="M' + (-68 + k * 32) + ' 0v-26a8 8 0 0 1 16 0v26z"/>';
      return '<rect class="rf-stone2" x="-84" y="-52" width="168" height="52"/><rect class="rf-stone" x="-90" y="-60" width="180" height="8"/>' +
        a + '<path class="rf-stone" d="M-74 -60 0 -88 74 -60z"/><circle class="rf-win" cx="0" cy="-70" r="5"/>' +
        '<path class="rf-edge" d="M0 -88V-132"/><g class="rf-flag"><path class="rf-flagcloth" d="M0 -132q14 -8 28 0t28 0v14q-14 8 -28 0t-28 0z"/></g>';
    },
    /* 2 · Pakka Ghat — the broad pucca landing */
    function () {
      return '<rect class="rf-stone" x="-108" y="-14" width="216" height="14"/><rect class="rf-stone2" x="-108" y="-20" width="216" height="6"/>' +
        '<path class="rf-line" d="M-108 -7h216M-72 -14v14M-24 -14v14M24 -14v14M72 -14v14"/>' +
        lamp(-76, -66, 1) + lamp(76, -66, 1) +
        '<rect class="rf-stone-d" x="-26" y="-34" width="52" height="10" rx="2"/><path class="rf-stone-d" d="M-22 -24v10M22 -24v10"/>' +
        '<g class="rf-person"><circle class="rf-skin" cx="-4" cy="-52" r="5"/><path class="rf-shirt" d="M-10 -34l2 -14h12l2 14z"/></g>';
    },
    /* 3 · Mahaul Ghat — a peepal tree and a quiet bank */
    function () {
      return '<path class="rf-bark" d="M-6 0C-6 -26 -9 -46 -14 -68L-4 -66C-2 -50 2 -30 6 0z"/><path class="rf-bark" d="M2 -50C14 -58 24 -62 34 -80L40 -76C30 -62 18 -52 6 -40z"/>' +
        '<circle class="rf-tree" cx="0" cy="-92" r="30"/><circle class="rf-tree" cx="-34" cy="-76" r="24"/><circle class="rf-tree" cx="36" cy="-80" r="26"/><circle class="rf-tree2" cx="6" cy="-112" r="20"/>' +
        '<g class="rf-person"><circle class="rf-skin" cx="58" cy="-26" r="5"/><path class="rf-shirt2" d="M52 0l1 -20h10l2 20z"/></g>' +
        '<rect class="rf-stone-d" x="-86" y="-12" width="44" height="12" rx="2"/>';
    },
    /* 4 · Gola Ghat — a round domed house */
    function () {
      return '<rect class="rf-stone2" x="-48" y="-44" width="96" height="44"/><path class="rf-stone" d="M-52 -44a52 52 0 0 1 104 0z"/>' +
        '<path class="rf-edge" d="M0 -96V-114"/><circle class="rf-lamp" cx="0" cy="-116" r="3.4"/>' +
        '<path class="rf-dark" d="M-12 0v-22a12 12 0 0 1 24 0v22z"/><circle class="rf-win" cx="-32" cy="-26" r="4.6"/><circle class="rf-win" cx="32" cy="-26" r="4.6"/>' +
        '<rect class="rf-stone" x="-76" y="-22" width="22" height="22"/><path class="rf-stone-d" d="M-80 -22h30l-15 -14z"/>';
    },
    /* 5 · ChitNath Ghat — the oldest: a temple spire, rows of lamps */
    function () {
      var d = '', k;
      for (k = -3; k <= 3; k++) d += diya(k * 15, -3);
      return '<circle class="rf-glow" cx="0" cy="-78" r="92"/>' +
        '<rect class="rf-stone2" x="-38" y="-30" width="76" height="30"/><rect class="rf-stone" x="-26" y="-62" width="52" height="32"/>' +
        '<path class="rf-brick" d="M-26 -62C-26 -104 -11 -134 0 -160C11 -134 26 -104 26 -62z"/>' +
        '<path class="rf-line" d="M-24 -78h48M-22 -96h44M-17 -114h34M-10 -132h20"/>' +
        '<ellipse class="rf-stone2" cx="0" cy="-152" rx="10" ry="4.4"/><circle class="rf-lamp" cx="0" cy="-166" r="3.4"/>' +
        '<path class="rf-dark" d="M-9 -30v-14a9 9 0 0 1 18 0v14z"/>' +
        '<g class="rf-bell"><circle class="rf-brass" cx="-32" cy="-34" r="2.8"/><circle class="rf-brass" cx="32" cy="-34" r="2.8"/></g>' + d;
    },
    /* 6 · Natkha Ghat — an open pavilion with a lamp */
    function () {
      return '<rect class="rf-stone2" x="-52" y="-8" width="104" height="8"/>' +
        '<rect class="rf-stone" x="-38" y="-62" width="9" height="54"/><rect class="rf-stone" x="29" y="-62" width="9" height="54"/>' +
        '<path class="rf-stone-d" d="M-56 -62 0 -92 56 -62z"/><path class="rf-edge" d="M0 -92V-104"/>' +
        '<circle class="rf-lamp-halo" cx="0" cy="-30" r="24"/><rect class="rf-lamp" x="-3" y="-34" width="6" height="8" rx="2"/>' +
        '<circle class="rf-tree" cx="-82" cy="-50" r="20"/><rect class="rf-bark" x="-85" y="-36" width="6" height="36"/>';
    },
    /* 7 · Khirki Ghat — a house with a great window */
    function () {
      return '<rect class="rf-brick" x="-56" y="-92" width="112" height="92"/><rect class="rf-brick-d" x="-62" y="-100" width="124" height="9"/>' +
        '<path class="rf-win" d="M-17 -18v-38a17 17 0 0 1 34 0v38z"/><path class="rf-line" d="M0 -73V-18M-17 -40H17"/>' +
        '<rect class="rf-win" x="-46" y="-76" width="16" height="20" rx="1"/><rect class="rf-win" x="30" y="-76" width="16" height="20" rx="1"/>' +
        '<path class="rf-stone" d="M-24 -2h48v-6h-48z"/>';
    },
    /* 8 · Pushta Ghat — a moored ferry, a pole and lantern */
    function () {
      return '<rect class="rf-stone" x="-70" y="-12" width="140" height="12"/><rect class="rf-bark" x="58" y="-72" width="5" height="60"/>' +
        lamp(60, -78, 0.9) +
        '<path class="rf-edge" d="M-60 -12V-52M-60 -52h30"/><g class="rf-person"><circle class="rf-skin" cx="-20" cy="-40" r="5"/><path class="rf-shirt" d="M-26 -12l2 -22h12l2 22z"/></g>';
    }
  ];

  /* ── the whole panorama ───────────────────────────────────── */
  function boatSvg() {
    return '<g class="rf-boat-in"><ellipse class="rf-shadow" cx="0" cy="8" rx="34" ry="4"/>' +
      '<path class="rf-hull" d="M-34 0C-26 10 26 10 34 0L28 -5H-28z"/><path class="rf-hull2" d="M-28 -5H28L26 -8H-26z"/>' +
      '<circle class="rf-skin" cx="-4" cy="-18" r="4.6"/><path class="rf-shirt" d="M-10 -8l2 -9h10l2 9z"/><ellipse class="rf-cap" cx="-4.4" cy="-21.6" rx="5.6" ry="2.8"/>' +
      '<path class="rf-oar" d="M-12 -12L-40 6M4 -12L32 6"/>' +
      '<path class="rf-dark" d="M24 -6V-26"/><circle class="rf-lamp-halo" cx="24" cy="-28" r="16"/><rect class="rf-lamp" x="21" y="-32" width="6" height="7" rx="2"/></g>';
  }

  function panorama(data) {
    var r = rng(77), i, s = '';
    s += '<defs>' +
      '<linearGradient id="rfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--rf-sky1)"/><stop offset="1" stop-color="var(--rf-sky2)"/></linearGradient>' +
      '<linearGradient id="rfWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--rf-water1)"/><stop offset="1" stop-color="var(--rf-water2)"/></linearGradient>' +
      '<radialGradient id="rfGlowG"><stop offset="0" stop-color="#ffd79a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd79a" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#rfSky)"/>';
    /* stars (night only), the sun or moon */
    s += '<g class="rf-stars">';
    for (i = 0; i < 60; i++) s += '<circle cx="' + (r() * W).toFixed(0) + '" cy="' + (r() * 150).toFixed(0) + '" r="' + (0.6 + r() * 1.1).toFixed(1) + '"/>';
    s += '</g><circle class="rf-orb-glow" cx="170" cy="80" r="80"/><circle class="rf-orb" cx="170" cy="80" r="26"/>';
    /* the far bank */
    var x = -10, far = '';
    while (x < W) {
      var bw = 18 + r() * 30, bh = 18 + r() * 52;
      far += '<rect x="' + x.toFixed(0) + '" y="' + (WALL - 20 - bh).toFixed(0) + '" width="' + bw.toFixed(0) + '" height="' + (bh + 20).toFixed(0) + '"/>';
      if (r() < 0.22) far += '<path d="M' + x.toFixed(0) + ' ' + (WALL - 20 - bh).toFixed(0) + 'a' + (bw / 2).toFixed(0) + ' ' + (bw / 2).toFixed(0) + ' 0 0 1 ' + bw.toFixed(0) + ' 0z"/>';
      x += bw + 2 + r() * 8;
    }
    s += '<g class="rf-far">' + far + '</g>';
    s += '<rect class="rf-far" x="0" y="' + (WALL - 26) + '" width="' + W + '" height="30"/>';
    /* Tari Ghat across the water, at the strip's far end */
    s += '<g class="rf-tari" transform="translate(2090,' + (WALL - 6) + ')"><path class="rf-stone" d="M-60 0C-30 -14 30 -14 80 0V70H-60z"/><path class="rf-stone-d" d="M-8 -8v-30a12 12 0 0 1 24 0v30z"/><path class="rf-edge" d="M4 -50V-66"/><circle class="rf-lamp" cx="4" cy="-68" r="3"/>' +
      '<text class="rf-tarilabel" x="10" y="92" text-anchor="middle">' + esc(L('rf.tari')) + '</text></g>';
    /* the water, under everything that stands in it */
    s += '<rect x="0" y="' + WATER + '" width="' + W + '" height="' + (H - WATER) + '" fill="url(#rfWater)"/>';
    for (i = 0; i < 3; i++) {
      var d = 'M-60 ' + (WATER + 14 + i * 20), n;
      for (n = 0; n < 75; n++) d += (n === 0 ? 'q15 -4 30 0' : 't30 0');
      s += '<path class="rf-wave rf-wave' + i + '" d="' + d + '"/>';
    }
    /* the nine ghats */
    for (i = 0; i < data.length; i++) {
      s += '<g class="rf-g' + (i === cur ? ' is-on' : '') + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(data[i].n) + '" transform="translate(' + cx(i) + ',' + WALL + ')">' +
        '<rect class="rf-hit" x="-110" y="-180" width="220" height="300"/>' +
        '<rect class="rf-stone" x="-110" y="0" width="220" height="70"/>' +
        '<path class="rf-line" d="M-110 17h220M-110 34h220M-110 51h220"/>' +
        '<g class="rf-art">' + ART[i]() + '</g>' + stairs(i, i === 2) +
        '<text class="rf-num" x="0" y="106" text-anchor="middle">0' + (i + 1) + '</text>' +
        '<text class="rf-label" x="0" y="126" text-anchor="middle">' + esc(data[i].n) + '</text></g>';
    }
    /* the ferry that crosses to Tari Ghat, and the boatman who visits the ghats */
    s += '<g transform="translate(' + (cx(8) - 6) + ',' + (WATER + 6) + ')"><g class="rf-ferry">' +
      '<path class="rf-hull" d="M-44 0C-30 12 30 12 44 0L38 -7H-38z"/><path class="rf-cloth" d="M-30 -8Q0 -34 30 -8z"/>' +
      '<path class="rf-dark" d="M-26 -8V-24M26 -8V-24"/><circle class="rf-skin" cx="-10" cy="-14" r="3.6"/><circle class="rf-skin" cx="4" cy="-14" r="3.6"/><circle class="rf-lamp" cx="36" cy="-16" r="3"/></g></g>';
    s += '<g class="rf-boat" id="rfBoat" style="transform:translate(' + cx(cur) + 'px,' + (WATER + 6) + 'px)">' + boatSvg() + '</g>';
    return s;
  }

  /* ── building ─────────────────────────────────────────────── */
  function build() {
    host = document.getElementById('riverfront');
    if (!host || !window.DATA) return;
    var data = window.DATA.ghats;
    host.innerHTML =
      '<div class="rf-frame" id="rfFrame" tabindex="-1">' +
      '<svg class="rf-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(L('rf.alt')) + '">' + panorama(data) + '</svg></div>' +
      '<div class="rf-cap" id="rfCap"></div>';
    frame = host.querySelector('#rfFrame');
    svg = host.querySelector('.rf-svg');
    boat = host.querySelector('#rfBoat');
    built = true;
    caption();
    bind();
  }

  function caption() {
    var cap = document.getElementById('rfCap');
    if (!cap) return;
    var g = window.DATA.ghats[cur];
    cap.innerHTML =
      '<button type="button" class="rf-nav" data-rf="prev" aria-label="' + esc(L('rf.prev')) + '"><svg class="ic"><use href="#i-arrow"/></svg></button>' +
      '<div class="rf-now" aria-live="polite"><span class="rf-count">0' + (cur + 1) + ' / 0' + window.DATA.ghats.length + '</span>' +
      '<b>' + esc(g.n) + '</b><i>' + esc(pick(g.t)) + '</i></div>' +
      '<button type="button" class="rf-nav" data-rf="next" aria-label="' + esc(L('rf.next')) + '"><svg class="ic"><use href="#i-arrow"/></svg></button>' +
      '<button type="button" class="yard-btn rf-tour" data-rf="tour" aria-pressed="' + (playing ? 'true' : 'false') + '"><svg class="ic"><use href="#i-boat"/></svg><span>' + esc(L(playing ? 'rf.pause' : 'rf.play')) + '</span></button>' +
      '<span class="rf-hint">' + esc(L('rf.hint')) + '</span>';
  }

  function centre(i, smooth) {
    if (!frame || !svg) return;
    var scale = svg.getBoundingClientRect().width / W;
    var left = cx(i) * scale - frame.clientWidth / 2;
    try { frame.scrollTo({ left: left, behavior: smooth && !reduced ? 'smooth' : 'auto' }); } catch (e) { frame.scrollLeft = left; }
  }

  function select(i, fromUser) {
    var n = window.DATA.ghats.length;
    i = (i + n) % n;
    var changed = i !== cur;
    cur = i;
    if (!built) return;
    Array.prototype.forEach.call(svg.querySelectorAll('.rf-g'), function (g) {
      g.classList.toggle('is-on', +g.getAttribute('data-i') === cur);
    });
    host.classList.add('has-on');
    boat.style.transform = 'translate(' + cx(cur) + 'px,' + (WATER + 6) + 'px)';
    caption();
    centre(cur, true);
    if (changed && window.Ambient) { if (window.Ambient.oar) window.Ambient.oar(0.45); if (fromUser && window.Ambient.chime) window.Ambient.chime(); }
  }

  function tour(on) {
    playing = on;
    clearInterval(tourTimer);
    if (on) tourTimer = setInterval(function () { select(cur + 1, false); }, 4200);
    caption();
  }

  function bind() {
    svg.addEventListener('click', function (e) {
      if (moved) return;
      var g = e.target.closest('.rf-g');
      if (g) select(+g.getAttribute('data-i'), true);
    });
    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest('.rf-g');
      if (!g) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(+g.getAttribute('data-i'), true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); select(cur + 1, true); focusGhat(cur); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(cur - 1, true); focusGhat(cur); }
    });
    host.querySelector('#rfCap').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rf]');
      if (!b) return;
      var k = b.getAttribute('data-rf');
      if (k === 'prev') select(cur - 1, true);
      else if (k === 'next') select(cur + 1, true);
      else if (k === 'tour') tour(!playing);
    });
    /* drag the river with a mouse; touch scrolls natively */
    var down = false, sx = 0, sl = 0;
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = frame.scrollLeft;
      frame.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) moved = true;
      frame.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; frame.classList.remove('is-drag');
      setTimeout(function () { moved = false; }, 0);
    });
  }
  function focusGhat(i) {
    var g = svg && svg.querySelector('.rf-g[data-i="' + i + '"]');
    if (g) g.focus({ preventScroll: true });
  }

  window.Riverfront = {
    build: function () {
      build();
      if (built) setTimeout(function () { centre(cur, false); }, 60);
    },
    select: function (i) { select(i, true); }
  };
  window.addEventListener('resize', function () { if (built) centre(cur, false); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) tour(false); });
})();
