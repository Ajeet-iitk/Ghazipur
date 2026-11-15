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
        '<span class="fest-num">0' + (i + 1) + '</span>' +
        (id === 'chhath' ? '<span class="fest-play" aria-hidden="true"><svg class="ic ic-p"><use href="#i-play"/></svg><svg class="ic ic-z"><use href="#i-pause"/></svg><span>' + esc(L('fest.song.play')) + '</span><i class="fp-eq"><b></b><b></b><b></b></i></span>' : '') + '</div>' +
        '<div class="fest-body"><h3>' + esc(name) + '</h3><span class="fest-when">' + esc(pick(f.w)) + '</span>' +
        '<span class="fest-text">' + esc(pick(f.d)) + '</span></div></article>';
    }).join('');
  }


  /* ── the Chhathi Maiya song: tap the Chhath card, and a small player appears ── */
  var SONG = { src: 'assets/audio/chhathi-maiya.mp3', audio: null, bar: null, seeking: false, duck: null };
  function fmt(t) { if (!isFinite(t)) return '0:00'; t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }

  function songSync() {
    var a = SONG.audio, playing = !!a && !a.paused && !a.ended;
    document.documentElement.classList.toggle('is-song', playing);
    Array.prototype.forEach.call(document.querySelectorAll('.fest-card[data-fest="chhath"] .fest-art'), function (x) { x.classList.toggle('is-song', playing); });
    Array.prototype.forEach.call(document.querySelectorAll('.fest-card[data-fest="chhath"] .fest-play'), function (x) {
      x.querySelector('span').textContent = L(playing ? 'fest.song.pause' : 'fest.song.play');
      x.classList.toggle('is-on', playing);
    });
    if (SONG.bar) {
      var pb = SONG.bar.querySelector('.sb-play');
      pb.classList.toggle('is-playing', playing);
      pb.setAttribute('aria-label', L(playing ? 'fest.song.pause' : 'fest.song.play'));
    }
  }
  function duck(on) {
    var A = window.Ambient; if (!A || !A.setMaster || !A.getMaster) return;
    if (on && SONG.duck === null) { SONG.duck = A.getMaster() / 0.95; A.setMaster(SONG.duck * 0.22); }
    else if (!on && SONG.duck !== null) { A.setMaster(SONG.duck); SONG.duck = null; }
  }

  function songBar() {
    if (SONG.bar) return SONG.bar;
    var d = document.createElement('div');
    d.className = 'song-bar'; d.hidden = true; d.setAttribute('role', 'group');
    d.innerHTML =
      '<div class="sb-art" aria-hidden="true"><span class="sb-eq"><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="sb-main"><div class="sb-top"><b class="sb-title"></b><span class="sb-time"><em class="sb-cur">0:00</em> / <em class="sb-dur">0:00</em></span></div>' +
      '<input class="sb-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek">' +
      '<div class="sb-row"><button type="button" class="sb-btn sb-play" aria-label="Play"><svg class="ic ic-p"><use href="#i-play"/></svg><svg class="ic ic-z"><use href="#i-pause"/></svg></button>' +
      '<button type="button" class="sb-btn sb-back" aria-label="Back 10 seconds"><span>−10</span></button><button type="button" class="sb-btn sb-fwd" aria-label="Forward 10 seconds"><span>+10</span></button>' +
      '<button type="button" class="sb-btn sb-loop" aria-pressed="false" aria-label="Loop"><svg class="ic"><use href="#i-spark"/></svg></button>' +
      '<label class="sb-vol"><svg class="ic"><use href="#i-sound"/></svg><input class="sb-volr" type="range" min="0" max="100" value="80" aria-label="Volume"></label>' +
      '<button type="button" class="sb-btn sb-close" aria-label="Close"><svg class="ic"><use href="#i-close"/></svg></button></div></div>';
    document.body.appendChild(d);
    SONG.bar = d;
    var seek = d.querySelector('.sb-seek');
    d.querySelector('.sb-play').addEventListener('click', toggleSong);
    d.querySelector('.sb-back').addEventListener('click', function () { if (SONG.audio) SONG.audio.currentTime = Math.max(0, SONG.audio.currentTime - 10); });
    d.querySelector('.sb-fwd').addEventListener('click', function () { if (SONG.audio) SONG.audio.currentTime = Math.min(SONG.audio.duration || 1e9, SONG.audio.currentTime + 10); });
    d.querySelector('.sb-loop').addEventListener('click', function (e) {
      var on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false'); e.currentTarget.classList.toggle('is-on', on);
      if (SONG.audio) SONG.audio.loop = on; store.set('gzp.song.loop', on ? '1' : '0');
    });
    d.querySelector('.sb-volr').addEventListener('input', function (e) { if (SONG.audio) SONG.audio.volume = e.target.value / 100; store.set('gzp.song.vol', e.target.value); });
    d.querySelector('.sb-close').addEventListener('click', function () { stopSong(); });
    seek.addEventListener('input', function () { SONG.seeking = true; if (SONG.audio && SONG.audio.duration) d.querySelector('.sb-cur').textContent = fmt(seek.value / 1000 * SONG.audio.duration); });
    seek.addEventListener('change', function () { if (SONG.audio && SONG.audio.duration) SONG.audio.currentTime = seek.value / 1000 * SONG.audio.duration; SONG.seeking = false; });
    var v = parseInt(store.get('gzp.song.vol') || '80', 10); d.querySelector('.sb-volr').value = isNaN(v) ? 80 : v;
    if (store.get('gzp.song.loop') === '1') { var lb = d.querySelector('.sb-loop'); lb.setAttribute('aria-pressed', 'true'); lb.classList.add('is-on'); }
    songLabels();
    return d;
  }
  function songLabels() {
    if (!SONG.bar) return;
    SONG.bar.setAttribute('aria-label', L('fest.song.title'));
    SONG.bar.querySelector('.sb-title').textContent = L('fest.song.title');
    SONG.bar.querySelector('.sb-seek').setAttribute('aria-label', L('fest.song.seek'));
    SONG.bar.querySelector('.sb-volr').setAttribute('aria-label', L('fest.song.vol'));
    SONG.bar.querySelector('.sb-loop').setAttribute('aria-label', L('fest.song.loop'));
    SONG.bar.querySelector('.sb-close').setAttribute('aria-label', L('fest.song.close'));
  }
  function songAudio() {
    if (SONG.audio) return SONG.audio;
    var a = new Audio(SONG.src);
    a.preload = 'none';
    a.volume = (parseInt(store.get('gzp.song.vol') || '80', 10) || 80) / 100;
    a.loop = store.get('gzp.song.loop') === '1';
    a.addEventListener('timeupdate', function () {
      var d = SONG.bar; if (!d || SONG.seeking || !a.duration || !isFinite(a.duration)) return;
      d.querySelector('.sb-dur').textContent = fmt(a.duration);
      d.querySelector('.sb-seek').value = Math.round(a.currentTime / a.duration * 1000);
      d.querySelector('.sb-cur').textContent = fmt(a.currentTime);
    });
    var setDur = function () { if (SONG.bar && isFinite(a.duration)) SONG.bar.querySelector('.sb-dur').textContent = fmt(a.duration); };
    a.addEventListener('loadedmetadata', setDur); a.addEventListener('durationchange', setDur);
    a.addEventListener('play', function () { songSync(); duck(true); });
    a.addEventListener('pause', function () { songSync(); duck(false); });
    a.addEventListener('ended', function () { songSync(); duck(false); });
    a.addEventListener('error', function () { if (SONG.bar) SONG.bar.querySelector('.sb-title').textContent = L('fest.song.error'); });
    SONG.audio = a;
    return a;
  }
  function toggleSong() {
    var a = songAudio(), bar = songBar();
    bar.hidden = false;
    songLabels();
    if (a.paused || a.ended) { var p = a.play(); if (p && p.catch) p.catch(function () {}); }
    else a.pause();
    songSync();
  }
  function stopSong() {
    var a = SONG.audio;
    if (a) { a.pause(); a.currentTime = 0; }
    duck(false);
    if (SONG.bar) SONG.bar.hidden = true;
    songSync();
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
    else { toggleSong(); }
  }

  /* ── the game: Match Ghazipur ─────────────────────────────── */
  /* ten things of the district, drawn small in the same hand as the rest of the page */
  var ICONS = {
    chhath: '<rect width="64" height="64" fill="#f5c08a"/><circle cx="32" cy="36" r="14" fill="#ffe29a"/><rect y="38" width="64" height="26" fill="#6fa3a8"/><path d="M0 48q8-4 16 0t16 0t16 0t16 0" stroke="#fff" opacity=".55" fill="none" stroke-width="1.4"/><path d="M14 62V46a4.5 4.5 0 0 1 9 0v16zM41 62V46a4.5 4.5 0 0 1 9 0v16z" fill="#3a2a22"/><circle cx="18.5" cy="40" r="4.2" fill="#3a2a22"/><circle cx="45.5" cy="40" r="4.2" fill="#3a2a22"/><ellipse cx="18.5" cy="28" rx="11" ry="3" fill="#c98b4a"/><path d="M7.5 28q11 9 22 0" fill="#a8692f"/><circle cx="14" cy="25" r="2.4" fill="#e9a23b"/><circle cx="21" cy="24" r="2.4" fill="#d4572b"/><ellipse cx="45.5" cy="28" rx="11" ry="3" fill="#c98b4a"/><path d="M34.5 28q11 9 22 0" fill="#a8692f"/><circle cx="41" cy="25" r="2.4" fill="#f2c14e"/>',
    kartik: '<rect width="64" height="64" fill="#1c2a5c"/><circle cx="50" cy="14" r="7" fill="#eef3ff"/><circle cx="12" cy="10" r="1" fill="#fff"/><circle cx="26" cy="18" r="1.2" fill="#fff"/><circle cx="38" cy="8" r="1" fill="#fff"/><rect y="40" width="64" height="24" fill="#2b4585"/><path d="M0 50q8-3 16 0t16 0t16 0t16 0" stroke="#9cb4ff" opacity=".4" fill="none"/><circle cx="32" cy="36" r="17" fill="#ffb454" opacity=".25"/><path d="M18 40q14 12 28 0z" fill="#8a5232"/><path d="M32 38c-7-7-4-15 0-21 4 6 7 14 0 21z" fill="#f2a63b"/><path d="M32 36c-3-3-2-8 0-11 2 3 3 8 0 11z" fill="#ffe08a"/><ellipse cx="14" cy="54" rx="5" ry="1.8" fill="#7a4a30"/><path d="M14 53c-2-2-1-4 0-6 1 2 2 4 0 6z" fill="#ffd27a"/><ellipse cx="51" cy="56" rx="5" ry="1.8" fill="#7a4a30"/><path d="M51 55c-2-2-1-4 0-6 1 2 2 4 0 6z" fill="#ffd27a"/>',
    sawan: '<rect width="64" height="64" fill="#5d7d70"/><ellipse cx="18" cy="12" rx="16" ry="6" fill="#33463f"/><ellipse cx="46" cy="9" rx="17" ry="6" fill="#2c3f3a"/><path d="M0 40c14-6 30-4 64 2v22H0z" fill="#5f8a55"/><rect y="52" width="64" height="12" fill="#6b5a45"/><path d="M12 6l-3 16M24 8l-3 16M36 6l-3 16M48 8l-3 16M58 6l-3 16" stroke="#d3e6dc" opacity=".6" stroke-width="1.2"/><path d="M14 32h36" stroke="#6d4a2a" stroke-width="2.6"/><path d="M16 32v8M48 32v8" stroke="#6d4a2a"/><ellipse cx="16" cy="43" rx="5.4" ry="5" fill="#d98a3d"/><ellipse cx="48" cy="43" rx="5.4" ry="5" fill="#d98a3d"/><circle cx="32" cy="22" r="4.6" fill="#3a2a22"/><path d="M26 30h12l-1 20h-10z" fill="#e8793a"/><path d="M29 50v8M35 50v8" stroke="#3a2a22" stroke-width="3" stroke-linecap="round"/>',
    birha: '<rect width="64" height="64" fill="#7a3b46"/><circle cx="32" cy="36" r="28" fill="#ffcf8a" opacity=".22"/><path d="M0 12q16 8 32 2t32-2" stroke="#d9b08a" fill="none"/><circle cx="8" cy="14" r="2" fill="#ffd27a"/><circle cx="24" cy="17" r="2" fill="#ffd27a"/><circle cx="42" cy="16" r="2" fill="#ffd27a"/><circle cx="57" cy="13" r="2" fill="#ffd27a"/><rect y="50" width="64" height="14" fill="#4a2a2a"/><rect x="12" y="30" width="40" height="20" rx="10" fill="#a8692f"/><ellipse cx="12" cy="40" rx="4" ry="10" fill="#e9c58c"/><ellipse cx="52" cy="40" rx="4" ry="10" fill="#d8b277"/><path d="M16 32l8 16M24 32l8 16M32 32l8 16M40 32l8 16" stroke="#7a4a30" stroke-width="1.6"/><circle cx="50" cy="16" r="3.4" fill="#ffe3a0"/><path d="M53 16V6q6 1 6 6" stroke="#ffe3a0" stroke-width="1.8" fill="none"/>',
    gulab: '<rect width="64" height="64" fill="#f8dccd"/><path d="M0 52c16-8 32-6 64 0v12H0z" fill="#8aa56a"/><rect x="22" y="30" width="22" height="30" rx="6" fill="#eaf3f1" opacity=".9"/><rect x="29" y="20" width="8" height="12" fill="#eaf3f1" opacity=".9"/><rect x="24" y="42" width="18" height="16" rx="4" fill="#f2a7b6"/><circle cx="33" cy="15" r="10" fill="#d6416a"/><circle cx="33" cy="15" r="6.6" fill="#e8607f"/><circle cx="33" cy="15" r="3" fill="#b8284f"/><circle cx="12" cy="40" r="6" fill="#e5557a"/><circle cx="12" cy="40" r="3.4" fill="#c63a62"/><path d="M12 46v10" stroke="#58733f" stroke-width="2"/>',
    poppy: '<rect width="64" height="64" fill="#f2e2c4"/><path d="M0 54c16-6 32-6 64 0v10H0z" fill="#9aae6a"/><path d="M32 60V30" stroke="#58733f" stroke-width="2.6"/><path d="M32 46q-10-2-12-10M32 50q10-2 12-10" stroke="#58733f" stroke-width="2" fill="none"/><g transform="translate(32 24)"><ellipse cx="-10" cy="-2" rx="11" ry="9" fill="#d63a2e"/><ellipse cx="10" cy="-2" rx="11" ry="9" fill="#e4483a"/><ellipse cx="-4" cy="-9" rx="9" ry="10" fill="#c92f26"/><ellipse cx="5" cy="5" rx="10" ry="8" fill="#e85a46"/><circle r="5" fill="#2a1a22"/><circle r="9" fill="none" stroke="#2a1a22" stroke-width="1.2" stroke-dasharray="1.4 2.6" opacity=".6"/></g><ellipse cx="12" cy="44" rx="4.4" ry="5.6" fill="#8aa56a"/><path d="M9 39h6" stroke="#58733f" stroke-width="1.4"/>',
    chihal: '<rect width="64" height="64" fill="#f1c68f"/><circle cx="14" cy="14" r="7" fill="#fff0c9" opacity=".9"/><rect y="52" width="64" height="12" fill="#8a674c"/><rect x="5" y="26" width="54" height="26" fill="#b2855c"/><rect x="3" y="22" width="58" height="5" fill="#c99a6d"/><path d="M7 20h4v-4H7zM15 20h4v-4h-4zM23 20h4v-4h-4zM31 20h4v-4h-4zM39 20h4v-4h-4zM47 20h4v-4h-4zM55 20h4v-4h-4z" fill="#a37853"/><path d="M10 52V42a5 5 0 0 1 10 0v10zM25 52V38a6.5 6.5 0 0 1 13 0v14zM43 52V42a5 5 0 0 1 10 0v10z" fill="#5f4535"/><path d="M12 52c8-14 14-20 20-26M52 52c-6-14-12-20-20-26" stroke="#5e7a4c" stroke-width="1.6" fill="none" opacity=".7"/>',
    pillar: '<rect width="64" height="64" fill="#f1d9a8"/><circle cx="50" cy="12" r="7" fill="#fff4d8"/><path d="M0 52c16-6 32-6 64 0v12H0z" fill="#a08056"/><path d="M26 56l2-6h8l2 6z" fill="#c9ad83"/><path d="M29 50l1.4-34h3.2l1.4 34z" fill="#d6bb90"/><rect x="26.5" y="12" width="11" height="4" fill="#d9c093"/><circle cx="32" cy="8" r="4.6" fill="#d9c093"/><path d="M6 60q2-8 4-12M14 60q2-8 4-12M46 60q2-8 4-12M54 60q2-8 4-12" stroke="#8d9a5a" stroke-width="1.6" fill="none"/>',
    cornwallis: '<rect width="64" height="64" fill="#cdd9d8"/><ellipse cx="14" cy="12" rx="12" ry="4" fill="#fff" opacity=".7"/><rect y="52" width="64" height="12" fill="#8ea9a4"/><path d="M0 57h64M0 61h64" stroke="#e3eeea" opacity=".4"/><rect x="8" y="46" width="48" height="6" fill="#d8d3c2"/><rect x="12" y="42" width="40" height="5" fill="#e7e1d0"/><path d="M14 42v-14M22 42v-14M30 42v-14M38 42v-14M46 42v-14M52 42v-14" stroke="#efe9d8" stroke-width="3.4"/><rect x="11" y="24" width="42" height="4" fill="#eae4d2"/><path d="M17 24c0-12 7-18 15-18s15 6 15 18z" fill="#f4efe0"/><rect x="31" y="2" width="2" height="6" fill="#d5cdb8"/>',
    chitnath: '<rect width="64" height="64" fill="#f5c08a"/><circle cx="52" cy="14" r="7" fill="#ffeec4"/><rect y="46" width="64" height="18" fill="#7f9f9e"/><path d="M0 52h64M0 58h64" stroke="#dfeae4" opacity=".35"/><rect x="14" y="36" width="36" height="12" fill="#c69d74"/><rect x="20" y="30" width="24" height="8" fill="#d3ad84"/><path d="M20 30c0-14 6-22 12-28 6 6 12 14 12 28z" fill="#a85442"/><path d="M22 24h20M23 17h18M25 10h14" stroke="#7c3a2d" stroke-width="1.2"/><path d="M28 36v-4a4 4 0 0 1 8 0v4z" fill="#33261f"/><circle cx="32" cy="2" r="2" fill="#ffd27a"/>'
  };
  var ITEMS = [
    { id: 'chhath', kind: 'fest', idx: 0 }, { id: 'kartik', kind: 'fest', idx: 1 }, { id: 'sawan', kind: 'fest', idx: 2 },
    { id: 'birha', kind: 'fest', idx: 3 }, { id: 'gulab', kind: 'fest', idx: 4 }, { id: 'poppy', kind: 'key' },
    { id: 'chihal', kind: 'place', pid: 'chihal-satun' }, { id: 'pillar', kind: 'place', pid: 'lathiya' },
    { id: 'cornwallis', kind: 'place', pid: 'cornwallis' }, { id: 'chitnath', kind: 'place', pid: 'chitnath' }
  ];
  var SIZES = { easy: 4, medium: 6, hard: 10 };
  var COLS = { easy: 4, medium: 4, hard: 5 };

  function itemOf(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return ITEMS[0]; }
  function placeOf(pid) { var a = window.DATA.places; for (var i = 0; i < a.length; i++) if (a[i].id === pid) return a[i]; return null; }
  function itemName(it) {
    if (it.kind === 'fest') return pick(window.DATA.festivals[it.idx].n);
    if (it.kind === 'place') { var p = placeOf(it.pid); return p ? pick(p.n) : it.id; }
    return L('fest.i.poppy');
  }
  function itemTag(it) {
    if (it.kind === 'fest') return pick(window.DATA.festivals[it.idx].w);
    if (it.kind === 'place') { var p = placeOf(it.pid); return p ? pick(p.era) : ''; }
    return L('fest.i.poppyTag');
  }

  var G = { size: store.get('gzp.fest.size') || 'medium', mode: store.get('gzp.fest.mode') || 'twins', tiles: [], first: null, lock: false,
    moves: 0, matched: {}, order: [], streak: 0, topStreak: 0, secs: 0, started: false, won: false, peeks: 1, hints: 3, ticker: 0 };
  if (!SIZES[G.size]) G.size = 'medium';
  if (G.mode !== 'twins' && G.mode !== 'name') G.mode = 'twins';

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function bestKey() { return 'gzp.fest.best2.' + G.mode + '.' + G.size; }
  function best() { return parseInt(store.get(bestKey()) || '0', 10) || 0; }
  function pairs() { return SIZES[G.size]; }
  function fmtTime(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function newDeal() {
    clearInterval(G.ticker);
    var pool = shuffle(ITEMS.slice()).slice(0, pairs()), k = 0, tiles = [];
    pool.forEach(function (it) {
      tiles.push({ id: it.id, k: k++, t: 'pic' });
      tiles.push({ id: it.id, k: k++, t: G.mode === 'name' ? 'name' : 'pic' });
    });
    G.tiles = shuffle(tiles); G.first = null; G.lock = false; G.moves = 0; G.matched = {}; G.order = pool.map(function (x) { return x.id; });
    G.streak = 0; G.topStreak = 0; G.secs = 0; G.started = false; G.won = false; G.peeks = 1; G.hints = 3; G.found = [];
  }

  function seg(name, opts, cur) {
    return '<div class="g2-seg" role="group" data-seg="' + name + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === cur ? 'true' : 'false') + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }

  function tileHtml(t, i) {
    var it = itemOf(t.id), done = !!G.matched[t.id], on = done || G.first === i;
    var face = t.t === 'pic'
      ? '<svg viewBox="0 0 64 64" aria-hidden="true">' + ICONS[t.id] + '</svg>'
      : '<span class="g2-label"><b>' + esc(itemName(it)) + '</b><i>' + esc(itemTag(it)) + '</i></span>';
    return '<button type="button" data-f="' + t.id + '" data-k="' + t.k + '" class="g2-tile' + (on ? ' is-flip' : '') + (done ? ' is-done' : '') + '" data-i="' + i + '" aria-label="' + (on ? esc(itemName(it)) : esc(L('fest.card'))) + '"' + (done ? ' disabled' : '') + '>' +
      '<span class="g2-in"><span class="g2-back"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".5"/>' +
      '<path d="M24 11c4 3 6 8 6 12 0 5-3 8-6 11-3-3-6-6-6-11 0-4 2-9 6-12z" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".7"/><path d="M24 11v23M17 22c3 3 5 5 7 8 2-3 4-5 7-8" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45"/>' +
      '<path d="M10 40h28M13 36h22" stroke="currentColor" stroke-width="1.2" opacity=".35"/></svg></span>' +
      '<span class="g2-face">' + face + '</span></span></button>';
  }

  function foundHtml() {
    if (!G.found.length) return '<li class="g2-empty">' + esc(L('fest.empty')) + '</li>';
    return G.found.map(function (id) {
      var it = itemOf(id);
      return '<li class="g2-card"><svg viewBox="0 0 64 64" aria-hidden="true">' + ICONS[id] + '</svg><span><b>' + esc(itemName(it)) + '</b><i>' + esc(itemTag(it)) + '</i></span></li>';
    }).join('');
  }

  function diyaRow() {
    return G.order.map(function (id) {
      var lit = !!G.matched[id];
      return '<span class="g2-diya' + (lit ? ' is-lit' : '') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15q9 8 18 0z" fill="#8a5232"/><path class="g2-fl" d="M12 13c-4-4-3-8 0-12 3 4 4 8 0 12z" fill="#ffd27a"/></svg></span>';
    }).join('');
  }

  function renderGame() {
    var host = document.getElementById('festGame');
    if (!host) return;
    host.innerHTML =
      '<div class="g2-top"><div><h3>' + esc(L('fest.gameTitle')) + '</h3><p>' + esc(L('fest.gameHint')) + '</p></div>' +
      '<div class="g2-stats"><span><i>' + esc(L('fest.time')) + '</i><b id="g2Time">' + fmtTime(G.secs) + '</b></span>' +
      '<span><i>' + esc(L('fest.movesL')) + '</i><b id="g2Moves">' + G.moves + '</b></span>' +
      '<span><i>' + esc(L('fest.streakL')) + '</i><b id="g2Streak">' + G.streak + '</b></span>' +
      '<span><i>' + esc(L('fest.bestL')) + '</i><b id="g2Best">' + (best() || '–') + '</b></span></div></div>' +
      '<div class="g2-ctl">' +
      seg('size', [['easy', L('fest.easy')], ['medium', L('fest.medium')], ['hard', L('fest.hard')]], G.size) +
      seg('mode', [['twins', L('fest.modeTwins')], ['name', L('fest.modeName')]], G.mode) +
      '<button type="button" class="g2-btn" data-act="peek"' + (G.peeks < 1 || G.won ? ' disabled' : '') + '><svg class="ic"><use href="#i-spark"/></svg><span>' + esc(L('fest.peek')) + '</span></button>' +
      '<button type="button" class="g2-btn" data-act="hint"' + (G.hints < 1 || G.won ? ' disabled' : '') + '><svg class="ic"><use href="#i-pin"/></svg><span>' + esc(L('fest.hint')) + ' <em id="g2Hints">' + G.hints + '</em></span></button>' +
      '<button type="button" class="g2-btn g2-btn-solid" data-act="deal"><svg class="ic"><use href="#i-play"/></svg><span>' + esc(L('fest.restart')) + '</span></button></div>' +
      '<div class="g2-diyas" id="g2Diyas" aria-hidden="true">' + diyaRow() + '</div>' +
      '<div class="g2-main"><div class="g2-grid" id="g2Grid" style="--cols:' + COLS[G.size] + '">' + G.tiles.map(tileHtml).join('') + '</div>' +
      '<aside class="g2-found"><h4>' + esc(L('fest.found')) + '</h4><ul id="g2Found">' + foundHtml() + '</ul></aside></div>' +
      '<div class="g2-win" id="g2Win" hidden></div>';
    if (G.won) showWin(true);
    if (G.started && !G.won) startTicker();
  }

  function stat(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  function startTicker() {
    clearInterval(G.ticker);
    G.ticker = setInterval(function () { if (!G.won) { G.secs++; stat('g2Time', fmtTime(G.secs)); } }, 1000);
  }

  function burst(btn) {
    if (reduced) return;
    var cols = ['#f2a63b', '#e5557a', '#6fa3a8', '#ffd27a', '#8aa56a'], i;
    for (i = 0; i < 10; i++) {
      var s = document.createElement('span');
      s.className = 'g2-burst';
      var a = (i / 10) * 6.283, d = 34 + Math.random() * 26;
      s.style.cssText = '--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d).toFixed(0) + 'px;background:' + cols[i % cols.length];
      btn.appendChild(s);
      setTimeout(function (el) { return function () { el.remove(); }; }(s), 900);
    }
  }

  function flip(i, btn) {
    if (G.lock || G.won || G.first === i || G.matched[G.tiles[i].id]) return;
    if (!G.started) { G.started = true; startTicker(); }
    btn.classList.add('is-flip');
    snd('tick');
    if (G.first === null) { G.first = i; return; }
    G.moves++; stat('g2Moves', G.moves);
    var a = G.tiles[G.first], b = G.tiles[i];
    var grid = document.getElementById('g2Grid');
    var btnA = grid.querySelector('[data-i="' + G.first + '"]');
    G.first = null;
    if (a.id === b.id && a.k !== b.k) {
      G.matched[a.id] = true; G.streak++; G.topStreak = Math.max(G.topStreak, G.streak); stat('g2Streak', G.streak);
      [btnA, btn].forEach(function (x) { x.classList.add('is-done'); x.disabled = true; burst(x); });
      G.found.push(a.id);
      var f = document.getElementById('g2Found');
      if (f) f.innerHTML = foundHtml();
      var d = document.getElementById('g2Diyas');
      if (d) d.innerHTML = diyaRow();
      snd(G.streak >= 3 ? 'bell' : 'coin');
      if (G.streak >= 2 && window.Scene && window.Scene.releaseDiya) window.Scene.releaseDiya(1);
      if (Object.keys(G.matched).length === pairs()) setTimeout(function () { showWin(false); }, 700);
    } else {
      G.streak = 0; stat('g2Streak', 0);
      G.lock = true;
      setTimeout(function () { btnA.classList.remove('is-flip'); btn.classList.remove('is-flip'); G.lock = false; }, 900);
    }
  }

  function stars() {
    var n = pairs();
    return G.moves <= n + 2 ? 3 : G.moves <= Math.ceil(n * 1.7) ? 2 : 1;
  }

  function showWin(quiet) {
    var w = document.getElementById('g2Win');
    if (!w) return;
    if (!quiet) {
      G.won = true; clearInterval(G.ticker);
      var b = best();
      G.newBest = !b || G.moves < b;
      if (G.newBest) store.set(bestKey(), String(G.moves));
      stat('g2Best', best());
      snd('bell');
      if (window.Scene && window.Scene.releaseDiya) window.Scene.releaseDiya(8);
      var peek = document.querySelector('[data-act="peek"]'), hint = document.querySelector('[data-act="hint"]');
      if (peek) peek.disabled = true; if (hint) hint.disabled = true;
    }
    var st = stars(), s = '';
    for (var i = 0; i < 3; i++) s += '<span class="g2-star' + (i < st ? ' is-on' : '') + '" style="animation-delay:' + (i * 0.18) + 's">★</span>';
    var next = G.size === 'easy' ? 'medium' : G.size === 'medium' ? 'hard' : null;
    w.hidden = false;
    w.innerHTML = '<div class="g2-stars">' + s + '</div><div class="g2-wtext"><b>' + esc(tpl(L('fest.win2'), { n: G.moves, t: fmtTime(G.secs) })) + (G.newBest ? ' ' + esc(L('fest.newBest')) : '') + '</b>' +
      (G.topStreak > 1 ? '<span>' + esc(tpl(L('fest.topStreak'), { n: G.topStreak })) + '</span>' : '') + '</div>' +
      '<div class="g2-wact"><button type="button" class="g2-btn g2-btn-solid" data-act="deal"><span>' + esc(L('fest.again')) + '</span></button>' +
      (next ? '<button type="button" class="g2-btn" data-act="up" data-v="' + next + '"><span>' + esc(L('fest.harder')) + '</span></button>' : '') + '</div>';
  }

  function peek() {
    if (G.peeks < 1 || G.lock || G.won) return;
    G.peeks--; G.moves += 3; stat('g2Moves', G.moves);
    if (!G.started) { G.started = true; startTicker(); }
    G.lock = true;
    var grid = document.getElementById('g2Grid'), shown = [];
    Array.prototype.forEach.call(grid.querySelectorAll('.g2-tile'), function (b) { if (!b.classList.contains('is-flip')) { b.classList.add('is-flip', 'is-peek'); shown.push(b); } });
    var pb = document.querySelector('[data-act="peek"]'); if (pb) pb.disabled = true;
    snd('chime');
    setTimeout(function () { shown.forEach(function (b) { b.classList.remove('is-flip', 'is-peek'); }); G.lock = false; }, 1900);
  }

  function hint() {
    if (G.hints < 1 || G.lock || G.won) return;
    var grid = document.getElementById('g2Grid');
    var hide = G.tiles.map(function (t, i) { return { t: t, i: i }; }).filter(function (o) { return !G.matched[o.t.id] && G.first !== o.i; });
    var pick1;
    if (G.first !== null) {
      var f = G.tiles[G.first];
      pick1 = hide.filter(function (o) { return o.t.id === f.id && o.t.k !== f.k; });
    } else {
      var one = hide[Math.floor(Math.random() * hide.length)];
      pick1 = hide.filter(function (o) { return o.t.id === one.t.id; });
    }
    G.hints--; G.moves += 1; stat('g2Moves', G.moves); stat('g2Hints', G.hints);
    pick1.forEach(function (o) { var b = grid.querySelector('[data-i="' + o.i + '"]'); if (b) { b.classList.add('is-hint'); setTimeout(function () { b.classList.remove('is-hint'); }, 1500); } });
    var hb = document.querySelector('[data-act="hint"]'); if (hb && G.hints < 1) hb.disabled = true;
    snd('tick');
  }

  function gameClick(e) {
    var t = e.target.closest('.g2-tile');
    if (t && !t.disabled) { flip(+t.getAttribute('data-i'), t); return; }
    var sg = e.target.closest('.g2-seg button');
    if (sg) {
      var name = sg.parentNode.getAttribute('data-seg'), v = sg.getAttribute('data-v');
      if (name === 'size') { G.size = v; store.set('gzp.fest.size', v); } else { G.mode = v; store.set('gzp.fest.mode', v); }
      newDeal(); renderGame(); snd('tick'); return;
    }
    var a = e.target.closest('[data-act]');
    if (!a || a.disabled) return;
    var act = a.getAttribute('data-act');
    if (act === 'deal') { newDeal(); renderGame(); snd('tick'); }
    else if (act === 'up') { G.size = a.getAttribute('data-v'); store.set('gzp.fest.size', G.size); newDeal(); renderGame(); }
    else if (act === 'peek') peek();
    else if (act === 'hint') hint();
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

  function bindGame() {
    var el = document.getElementById('festGame');
    if (!el || el._bound) return;
    el._bound = true;
    el.addEventListener('click', gameClick);
  }

  window.Festivals = {
    build: function () {
      renderCards();
      songLabels(); songSync();
      bindCards();
      bindGame();
      if (!G.tiles.length) newDeal();
      renderGame();
    }
  };
})();
