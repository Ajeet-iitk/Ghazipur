/* The Lanka Maidan card: opens, then loads the arrow game in a frame, once. */
(function () {
  'use strict';
  var card = document.getElementById('lankaNook'), head = document.getElementById('lkHead'), frame = document.getElementById('lkFrame');
  if (!card || !head || !frame) return;
  var URL = 'https://ajeet-iitk.github.io/Raavan1/ram-arrow-game.html', loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    var f = document.createElement('iframe');
    f.src = URL; f.title = 'Lanka Maidan: the arrow game'; f.allow = 'fullscreen; autoplay'; f.allowFullscreen = true; f.loading = 'lazy';
    f.addEventListener('load', function () { frame.classList.add('is-ready'); });
    frame.appendChild(f);
  }
  head.addEventListener('click', function () {
    var open = !card.classList.contains('is-open');
    card.classList.toggle('is-open', open);
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { load(); if (window.Ambient && window.Ambient.templeBell) window.Ambient.templeBell(1); }
  });
  var full = document.getElementById('lkFull');
  if (full) full.addEventListener('click', function () {
    var f = frame.querySelector('iframe'); if (!f) { load(); f = frame.querySelector('iframe'); }
    try { (f.requestFullscreen || f.webkitRequestFullscreen).call(f); } catch (e) { window.open(URL, '_blank', 'noopener'); }
  });
  window.Lanka = { open: function () { if (!card.classList.contains('is-open')) head.click(); } };
})();
