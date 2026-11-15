/* ══════════════════════════════════════════════════════════════
   THE KITCHEN CORNER — a second easter egg in the Living chapter.
   Three small kitchens: a woman roasting litti on cow-dung-cake embers,
   a man mashing chokha, and a halwai frying launglata. Tap to cook along.
   Illustrations of dishes loved across the Bhojpuri belt, drawn for this
   page; they are not portraits of any real kitchen.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var host = document.getElementById('kitchenNook');
  if (!host) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lang() { return document.documentElement.getAttribute('data-lang') || 'en'; }
  function L(k) {
    var d = window.I18N && (window.I18N[lang()] || window.I18N.en);
    return (d && d[k]) || (window.I18N && window.I18N.en[k]) || k;
  }
  function tpl(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function snd(n, a) { var A = window.Ambient; if (A && A[n]) A[n](a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixc(a, b, t) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], t)); }).join(',') + ')'; }
  function el(name, attrs, parent) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function svgPt(svg, e) { var r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 320, y: (e.clientY - r.top) / r.height * 220 }; }

  var st = { open: false, tab: 'litti', built: false, visible: false, raf: 0, last: 0 };
  var SCENES = {};

  /* a seated cook: torso, head, cloth, two arms drawn each frame */
  function cook(parent, x, y, o) {
    var g = el('g', { transform: 'translate(' + x + ',' + y + ')' }, parent);
    el('ellipse', { cy: 2, rx: 26, ry: 5, fill: '#000', opacity: .16 }, g);
    el('path', { d: 'M-22 0q2-10 22-10t22 10z', fill: o.lower || '#e8e0cc' }, g);
    el('path', { d: 'M-12 -8q-2-24 2-34h20q4 10 2 34z', fill: o.shirt }, g);
    el('circle', { cx: 0, cy: -48, r: 9, fill: '#a56d47' }, g);
    if (o.turban) el('ellipse', { cx: 0, cy: -55, rx: 10.5, ry: 6, fill: o.turban }, g);
    else { el('path', { d: 'M-9.5 -50q9.5-14 19 0q0 -2 -4 -1q-5 -4 -11 1z', fill: '#2b2420' }, g); if (o.pallu) el('path', { d: 'M-9 -52q10-12 18 0l3 20-6-12z', fill: o.pallu }, g); }
    var a1 = el('line', { x1: -9, y1: -36, x2: -20, y2: -14, stroke: '#a56d47', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    var a2 = el('line', { x1: 9, y1: -36, x2: 20, y2: -14, stroke: '#a56d47', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    return { g: g, a1: a1, a2: a2 };
  }
  function setArm(l, x1, y1, x2, y2) { l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); }

  /* ══ 1 · LITTI ══ */
  SCENES.litti = (function () {
    var S = { slots: [], flying: [], served: 0, done: 0, svg: null, items: {} };
    var SLOT = []; for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) SLOT.push({ x: 74 + c * 28 + r * 8, y: 158 + r * 15 });
    var PLATE = { x: 252, y: 172 };
    S.build = function (svg) {
      S.svg = svg;
      svg.innerHTML =
        '<defs><radialGradient id="kEmb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb347" stop-opacity=".95"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient></defs>' +
        '<rect width="320" height="220" fill="#f1ddc2"/><rect y="188" width="320" height="32" fill="#b98a62"/>' +
        '<path d="M0 188q80-10 160-4t160-4v8H0z" fill="#cfa77a" opacity=".5"/>' +
        '<path d="M30 190q4-32 44-34h66q40 2 44 34z" fill="#9a6a4a"/><path d="M40 186q40-12 110-4" stroke="#7a4e34" stroke-width="2" fill="none" opacity=".5"/>' +
        '<ellipse cx="116" cy="165" rx="70" ry="20" fill="#3a2a22"/><ellipse class="k-ember" cx="116" cy="165" rx="66" ry="17" fill="url(#kEmb)"/>' +
        '<g id="kSmoke"><circle cx="100" cy="150" r="6" fill="#d7d0c4"/><circle cx="124" cy="150" r="7" fill="#d7d0c4"/><circle cx="140" cy="150" r="5" fill="#d7d0c4"/></g>' +
        '<g id="kSparks"></g><g id="kLittis"></g><g id="kFly"></g>' +
        '<g transform="translate(252,184)"><ellipse rx="40" ry="9" fill="#000" opacity=".15"/><ellipse cx="0" cy="-6" rx="36" ry="10" fill="#f6f1e4"/><ellipse cx="0" cy="-8" rx="28" ry="7" fill="#e9e2d0"/>' +
        '<path d="M16 -14q8-10 16 0q-2 7-8 8q-8 0-8-8z" fill="#7a5a3a"/><path d="M-4 -17q10-4 14 -1" stroke="#fff" opacity=".5" fill="none"/></g>' +
        '<g id="kStack"></g><g class="k-steam" id="kPlateSteam"><circle cx="248" cy="150" r="4" fill="#fff"/><circle class="s2" cx="256" cy="150" r="3.4" fill="#fff"/><circle class="s3" cx="242" cy="150" r="3.6" fill="#fff"/></g>' +
        '<g id="kCookG"></g><g id="kFlame"></g>';
      S.items.litti = svg.querySelector('#kLittis'); S.items.fly = svg.querySelector('#kFly'); S.items.stack = svg.querySelector('#kStack');
      S.items.sparks = svg.querySelector('#kSparks');
      S.cook = cook(svg.querySelector('#kCookG'), 36, 196, { shirt: '#c0504a', pallu: '#f0c25a', lower: '#e9e0c8' });
      S.slots = SLOT.map(function (p) {
        var g = el('g', { transform: 'translate(' + p.x + ',' + p.y + ')', visibility: 'hidden' }, S.items.litti);
        var body = el('circle', { r: 10.5, fill: '#f1e2c0' }, g);
        el('ellipse', { cx: -3, cy: -4, rx: 4.5, ry: 2.6, fill: '#fff', opacity: .3 }, g);
        return { g: g, body: body, used: false, p: 0, wob: 0 };
      });
      S.stackEls = [];
      for (var i = 0; i < 4; i++) {
        var g = el('g', { transform: 'translate(' + (PLATE.x - 14 + (i % 2) * 20) + ',' + (PLATE.y - 4 - Math.floor(i / 2) * 9 - (i % 2) * 2) + ')', visibility: 'hidden' }, S.items.stack);
        el('circle', { r: 9.5, fill: '#b06a2e' }, g); el('ellipse', { cx: -2.5, cy: -3, rx: 4, ry: 2.2, fill: '#f4d08a', opacity: .5 }, g);
        S.stackEls.push(g);
      }
      svg.onpointerdown = function (e) { S.tap(svgPt(svg, e)); };
      S.served = 0; S.flying = []; S.done = 0;
      S.status();
    };
    S.status = function () { setStatus(S.done > 0 ? L('kitchen.littiDone') : tpl(L('kitchen.served'), { n: S.served })); };
    S.tap = function (p) {
      for (var i = 0; i < S.slots.length; i++) {
        var s = S.slots[i]; if (!s.used) continue;
        var q = SLOT[i];
        if (Math.hypot(p.x - q.x, p.y - q.y) < 16) {
          if (s.p > 0.5 && s.p < 1.5) { serve(i); return; }
          s.wob = 1; snd('tick'); return;
        }
      }
      for (var j = 0; j < S.slots.length; j++) if (!S.slots[j].used) { S.slots[j].used = true; S.slots[j].p = 0; S.slots[j].g.setAttribute('visibility', 'visible'); snd('thud'); return; }
    };
    function serve(i) {
      var s = S.slots[i]; s.used = false; s.g.setAttribute('visibility', 'hidden');
      var g = el('g', {}, S.items.fly); el('circle', { r: 10, fill: s.body.getAttribute('fill') }, g);
      S.flying.push({ g: g, t: 0, x0: SLOT[i].x, y0: SLOT[i].y });
      snd('tick');
    }
    S.tick = function (dt) {
      var t = performance.now() / 1000;
      S.slots.forEach(function (s, i) {
        if (!s.used) return;
        s.p = Math.min(1.6, s.p + dt / 8);
        var p = s.p, col = p < 0.6 ? mixc([241, 226, 192], [217, 162, 74], p / 0.6) : p < 1.1 ? mixc([217, 162, 74], [150, 86, 38], (p - 0.6) / 0.5) : mixc([150, 86, 38], [52, 34, 24], clamp((p - 1.1) / 0.5, 0, 1));
        s.body.setAttribute('fill', col);
        s.wob = Math.max(0, s.wob - dt * 2.2);
        var q = SLOT[i], w = Math.sin(t * 22) * s.wob * 3;
        s.g.setAttribute('transform', 'translate(' + (q.x + w) + ',' + (q.y - Math.sin(Math.PI * Math.min(1, s.wob)) * 4) + ') rotate(' + (w * 4) + ')');
      });
      for (var f = S.flying.length - 1; f >= 0; f--) {
        var o = S.flying[f]; o.t += dt / 0.65;
        var k = Math.min(1, o.t), tx = PLATE.x - 14 + (S.served % 2) * 20, ty = PLATE.y - 4 - Math.floor(S.served / 2) * 9;
        o.g.setAttribute('transform', 'translate(' + lerp(o.x0, tx, k) + ',' + (lerp(o.y0, ty, k) - Math.sin(Math.PI * k) * 46) + ') rotate(' + (k * 360) + ')');
        if (k >= 1) {
          S.items.fly.removeChild(o.g); S.flying.splice(f, 1);
          S.served++; S.stackEls.forEach(function (g, i) { g.setAttribute('visibility', i < S.served ? 'visible' : 'hidden'); });
          snd('coin');
          if (S.served >= 4) { S.done = 3; snd('bell'); S.svg.classList.add('is-celebrate'); }
          S.status();
        }
      }
      if (S.done > 0) { S.done -= dt; if (S.done <= 0) { S.served = 0; S.done = 0; S.stackEls.forEach(function (g) { g.setAttribute('visibility', 'hidden'); }); S.svg.classList.remove('is-celebrate'); S.status(); } }
      /* the cook turns a litti every so often */
      var a = Math.sin(t * 1.8);
      setArm(S.cook.a1, -9, -36, -16, -20);
      setArm(S.cook.a2, 9, -36, 44 + a * 10, -22 + Math.sin(t * 3.6) * 5);
      if (Math.random() < dt * 5) {
        var sp = el('circle', { cx: 80 + Math.random() * 70, cy: 160, r: 1.5, fill: '#ffb347', class: 'k-spark' }, S.items.sparks);
        setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 900);
      }
    };
    return S;
  })();

  /* ══ 2 · CHOKHA ══ */
  SCENES.chokha = (function () {
    var S = { n: 0, hold: 0, flying: [], blobs: [], svg: null, items: {} };
    var ING = [
      { k: 'brinjal', col: [86, 44, 96], x: 28, y: 152 }, { k: 'tomato', col: [208, 60, 44], x: 54, y: 150 }, { k: 'potato', col: [201, 164, 106], x: 80, y: 152 },
      { k: 'garlic', col: [240, 232, 214], x: 28, y: 176 }, { k: 'chilli', col: [79, 154, 60], x: 54, y: 176 }, { k: 'oil', col: [227, 183, 60], x: 80, y: 176 }
    ];
    var BOWL = { x: 176, y: 160 };
    function icon(g, k, col) {
      var c = 'rgb(' + col.join(',') + ')';
      if (k === 'brinjal') { el('path', { d: 'M-9 4q-2-14 9-14t9 14q-9 6-18 0z', fill: c }, g); el('path', { d: 'M-3 -10q3-6 7 0', stroke: '#4f9a3c', 'stroke-width': 2.4, fill: 'none' }, g); }
      else if (k === 'tomato') { el('circle', { r: 9, fill: c }, g); el('path', { d: 'M-4 -8l4 3 4-3', stroke: '#4f9a3c', 'stroke-width': 2, fill: 'none' }, g); }
      else if (k === 'potato') { el('ellipse', { rx: 10, ry: 7, fill: c }, g); el('circle', { cx: -3, cy: -1, r: 1, fill: '#a78a54' }, g); el('circle', { cx: 4, cy: 2, r: 1, fill: '#a78a54' }, g); }
      else if (k === 'garlic') { el('path', { d: 'M0 -9q9 4 8 10q-4 5-8 4t-8-4q-1-6 8-10z', fill: c }, g); el('path', { d: 'M0 -9v13', stroke: '#c9bfa4', 'stroke-width': 1 }, g); }
      else if (k === 'chilli') { el('path', { d: 'M-10 -2q12-8 20 2q-8 8-22 2z', fill: c }, g); el('path', { d: 'M-10 -2l-3-3', stroke: '#356b28', 'stroke-width': 2 }, g); }
      else { el('rect', { x: -5, y: -9, width: 10, height: 17, rx: 3, fill: '#d6efe8', opacity: .85 }, g); el('rect', { x: -4, y: -1, width: 8, height: 8, rx: 2, fill: c }, g); el('rect', { x: -2, y: -13, width: 4, height: 5, fill: '#c9a24a' }, g); }
    }
    S.build = function (svg) {
      S.svg = svg;
      svg.innerHTML =
        '<rect width="320" height="220" fill="#f1ddc2"/><rect y="188" width="320" height="32" fill="#b98a62"/>' +
        '<g transform="translate(60,196)"><ellipse rx="50" ry="6" fill="#000" opacity=".12"/><path d="M-48 0q0-26 4-30h88q4 4 4 30z" fill="#a98a62"/></g>' +
        '<g id="kIng"></g><g transform="translate(176,184)"><ellipse rx="46" ry="7" fill="#000" opacity=".16"/><path d="M-44 -22q2 22 44 22t44-22z" fill="#c98a3a"/><ellipse cy="-22" rx="44" ry="10" fill="#e2b45a"/><ellipse cy="-21" rx="38" ry="8" fill="#7a5a3a"/></g>' +
        '<g id="kBlobs"></g><g id="kPestle"></g><g id="kFlyC"></g><g class="k-steam" id="kBowlSteam"><circle cx="170" cy="130" r="4" fill="#fff"/><circle class="s2" cx="180" cy="130" r="3.4" fill="#fff"/><circle class="s3" cx="176" cy="130" r="3.8" fill="#fff"/></g><g id="kManG"></g>';
      S.items.blobs = svg.querySelector('#kBlobs'); S.items.fly = svg.querySelector('#kFlyC');
      var ing = svg.querySelector('#kIng');
      S.ingEls = ING.map(function (o) { var g = el('g', { transform: 'translate(' + o.x + ',' + o.y + ')' }, ing); icon(g, o.k, o.col); return g; });
      var pg = svg.querySelector('#kPestle');
      S.pestle = el('g', {}, pg);
      el('rect', { x: -4, y: -46, width: 8, height: 46, rx: 4, fill: '#8a6a42' }, S.pestle); el('ellipse', { cy: 2, rx: 9, ry: 6, fill: '#a98a58' }, S.pestle);
      S.man = cook(svg.querySelector('#kManG'), 262, 196, { shirt: '#3f6f8f', turban: '#e9dcc0', lower: '#e6dcc4' });
      svg.onpointerdown = function () { S.tap(); };
      S.reset();
    };
    S.reset = function () {
      S.n = 0; S.hold = 0; S.flying = []; S.blobs = [];
      S.items.blobs.innerHTML = ''; S.items.fly.innerHTML = '';
      S.ingEls.forEach(function (g) { g.setAttribute('opacity', 1); });
      S.status();
    };
    S.status = function () { setStatus(S.n >= ING.length ? L('kitchen.chokhaDone') : tpl(L('kitchen.next'), { name: L('kitchen.i.' + ING[S.n].k), n: S.n + 1 })); };
    S.tap = function () {
      if (S.n >= ING.length || S.flying.length > 1) return;
      var o = ING[S.n]; S.ingEls[S.n].setAttribute('opacity', 0.22);
      var g = el('g', { transform: 'translate(' + o.x + ',' + o.y + ')' }, S.items.fly); icon(g, o.k, o.col);
      S.flying.push({ g: g, t: 0, o: o, i: S.n }); S.n++; snd('tick'); S.status();
    };
    S.tick = function (dt) {
      var t = performance.now() / 1000;
      for (var f = S.flying.length - 1; f >= 0; f--) {
        var q = S.flying[f]; q.t += dt / 0.6; var k = Math.min(1, q.t);
        q.g.setAttribute('transform', 'translate(' + lerp(q.o.x, BOWL.x, k) + ',' + (lerp(q.o.y, BOWL.y - 12, k) - Math.sin(Math.PI * k) * 50) + ') rotate(' + (k * 240) + ')');
        if (k >= 1) {
          S.items.fly.removeChild(q.g); S.flying.splice(f, 1);
          for (var b = 0; b < 4; b++) {
            var bl = el('ellipse', { cx: BOWL.x + (Math.random() - 0.5) * 56, cy: BOWL.y - 12 + (Math.random() - 0.5) * 8, rx: 7 + Math.random() * 5, ry: 3.6 + Math.random() * 2, fill: 'rgb(' + q.o.col.join(',') + ')' }, S.items.blobs);
            S.blobs.push({ el: bl, col: q.o.col });
          }
          snd('coin');
          if (S.n >= ING.length && !S.flying.length) { S.hold = 3.2; snd('bell'); S.svg.classList.add('is-celebrate'); S.status(); }
        }
      }
      var m = clamp(S.n / ING.length, 0, 1);
      S.blobs.forEach(function (b) { b.el.setAttribute('fill', mixc(b.col, [122, 90, 58], m * 0.85)); });
      var mashing = S.n > 0 && S.n < ING.length + 1;
      var up = Math.abs(Math.sin(t * 5.2)) * (mashing ? 1 : 0.3);
      S.pestle.setAttribute('transform', 'translate(' + (BOWL.x + 6) + ',' + (BOWL.y - 28 - up * 22) + ')');
      setArm(S.man.a1, -9, -36, -22, -18);
      setArm(S.man.a2, 9, -36, -62, -52 - up * 14);
      if (S.hold > 0) { S.hold -= dt; if (S.hold <= 0) { S.svg.classList.remove('is-celebrate'); S.reset(); } }
    };
    return S;
  })();

  /* ══ 3 · LAUNGLATA ══ */
  SCENES.sweet = (function () {
    var S = { pieces: [], flying: [], served: 0, done: 0, svg: null, items: {} };
    var KAD = { x: 150, y: 160 }, SYR = { x: 66, y: 124 }, PLATE = { x: 262, y: 172 };
    function piece(g, col) {
      var b = el('g', {}, g);
      el('rect', { x: -8, y: -8, width: 16, height: 16, rx: 3, fill: col, transform: 'rotate(45)' }, b);
      el('path', { d: 'M-6 0H6M0 -6V6', stroke: '#fff', opacity: .3, 'stroke-width': 1.2 }, b);
      el('circle', { r: 1.8, fill: '#7a4a1e' }, b);
      return b;
    }
    S.build = function (svg) {
      S.svg = svg;
      svg.innerHTML =
        '<rect width="320" height="220" fill="#f1ddc2"/><rect y="188" width="320" height="32" fill="#b98a62"/>' +
        '<g transform="translate(150,196)"><ellipse rx="62" ry="6" fill="#000" opacity=".14"/><path d="M-50 0q0-30 6-34h88q6 4 6 34z" fill="#9a6a4a"/></g>' +
        '<g transform="translate(150,160)"><ellipse rx="64" ry="16" fill="#2b2420"/><ellipse cy="-2" rx="58" ry="12" fill="#c98a28"/><ellipse class="k-oil" cy="-2" rx="52" ry="9" fill="#e9b84a"/></g>' +
        '<g id="kBubbles"></g><g id="kPieces"></g><g id="kFlyS"></g>' +
        '<g transform="translate(66,140)"><ellipse rx="30" ry="6" fill="#000" opacity=".14" cy="22"/><path d="M-28 0q2 22 28 22t28-22z" fill="#b8c0c6"/><ellipse rx="28" ry="7" fill="#e6c36a"/><ellipse ry="5" rx="24" cy="1" fill="#f2cf7a"/><path class="k-syr" d="M-14 0q5-2 10 0t10 0t10 0" stroke="#fff" opacity=".5" fill="none"/></g>' +
        '<g transform="translate(262,184)"><ellipse rx="36" ry="9" fill="#000" opacity=".15"/><ellipse cy="-6" rx="34" ry="10" fill="#f6f1e4"/><ellipse cy="-8" rx="26" ry="7" fill="#e9e2d0"/></g><g id="kPlateS"></g>' +
        '<g class="k-steam"><circle cx="146" cy="132" r="4" fill="#fff"/><circle class="s2" cx="156" cy="132" r="3.4" fill="#fff"/><circle class="s3" cx="140" cy="132" r="3.8" fill="#fff"/></g><g id="kHalwai"></g>';
      S.items.pieces = svg.querySelector('#kPieces'); S.items.fly = svg.querySelector('#kFlyS'); S.items.bub = svg.querySelector('#kBubbles'); S.items.plate = svg.querySelector('#kPlateS');
      S.man = cook(svg.querySelector('#kHalwai'), 214, 134, { shirt: '#e9dcc0', turban: '#c0504a', lower: '#e6dcc4' });
      S.stackEls = [];
      for (var i = 0; i < 5; i++) { var g = el('g', { transform: 'translate(' + (PLATE.x - 20 + (i % 3) * 18 + (Math.floor(i / 3)) * 9) + ',' + (PLATE.y - 6 - Math.floor(i / 3) * 9) + ')', visibility: 'hidden' }, S.items.plate); piece(g, '#c47a2a'); S.stackEls.push(g); }
      svg.onpointerdown = function () { S.tap(); };
      S.pieces = []; S.flying = []; S.served = 0; S.done = 0; S.status();
    };
    S.status = function () { setStatus(S.done > 0 ? L('kitchen.sweetDone') : tpl(L('kitchen.sweetServed'), { n: S.served })); };
    S.tap = function () {
      if (S.pieces.length >= 5) return;
      var g = el('g', {}, S.items.pieces), c = piece(g, '#f0d79a');
      var x = KAD.x - 38 + S.pieces.length * 19 + (Math.random() - 0.5) * 6;
      S.pieces.push({ g: g, body: c.firstChild, p: 0, x: x, y: KAD.y - 6 + (S.pieces.length % 2) * 4, fall: 0 }); snd('thud');
    };
    S.tick = function (dt) {
      var t = performance.now() / 1000;
      for (var i = S.pieces.length - 1; i >= 0; i--) {
        var q = S.pieces[i];
        q.fall = Math.min(1, q.fall + dt / 0.45);
        if (q.fall >= 1) q.p += dt / 5;
        var fy = q.fall < 1 ? lerp(40, q.y, q.fall * q.fall) : q.y + Math.sin(t * 3 + i) * 1.4;
        q.g.setAttribute('transform', 'translate(' + q.x + ',' + fy + ') rotate(' + (Math.sin(t * 2 + i) * 6) + ')');
        q.body.setAttribute('fill', mixc([240, 215, 154], [196, 122, 42], clamp(q.p, 0, 1)));
        if (q.p >= 1) {
          S.pieces.splice(i, 1); S.items.pieces.removeChild(q.g);
          var g = el('g', {}, S.items.fly); piece(g, '#c47a2a');
          S.flying.push({ g: g, t: 0, x0: q.x, y0: q.y }); snd('splash', 0.4);
        }
      }
      if (Math.random() < dt * 14) {
        var b = el('circle', { cx: KAD.x - 46 + Math.random() * 92, cy: KAD.y - 4 + Math.random() * 4, r: 1 + Math.random() * 2, fill: '#fff6cf', opacity: .8, class: 'k-bub' }, S.items.bub);
        setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 700);
      }
      for (var f = S.flying.length - 1; f >= 0; f--) {
        var o = S.flying[f]; o.t += dt / 1.3;
        var k = Math.min(1, o.t), tx, ty, p2;
        if (k < 0.5) { p2 = k / 0.5; tx = lerp(o.x0, SYR.x, p2); ty = lerp(o.y0, SYR.y - 6, p2) - Math.sin(Math.PI * p2) * 36; }
        else { p2 = (k - 0.5) / 0.5; tx = lerp(SYR.x, PLATE.x - 20 + (S.served % 3) * 18, p2); ty = lerp(SYR.y - 6, PLATE.y - 6, p2) - Math.sin(Math.PI * p2) * 40; }
        o.g.setAttribute('transform', 'translate(' + tx + ',' + ty + ') rotate(' + (k * 200) + ')');
        if (k >= 1) {
          S.items.fly.removeChild(o.g); S.flying.splice(f, 1);
          S.served++; S.stackEls.forEach(function (g, i) { g.setAttribute('visibility', i < S.served ? 'visible' : 'hidden'); });
          snd('coin');
          if (S.served >= 5) { S.done = 3; snd('bell'); S.svg.classList.add('is-celebrate'); }
          S.status();
        }
      }
      if (S.done > 0) { S.done -= dt; if (S.done <= 0) { S.served = 0; S.done = 0; S.stackEls.forEach(function (g) { g.setAttribute('visibility', 'hidden'); }); S.svg.classList.remove('is-celebrate'); S.status(); } }
      var s = Math.sin(t * 2.6);
      setArm(S.man.a1, -9, -36, -24, -16);
      setArm(S.man.a2, 9, -36, -44 + s * 8, -34 + Math.cos(t * 2.6) * 6);
    };
    return S;
  })();

  /* ── the shell, the tabs, one small loop ──────────────────── */
  var statusEl = null;
  function setStatus(txt) { if (statusEl) statusEl.textContent = txt; }

  function build() {
    host.innerHTML =
      '<button type="button" class="an-head" id="knHead" aria-expanded="false" aria-controls="knBody">' +
      '<span class="an-ic" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24"><circle cx="9" cy="14" r="5.5" class="kn-i1"/><circle cx="17" cy="15.5" r="4" class="kn-i1 b"/></svg>' +
      '<svg viewBox="0 0 24 24"><path d="M12 3q4 5 0 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" class="kn-i2"/><path d="M6 20h12l-1-6H7z" fill="currentColor"/></svg>' +
      '<svg viewBox="0 0 24 24"><path d="M3 12l6-6 6 6-6 6z" fill="currentColor" class="kn-i3"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg></span>' +
      '<span class="an-txt"><i></i><b></b><em></em></span><span class="an-plus" aria-hidden="true"></span></button>' +
      '<div class="an-body" id="knBody"><div class="an-in"><div class="an-tabs" role="tablist"></div>' +
      '<div class="an-stage"><div class="an-pane" data-pane="litti"><svg class="an-svg" id="knLitti" viewBox="0 0 320 220"></svg></div>' +
      '<div class="an-pane" data-pane="chokha"><svg class="an-svg" id="knChokha" viewBox="0 0 320 220"></svg></div>' +
      '<div class="an-pane" data-pane="sweet"><svg class="an-svg" id="knSweet" viewBox="0 0 320 220"></svg></div></div>' +
      '<p class="kn-status" aria-live="polite"></p><p class="an-hint"></p><p class="an-note"></p></div></div>';
    statusEl = host.querySelector('.kn-status');
    var tabs = host.querySelector('.an-tabs');
    ['litti', 'chokha', 'sweet'].forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.className = 'an-tab'; b.setAttribute('role', 'tab'); b.setAttribute('data-tab', k); tabs.appendChild(b); });
    SCENES.litti.build(host.querySelector('#knLitti'));
    SCENES.chokha.build(host.querySelector('#knChokha'));
    SCENES.sweet.build(host.querySelector('#knSweet'));
    host.querySelector('#knHead').addEventListener('click', function () { toggle(!st.open); });
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.an-tab'); if (b) { setTab(b.getAttribute('data-tab')); snd('tick'); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { st.visible = es[0].isIntersecting; if (st.visible) kick(); }, { threshold: 0.1 }).observe(host);
    else st.visible = true;
    st.built = true;
    labels();
  }
  function labels() {
    host.querySelector('.an-txt i').textContent = L('kitchen.kicker');
    host.querySelector('.an-txt b').textContent = L('kitchen.title');
    host.querySelector('.an-txt em').textContent = L('kitchen.lede');
    Array.prototype.forEach.call(host.querySelectorAll('.an-tab'), function (b) {
      var k = b.getAttribute('data-tab'); b.textContent = L('kitchen.' + k); b.classList.toggle('is-on', k === st.tab); b.setAttribute('aria-selected', k === st.tab ? 'true' : 'false');
    });
    host.querySelector('.an-hint').textContent = L('kitchen.' + st.tab + 'Hint');
    host.querySelector('.an-note').textContent = L('kitchen.note');
    if (SCENES[st.tab] && SCENES[st.tab].status) SCENES[st.tab].status();
  }
  function setTab(k) {
    st.tab = k;
    Array.prototype.forEach.call(host.querySelectorAll('.an-pane'), function (p) { p.classList.toggle('is-on', p.getAttribute('data-pane') === k); });
    labels(); kick();
  }
  function toggle(open) {
    st.open = open; host.classList.toggle('is-open', open);
    host.querySelector('#knHead').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { snd('chime'); setTab(st.tab); }
    kick();
  }
  function loop(now) {
    if (!st.visible || !st.open) { st.raf = 0; return; }
    var dt = st.last ? Math.min(0.1, (now - st.last) / 1000) : 0; st.last = now;
    SCENES[st.tab].tick(dt);
    st.raf = requestAnimationFrame(loop);
  }
  function kick() { st.last = 0; if (!st.raf && st.visible && st.open && !reduced) st.raf = requestAnimationFrame(loop); }

  window.Kitchen = { build: function () { if (!st.built) build(); else labels(); } };
  window.Kitchen.build();
})();
