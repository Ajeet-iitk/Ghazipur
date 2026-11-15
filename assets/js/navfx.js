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

  /* ── scroll: progress and chapter ─────────────────────────── */
  var ticking = false, lastActive = null;
  function frame() {
    ticking = false;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, window.scrollY / max));
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

  frame();
  setTimeout(function () { rest(true); }, 400);
})();
