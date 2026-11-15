/* ══════════════════════════════════════════════════════════════
   THE PILLAR AT LATIYA — a small two-part game.
   1. Hold the rope and haul the sandstone shaft upright.
   2. Read the writing on it: tap a blank glyph, choose its sound.
   The glyphs are stylised, Brahmi-style marks drawn for this page. The
   words are chosen in the spirit of Ashoka's edicts; this is a game, not
   a transcription of the real inscription.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.getElementById('pillar');
  if (!root) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function tpl(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }

  /* ── the glyphs: five stylised marks, 40 × 40 ─────────────── */
  var GLYPH = {
    da: 'M13 8V32M13 8Q31 8 31 20Q31 32 13 32',
    ya: 'M9 8 20 22 31 8M20 22V34',
    sa: 'M9 12H31M20 12V30M10 31H30',
    ca: 'M20 7V33M7 20H33M20 20m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0',
    na: 'M9 33 20 8 31 33M14 25H26'
  };
  function glyphSvg(id, cls) {
    return '<svg class="' + (cls || 'pg') + '" viewBox="0 0 40 40" aria-hidden="true"><path d="' + GLYPH[id] + '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  var WORDS = [
    { id: 'daya', syl: ['da', 'ya'] },
    { id: 'saca', syl: ['sa', 'ca'] },
    { id: 'dana', syl: ['da', 'na'] }
  ];
  var KNOWN = ['da'];
  var DECOYS = ['ka', 'ma', 'ra', 'ta', 'pa', 'la', 'ya', 'sa', 'ca', 'na', 'da'];

  /* ── state ────────────────────────────────────────────────── */
  var open = false, raf = 0, last = 0, clock = 0;
  var stage = 'raise';            /* raise | decode | done */
  var prog = 0, held = false, heaveT = 0, dust = 0;
  var solved = {};                /* "w-i" -> true */
  var picking = null;             /* "w-i" currently being chosen */
  var built = false;
  var el = {};

  /* ── build ────────────────────────────────────────────────── */
  function build() {
    if (built) return;
    built = true;
    root.innerHTML =
      '<div class="pl-stage" id="plStage">' +
      '  <header class="pl-head">' +
      '    <div><p id="plKicker"></p><h2 id="plTitle"></h2></div>' +
      '    <button class="pl-close" id="plClose" type="button"><svg class="ic"><use href="#i-close"/></svg></button>' +
      '  </header>' +
      '  <svg class="pl-scene" id="plScene" viewBox="0 0 800 460" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '    <defs>' +
      '      <linearGradient id="plSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#31406e"/><stop offset=".55" stop-color="#b9777a"/><stop offset="1" stop-color="#f3c183"/></linearGradient>' +
      '      <linearGradient id="plStone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b79a73"/><stop offset=".4" stop-color="#e2c9a0"/><stop offset=".62" stop-color="#cdb088"/><stop offset="1" stop-color="#8f7556"/></linearGradient>' +
      '      <radialGradient id="plSunG"><stop offset="0" stop-color="#ffe3b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffe3b0" stop-opacity="0"/></radialGradient>' +
      '    </defs>' +
      '    <rect width="800" height="460" fill="url(#plSky)"/>' +
      '    <circle cx="640" cy="250" r="150" fill="url(#plSunG)"/>' +
      '    <circle cx="640" cy="262" r="34" fill="#ffe7bd" opacity=".9"/>' +
      '    <path d="M0 330C90 300 170 322 260 306S420 296 520 316 700 322 800 300V420H0z" fill="#5a4a50" opacity=".75"/>' +
      '    <path d="M0 362C110 340 210 366 330 350S560 340 800 360V460H0z" fill="#3a2f2c"/>' +
      '    <rect y="400" width="800" height="60" fill="#2b221f"/>' +
      '    <path d="M0 400H800" stroke="#6b5646" stroke-width="2"/>' +
      '    <g id="plFrame" stroke="#4a3426" stroke-width="7" stroke-linecap="round" fill="none"><path d="M520 400 560 190M600 400 560 190"/><path d="M533 340H587"/></g>' +
      '    <circle cx="560" cy="188" r="7" fill="#5a4030" stroke="#8a6a52" stroke-width="2"/>' +
      '    <g id="plGang"></g>' +
      '    <path id="plRope" stroke="#c4ad8a" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '    <g id="plPillar" transform="translate(440,400)">' +
      '      <path d="M-15 0 15 0 11 -290-11 -290z" fill="url(#plStone)"/>' +
      '      <path d="M-2 -4 0 -286" stroke="#fff4dc" stroke-width="3" opacity=".25"/>' +
      '      <rect x="-15" y="-300" width="30" height="10" rx="2" fill="#a88a63"/>' +
      '      <path d="M-11 -300C-12 -318-5 -326 0 -336 5 -326 12 -318 11 -300z" fill="#c3a679"/>' +
      '      <g id="plWriting" opacity="0" fill="none" stroke="#6a5238" stroke-width="1.8" stroke-linecap="round">' +
      '        <path d="M-5 -230h10M0 -230v9M-5 -208 0 -197 5 -208M-5 -182h10M-4 -170v8"/>' +
      '        <path d="M-5 -150h10M0 -150v10M-5 -128h10M0 -128v9M-5 -108 0 -98 5 -108"/>' +
      '      </g>' +
      '    </g>' +
      '    <g id="plDust" fill="#d8c3a2" opacity="0"><circle cx="410" cy="396" r="9"/><circle cx="430" cy="390" r="12"/><circle cx="455" cy="394" r="10"/><circle cx="476" cy="397" r="8"/></g>' +
      '  </svg>' +
      '  <div class="pl-heave" id="plHeave" aria-hidden="true"></div>' +
      '  <div class="pl-bar" id="plBar" aria-hidden="true"><i id="plBarFill"></i></div>' +
      '  <p class="pl-tip" id="plTip"></p>' +
      '  <footer class="pl-foot" id="plFoot"></footer>' +
      '</div>';
    ['Stage', 'Kicker', 'Title', 'Close', 'Scene', 'Pillar', 'Rope', 'Gang', 'Writing', 'Dust', 'Heave', 'BarFill', 'Bar', 'Tip', 'Foot'].forEach(function (k) {
      el[k] = root.querySelector('#pl' + k);
    });

    /* the haulers */
    var gang = el.Gang;
    el.pullers = [];
    var cols = ['#d8c9a6', '#8c5a3e', '#41566b', '#c7b48a', '#6d7f5d'];
    for (var i = 0; i < 5; i++) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', 'translate(' + (640 + i * 30) + ',400)');
      g.innerHTML =
        '<ellipse cx="0" cy="1" rx="11" ry="3" fill="#000" opacity=".3"/>' +
        '<g class="pl-pull"><path d="M-5 -14H5L4 -34Q0 -36-4 -34z" fill="' + cols[i] + '"/>' +
        '<path d="M-4 -14-8 0M4 -14 8 0" stroke="#2b211b" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="0" cy="-41" r="5.2" fill="#a56d47"/><ellipse cx="-.4" cy="-45" rx="6" ry="3.3" fill="#e9dcc0"/>' +
        '<path d="M-2 -30-16 -34" stroke="' + cols[i] + '" stroke-width="3" stroke-linecap="round"/></g>';
      gang.appendChild(g);
      el.pullers.push(g.querySelector('.pl-pull'));
    }

    el.Close.addEventListener('click', close);
    root.addEventListener('pointerdown', function (e) {
      if (stage !== 'raise') return;
      if (e.target.closest('#plClose')) return;
      held = true;
    });
    window.addEventListener('pointerup', function () { held = false; });
    window.addEventListener('pointercancel', function () { held = false; });
    window.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === ' ' && stage === 'raise') { held = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', function (e) { if (open && e.key === ' ') held = false; });
  }

  /* a narrow screen crops to the pillar and the haulers so the scene stays readable */
  function fit() {
    if (!built) return;
    var narrow = el.Stage.clientWidth < 640;
    el.Scene.setAttribute('viewBox', narrow ? '110 30 660 430' : '0 0 800 460');
  }
  window.addEventListener('resize', fit);

  /* ── text ─────────────────────────────────────────────────── */
  function texts() {
    if (!built) return;
    el.Kicker.textContent = L('pillar.kicker');
    el.Title.textContent = L('pillar.title');
    el.Close.setAttribute('aria-label', L('pillar.close'));
    el.Heave.textContent = L('pillar.heave');
    if (stage === 'raise') el.Tip.textContent = L('pillar.raiseTip');
    renderFoot();
  }

  function total() { var n = 0; WORDS.forEach(function (w) { n += w.syl.length; }); return n; }
  function readCount() {
    var n = 0;
    WORDS.forEach(function (w, wi) { w.syl.forEach(function (s, i) { if (KNOWN.indexOf(s) >= 0 || solved[wi + '-' + i]) n++; }); });
    return n;
  }

  function renderFoot() {
    if (stage === 'raise') {
      el.Foot.innerHTML = '<button class="pl-hold" id="plHold" type="button"><svg class="ic"><use href="#i-arrow"/></svg><span>' + L('pillar.raise') + '</span></button>';
      var b = el.Foot.querySelector('#plHold');
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); held = true; });
      return;
    }
    if (stage === 'done') {
      el.Foot.innerHTML =
        '<div class="pl-done"><h3>' + L('pillar.doneTitle') + '</h3><p>' + L('pillar.doneBody') + '</p>' +
        '<p class="pl-note">' + L('pillar.note') + '</p>' +
        '<div class="pl-actions"><button class="pl-btn pl-btn-solid" id="plAgain" type="button">' + L('pillar.again') + '</button>' +
        '<button class="pl-btn" id="plQuit" type="button">' + L('pillar.quit') + '</button></div></div>';
      el.Foot.querySelector('#plAgain').addEventListener('click', reset);
      el.Foot.querySelector('#plQuit').addEventListener('click', close);
      return;
    }
    /* decode */
    var h = '<div class="pl-key"><span>' + L('pillar.key') + '</span>';
    KNOWN.forEach(function (s) { h += '<b>' + glyphSvg(s, 'pg pg-sm') + '<em>' + s + '</em></b>'; });
    h += '</div><div class="pl-words">';
    WORDS.forEach(function (w, wi) {
      var complete = w.syl.every(function (s, i) { return KNOWN.indexOf(s) >= 0 || solved[wi + '-' + i]; });
      h += '<div class="pl-word' + (complete ? ' is-done' : '') + '"><div class="pl-tiles">';
      w.syl.forEach(function (s, i) {
        var key = wi + '-' + i, known = KNOWN.indexOf(s) >= 0 || solved[key];
        h += '<button type="button" class="pl-tile' + (known ? ' is-known' : '') + (picking === key ? ' is-picking' : '') + '" data-key="' + key + '"' + (known ? ' disabled' : '') + '>' +
          glyphSvg(s) + '<em>' + (known ? s : '?') + '</em></button>';
      });
      h += '</div><p class="pl-mean">' + (complete ? '<b>' + w.syl.join('·') + '</b> — ' + L('pillar.w.' + w.id) : L('pillar.hint.' + w.id)) + '</p></div>';
    });
    h += '</div>';
    h += '<div class="pl-pick" id="plPick">' + (picking ? pickHtml() : '<p>' + L('pillar.decodeTip') + '</p>') + '</div>';
    h += '<p class="pl-count">' + tpl(L('pillar.progress'), { n: readCount(), t: total() }) + '</p>';
    el.Foot.innerHTML = h;
    Array.prototype.forEach.call(el.Foot.querySelectorAll('.pl-tile'), function (b) {
      b.addEventListener('click', function () { picking = b.getAttribute('data-key'); snd('tick'); renderFoot(); });
    });
    Array.prototype.forEach.call(el.Foot.querySelectorAll('.pl-opt'), function (b) {
      b.addEventListener('click', function () { choose(b.getAttribute('data-s'), b); });
    });
  }

  var opts = {};
  function pickHtml() {
    var parts = picking.split('-'), w = WORDS[+parts[0]], right = w.syl[+parts[1]];
    if (!opts[picking]) {
      var pool = DECOYS.filter(function (x) { return x !== right; });
      var list = [right];
      while (list.length < 4) { var c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; list.push(c); }
      list.sort(function () { return Math.random() - 0.5; });
      opts[picking] = list;
    }
    return '<p>' + L('pillar.pick') + '</p><div class="pl-opts">' + opts[picking].map(function (s) {
      return '<button type="button" class="pl-opt" data-s="' + s + '">' + s + '</button>';
    }).join('') + '</div>';
  }

  function choose(s, btn) {
    var parts = picking.split('-'), w = WORDS[+parts[0]], right = w.syl[+parts[1]];
    if (s === right) {
      solved[picking] = true; picking = null; snd('coin');
      if (readCount() >= total()) { stage = 'done'; setTimeout(function () { snd('bell'); }, 250); }
      renderFoot();
    } else {
      snd('thud');
      btn.classList.add('is-wrong');
      btn.disabled = true;
      var pk = el.Foot.querySelector('#plPick');
      if (pk && !pk.querySelector('.pl-wrong')) pk.insertAdjacentHTML('beforeend', '<p class="pl-wrong">' + L('pillar.wrong') + '</p>');
    }
  }

  /* ── the loop ─────────────────────────────────────────────── */
  function frame(now) {
    if (!open) return;
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;

    if (stage === 'raise') {
      if (held) {
        prog = Math.min(1, prog + dt * 0.2);
        heaveT -= dt;
        if (heaveT <= 0) { heaveT = 0.46; snd('clack'); el.Heave.classList.remove('is-on'); void el.Heave.offsetWidth; el.Heave.classList.add('is-on'); }
      } else {
        prog = Math.max(0, prog - dt * 0.07);
      }
      if (prog >= 1) {
        stage = 'decode'; held = false; dust = 1; snd('thud');
        el.Tip.textContent = L('pillar.stands');
        el.Heave.classList.remove('is-on');
        renderFoot();
        setTimeout(function () { if (open && stage === 'decode') el.Tip.style.opacity = '0'; }, 3200);
      }
    }
    var p = stage === 'raise' ? prog : 1;
    var deg = -90 * (1 - ease(p));
    var rad = deg * Math.PI / 180;
    var topX = 440 + Math.sin(rad) * 336, topY = 400 - Math.cos(rad) * 336;
    el.Pillar.setAttribute('transform', 'translate(440,400) rotate(' + deg.toFixed(2) + ')');
    var holdX = 440 + Math.sin(rad) * 300, holdY = 400 - Math.cos(rad) * 300;
    var pull = stage === 'raise' ? (held ? 1 : 0) : 0;
    var endX = 640 - pull * 8, endY = 366;
    el.Rope.setAttribute('d', 'M' + holdX.toFixed(1) + ' ' + holdY.toFixed(1) + ' L560 188 L' + endX + ' ' + endY);
    el.Writing.setAttribute('opacity', (stage === 'raise' ? Math.max(0, (prog - 0.9) * 10) : 1).toFixed(2));
    for (var i = 0; i < el.pullers.length; i++) {
      var lean = pull ? 14 + Math.sin(clock * 7 + i * 0.7) * 5 : 4 + Math.sin(clock * 1.5 + i) * 1.2;
      el.pullers[i].setAttribute('transform', 'rotate(' + lean.toFixed(1) + ' 0 0)');
    }
    if (dust > 0) {
      dust = Math.max(0, dust - dt * 0.9);
      el.Dust.setAttribute('opacity', (dust * 0.7).toFixed(2));
      el.Dust.setAttribute('transform', 'translate(0,' + ((1 - dust) * -14).toFixed(1) + ')');
    }
    el.BarFill.style.width = (p * 100).toFixed(1) + '%';
    el.Bar.style.opacity = stage === 'raise' ? '1' : '0';
    raf = requestAnimationFrame(frame);
  }

  /* ── open / close / reset ─────────────────────────────────── */
  function reset() {
    stage = 'raise'; prog = 0; held = false; heaveT = 0; dust = 0; solved = {}; picking = null; opts = {};
    el.Tip.style.opacity = '1';
    el.Tip.textContent = L('pillar.raiseTip');
    el.Dust.setAttribute('opacity', '0');
    renderFoot();
  }

  function openGame() {
    if (open) return;
    build();
    open = true;
    root.hidden = false;
    document.body.classList.add('pillar-open');
    if (window.Scene && window.Scene.pause) window.Scene.pause();
    texts();
    reset();
    fit();
    last = 0;
    if (reduced) { prog = 1; }
    raf = requestAnimationFrame(frame);
    setTimeout(function () { try { el.Close.focus(); } catch (e) {} }, 80);
    snd('tick');
  }

  function close() {
    if (!open) return;
    open = false;
    held = false;
    cancelAnimationFrame(raf);
    root.hidden = true;
    document.body.classList.remove('pillar-open');
    if (window.Scene && window.Scene.resume) window.Scene.resume();
  }

  window.Pillar = {
    open: openGame,
    close: close,
    refresh: function () { if (built) texts(); },
    isOpen: function () { return open; }
  };
})();
