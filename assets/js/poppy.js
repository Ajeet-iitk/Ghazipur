/* From seed to opium: a small animated storyboard of the licensed poppy crop —
   sowing, bloom, pods, scoring and collecting the latex, and the gum going to
   the Government Opium Works. Illustrative; drawn for this page. */
(function () {
  'use strict';
  var host = document.getElementById('poppyCult');
  if (!host) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = null, visible = false, user = false;
  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) { var d = window.I18N && (window.I18N[lang()] || window.I18N.en); return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k; }

  function plant(x, y, h, stage, i) {
    var s = '<g transform="translate(' + x + ',' + y + ')"><g class="pc-plant" style="animation-delay:-' + (i * 0.5) + 's">';
    s += '<path d="M0 0Q' + (i % 2 ? 2 : -2) + ' ' + (-h * 0.5) + ' 0 ' + (-h) + '" stroke="#6f9a58" stroke-width="2" fill="none"/>';
    s += '<path d="M0 ' + (-h * 0.3) + 'q-9 -4 -12 -10q8 0 12 10zM0 ' + (-h * 0.5) + 'q9 -4 12 -10q-8 0 -12 10z" fill="#8fb36e"/>';
    if (stage === 1) s += '<g transform="translate(0,' + (-h - 3) + ')"><g class="pc-bloom"><circle r="7" fill="' + (i % 2 ? '#e8e2f0' : '#d94a5a') + '"/><circle r="4.4" fill="' + (i % 2 ? '#fff' : '#ef6f7c') + '"/><circle r="1.8" fill="#2a1a22"/></g></g>';
    if (stage >= 2) s += '<g transform="translate(0,' + (-h - 4) + ')"><ellipse rx="5.6" ry="6.6" fill="#9ab870"/><path d="M-4 -5.6h8" stroke="#6f8f50" stroke-width="1.4"/>' + (stage === 2 ? '<g class="pc-petal"><ellipse cx="9" cy="6" rx="3.6" ry="2" fill="#d94a5a"/></g>' : '') + '</g>';
    return s + '</g></g>';
  }
  function farmer(x, y, col, pose) {
    return '<g transform="translate(' + x + ',' + y + ')"><g class="pc-farmer ' + pose + '"><ellipse cy="2" rx="9" ry="2.4" fill="#000" opacity=".25"/>' +
      '<path d="M-5 0L-4 -16L4 -16L5 0Z" fill="#e8e0cc"/><path d="M-5 -16Q0 -26 5 -16L4 -24H-4Z" fill="' + col + '"/>' +
      '<circle cy="-29" r="5" fill="#a56d47"/><ellipse cy="-33" rx="6.4" ry="3" fill="#e9dcc0"/>' +
      '<g class="pc-arm"><path d="M3 -22L14 -14" stroke="#a56d47" stroke-width="3" stroke-linecap="round"/></g></g></g>';
  }
  function scene(n) {
    var g = '<rect width="320" height="180" fill="' + ['#f6dcc0', '#cfe3ee', '#eadfc4', '#f3d7ae', '#d9c6a8'][n] + '"/>';
    g += '<circle cx="268" cy="34" r="16" fill="#fff2c8" opacity=".9"/>';
    g += '<rect y="128" width="320" height="52" fill="#9a7048"/><path d="M0 128q80-8 160-2t160-2v6H0z" fill="#b08556"/>';
    for (var r = 0; r < 5; r++) g += '<path d="M' + (-10 + r * 4) + ' ' + (140 + r * 8) + 'H330" stroke="#7a5230" stroke-width="2" opacity=".5"/>';
    var i;
    if (n === 0) {
      g += farmer(70, 128, '#c0504a', 'sow');
      for (i = 0; i < 14; i++) g += '<circle class="pc-seed" style="animation-delay:-' + (i * 0.2).toFixed(1) + 's" cx="' + (92 + (i * 17) % 190) + '" cy="120" r="1.5" fill="#2a1a22"/>';
    } else if (n === 1) {
      for (i = 0; i < 9; i++) g += plant(34 + i * 32, 138 + (i % 2) * 6, 44 + (i * 7) % 16, 1, i);
    } else if (n === 2) {
      for (i = 0; i < 9; i++) g += plant(34 + i * 32, 138 + (i % 2) * 6, 44 + (i * 7) % 16, 2, i);
    } else if (n === 3) {
      for (i = 0; i < 6; i++) g += plant(150 + i * 28, 138 + (i % 2) * 6, 46 + (i * 7) % 12, 3, i);
      g += farmer(60, 132, '#3f6f8f', 'score') + farmer(112, 142, '#d8a43a', 'score');
      for (i = 0; i < 6; i++) g += '<circle class="pc-latex" style="animation-delay:-' + (i * 0.5) + 's" cx="' + (146 + i * 28) + '" cy="' + (88 + (i % 2) * 3) + '" r="2.2" fill="#f6f1e2"/>';
    } else {
      g += '<g class="pc-cart"><rect x="30" y="100" width="64" height="22" rx="3" fill="#7a5a3a"/><circle cx="44" cy="126" r="7" fill="#3a2a22"/><circle cx="82" cy="126" r="7" fill="#3a2a22"/>';
      for (i = 0; i < 5; i++) g += '<circle cx="' + (42 + i * 11) + '" cy="97" r="7" fill="#3a2418"/><circle cx="' + (40 + i * 11) + '" cy="95" r="2" fill="#6a4a30" opacity=".6"/>';
      g += '</g>';
      g += '<rect x="196" y="70" width="96" height="58" fill="#8a3a2a"/><path d="M190 70l54-24 54 24z" fill="#5a2a22"/><rect x="224" y="98" width="20" height="30" fill="#2a1a16"/><rect x="262" y="40" width="10" height="34" fill="#6a2f24"/>';
      g += '<circle class="pc-smoke" cx="267" cy="36" r="5" fill="#ddd" opacity=".5"/>' + farmer(168, 130, '#c0504a', 'walk');
      g += '<path d="M100 112H190" stroke="#e8c27a" stroke-width="2" stroke-dasharray="5 6" class="pc-trail"/>';
    }
    return g;
  }

  function build() {
    host.innerHTML = '<div class="pc-head"><i></i><b></b></div><div class="pc-stage"></div><p class="pc-cap" aria-live="polite"></p><div class="pc-dots" role="tablist"></div><p class="pc-note"></p>';
    var st = host.querySelector('.pc-stage');
    for (var n = 0; n < 5; n++) { var d = document.createElementNS(NS, 'svg'); d.setAttribute('viewBox', '0 0 320 180'); d.setAttribute('class', 'pc-sc'); d.setAttribute('aria-hidden', 'true'); d.innerHTML = scene(n); st.appendChild(d); }
    var dots = host.querySelector('.pc-dots');
    for (var k = 0; k < 5; k++) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-i', k); dots.appendChild(b); }
    dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { user = true; show(+b.getAttribute('data-i')); } });
    host.addEventListener('pointerenter', function () { user = true; });
    show(cur); labels();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .2 }).observe(host); else visible = true;
    if (!reduced) timer = setInterval(function () { if (visible && !user) show((cur + 1) % 5); }, 4200);
  }
  function show(i) {
    cur = i;
    Array.prototype.forEach.call(host.querySelectorAll('.pc-sc'), function (s, n) { s.classList.toggle('is-on', n === i); });
    Array.prototype.forEach.call(host.querySelectorAll('.pc-dots button'), function (b, n) { b.classList.toggle('is-on', n === i); b.setAttribute('aria-label', L('poppyc.s' + n)); });
    host.querySelector('.pc-cap').innerHTML = '<b>' + L('poppyc.s' + i) + '</b> <em>' + L('poppyc.m' + i) + '</em><span>' + L('poppyc.d' + i) + '</span>';
  }
  function labels() {
    host.querySelector('.pc-head i').textContent = L('poppyc.kicker'); host.querySelector('.pc-head b').textContent = L('poppyc.title');
    host.querySelector('.pc-note').textContent = L('poppyc.note'); show(cur);
  }
  window.PoppyCult = { build: function () { host.innerHTML ? labels() : build(); } };
  window.PoppyCult.build();
})();
