/* ══════════════════════════════════════════════════════════════
   THE TIME MACHINE — twenty-three centuries on one riverbank.
   One diorama that grows as you dig down through the layers of silt:
   forest ashrams, a pillar, a pilgrim, a founding, forts and gardens,
   arches, a tomb, a factory, a rising, a society of science.
   Click a layer, press play, or use the arrows. The scenes are
   illustrations; the dates and notes are the page's own timeline.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var W = 1600, H = 520, GROUND = 400;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, playing = false, timer = null, host = null, built = false, yearTween = 0;

  /* a number for each era, for the rolling counter */
  var YEARS = [-375, -250, 637, 1330, 1494, 1567, 1727, 1805, 1818, 1858, 1862];
  /* where the camera looks in each era (matters on a narrow screen) */
  var FOCUS = [190, 430, 620, 560, 790, 940, 1150, 1316, 1440, 850, 1530];
  /* sky for each era: top, horizon */
  var SKY = [['#7fa7a0', '#f3d9a8'], ['#7fb2d0', '#f6e6bf'], ['#9ab7c4', '#f2d29a'], ['#8a5a5a', '#f0a867'], ['#8fa7b4', '#f0c98a'], ['#86b4d4', '#f7e1b0'],
    ['#7fa3c8', '#f2cf9a'], ['#7c7fb0', '#f0a888'], ['#8a8f96', '#d9b98f'], ['#4b2a3a', '#d9663f'], ['#0d1a44', '#3c5594']];
  /* silt colours, one layer per era (oldest at the left) */
  var SILT = ['#7a6a4c', '#8b7a58', '#9a8864', '#a8956f', '#b6a27a', '#a18a68', '#8f7858', '#7e684c', '#6e5a42', '#5e4c38', '#4e3f2f'];

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function pick(o) { return !o ? '' : typeof o === 'string' ? o : (o[lang()] || o.en || ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tpl(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function fmtYear(n) { return n < 0 ? 'c. ' + Math.abs(Math.round(n)) + ' BCE' : String(Math.round(n)); }

  /* ── the scene's pieces ───────────────────────────────────── */
  function tree(x, y, s, c) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"><g class="tm-sway"><rect x="-2.5" y="-14" width="5" height="16" class="tm-bark"/><circle cy="-30" r="17" class="' + c + '"/><circle cx="-11" cy="-22" r="12" class="' + c + '"/><circle cx="12" cy="-23" r="13" class="' + c + '"/></g></g>';
  }
  function house(x, w, h, c) {
    return '<g transform="translate(' + x + ',' + GROUND + ')"><rect x="0" y="' + (-h) + '" width="' + w + '" height="' + h + '" class="' + c + '"/><path d="M-3 ' + (-h) + 'h' + (w + 6) + 'l-6 -9h' + (-w + 6) + 'z" class="tm-roof"/><rect x="' + (w / 2 - 3) + '" y="' + (-h * 0.55) + '" width="6" height="' + (h * 0.55) + '" class="tm-door"/><rect class="tm-glow" x="3" y="' + (-h + 6) + '" width="5" height="5"/></g>';
  }
  function dome(x, y, r, c) { return '<path d="M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 0 1 ' + (2 * r) + ' 0z" class="' + c + '"/><path d="M' + x + ' ' + (y - r) + 'v-' + (r * 0.4) + '" class="tm-line"/><circle cx="' + x + '" cy="' + (y - r * 1.5) + '" r="2.6" class="tm-gold"/>'; }
  function person(x, y, c, extra) {
    return '<g transform="translate(' + x + ',' + y + ')"><ellipse cy="1" rx="8" ry="2.2" fill="#000" opacity=".25"/><circle cy="-30" r="5.2" class="tm-skin"/><path d="M-6 0l2 -24h8l2 24z" class="' + c + '"/>' + (extra || '') + '</g>';
  }

  function sceneSvg() {
    var r = rng(9), i, s = '';
    s += '<defs><radialGradient id="tmOrbG"><stop offset="0" stop-color="#fff2c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tmWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc3c4"/><stop offset="1" stop-color="#4d8590"/></linearGradient>';
    for (i = 0; i < SKY.length; i++) s += '<linearGradient id="tmSky' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + SKY[i][0] + '"/><stop offset="1" stop-color="' + SKY[i][1] + '"/></linearGradient>';
    s += '</defs>';
    for (i = 0; i < SKY.length; i++) s += '<rect class="tm-sky" data-i="' + i + '" width="' + W + '" height="' + H + '" fill="url(#tmSky' + i + ')"/>';
    /* stars for the last, night-time era */
    s += '<g class="tm-stars">';
    for (i = 0; i < 70; i++) s += '<circle class="tm-star" style="animation-delay:-' + (r() * 4).toFixed(1) + 's" cx="' + (r() * W).toFixed(0) + '" cy="' + (r() * 230).toFixed(0) + '" r="' + (0.6 + r() * 1.2).toFixed(1) + '"/>';
    s += '</g>';
    /* the sun that crosses the centuries */
    s += '<g class="tm-orb" id="tmOrb"><circle r="90" fill="url(#tmOrbG)"/><circle class="tm-orbc" r="26"/></g>';
    /* everything on the ground pans together, so a phone can follow the story */
    s += '<g id="tmCam">';
    /* far bank */
    s += '<path class="tm-far" d="M0 ' + (GROUND - 50) + 'C200 ' + (GROUND - 80) + ' 420 ' + (GROUND - 40) + ' 700 ' + (GROUND - 66) + 'S1200 ' + (GROUND - 90) + ' ' + W + ' ' + (GROUND - 56) + 'V' + GROUND + 'H0z"/>';

    /* era 0 — forest ashrams */
    var forest = '';
    for (i = 0; i < 15; i++) forest += tree(30 + i * 22 + (i % 3) * 8, GROUND - 2 + (i % 2) * 6, 0.9 + (i % 4) * 0.18, i % 3 ? 'tm-leaf' : 'tm-leaf2');
    s += '<g class="tm-e" data-from="0">' + forest +
      '<g transform="translate(150,' + GROUND + ')"><path d="M-22 0l22 -34 22 34z" class="tm-thatch"/><rect x="-6" y="-14" width="12" height="14" class="tm-door"/><path class="tm-smoke" d="M12 -34c-6-8 6-14 0-24" stroke="#e6dccb" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
      '<g transform="translate(236,' + GROUND + ')"><path d="M-18 0l18 -28 18 28z" class="tm-thatch"/><rect x="-5" y="-12" width="10" height="12" class="tm-door"/></g>' +
      person(196, GROUND + 4, 'tm-saffron') + '</g>';
    /* era 1 — the pillar */
    s += '<g class="tm-e" data-from="1" transform="translate(430,' + GROUND + ')"><g class="tm-grow-in"><path d="M-14 0l3 -10h16l3 10z" class="tm-stone2"/><path d="M-8 -10l3 -150h10l3 150z" class="tm-stone"/><rect x="-11" y="-170" width="22" height="9" class="tm-stone2"/><circle cy="-186" r="13" class="tm-stone"/><circle cy="-186" r="6" class="tm-stone2"/><path d="M-1 -20V-150" stroke="#fff" stroke-width="2" opacity=".35"/></g></g>';
    /* era 2 — the pilgrim (only then) */
    s += '<g class="tm-e tm-only" data-only="2"><g class="tm-pilgrim">' + person(0, GROUND + 6, 'tm-saffron', '<path d="M8 -24L12 -52M12 -52q8 -2 8 6" class="tm-line" fill="none"/><rect x="-14" y="-30" width="9" height="12" rx="2" class="tm-book"/>') +
      '</g><text class="tm-tag" x="470" y="' + (GROUND - 80) + '">Xuanzang</text></g>';
    /* era 3 — the founding: fort, first houses; a clash (only then) */
    var hs = '';
    [560, 592, 630, 668].forEach(function (x, k) { hs += house(x, 24 + (k % 2) * 8, 34 + (k % 3) * 8, 'tm-wall'); });
    s += '<g class="tm-e" data-from="3"><g transform="translate(520,' + GROUND + ')"><rect x="-40" y="-70" width="80" height="70" class="tm-stone"/><path d="M-44 -70h88v-8h-88z" class="tm-stone2"/>' +
      [-38, -24, -10, 4, 18, 32].map(function (x) { return '<rect x="' + x + '" y="-88" width="8" height="10" class="tm-stone2"/>'; }).join('') +
      '<path d="M-12 0v-34a12 12 0 0 1 24 0v34z" class="tm-door"/><path d="M0 -88v-26" class="tm-line"/><path class="tm-flagc" d="M0 -114l24 6-24 8z"/></g>' + hs + '</g>';
    s += '<g class="tm-e tm-only" data-only="3"><g class="tm-clash"><path d="M440 ' + (GROUND - 40) + 'l-22 -52" class="tm-line" stroke-width="3"/><path d="M458 ' + (GROUND - 40) + 'l22 -52" class="tm-line" stroke-width="3"/><path class="tm-flagc" d="M418 ' + (GROUND - 92) + 'l22 6-22 8z"/><path class="tm-flagc2" d="M480 ' + (GROUND - 92) + 'l-22 6 22 8z"/></g>' +
      '<g class="tm-sparks"><circle cx="449" cy="' + (GROUND - 56) + '" r="3"/><circle cx="440" cy="' + (GROUND - 66) + '" r="2"/><circle cx="458" cy="' + (GROUND - 64) + '" r="2.4"/></g></g>';
    /* era 4 — a new fort, new muhallas */
    var hs4 = '';
    [704, 738, 772].forEach(function (x, k) { hs4 += house(x, 26 + (k % 2) * 6, 38 + (k % 3) * 9, 'tm-wall2'); });
    s += '<g class="tm-e" data-from="4">' + hs4 + '<g transform="translate(822,' + GROUND + ')"><rect x="-12" y="-44" width="52" height="44" class="tm-stone"/>' + dome(14, -44, 18, 'tm-stone2') + '<path d="M-12 0v-20a8 8 0 0 1 16 0v20z" class="tm-door"/></g></g>';
    /* era 5 — Akbar's sarkar: a Mughal garden; the ledger floats (only then) */
    s += '<g class="tm-e" data-from="5"><g transform="translate(900,' + GROUND + ')"><rect x="-6" y="-12" width="150" height="12" class="tm-water-tank"/>' +
      [10, 56, 102, 134].map(function (x, k) { return '<g transform="translate(' + x + ',-2)"><path d="M0 0c-9-24-5-' + (50 + k * 6) + ' 0-' + (50 + k * 6) + 's9 ' + (26 - k * 6) + ' 0 ' + (50 + k * 6) + 'z" class="tm-cypress tm-sway"/></g>'; }).join('') +
      '<path class="tm-line" d="M30 -12v-36M30 -48q16 -16 32 0v36" fill="none"/><rect x="32" y="-34" width="28" height="22" class="tm-stone2"/>' + dome(46, -34, 14, 'tm-stone') + '</g></g>';
    s += '<g class="tm-e tm-only" data-only="5"><g class="tm-float"><rect x="930" y="' + (GROUND - 150) + '" width="54" height="40" rx="4" class="tm-book"/><path d="M938 ' + (GROUND - 138) + 'h38M938 ' + (GROUND - 130) + 'h38M938 ' + (GROUND - 122) + 'h24" class="tm-line"/></g><text class="tm-tag" x="900" y="' + (GROUND - 160) + '">Ain-i-Akbari</text></g>';
    /* era 6 — the Nawabs build: Chihal Satun's arcade and a mosque */
    var arch = '';
    for (i = 0; i < 7; i++) arch += '<path d="M' + (i * 22 + 8) + ' 0v-30a8 8 0 0 1 16 0v30z" class="tm-door"/>';
    s += '<g class="tm-e" data-from="6"><g transform="translate(1066,' + GROUND + ')"><rect x="0" y="-66" width="164" height="66" class="tm-brickc"/><path d="M-6 -66h176v-9h-176z" class="tm-stone2"/>' + arch +
      [0, 22, 44, 66, 88, 110, 132, 154].map(function (x) { return '<rect x="' + x + '" y="-84" width="8" height="9" class="tm-stone2"/>'; }).join('') + '</g></g>';
    /* era 7 — Cornwallis's tomb on twelve columns */
    var cols = '';
    for (i = 0; i < 6; i++) cols += '<rect x="' + (-46 + i * 18) + '" y="-60" width="6" height="52" class="tm-stone2"/>';
    s += '<g class="tm-e" data-from="7"><g transform="translate(1316,' + GROUND + ')"><rect x="-60" y="-10" width="120" height="10" class="tm-stone"/><rect x="-54" y="-18" width="108" height="8" class="tm-stone2"/>' + cols +
      '<rect x="-54" y="-68" width="108" height="8" class="tm-stone2"/>' + dome(0, -68, 40, 'tm-stone2') + '</g></g>';
    /* era 8 — the opium factory */
    s += '<g class="tm-e" data-from="8"><g transform="translate(1394,' + GROUND + ')"><rect x="0" y="-56" width="110" height="56" class="tm-brickc"/><path d="M0 -56l22 -20v20zM28 -56l22 -20v20zM56 -56l22 -20v20zM84 -56l22 -20v20z" class="tm-roof"/>' +
      '<rect x="92" y="-132" width="16" height="76" class="tm-brickd"/><rect x="88" y="-138" width="24" height="8" class="tm-brickc"/>' +
      '<g class="tm-puff"><circle cx="100" cy="-148" r="7"/><circle cx="104" cy="-166" r="9"/><circle cx="98" cy="-186" r="10"/></g>' +
      '<rect class="tm-glow" x="12" y="-40" width="10" height="12"/><rect class="tm-glow" x="40" y="-40" width="10" height="12"/><rect class="tm-glow" x="68" y="-40" width="10" height="12"/></g></g>';
    /* era 9 — the rising: torches along the bank (only then), a memorial lamp after */
    var crowd = '';
    [700, 740, 800, 860, 920, 980].forEach(function (x, k) {
      crowd += person(x, GROUND + 8 + (k % 2) * 4, k % 2 ? 'tm-indigo' : 'tm-white',
        '<path d="M6 -26L10 -58" class="tm-line"/><g class="tm-torch"><ellipse cx="10" cy="-66" rx="5" ry="9" class="tm-fire"/><ellipse cx="10" cy="-64" rx="2.6" ry="5" class="tm-fire2"/></g>');
    });
    s += '<g class="tm-e tm-only" data-only="9">' + crowd + '</g>';
    s += '<g class="tm-e" data-from="9"><g transform="translate(1520,' + GROUND + ')"><rect x="-10" y="-34" width="20" height="34" class="tm-stone"/><path d="M-14 -34h28l-14 -16z" class="tm-stone2"/><circle class="tm-lampc" cy="-60" r="14"/><path class="tm-fire" d="M0 -56c-4-4-3-10 0-14 3 4 4 10 0 14z"/></g></g>';
    /* era 10 — the Scientific Society, and a telescope at night */
    s += '<g class="tm-e" data-from="10"><g transform="translate(1558,' + GROUND + ')"><rect x="-18" y="-36" width="46" height="36" class="tm-stone2"/>' + dome(5, -36, 16, 'tm-stone') + '<path d="M18 -52L52 -92" stroke="#c9a96a" stroke-width="5" stroke-linecap="round"/><rect class="tm-glow" x="-10" y="-24" width="8" height="10"/><rect class="tm-glow" x="8" y="-24" width="8" height="10"/></g></g>';

    /* the ground, the river, the boat */
    s += '<rect class="tm-ground" y="' + GROUND + '" width="' + W + '" height="44"/>' +
      '<rect y="' + (GROUND + 38) + '" width="' + W + '" height="' + (H - GROUND - 38) + '" fill="url(#tmWater)"/>' +
      '<path class="tm-ripple" d="M-60 ' + (GROUND + 62) + 'q15-4 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" stroke="#fff" stroke-width="1.3" fill="none"/>' +
      '<g class="tm-boat"><g transform="translate(0,' + (GROUND + 80) + ')"><path d="M-30 0q30 12 60 0l-6 -7h-48z" fill="#3a2a22"/><path d="M0 -7V-34l16 22z" fill="#f1d9b0"/></g></g>' +
      '</g><rect class="tm-night" width="' + W + '" height="' + H + '"/>';
    return s;
  }

  /* ── the page ─────────────────────────────────────────────── */
  function build() {
    host = document.getElementById('timemachine');
    if (!host || !window.DATA) return;
    var tl = window.DATA.timeline;
    host.innerHTML =
      '<svg class="tm-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(L('tm.alt')) + '">' + sceneSvg() + '</svg>' +
      '<div class="tm-hud"><div class="tm-year" id="tmYear"></div><div class="tm-count" id="tmCount"></div></div>' +
      '<div class="tm-panel">' +
      '<div class="tm-info"><h3 id="tmTitle"></h3><p id="tmText"></p></div>' +
      '<div class="tm-ctl"><button type="button" class="rf-nav" data-tm="prev" aria-label="' + esc(L('tm.prev')) + '"><svg class="ic"><use href="#i-arrow"/></svg></button>' +
      '<button type="button" class="rf-nav" data-tm="next" aria-label="' + esc(L('tm.next')) + '"><svg class="ic"><use href="#i-arrow"/></svg></button>' +
      '<button type="button" class="yard-btn tm-play" data-tm="play" aria-pressed="' + (playing ? 'true' : 'false') + '"><svg class="ic"><use href="#i-play"/></svg><span>' + esc(L(playing ? 'tm.pause' : 'tm.play')) + '</span></button></div></div>' +
      '<div class="tm-strata" role="group" aria-label="' + esc(L('tm.layers')) + '">' + tl.map(function (e, i) {
        return '<button type="button" class="tm-layer' + (i === cur ? ' is-on' : '') + '" data-i="' + i + '" style="--silt:' + SILT[i % SILT.length] + '" aria-label="' + esc(pick(e.t)) + '"><span class="tm-ly">' + esc(e.y.replace(/\s*[–-].*$/, '').replace('c. ', '')) + '</span></button>';
      }).join('') + '</div><p class="tm-hint">' + esc(L('tm.hint')) + '</p>';
    built = true;
    bind();
    apply(false);
    var tn = document.getElementById('tmYear');
    if (tn) tn.textContent = tl[cur].y;
  }

  function apply(animate) {
    if (!built) return;
    var tl = window.DATA.timeline, e = tl[cur];
    var svg = host.querySelector('.tm-svg');
    Array.prototype.forEach.call(svg.querySelectorAll('.tm-sky'), function (r) { r.classList.toggle('is-on', +r.getAttribute('data-i') === cur); });
    Array.prototype.forEach.call(svg.querySelectorAll('.tm-e'), function (g) {
      var from = g.getAttribute('data-from'), only = g.getAttribute('data-only');
      var on = from !== null ? cur >= +from : cur === +only;
      g.classList.toggle('is-on', on);
    });
    /* the sun crosses the sky; at the last era it becomes the moon */
    var t = cur / (YEARS.length - 1);
    var cw = svg.clientWidth || 1, ch = svg.clientHeight || 1;
    var vw = cw / Math.max(cw / W, ch / H);               /* how much of the scene fits */
    var cam = svg.querySelector('#tmCam');
    var lim = Math.max(0, 800 - vw / 2);
    var camX = vw < W - 2 ? Math.max(-lim, Math.min(lim, 800 - FOCUS[cur])) : 0;
    cam.style.transform = 'translateX(' + camX.toFixed(0) + 'px)';
    var left = 800 - vw / 2;
    var ox = vw < W - 2 ? left + 70 + (vw - 140) * t : 120 + (W - 240) * t;
    var oy = 170 - Math.sin(Math.PI * Math.min(t, 0.96)) * 100;
    var orb = svg.querySelector('#tmOrb');
    orb.style.transform = 'translate(' + ox.toFixed(0) + 'px,' + oy.toFixed(0) + 'px)';
    svg.classList.toggle('is-night', cur >= 10);
    svg.classList.toggle('is-fire', cur === 9);
    Array.prototype.forEach.call(host.querySelectorAll('.tm-layer'), function (b) { b.classList.toggle('is-on', +b.getAttribute('data-i') === cur); b.classList.toggle('is-past', +b.getAttribute('data-i') < cur); });
    var strip = host.querySelector('.tm-strata'), on = strip && strip.querySelector('.tm-layer.is-on');
    if (strip && on && strip.scrollWidth > strip.clientWidth) {
      var want = on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2;
      try { strip.scrollTo({ left: want, behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { strip.scrollLeft = want; }
    }
    var cnt = host.querySelector('#tmCount'); if (cnt) cnt.textContent = tpl(L('tm.of'), { n: cur + 1, t: tl.length });
    var ti = host.querySelector('#tmTitle'); if (ti) ti.textContent = pick(e.t);
    var tx = host.querySelector('#tmText'); if (tx) tx.textContent = pick(e.d);
    var info = host.querySelector('.tm-info');
    if (info && animate) { info.classList.remove('is-in'); void info.offsetWidth; info.classList.add('is-in'); }
    /* roll the year counter */
    var yEl = host.querySelector('#tmYear');
    cancelAnimationFrame(yearTween);
    if (!yEl) return;
    if (!animate || reduced) { yEl.textContent = e.y; return; }
    var from = parseFloat(yEl.getAttribute('data-n')) || YEARS[Math.max(0, cur - 1)], to = YEARS[cur], t0 = performance.now(), dur = 900;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur), v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      yEl.textContent = k < 1 ? fmtYear(v) : e.y;
      yEl.setAttribute('data-n', v);
      if (k < 1) yearTween = requestAnimationFrame(step);
    }
    yearTween = requestAnimationFrame(step);
  }

  function go(i, user) {
    var n = window.DATA.timeline.length;
    i = (i + n) % n;
    if (user && playing) toggle(false);
    var changed = i !== cur;
    cur = i;
    apply(true);
    if (changed) snd(i === 9 ? 'thud' : 'chime');
  }

  function toggle(on) {
    playing = on === undefined ? !playing : on;
    clearInterval(timer);
    if (playing) timer = setInterval(function () { go(cur + 1, false); }, 4600);
    var b = host && host.querySelector('.tm-play');
    if (b) { b.setAttribute('aria-pressed', playing ? 'true' : 'false'); b.querySelector('span').textContent = L(playing ? 'tm.pause' : 'tm.play'); }
  }

  function bind() {
    host.addEventListener('click', function (e) {
      var l = e.target.closest('.tm-layer');
      if (l) { go(+l.getAttribute('data-i'), true); return; }
      var b = e.target.closest('[data-tm]');
      if (!b) return;
      var k = b.getAttribute('data-tm');
      if (k === 'prev') go(cur - 1, true);
      else if (k === 'next') go(cur + 1, true);
      else if (k === 'play') toggle();
    });
    host.setAttribute('tabindex', '0');
    host.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
    });
  }

  window.addEventListener('resize', function () { if (built) apply(false); });

  window.Story = {
    build: function () { build(); }
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) toggle(false); });
})();
