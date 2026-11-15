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

  /* ══ life on the riverfront: people, animals, vendors, trees, birds, and a moving river ══ */
  function across(cls, y, dur, del, dir, inner) {
    return '<g transform="translate(0,' + y + ')" class="rf-nopt"><g class="rf-mv ' + (dir < 0 ? 'rf-mvL ' : '') + cls + '" style="animation-duration:' + dur + 's;animation-delay:-' + del + 's"><g transform="scale(' + (dir < 0 ? -1 : 1) + ',1)">' + inner + '</g></g></g>';
  }

  function person(col, pants, kind, hair) {
    var h = '<ellipse cy="1" rx="8" ry="2" fill="#000" opacity=".22"/>' +
      '<g class="rf-wb"><g class="rf-leg"><rect x="-3.4" y="-15" width="2.9" height="15" rx="1.3" fill="' + pants + '"/></g><g class="rf-leg l2"><rect x="0.6" y="-15" width="2.9" height="15" rx="1.3" fill="' + pants + '"/></g>' +
      (kind === 'saree' ? '<path d="M-5.5 -14L5.5 -14L7 -1L-7 -1Z" fill="' + col + '"/>' : '') +
      '<path d="M-5 -14L5 -14L4.2 -31Q0 -34 -4.2 -31Z" fill="' + col + '"/>' +
      '<g class="rf-arm"><rect x="-1.2" y="-31" width="2.5" height="12" rx="1.2" fill="var(--rf-skin)"/></g>' +
      '<circle cy="-36" r="4.4" fill="var(--rf-skin)"/>';
    if (kind === 'turban') h += '<ellipse cy="-39.5" rx="5.2" ry="3" fill="' + hair + '"/>';
    else if (kind === 'pot') h += '<path d="M-4.6 -39.5q4.6 -4.6 9.2 0" fill="' + hair + '"/><ellipse cx="0.4" cy="-43" rx="4.4" ry="3.4" fill="#c98b3a"/><rect x="-1.8" y="-47" width="3.6" height="2.4" fill="#c98b3a"/>';
    else if (kind === 'bundle') h += '<path d="M-4.6 -39.5q4.6 -4.6 9.2 0" fill="' + hair + '"/><rect x="-6" y="-46" width="12" height="6.4" rx="3" fill="#b79a68"/>';
    else if (kind === 'umb') h += '<path d="M-4.6 -39.5q4.6 -4.6 9.2 0" fill="' + hair + '"/><path d="M-13 -44q13 -14 26 0z" fill="' + col + '" opacity=".95"/><path d="M0 -44V-30" stroke="#4a3a2a" stroke-width="1"/>';
    else h += '<path d="M-4.6 -39.5q4.6 -4.6 9.2 0" fill="' + hair + '"/>';
    return h + '</g>';
  }

  function cow(lying) {
    if (lying) {
      return '<ellipse cy="2" rx="22" ry="3" fill="#000" opacity=".2"/><path d="M-20 0Q-24 -14 -10 -17Q8 -19 18 -13Q22 -6 18 0Z" fill="#d9d2c0"/><path d="M-6 -17Q2 -21 8 -16Q4 -10 -6 -12Z" fill="#8a7a62"/>' +
        '<g class="rf-chew"><path d="M16 -13Q26 -17 30 -10Q29 -3 22 -2Q16 -4 16 -13Z" fill="#d9d2c0"/><circle cx="25" cy="-11" r="1" fill="#2b2420"/><path d="M19 -15l-3 -5M24 -16l2 -5" stroke="#8a7a62" stroke-width="1.5" stroke-linecap="round"/></g>' +
        '<g class="rf-tail"><path d="M-20 -8q-8 -2 -9 6" stroke="#8a7a62" stroke-width="1.6" fill="none"/></g>';
    }
    return '<ellipse cy="1" rx="26" ry="3" fill="#000" opacity=".22"/>' +
      '<g class="rf-cleg"><rect x="-17" y="-18" width="3.4" height="18" fill="#cfc7b2"/></g><g class="rf-cleg l2"><rect x="-8" y="-18" width="3.4" height="18" fill="#bdb49e"/></g>' +
      '<g class="rf-cleg l2"><rect x="9" y="-18" width="3.4" height="18" fill="#cfc7b2"/></g><g class="rf-cleg"><rect x="17" y="-18" width="3.4" height="18" fill="#bdb49e"/></g>' +
      '<path d="M-24 -24Q-26 -36 -10 -37Q10 -39 22 -34Q26 -28 22 -22Q4 -17 -24 -24Z" fill="#ddd6c4"/><path d="M-12 -35Q-2 -39 6 -33Q0 -27 -10 -29Z" fill="#8a7a62"/>' +
      '<path d="M22 -34l5 -8 3 7" fill="#cfc7b2"/><g class="rf-head"><path d="M22 -36Q34 -38 36 -28Q35 -20 28 -19Q22 -22 22 -36Z" fill="#ddd6c4"/><circle cx="31" cy="-29" r="1.1" fill="#2b2420"/><path d="M24 -37l-2 -6M30 -38l3 -5" stroke="#8a7a62" stroke-width="1.7" stroke-linecap="round"/></g>' +
      '<g class="rf-tail"><path d="M-24 -30q-9 0 -10 9" stroke="#8a7a62" stroke-width="1.6" fill="none"/></g>';
  }
  function goat() {
    return '<ellipse cy="1" rx="11" ry="2" fill="#000" opacity=".2"/><g class="rf-cleg"><rect x="-8" y="-10" width="2" height="10" fill="#8a6f55"/></g><g class="rf-cleg l2"><rect x="-3" y="-10" width="2" height="10" fill="#7a6048"/></g>' +
      '<g class="rf-cleg l2"><rect x="4" y="-10" width="2" height="10" fill="#8a6f55"/></g><g class="rf-cleg"><rect x="8" y="-10" width="2" height="10" fill="#7a6048"/></g>' +
      '<path d="M-11 -13Q-12 -20 -3 -20Q8 -21 11 -17Q10 -11 -11 -13Z" fill="#a98b6a"/><g class="rf-head"><path d="M10 -20Q16 -22 17 -16Q15 -12 11 -13Z" fill="#a98b6a"/><path d="M12 -21l-1 -4M14 -21l2 -3" stroke="#6a523c" stroke-width="1.2"/><path d="M16 -13l0 3" stroke="#6a523c" stroke-width="1"/></g>';
  }
  function dog() {
    return '<ellipse cy="1" rx="12" ry="2" fill="#000" opacity=".2"/><g class="rf-cleg"><rect x="-9" y="-9" width="2" height="9" fill="#9a7a52"/></g><g class="rf-cleg l2"><rect x="-4" y="-9" width="2" height="9" fill="#876944"/></g>' +
      '<g class="rf-cleg l2"><rect x="5" y="-9" width="2" height="9" fill="#9a7a52"/></g><g class="rf-cleg"><rect x="9" y="-9" width="2" height="9" fill="#876944"/></g>' +
      '<path d="M-11 -12Q-12 -17 -4 -17Q8 -18 12 -14Q10 -9 -11 -12Z" fill="#b08a5c"/><path d="M11 -17Q18 -19 19 -13Q16 -9 11 -11Z" fill="#b08a5c"/><path d="M12 -19l2 -4 2 4" fill="#8a6a44"/><circle cx="16" cy="-14.5" r="0.9" fill="#222"/>' +
      '<g class="rf-wag"><path d="M-11 -14q-6 -6 -9 -4" stroke="#b08a5c" stroke-width="2" fill="none" stroke-linecap="round"/></g>';
  }
  function bird(y, dur, del, sc, col) {
    return '<g class="rf-nopt"><g class="rf-mv rf-bird" style="animation-duration:' + dur + 's;animation-delay:-' + del + 's"><g transform="translate(0,' + y + ') scale(' + sc + ')">' +
      [[0, 0], [-16, 7], [-14, -6], [-30, 12], [-28, -11]].map(function (o, k) { return '<g transform="translate(' + o[0] + ',' + o[1] + ')"><path class="rf-wingf" style="animation-delay:-' + (k * 0.13) + 's" d="M0 0q5 -8 10 0q5 -8 10 0" stroke="' + col + '" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>'; }).join('') +
      '</g></g></g>';
  }
  function treeBack(x, y, sc, kind) {
    if (kind === 'palm') {
      var fr = '';
      for (var f = 0; f < 7; f++) fr += '<path d="M0 0q' + (14 + f * 2) + ' -12 ' + (30 - Math.abs(f - 3) * 3) + ' ' + (6 + Math.abs(f - 3) * 4) + '" stroke="var(--rf-tree)" stroke-width="3.2" fill="none" stroke-linecap="round" transform="rotate(' + (f * 51 - 150) + ')"/>';
      return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><path d="M-3 0Q-6 -50 -2 -92L3 -92Q0 -50 3 0Z" fill="var(--rf-bark)"/><g class="rf-sway" transform="translate(0,-92)">' + fr + '</g></g>';
    }
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><path d="M-5 0Q-6 -22 -10 -44L-2 -44Q0 -22 6 0Z" fill="var(--rf-bark)"/><path d="M0 -26Q10 -34 22 -52" stroke="var(--rf-bark)" stroke-width="4" fill="none"/>' +
      '<g class="rf-sway"><circle cy="-62" r="26" fill="var(--rf-tree)"/><circle cx="-26" cy="-48" r="19" fill="var(--rf-tree2)"/><circle cx="28" cy="-52" r="21" fill="var(--rf-tree)"/><circle cx="4" cy="-84" r="17" fill="var(--rf-tree2)"/>' +
      '<circle class="rf-leaf-a" cx="-12" cy="-70" r="3" fill="var(--rf-tree2)"/></g></g>';
  }

  function riverLife(r) {
    var s = '', i;
    /* currents: long dashed lines sliding downstream, faster toward the middle of the river */
    [[8, 4, 3.4, 0.34], [21, 6, 2.6, 0.26], [34, 8, 2.2, 0.22], [49, 11, 1.8, 0.18], [64, 14, 1.4, 0.14]].forEach(function (c, k) {
      s += '<path class="rf-cur" d="M-80 ' + (WATER + c[0]) + 'H2300" style="animation-duration:' + c[1] + 's;stroke-width:' + c[2] + 'px;opacity:' + c[3] + ';stroke-dasharray:' + (26 + k * 8) + ' ' + (70 + k * 14) + '"/>';
    });
    /* things on the current: garlands, leaves, diyas, paper boats */
    var kinds = ['garland', 'leaf', 'diya', 'paper', 'garland', 'leaf', 'diya', 'leaf', 'garland'];
    for (i = 0; i < 9; i++) {
      var y = WATER + 10 + r() * 58, dur = 60 + r() * 50, k = kinds[i], g;
      if (k === 'garland') g = '<ellipse rx="9" ry="3" fill="none" stroke="#f0a02c" stroke-width="3.4" stroke-dasharray="2 2"/><ellipse rx="9" ry="3" fill="none" stroke="#e46a24" stroke-width="1.2" stroke-dasharray="2 4"/>';
      else if (k === 'leaf') g = '<path d="M-7 0Q0 -5 7 0Q0 4 -7 0Z" fill="#6f8f4e"/><path d="M-6 0H6" stroke="#4e6a36" stroke-width=".8"/>';
      else if (k === 'diya') g = '<ellipse rx="5" ry="2" fill="#7a4a30"/><path class="rf-fl-flame" d="M0 -1.4C-2 -3 -1 -6 0 -8 1 -6 2 -3 0 -1.4z" fill="#ffd27a"/><circle r="9" cy="-3" fill="#ffd27a" opacity=".22"/>';
      else g = '<path d="M-6 0L6 0L3 3H-3z" fill="#f4ecd8"/><path d="M0 0V-6L5 0z" fill="#f4ecd8"/>';
      s += '<g transform="translate(0,' + y.toFixed(0) + ')" class="rf-nopt"><g class="rf-mv rf-drift" style="animation-duration:' + dur.toFixed(0) + 's;animation-delay:-' + (r() * dur).toFixed(0) + 's"><g class="rf-bobw" style="animation-delay:-' + (r() * 3).toFixed(1) + 's">' + g + '</g></g></g>';
    }
    /* fish that leap now and then */
    [[330, 0], [1010, 3.2], [1730, 6.1]].forEach(function (f) {
      s += '<g transform="translate(' + f[0] + ',' + (WATER + 30) + ')" class="rf-nopt"><ellipse class="rf-fring" rx="14" ry="3.5" fill="none" stroke="#fff" stroke-width="1.2" style="animation-delay:-' + f[1] + 's"/>' +
        '<g class="rf-fish" style="animation-delay:-' + f[1] + 's"><path d="M-6 0Q0 -4 6 0Q0 4 -6 0zM-5 0L-10 -3V3z" fill="#e8eef0"/></g></g>';
    });
    /* boats drifting past: a rowing boat, a net boat, a sail boat */
    s += across('rf-slow', WATER + 44, 95, 10, 1, '<ellipse cy="9" rx="26" ry="3" fill="#000" opacity=".15"/><path d="M-26 0Q0 12 26 0L21 -5H-21z" class="rf-hull"/><circle cx="-6" cy="-12" r="3.6" fill="var(--rf-skin)"/><path d="M-11 -5l2 -8h8l2 8z" fill="#c9774a"/><circle cx="8" cy="-11" r="3.2" fill="var(--rf-skin)"/><path d="M4 -5l2 -7h7l1 7z" fill="#4a7a9a"/><path class="rf-oarb" d="M-10 -9L-30 6" stroke="#8a6a52" stroke-width="2" stroke-linecap="round"/>');
    s += across('rf-slow', WATER + 20, 140, 60, -1, '<ellipse cy="9" rx="30" ry="3" fill="#000" opacity=".15"/><path d="M-30 0Q0 12 30 0L24 -6H-24z" class="rf-hull"/><circle cx="-10" cy="-14" r="3.6" fill="var(--rf-skin)"/><path d="M-15 -6l2 -9h8l2 9z" fill="#d8c9a6"/><path d="M4 -6L20 -26M20 -26L30 -4" stroke="#6b5240" stroke-width="1.4" fill="none"/><path d="M20 -26L30 -4L8 -5z" fill="none" stroke="#b8a58a" stroke-width=".8" stroke-dasharray="2 2"/>');
    s += across('rf-slow', WATER + 8, 170, 100, 1, '<ellipse cy="9" rx="34" ry="3" fill="#000" opacity=".14"/><path d="M-34 0Q0 12 34 0L28 -6H-28z" class="rf-hull"/><path d="M0 -6V-44" stroke="#5a4636" stroke-width="2"/><path d="M0 -42L24 -10H0z" fill="#e9dcc0"/><path d="M0 -40L-14 -10H0z" fill="#d8bf92"/><circle cx="-20" cy="-12" r="3.4" fill="var(--rf-skin)"/>');
    return s;
  }

  function lifeFront(r) {
    var s = '', i, cols = ['#c0504a', '#3f6f8f', '#d8a43a', '#5e8f62', '#8a5aa0', '#d8d0bc', '#b8663a', '#2f5f6f'];
    var pants = ['#2f2a28', '#e8e0cc', '#3a4a5a', '#6a4a3a'];
    var kinds = ['saree', 'pot', 'plain', 'turban', 'bundle', 'saree', 'umb', 'plain', 'pot', 'turban', 'saree', 'plain'];
    /* walkers on the steps, both ways, at their own pace */
    for (i = 0; i < 14; i++) {
      var dir = i % 3 === 1 ? -1 : 1, lane = [14, 30, 46, 22, 38, 54, 18][i % 7], dur = 48 + (i * 13) % 40;
      var k = kinds[i % kinds.length];
      s += across('rf-walk', WALL + lane, dur, (i * 37) % dur, dir, '<g transform="scale(' + (0.86 + lane / 120).toFixed(2) + ')">' + person(cols[i % cols.length], k === 'saree' ? cols[(i + 3) % cols.length] : pants[i % pants.length], k, i % 2 ? '#2b2420' : '#4a3a2c') + '</g>');
    }
    /* children running between the ghats */
    for (i = 0; i < 3; i++) s += across('rf-walk rf-fast', WALL + 58 - i * 8, 26 + i * 4, i * 9, i % 2 ? -1 : 1, '<g transform="scale(.62)">' + person(cols[(i * 2 + 1) % cols.length], '#e8e0cc', 'plain', '#2b2420') + '</g>');

    /* animals */
    s += across('rf-walk rf-slow2', WALL + 40, 190, 70, 1, '<g transform="scale(.9)">' + cow(false) + '</g>');
    s += '<g transform="translate(' + (cx(3) + 62) + ',' + (WALL + 52) + ') scale(.85)" class="rf-nopt">' + cow(true) + '</g>';
    s += across('rf-walk rf-fast', WALL + 60, 24, 6, -1, '<g transform="scale(.85)">' + dog() + '</g>');
    [0, 1, 2].forEach(function (g) { s += across('rf-walk rf-slow2', WALL + 26 + g * 6, 120, 20 + g * 4, 1, '<g transform="scale(' + (0.8 + g * 0.05) + ')">' + goat() + '</g>'); });
    /* pigeons pecking at the steps, and a flock that takes off now and then */
    s += '<g transform="translate(' + (cx(1) - 40) + ',' + (WALL + 60) + ')" class="rf-nopt">';
    for (i = 0; i < 6; i++) s += '<g transform="translate(' + (i * 15) + ',' + ((i % 2) * 3) + ')"><g class="rf-peck" style="animation-delay:-' + (i * 0.45).toFixed(2) + 's"><ellipse rx="4.2" ry="2.8" fill="#8a909a"/><circle cx="4" cy="-2.4" r="1.9" fill="#6f7580"/><path d="M5.6 -2.4l2.2 .6" stroke="#caa56a" stroke-width="1"/></g></g>';
    s += '</g>';
    s += '<g class="rf-nopt"><g class="rf-takeoff" transform="translate(' + (cx(1) + 10) + ',' + (WALL + 56) + ')">' + [0, 1, 2, 3].map(function (k) { return '<g transform="translate(' + (k * 11) + ',' + (-k * 5) + ')"><path class="rf-wingf" style="animation-delay:-' + (k * 0.1) + 's" d="M0 0q4 -7 8 0q4 -7 8 0" stroke="#7a808a" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>'; }).join('') + '</g></g>';
    /* a monkey on the pavilion roof */
    s += '<g transform="translate(' + (cx(6) + 30) + ',' + (WALL - 76) + ')" class="rf-nopt"><ellipse cy="1" rx="6" ry="1.5" fill="#000" opacity=".2"/><path d="M-5 0Q-6 -10 0 -12Q6 -10 5 0Z" fill="#9a8468"/><circle cy="-15" r="4.2" fill="#9a8468"/><circle cy="-14.5" r="2.6" fill="#d9bfa0"/><g class="rf-scratch"><path d="M3 -9L9 -15" stroke="#9a8468" stroke-width="2.2" stroke-linecap="round"/></g><path class="rf-tail" d="M-5 -2q-9 0 -9 -8" stroke="#9a8468" stroke-width="1.8" fill="none"/></g>';

    /* vendors */
    var stall = function (x, can, can2, body) {
      return '<g transform="translate(' + x + ',' + (WALL + 30) + ')" class="rf-nopt"><ellipse cy="14" rx="32" ry="4" fill="#000" opacity=".2"/><path d="M0 -4V-46" stroke="#5a4636" stroke-width="2"/>' +
        '<path d="M-34 -42Q0 -66 34 -42Z" fill="' + can + '"/><path d="M-34 -42Q-17 -52 0 -42Q17 -52 34 -42" fill="none" stroke="' + can2 + '" stroke-width="3" stroke-dasharray="7 6"/>' + body + '</g>';
    };
    /* chai-wala: kettle, steam, and two customers */
    s += stall(cx(1) + 112, '#c0504a', '#f0d9a6',
      '<rect x="-26" y="-8" width="52" height="5" rx="1.5" fill="#6a4b38"/><path d="M-22 -3v16M22 -3v16" stroke="#4a3426" stroke-width="3"/><g transform="translate(-8,-11)"><path d="M-7 3Q-9 -8 0 -9Q9 -8 7 3Z" fill="#b8c0c6"/><path d="M6 -4l7 -5" stroke="#b8c0c6" stroke-width="2.4"/><path d="M-7 -9l7 -4 7 4" fill="none" stroke="#8a9096" stroke-width="1.2"/></g>' +
      '<circle class="rf-steam" cx="-6" cy="-24" r="3" fill="#fff"/><circle class="rf-steam s2" cx="-3" cy="-24" r="2.6" fill="#fff"/><circle class="rf-steam s3" cx="-9" cy="-24" r="2.4" fill="#fff"/>' +
      '<g transform="translate(14,12) scale(.8)">' + person('#3f6f8f', '#2f2a28', 'turban', '#d8a43a') + '</g><g transform="translate(26,14) scale(.7)"><g class="rf-sip">' + person('#d8d0bc', '#6a4a3a', 'plain', '#2b2420') + '</g></g>');
    /* flower seller with marigolds and hanging garlands */
    var mar = '';
    for (i = 0; i < 18; i++) mar += '<circle cx="' + (-18 + (i % 9) * 4.4) + '" cy="' + (-11 - Math.floor(i / 9) * 4) + '" r="2.6" fill="' + (i % 3 ? '#f0a02c' : '#e46a24') + '"/>';
    s += stall(cx(4) + 104, '#d8a43a', '#c0504a',
      '<path d="M-24 -8Q0 2 24 -8L22 -2Q0 8 -22 -2Z" fill="#7a5a3a"/>' + mar +
      [-26, -12, 4, 20].map(function (x, k) { return '<g class="rf-garl" style="animation-delay:-' + k * 0.7 + 's"><path d="M' + x + ' -42V-22" stroke="#f0a02c" stroke-width="3.4" stroke-dasharray="2.4 1.6"/><circle cx="' + x + '" cy="-20" r="2.6" fill="#e46a24"/></g>'; }).join('') +
      '<g transform="translate(-30,14) scale(.8)"><g class="rf-fan">' + person('#c0504a', '#c0504a', 'saree', '#2b2420') + '</g></g>');
    /* the pandit under his umbrella, ringing a small bell */
    s += stall(cx(6) - 108, '#e9dcc0', '#c0504a',
      '<rect x="-14" y="-6" width="28" height="4" rx="1" fill="#a8855a"/><g transform="translate(0,9) scale(.9)">' + person('#e8e0cc', '#e8e0cc', 'plain', '#2b2420') + '</g><circle cx="0" cy="-14" r="5" fill="none" stroke="#f0a02c" stroke-width="1.6" stroke-dasharray="2 1.4"/>' +
      '<g class="rf-ding"><path d="M10 -12q3 -6 6 0z" fill="#d9a441"/></g>');
    /* a kulfi cart */
    s += stall(cx(7) + 100, '#4a8f9a', '#f4ecd8',
      '<rect x="-24" y="-12" width="48" height="12" rx="2" fill="#f0e6cc"/><path d="M-24 -12h48" stroke="#4a8f9a" stroke-width="2"/><circle cx="-14" cy="3" r="6" fill="#3a2a22" stroke="#8a6a52" stroke-width="1.4"/><circle cx="14" cy="3" r="6" fill="#3a2a22" stroke="#8a6a52" stroke-width="1.4"/>' +
      '<g transform="translate(30,12) scale(.85)"><g class="rf-fan">' + person('#d8a43a', '#2f2a28', 'turban', '#c0504a') + '</g></g>');
    return s;
  }

  function skyLife(r) {
    var s = '';
    s += bird(70, 34, 6, 1, '#4a3a30') + bird(104, 46, 22, 0.8, '#4a3a30') + bird(52, 58, 40, 0.65, '#4a3a30');
    /* a pair of kites over the ghats */
    [[620, 70, '#c0504a', 0], [1480, 96, '#3f8a8f', 2.3]].forEach(function (k) {
      s += '<g transform="translate(' + k[0] + ',' + k[1] + ')" class="rf-nopt"><g class="rf-kite" style="animation-delay:-' + k[3] + 's"><path d="M0 -12L9 0L0 14L-9 0Z" fill="' + k[2] + '"/><path d="M0 -12V14M-9 0H9" stroke="#f4ecd8" stroke-width=".8" opacity=".8"/>' +
        '<path class="rf-ktail" d="M0 14q4 8 -2 14t2 14" stroke="' + k[2] + '" stroke-width="1.6" fill="none"/><path d="M0 14L-30 150" stroke="#e8e0cc" stroke-width=".7" opacity=".5"/></g></g>';
    });
    return s;
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
    s += skyLife(r);
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
    /* trees behind the ghats */
    [[40, 'neem', 0.8], [330, 'palm', 0.85], [660, 'neem', 0.7], [990, 'palm', 0.95], [1290, 'neem', 0.78], [1640, 'palm', 0.9], [1930, 'neem', 0.85], [2160, 'palm', 0.8]].forEach(function (t) {
      s += treeBack(t[0], WALL + 4, t[2], t[1]);
    });
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
    s += riverLife(r);
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
    s += '<g class="rf-life">' + lifeFront(r) + '</g>';
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
