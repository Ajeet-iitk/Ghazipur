/* ══════════════════════════════════════════════════════════════
   THE NAVBAR, ON THE WATER.
   - A little boat sails along the bottom of the header as you read:
     its wake is your scroll progress.
   - A wave glides under the links to follow the pointer, and rests under
     the chapter you are in.
   - The brand diya flickers, and wakes up when you point at it.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var head = document.getElementById('siteHead');
  var nav = document.getElementById('siteNav');
  if (!head || !nav) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── the river along the header ───────────────────────────── */
  var river = document.createElement('div');
  river.className = 'head-river';
  river.setAttribute('aria-hidden', 'true');
  river.innerHTML =
    '<i class="hr-fill"></i>' +
    '<span class="hr-boat"><svg viewBox="0 0 30 22"><path class="hr-wake" d="M-14 17q4-3 8 0t8 0t8 0"/>' +
    '<path d="M3 15q12 7 24 0l-3-3H6z" fill="currentColor"/><path d="M15 12V2l8 9z" class="hr-sail"/><path d="M15 12V4l-5 8z" class="hr-sail2"/></svg></span>';
  head.appendChild(river);
  var boat = river.querySelector('.hr-boat');

  /* ── the wave under the links ─────────────────────────────── */
  var wave = document.createElement('span');
  wave.className = 'nav-wave';
  wave.setAttribute('aria-hidden', 'true');
  wave.innerHTML = '<svg viewBox="0 0 60 10" preserveAspectRatio="none"><path d="M0 5q7.5-7 15 0t15 0t15 0t15 0t15 0t15 0t15 0t15 0"/></svg>';
  nav.appendChild(wave);

  var hovering = false;
  function desktop() { return window.innerWidth > 900; }

  function place(a, instant) {
    if (!a || !desktop()) { wave.classList.remove('is-on'); return; }
    if (instant) wave.classList.add('no-ease');
    wave.style.setProperty('--wx', a.offsetLeft + 'px');
    wave.style.setProperty('--ww', a.offsetWidth + 'px');
    wave.classList.add('is-on');
    if (instant) { void wave.offsetWidth; wave.classList.remove('no-ease'); }
  }
  function rest(instant) {
    var act = nav.querySelector('a.is-active');
    if (act) place(act, instant); else wave.classList.remove('is-on');
  }

  nav.addEventListener('pointerover', function (e) {
    var a = e.target.closest('a');
    if (!a || e.pointerType === 'touch') return;
    hovering = true; place(a, false);
  });
  nav.addEventListener('pointerleave', function () { hovering = false; rest(false); });
  nav.addEventListener('focusin', function (e) { var a = e.target.closest('a'); if (a) place(a, false); });
  nav.addEventListener('focusout', function () { setTimeout(function () { if (!nav.contains(document.activeElement)) rest(false); }, 0); });

  /* ── hiding on scroll: it slides away going down, and returns going up, at the top, or at the pointer ── */
  var lastY = window.scrollY, hidden = false;
  function setHeight() { head.style.setProperty('--hh', head.offsetHeight + 'px'); }
  setHeight();
  window.addEventListener('resize', setHeight);
  function hide(on) {
    if (on === hidden) return;
    if (on && (document.body.classList.contains('nav-open') || head.matches(':focus-within'))) return;
    hidden = on; head.classList.toggle('is-hidden', on);
  }
  window.addEventListener('pointermove', function (e) { if (hidden && e.pointerType === 'mouse' && e.clientY < 36) hide(false); }, { passive: true });
  head.addEventListener('focusin', function () { hide(false); });

  /* ── scroll: progress and chapter ─────────────────────────── */
  var ticking = false, lastActive = null;
  function frame() {
    ticking = false;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, window.scrollY / max));
    var y = window.scrollY, dy = y - lastY;
    if (y < 90) hide(false);
    else if (dy > 6) hide(true);
    else if (dy < -6) hide(false);
    if (Math.abs(dy) > 6) lastY = y;
    head.style.setProperty('--hp', (p * 100).toFixed(2) + '%');
    boat.style.left = (p * 100).toFixed(2) + '%';
    var act = nav.querySelector('a.is-active');
    var key = act ? act.getAttribute('href') : '';
    if (key !== lastActive) { lastActive = key; if (!hovering) rest(false); }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { onScroll(); rest(true); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (!hovering) rest(true); }).observe(nav);
  /* the language switch changes link widths */
  document.addEventListener('click', function (e) { if (e.target.closest('.lang button')) setTimeout(function () { rest(true); }, 60); });

  /* a pulse of ripples when the boat is clicked */
  river.style.pointerEvents = 'none';

  /* the brand diya wakes when pointed at */
  var brand = head.querySelector('.brand');
  if (brand && !reduced) {
    brand.addEventListener('pointerenter', function () { brand.classList.add('is-awake'); });
    brand.addEventListener('pointerleave', function () { brand.classList.remove('is-awake'); });
  }

  /* the Google map loads when it nears the screen, and only once */
  var msMap = document.getElementById('msMap');
  function loadMap() {
    if (!msMap || msMap.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=Ghazipur%2C%20Uttar%20Pradesh&z=11&output=embed';
    f.title = 'Map of Ghazipur, Uttar Pradesh';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    msMap.appendChild(f); msMap.classList.add('is-loaded');
  }
  if (msMap) {
    var btn = document.getElementById('msLoad');
    if (btn) btn.addEventListener('click', loadMap);
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: '300px' });
      mo.observe(msMap);
    }
  }

  /* ══ the eye: fade the page away and just watch the view ══ */
  var viewBtn = document.getElementById('viewBtn'), viewBar = document.getElementById('viewBar'), viewHint = document.getElementById('viewHint');
  var viewing = false, drift = true, driftT0 = 0, driftTimer = null, hintTimer = null, lockTimer = null;
  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function T(k) { var d = window.I18N && (window.I18N[lang()] || window.I18N.en); return (d && d[k]) || (window.I18N && window.I18N.en[k]) || ''; }
  function labelEye() { if (viewBtn) viewBtn.setAttribute('aria-label', T(viewing ? 'view.exit' : 'view.enter')); }
  labelEye();
  function setSky(t) { if (window.Scene && window.Scene.setTime) window.Scene.setTime(t); }
  function startDrift() {
    clearInterval(driftTimer);
    if (reduced) return;
    driftT0 = performance.now() - 6000;            /* begins in the lit part of the day */
    driftTimer = setInterval(function () {
      var p = ((performance.now() - driftT0) / 110000) % 1;            /* one slow day every ~110 seconds */
      setSky(0.17 + (0.99 - 0.17) * (0.5 - 0.5 * Math.cos(p * Math.PI * 2)));
    }, 250);
  }
  function syncSeasons() {
    if (!viewBar || !window.Scene || !window.Scene.getSeason) return;
    var cur = window.Scene.getSeason();
    Array.prototype.forEach.call(viewBar.querySelectorAll('[data-vs]'), function (b) {
      var on = b.getAttribute('data-vs') === cur; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function enterView() {
    if (viewing) return;
    viewing = true;
    document.body.classList.add('view-mode');
    viewBtn.setAttribute('aria-pressed', 'true'); labelEye();
    if (viewBar) viewBar.hidden = false;
    foldBar(false);
    hide(false);
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    clearTimeout(lockTimer);
    lockTimer = setTimeout(function () { if (viewing) document.documentElement.classList.add('view-lock'); }, reduced ? 50 : 900);
    drift = true;
    if (viewBar) Array.prototype.forEach.call(viewBar.querySelectorAll('[data-vt]'), function (b) { b.classList.toggle('is-on', b.getAttribute('data-vt') === 'auto'); });
    startDrift();
    syncSeasons();
    if (viewHint) { viewHint.classList.add('is-on'); clearTimeout(hintTimer); hintTimer = setTimeout(function () { viewHint.classList.remove('is-on'); }, 5000); }
    if (window.Ambient && window.Ambient.chime) window.Ambient.chime();
  }
  function exitView() {
    if (!viewing) return;
    viewing = false;
    clearInterval(driftTimer); clearTimeout(lockTimer);
    document.body.classList.remove('view-mode');
    document.documentElement.classList.remove('view-lock');
    viewBtn.setAttribute('aria-pressed', 'false'); labelEye();
    if (viewBar) viewBar.hidden = true;
    window.dispatchEvent(new Event('scroll'));       /* the page takes the sky back */
  }
  if (viewBtn) viewBtn.addEventListener('click', function () { viewing ? exitView() : enterView(); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && viewing) exitView(); });
  /* on a phone the pills hide behind one small button, so they never cover the view */
  var moreT = null;
  function foldBar(open) {
    if (!viewBar) return;
    viewBar.classList.toggle('is-open', open);
    var mb = document.getElementById('viewMore'); if (mb) mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    clearTimeout(moreT);
    if (open) moreT = setTimeout(function () { foldBar(false); }, 7000);
  }
  var he = document.getElementById('heroEye');
  if (he) he.addEventListener('click', function () { if (viewBtn) viewBtn.click(); });
  var vd = document.getElementById('viewDiya');
  if (vd) vd.addEventListener('click', function (e) {
    e.stopPropagation();
    if (window.Scene && window.Scene.releaseDiya) window.Scene.releaseDiya(6);
    if (window.Ambient && window.Ambient.plop) window.Ambient.plop();
    vd.classList.remove('is-pop'); void vd.offsetWidth; vd.classList.add('is-pop');
  });
  var vm = document.getElementById('viewMore');
  if (vm) vm.addEventListener('click', function () { foldBar(!viewBar.classList.contains('is-open')); });
  if (viewBar) viewBar.addEventListener('click', function () { if (viewBar.classList.contains('is-open')) foldBar(true); });
  if (viewBar) viewBar.addEventListener('click', function (e) {
    var sb = e.target.closest('[data-vs]');
    if (sb) { if (window.Nature && window.Nature.setSeason) window.Nature.setSeason(sb.getAttribute('data-vs')); else if (window.Scene) window.Scene.setSeason(sb.getAttribute('data-vs')); syncSeasons(); return; }
    var b = e.target.closest('[data-vt]'); if (!b) return;
    Array.prototype.forEach.call(viewBar.querySelectorAll('[data-vt]'), function (x) { x.classList.toggle('is-on', x === b); });
    var v = b.getAttribute('data-vt');
    if (v === 'auto') { drift = true; startDrift(); }
    else { drift = false; clearInterval(driftTimer); setSky(parseFloat(v)); }
  });
  document.addEventListener('click', function (e) { if (e.target.closest('.lang button')) setTimeout(labelEye, 80); });

  frame();
  setTimeout(function () { rest(true); }, 400);
})();
