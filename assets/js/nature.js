/* ══════════════════════════════════════════════════════════════
   GHAZIPUR — weather and wildlife controls.
   The season switch (summer / clear / monsoon) and the field journal.
   The drawing itself lives in scene.js; the sound in audio.js.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var box = document.getElementById('season');
  var journal = document.getElementById('journal');
  if (!box && !journal) return;

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var SPECIES = ['dolphin', 'geese', 'ducks'];
  var seen = [];
  try { seen = JSON.parse(store.get('gzp.spotted') || '[]').filter(function (x) { return SPECIES.indexOf(x) >= 0; }); } catch (e) { seen = []; }
  var season = store.get('gzp.season');
  if (['summer', 'normal', 'monsoon'].indexOf(season) < 0) season = 'normal';
  var armed = false;   /* browsers only allow sound after a gesture */

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || '';
  }
  function tpl(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }

  var toastEl = document.getElementById('toast'), toastTimer = null;
  function toast(msg) {
    if (!toastEl || !msg) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3400);
  }

  /* ── season ───────────────────────────────────────────────── */
  function applyAudio() {
    if (!armed || !window.Ambient || !window.Ambient.setRain) return;
    window.Ambient.setRain(season === 'monsoon' ? 1 : 0);
  }

  function setSeason(name, announce) {
    season = name;
    store.set('gzp.season', name);
    if (window.Scene && window.Scene.setSeason) window.Scene.setSeason(name);
    if (box) {
      Array.prototype.forEach.call(box.querySelectorAll('[data-season]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-season') === name ? 'true' : 'false');
      });
    }
    document.documentElement.setAttribute('data-season', name);
    applyAudio();
    if (announce) toast(L('season.on.' + name));
  }

  if (box) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-season]');
      if (!b) return;
      armed = true;
      setSeason(b.getAttribute('data-season'), true);
    });
  }
  function arm() {
    if (armed) return;
    armed = true;
    applyAudio();
  }
  window.addEventListener('pointerdown', arm, { once: true, passive: true });
  window.addEventListener('keydown', arm, { once: true });

  /* ── field journal ────────────────────────────────────────── */
  var listEl = document.getElementById('journalList');
  var countEl = document.getElementById('journalCount');

  function renderJournal() {
    if (countEl) countEl.textContent = seen.length + '/' + SPECIES.length;
    if (!listEl) return;
    listEl.innerHTML = SPECIES.map(function (id) {
      var on = seen.indexOf(id) >= 0;
      return '<li class="spot-pill' + (on ? ' is-on' : '') + '">' + (on ? L('spot.' + id) : '?') + '</li>';
    }).join('');
  }

  document.addEventListener('gzp:spot', function (e) {
    var id = e.detail && e.detail.id;
    if (SPECIES.indexOf(id) < 0) return;
    if (seen.indexOf(id) < 0) {
      seen.push(id);
      store.set('gzp.spotted', JSON.stringify(seen));
      renderJournal();
      toast(seen.length === SPECIES.length ? L('spot.all') : tpl(L('spot.found'), { name: L('spot.' + id) }));
    } else {
      toast(tpl(L('spot.again'), { name: L('spot.' + id) }));
    }
  });

  /* ask the river to show something you have not logged yet */
  function callWild() {
    var unseen = SPECIES.filter(function (id) { return seen.indexOf(id) < 0; });
    var pool = unseen.length ? unseen : SPECIES;
    var id = pool[Math.floor(Math.random() * pool.length)];
    if (window.Scene && window.Scene.callWild) window.Scene.callWild(id);
    toast(L('spot.call'));
  }
  if (journal) journal.addEventListener('click', function () { armed = true; callWild(); });

  setSeason(season, false);
  renderJournal();

  window.Nature = {
    setSeason: function (n) { setSeason(n, true); },
    call: callWild,
    refresh: function () { renderJournal(); }
  };
})();
