/* ══════════════════════════════════════════════════════════════
   THE LIVING YEAR — festivals as little animated scenes, and a game.
   Each festival card is a moving picture you can poke. Below them,
   "Match the year": flip tiles to pair every festival with its symbol.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ORDER = ['chhath', 'kartik', 'sawan', 'birha', 'gulab'];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function pick(o) { return !o ? '' : typeof o === 'string' ? o : (o[lang()] || o.en || ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tpl(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

/* five animated festival scenes (viewBox 0 0 300 190) */
var SCENES = {
  chhath: function (u) {
    return '<defs><linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4b27c"/><stop offset=".6" stop-color="#fbd9a6"/><stop offset="1" stop-color="#fde9c2"/></linearGradient>' +
      '<linearGradient id="' + u + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7b88c"/><stop offset="1" stop-color="#6f9ea0"/></linearGradient>' +
      '<radialGradient id="' + u + 'g"><stop offset="0" stop-color="#fff2c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="300" height="190" fill="url(#' + u + 's)"/>' +
      '<g class="fa-sun"><circle cx="150" cy="104" r="70" fill="url(#' + u + 'g)"/><circle cx="150" cy="104" r="26" fill="#ffe2a0"/></g>' +
      '<path d="M0 112c40-8 80 2 120-4s90-6 180 2v8H0z" fill="#b89472" opacity=".5"/>' +
      '<rect y="112" width="300" height="78" fill="url(#' + u + 'w)"/>' +
      '<g class="fa-glint"><path d="M126 120h48M132 128h36M138 137h24M142 146h16" stroke="#fff3cf" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>' +
      '<path class="fa-wave" d="M-30 150q15-4 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".3"/>' +
      [[84, 0], [216, 1]].map(function (f) {
        return '<g transform="translate(' + f[0] + ',150)"><ellipse class="fa-ring" cx="0" cy="2" rx="22" ry="5" fill="none" stroke="#fff" stroke-width="1.3" style="animation-delay:-' + f[1] * 1.6 + 's"/>' +
          '<path d="M-9 2V-26a9 9 0 0 1 18 0V2z" fill="#3a2a22"/><circle cx="0" cy="-40" r="7" fill="#3a2a22"/>' +
          '<path d="M-8 -28L-14 -52M8 -28L14 -52" stroke="#3a2a22" stroke-width="3.4" stroke-linecap="round"/>' +
          '<g class="fa-soop"><ellipse cx="0" cy="-58" rx="22" ry="5.5" fill="#c98b4a"/><path d="M-22 -58q22 16 44 0" fill="#a8692f"/><circle cx="-8" cy="-64" r="4" fill="#e9a23b"/><circle cx="4" cy="-66" r="4" fill="#d4572b"/><circle cx="12" cy="-63" r="3.4" fill="#f2c14e"/></g></g>';
      }).join('');
  },
  kartik: function (u) {
    var stars = '', diyas = '', i, lan = '';
    for (i = 0; i < 26; i++) stars += '<circle class="fa-star" style="animation-delay:-' + ((i * 0.37) % 4).toFixed(2) + 's" cx="' + ((i * 53) % 300) + '" cy="' + (6 + (i * 29) % 78) + '" r="' + (0.7 + (i % 3) * 0.4) + '" fill="#fff6dc"/>';
    for (i = 0; i < 11; i++) {
      var x = 20 + (i * 47) % 270, y = 132 + (i * 23) % 46;
      diyas += '<g class="fa-diya" style="animation-delay:-' + (i * 1.3) + 's;animation-duration:' + (16 + i % 4 * 4) + 's"><g transform="translate(' + x + ',' + y + ')">' +
        '<ellipse cx="0" cy="9" rx="9" ry="2.4" fill="#ffb454" opacity=".25"/><path d="M-6 0q6 6 12 0z" fill="#7a4a30"/><path class="fa-flame" d="M0 -1c-3-3-2-7 0-10 2 3 3 7 0 10z" fill="#ffd27a"/></g></g>';
    }
    for (i = 0; i < 4; i++) lan += '<g class="fa-lantern" style="animation-delay:-' + (i * 2.6) + 's"><g transform="translate(' + (50 + i * 62) + ',150)"><rect x="-4" y="-8" width="8" height="11" rx="3" fill="#ffc46a"/><circle r="12" cy="-3" fill="#ffc46a" opacity=".25"/></g></g>';
    return '<defs><linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1a44"/><stop offset="1" stop-color="#3d5594"/></linearGradient>' +
      '<linearGradient id="' + u + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4585"/><stop offset="1" stop-color="#101d4a"/></linearGradient></defs>' +
      '<rect width="300" height="190" fill="url(#' + u + 's)"/>' + stars +
      '<g class="fa-moon"><circle cx="232" cy="42" r="34" fill="#eef3ff" opacity=".18"/><circle cx="232" cy="42" r="18" fill="#f3f6ff"/></g>' +
      '<path d="M0 116c40-12 80 0 120-6s80-8 180 2v10H0z" fill="#1b2a5a"/><rect y="118" width="300" height="72" fill="url(#' + u + 'w)"/>' +
      '<path class="fa-wave" d="M-30 134q15-4 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" stroke="#9cb4ff" stroke-width="1.1" fill="none" opacity=".3"/>' +
      '<g class="fa-diyas">' + diyas + '</g>' + lan;
  },
  sawan: function (u) {
    var rain = '', i;
    for (i = 0; i < 16; i++) rain += '<path class="fa-rain" style="animation-delay:-' + ((i * 0.13) % 1.2).toFixed(2) + 's" d="M' + (8 + i * 19) + ' 0l-4 14" stroke="#cfe3d8" stroke-width="1.2" opacity=".6"/>';
    return '<defs><linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46605a"/><stop offset="1" stop-color="#8fae9c"/></linearGradient></defs>' +
      '<rect width="300" height="190" fill="url(#' + u + 's)"/>' +
      '<g class="fa-cloud" opacity=".85"><ellipse cx="80" cy="30" rx="56" ry="15" fill="#30443f"/><ellipse cx="116" cy="24" rx="36" ry="13" fill="#3a504a"/></g>' +
      '<g class="fa-cloud c2" opacity=".8"><ellipse cx="220" cy="22" rx="62" ry="15" fill="#2c3f3a"/><ellipse cx="190" cy="16" rx="34" ry="12" fill="#364c46"/></g>' +
      '<path class="fa-bolt" d="M170 36l-14 34 12 0-10 30 28-40-14 0 10-24z" fill="#fff9d0"/>' +
      '<path d="M0 120c50-14 100-8 150-12s100-4 150 6v76H0z" fill="#5f8a55"/>' +
      '<path d="M0 138h300M0 152h300" stroke="#4f7647" stroke-width="2" opacity=".6"/>' +
      '<path d="M0 168c70-14 150-8 300-18v40H0z" fill="#6b5a45"/>' +
      '<g class="fa-walk"><g transform="translate(0,166)">' +
      '<g class="fa-kanwar"><path d="M-26 -34h52" stroke="#6d4a2a" stroke-width="2.4"/><path d="M-24 -34v10M24 -34v10" stroke="#6d4a2a" stroke-width="1.4"/>' +
      '<ellipse cx="-24" cy="-20" rx="7" ry="6" fill="#d98a3d"/><ellipse cx="24" cy="-20" rx="7" ry="6" fill="#d98a3d"/><path d="M-30 -34l-4 -6M30 -34l4 -6" stroke="#e8793a" stroke-width="2"/></g>' +
      '<circle cx="0" cy="-48" r="6" fill="#3a2a22"/><path d="M-7 -40h14l-1 22h-12z" fill="#e8793a"/>' +
      '<path class="fa-leg" d="M-3 -18v18" stroke="#3a2a22" stroke-width="3.6" stroke-linecap="round"/><path class="fa-leg l2" d="M3 -18v18" stroke="#3a2a22" stroke-width="3.6" stroke-linecap="round"/></g></g>' +
      rain;
  },
  birha: function (u) {
    var bulbs = '', notes = '', bars = '', i;
    for (i = 0; i < 9; i++) bulbs += '<circle class="fa-bulb" style="animation-delay:-' + (i * 0.4) + 's" cx="' + (14 + i * 34) + '" cy="' + (16 + Math.sin(i * 0.7 + 1) * 5 + 8) + '" r="3.4" fill="#ffd27a"/>';
    for (i = 0; i < 6; i++) notes += '<g class="fa-note" style="animation-delay:-' + (i * 0.9) + 's"><g transform="translate(' + (110 + (i * 23) % 90) + ',112)"><circle cx="0" cy="0" r="3.4" fill="#ffe3a0"/><path d="M3 0V-14q6 1 6 6" stroke="#ffe3a0" stroke-width="1.6" fill="none"/></g></g>';
    for (i = 0; i < 9; i++) bars += '<rect class="fa-bar" style="animation-delay:-' + ((i * 0.23) % 1.1).toFixed(2) + 's" x="' + (108 + i * 9) + '" y="170" width="5" height="14" rx="2" fill="#ffc46a" opacity=".7"/>';
    return '<defs><linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1f2e"/><stop offset="1" stop-color="#9a5a45"/></linearGradient><radialGradient id="' + u + 'g"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="300" height="190" fill="url(#' + u + 's)"/><ellipse cx="150" cy="120" rx="120" ry="60" fill="url(#' + u + 'g)"/>' +
      '<path d="M0 20q75 22 150 8t150-8" stroke="#6b4636" stroke-width="1.6" fill="none"/>' + bulbs +
      '<rect y="150" width="300" height="40" fill="#4a2a2a"/><path d="M0 150h300" stroke="#d29a6a" stroke-width="2" opacity=".5"/>' +
      /* singer */
      '<g class="fa-sing"><circle cx="150" cy="92" r="11" fill="#1d1114"/><ellipse cx="150" cy="84" rx="12" ry="5" fill="#e9dcc0"/><path d="M134 150c0-26 8-46 16-46s16 20 16 46z" fill="#1d1114"/><path d="M162 112l22 14" stroke="#1d1114" stroke-width="4" stroke-linecap="round"/></g>' +
      '<rect x="164" y="128" width="40" height="18" rx="2" fill="#7a4a30"/><path d="M168 134h32M168 140h32" stroke="#e9c58c" stroke-width="1.2"/>' +
      /* dholak player */
      '<g class="fa-drum"><circle cx="76" cy="110" r="9" fill="#1d1114"/><path d="M62 150c0-22 6-36 14-36s14 14 14 36z" fill="#1d1114"/><ellipse cx="96" cy="136" rx="14" ry="8" fill="#a8692f"/><path d="M84 136h24" stroke="#e9c58c" stroke-width="1.4"/></g>' +
      notes + bars;
  },
  gulab: function (u) {
    var petals = '', roses = '', i;
    for (i = 0; i < 9; i++) petals += '<ellipse class="fa-petal" style="animation-delay:-' + (i * 0.9) + 's;animation-duration:' + (7 + i % 3 * 2) + 's" cx="' + (20 + i * 31) + '" cy="-6" rx="5" ry="3" fill="#e5557a"/>';
    [[56, 60, 20], [92, 48, 24], [128, 66, 18], [30, 88, 16], [112, 92, 15]].forEach(function (r) {
      roses += '<g class="fa-rose"><circle cx="' + r[0] + '" cy="' + r[1] + '" r="' + r[2] + '" fill="#d6416a"/><circle cx="' + r[0] + '" cy="' + r[1] + '" r="' + (r[2] * 0.66).toFixed(1) + '" fill="#e8607f"/><circle cx="' + r[0] + '" cy="' + r[1] + '" r="' + (r[2] * 0.32).toFixed(1) + '" fill="#b8284f"/></g>';
    });
    return '<defs><linearGradient id="' + u + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9dcc9"/><stop offset="1" stop-color="#f4e9d2"/></linearGradient></defs>' +
      '<rect width="300" height="190" fill="url(#' + u + 's)"/><circle cx="244" cy="38" r="22" fill="#fff2cf" opacity=".9"/>' +
      '<path d="M0 150c40-14 90-8 140-12s100-4 160 8v44H0z" fill="#8aa56a"/><rect y="164" width="300" height="26" fill="#a98a62"/>' +
      '<path d="M20 150c12-30 30-46 54-52M110 150c-2-22 8-40 24-50" stroke="#58733f" stroke-width="3" fill="none"/>' +
      '<g class="fa-bush">' + roses + '</g>' +
      /* the copper still */
      '<g transform="translate(206,150)"><ellipse cx="0" cy="12" rx="38" ry="5" fill="#000" opacity=".12"/>' +
      '<path d="M-30 12c-6-28 0-46 30-46s36 18 30 46z" fill="#c4783a"/><path d="M-26 -10h52" stroke="#e8a35c" stroke-width="2.4"/><path d="M-12 -34h24l-4 -10h-16z" fill="#b3672d"/>' +
      '<path d="M-22 -40q-30 -4 -60 22v6" stroke="#b3672d" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle class="fa-steam" cx="0" cy="-50" r="5" fill="#fff"/><circle class="fa-steam s2" cx="4" cy="-50" r="4" fill="#fff"/><circle class="fa-steam s3" cx="-4" cy="-50" r="4.4" fill="#fff"/></g>' +
      /* the bottle */
      '<g transform="translate(122,150)"><rect x="-9" y="-6" width="18" height="22" rx="4" fill="#e9f2f0" opacity=".85"/><rect x="-4" y="-16" width="8" height="12" fill="#e9f2f0" opacity=".85"/><rect class="fa-fill" x="-8" y="2" width="16" height="13" rx="3" fill="#f2a7b6" opacity=".8"/>' +
      '<circle class="fa-drop" cx="0" cy="-22" r="2" fill="#f2a7b6"/></g>' +
      '<g class="fa-petals">' + petals + '</g>';
  }
};


  /* ── the cards ────────────────────────────────────────────── */
  function renderCards() {
    var el = document.getElementById('festivalGrid');
    if (!el || !window.DATA) return;
    el.innerHTML = window.DATA.festivals.map(function (f, i) {
      var id = ORDER[i] || ORDER[0];
      var name = pick(f.n);
      return '<article class="fest-card rev" data-fest="' + id + '" tabindex="0" role="button" aria-label="' + esc(name) + '">' +
        '<div class="fest-art"><svg viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + SCENES[id]('fs' + i) + '</svg>' +
        '<span class="fest-num">0' + (i + 1) + '</span></div>' +
        '<div class="fest-body"><h3>' + esc(name) + '</h3><span class="fest-when">' + esc(pick(f.w)) + '</span>' +
        '<span class="fest-text">' + esc(pick(f.d)) + '</span></div></article>';
    }).join('');
  }

  /* poke a card: each scene answers in its own way */
  function poke(card) {
    var id = card.getAttribute('data-fest');
    var art = card.querySelector('.fest-art');
    art.classList.remove('is-act'); void art.offsetWidth; art.classList.add('is-act');
    clearTimeout(card._t); card._t = setTimeout(function () { art.classList.remove('is-act'); }, 2200);
    if (id === 'kartik') {
      var g = art.querySelector('.fa-diyas');
      var n = g.children.length;
      var x = 20 + Math.random() * 260, y = 128 + Math.random() * 52;
      var ns = 'http://www.w3.org/2000/svg';
      var d = document.createElementNS(ns, 'g');
      d.setAttribute('class', 'fa-diya fa-new');
      d.setAttribute('style', 'animation-duration:' + (14 + Math.random() * 8) + 's');
      d.innerHTML = '<g transform="translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ')"><ellipse cx="0" cy="9" rx="10" ry="2.6" fill="#ffb454" opacity=".35"/><path d="M-6 0q6 6 12 0z" fill="#7a4a30"/><path class="fa-flame" d="M0 -1c-3-3-2-7 0-10 2 3 3 7 0 10z" fill="#ffd27a"/></g>';
      g.appendChild(d);
      if (n > 26) g.removeChild(g.children[0]);
      snd('chime');
    } else if (id === 'sawan') { snd('thud'); setTimeout(function () { snd('thunder'); }, 380); }
    else if (id === 'birha') { snd('chime'); setTimeout(function () { snd('chime'); }, 220); }
    else if (id === 'gulab') { snd('coin'); }
    else { snd('bell'); }
  }

  /* ── the game: match the year ─────────────────────────────── */
  var GLYPH = {
    chhath: '<circle cx="24" cy="22" r="9" fill="#f2a63b"/><path d="M6 32c6-4 12-4 18 0s12 4 18 0M6 40c6-4 12-4 18 0s12 4 18 0" stroke="#4d8f94" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    kartik: '<path d="M8 28q16 14 32 0z" fill="#8a5232"/><path d="M24 26c-7-7-4-16 0-22 4 6 7 15 0 22z" fill="#f2a63b"/><path d="M24 24c-3-3-2-8 0-11 2 3 3 8 0 11z" fill="#ffe08a"/>',
    sawan: '<path d="M12 28a8 8 0 0 1 1-16 11 11 0 0 1 21 3 7 7 0 0 1 1 13z" fill="#6c8c85"/><path d="M15 33l-3 8M24 33l-3 8M33 33l-3 8" stroke="#4d8f94" stroke-width="2.6" stroke-linecap="round"/>',
    birha: '<circle cx="17" cy="35" r="7" fill="#9a4a5c"/><path d="M24 35V10q10 2 12 12" stroke="#9a4a5c" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    gulab: '<circle cx="24" cy="22" r="14" fill="#d6416a"/><circle cx="24" cy="22" r="9" fill="#e8607f"/><circle cx="24" cy="22" r="4.4" fill="#b8284f"/><path d="M24 36v8M24 42l-7-4M24 42l7-4" stroke="#58733f" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
  };
  var G = { tiles: [], first: null, lock: false, moves: 0, matched: {}, built: false };

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function newDeal() {
    G.tiles = shuffle(ORDER.concat(ORDER).map(function (id, i) { return { id: id, k: i }; }));
    G.first = null; G.lock = false; G.moves = 0; G.matched = {};
  }

  function best() { return parseInt(store.get('gzp.fest.best') || '0', 10) || 0; }

  function renderGame() {
    var host = document.getElementById('festGame');
    if (!host) return;
    var fest = window.DATA.festivals;
    host.innerHTML =
      '<div class="fg-head"><div><h3>' + esc(L('fest.gameTitle')) + '</h3><p>' + esc(L('fest.gameHint')) + '</p></div>' +
      '<div class="fg-stats"><span id="fgMoves">' + esc(tpl(L('fest.moves'), { n: G.moves })) + '</span>' +
      '<span id="fgBest">' + (best() ? esc(tpl(L('fest.best'), { n: best() })) : '') + '</span></div></div>' +
      '<div class="fg-grid" id="fgGrid">' + G.tiles.map(function (t, i) {
        var on = G.matched[t.id] || G.first === i;
        var idx = ORDER.indexOf(t.id);
        return '<button type="button" data-f="' + t.id + '" class="fg-tile' + (on ? ' is-flip' : '') + (G.matched[t.id] ? ' is-done' : '') + '" data-i="' + i + '" aria-label="' + (on ? esc(pick(fest[idx].n)) : esc(L('fest.card'))) + '"' + (G.matched[t.id] ? ' disabled' : '') + '>' +
          '<span class="fg-in"><span class="fg-back"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".5"/><circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".4" stroke-dasharray="2 4"/><path d="M24 12v24M12 24h24" stroke="currentColor" stroke-width="1.2" opacity=".35"/></svg></span>' +
          '<span class="fg-face"><svg viewBox="0 0 48 48" aria-hidden="true">' + GLYPH[t.id] + '</svg></span></span></button>';
      }).join('') + '</div>' +
      '<p class="fg-cap" id="fgCap" aria-live="polite"></p>' +
      '<div class="fg-win" id="fgWin" hidden></div>';
    var grid = host.querySelector('#fgGrid');
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.fg-tile');
      if (b && !b.disabled) flip(+b.getAttribute('data-i'), b);
    });
    G.built = true;
    if (Object.keys(G.matched).length === ORDER.length) showWin();
  }

  function setStat() {
    var m = document.getElementById('fgMoves');
    if (m) m.textContent = tpl(L('fest.moves'), { n: G.moves });
    var b = document.getElementById('fgBest');
    if (b) b.textContent = best() ? tpl(L('fest.best'), { n: best() }) : '';
  }

  function flip(i, btn) {
    if (G.lock || G.first === i || G.matched[G.tiles[i].id]) return;
    btn.classList.add('is-flip');
    snd('tick');
    if (G.first === null) { G.first = i; return; }
    G.moves++; setStat();
    var a = G.tiles[G.first], b = G.tiles[i];
    var grid = document.getElementById('fgGrid');
    var btnA = grid.querySelector('[data-i="' + G.first + '"]');
    G.first = null;
    if (a.id === b.id) {
      G.matched[a.id] = true;
      [btnA, btn].forEach(function (x) { x.classList.add('is-done'); x.disabled = true; });
      var f = window.DATA.festivals[ORDER.indexOf(a.id)];
      var cap = document.getElementById('fgCap');
      if (cap) cap.innerHTML = '<b>' + esc(pick(f.n)) + '</b> · ' + esc(pick(f.w));
      snd('coin');
      if (Object.keys(G.matched).length === ORDER.length) setTimeout(showWin, 650);
    } else {
      G.lock = true;
      setTimeout(function () { btnA.classList.remove('is-flip'); btn.classList.remove('is-flip'); G.lock = false; }, 850);
    }
  }

  function showWin() {
    var w = document.getElementById('fgWin');
    if (!w) return;
    var isBest = !best() || G.moves < best();
    if (isBest) store.set('gzp.fest.best', String(G.moves));
    setStat();
    w.hidden = false;
    w.innerHTML = '<b>' + esc(tpl(L('fest.win'), { n: G.moves })) + (isBest ? ' ' + esc(L('fest.newBest')) : '') + '</b>' +
      '<button type="button" class="yard-btn" id="fgAgain"><svg class="ic"><use href="#i-spark"/></svg><span>' + esc(L('fest.again')) + '</span></button>';
    w.querySelector('#fgAgain').addEventListener('click', function () { newDeal(); renderGame(); });
    snd('bell');
    if (window.Scene && window.Scene.releaseDiya) window.Scene.releaseDiya(6);
  }

  function bindCards() {
    var el = document.getElementById('festivalGrid');
    if (!el || el._bound) return;
    el._bound = true;
    el.addEventListener('click', function (e) { var c = e.target.closest('.fest-card'); if (c) poke(c); });
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var c = e.target.closest('.fest-card'); if (c) { e.preventDefault(); poke(c); }
    });
  }

  window.Festivals = {
    build: function () {
      renderCards();
      bindCards();
      if (!G.tiles.length) newDeal();
      renderGame();
    }
  };
})();
