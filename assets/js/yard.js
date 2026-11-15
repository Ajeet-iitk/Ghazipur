/* ══════════════════════════════════════════════════════════════
   GHAZIPUR — the works at work.
   A hand-animated crew for the opium-factory yard: loaders carrying
   sacks, a screw press, sorters at a table, a crane, a foreman and a
   watchman on the wall. Pure SVG, driven by one small loop that only
   runs while the yard is on screen. Sound the siren and everyone hurries.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var frame = document.getElementById('yard');
  var svg = frame && frame.querySelector('svg');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t * t * (3 - 2 * t); }

  var crew = el('g', { id: 'yardCrew' }, svg);
  var back = el('g', {}, crew);      /* crane, machines */
  var people = el('g', {}, crew);    /* workers, sorted by depth */

  var SKIN = ['#b9825a', '#a56d47', '#c99468', '#94603e'];
  var SHIRT = ['#d8c9a6', '#8c5a3e', '#41566b', '#c7b48a', '#6d7f5d', '#b36b4a', '#e0d6bf'];
  var CAP = ['#e9dcc0', '#b1432f', '#3d4a5c', '#d7a84a', '#efe6d0'];

  /* ── a worker ─────────────────────────────────────────────── */
  function Worker(o) {
    var w = this;
    w.x = o.x; w.y = o.y; w.s = (o.s || (0.82 + (o.y - 400) / 34 * 0.3)) * 1.3;
    w.dir = o.dir || 1; w.mode = o.mode || 'idle'; w.carry = false;
    w.p = Math.random() * 6.28; w.route = o.route || null; w.i = 0; w.wait = Math.random() * 1.2;
    w.speed = o.speed || 34; w.lamp = !!o.lamp; w.lean = 0;
    var skin = o.skin || SKIN[Math.floor(Math.random() * SKIN.length)];
    var shirt = o.shirt || SHIRT[Math.floor(Math.random() * SHIRT.length)];
    var cap = o.cap || CAP[Math.floor(Math.random() * CAP.length)];

    w.g = el('g', {});
    el('ellipse', { cx: 0, cy: 0.5, rx: 11, ry: 3, fill: '#000', opacity: 0.32 }, w.g);
    w.b = el('g', {}, w.g);
    var line = { 'stroke-linecap': 'round' };
    w.legB = el('line', { stroke: '#2a211c', 'stroke-width': 3.1 }, w.b);
    w.legF = el('line', { stroke: '#352a23', 'stroke-width': 3.1 }, w.b);
    w.armB = el('line', { stroke: shirt, 'stroke-width': 2.8, 'stroke-linecap': 'round', opacity: 0.85 }, w.b);
    w.handB = el('circle', { r: 1.5, fill: skin }, w.b);
    el('path', { d: 'M-5 -14 L5 -14 L4 -30.5 Q0 -32.5 -4 -30.5Z', fill: shirt }, w.b);
    el('path', { d: 'M-5 -14 L5 -14 L4.6 -11 L-4.6 -11Z', fill: '#2f3a44' }, w.b);
    el('circle', { cx: 0, cy: -36.5, r: 4.6, fill: skin }, w.b);
    el('ellipse', { cx: -0.4, cy: -39.6, rx: 5.5, ry: 3.1, fill: cap }, w.b);
    w.armF = el('line', { stroke: shirt, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, w.b);
    w.handF = el('circle', { r: 1.6, fill: skin }, w.b);
    w.sack = el('g', { visibility: 'hidden' }, w.b);
    el('rect', { x: -8, y: -45, width: 16, height: 10, rx: 3.4, fill: '#c9a779' }, w.sack);
    el('path', { d: 'M-6 -42h12', stroke: '#8d6e45', 'stroke-width': 1 }, w.sack);
    if (w.lamp) {
      w.halo = el('circle', { r: 11, fill: 'url(#yardGlowG)', opacity: 0.8 }, w.b);
      el('rect', { x: -1.8, y: -1.2, width: 3.6, height: 4.8, rx: 1, fill: '#ffd79a' }, w.b);
      w.lampG = w.b.lastChild;
    }
    w.o = o;
    people.appendChild(w.g);
  }

  function setLine(l, x1, y1, x2, y2) {
    l.setAttribute('x1', x1.toFixed(1)); l.setAttribute('y1', y1.toFixed(1));
    l.setAttribute('x2', x2.toFixed(1)); l.setAttribute('y2', y2.toFixed(1));
  }
  function setDot(c, x, y) { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); }

  Worker.prototype.draw = function () {
    var w = this, p = w.p, m = w.mode;
    var bob = 0, lean = 0;
    var lf = 0, lb = 0;     /* leg swing */
    var hF, hB;             /* hands */
    var sx = 1.5, sy = -28; /* shoulder */

    if (m === 'walk') {
      lf = Math.sin(p) * 7; lb = -lf;
      bob = Math.abs(Math.sin(p)) * 1.3;
      if (w.carry) { hF = [4.5, -37]; hB = [-3, -38]; lean = 3; }
      else { hF = [Math.sin(p + 3.14) * 6, -17]; hB = [Math.sin(p) * 6, -17]; }
    } else if (m === 'press') {
      var a = Math.sin(p);
      lean = a * 7 + 4;
      hF = [9 + a * 5, -27 + Math.cos(p) * 3]; hB = [7 + a * 4, -24 + Math.cos(p) * 3];
      bob = Math.max(0, -a) * 0.8;
    } else if (m === 'lift') {
      var u = (Math.sin(p) + 1) / 2;
      hF = [7, -20 - u * 15]; hB = [4, -19 - u * 14];
      lean = -u * 4 + 3;
    } else if (m === 'sort') {
      lean = 12;
      hF = [9 + Math.sin(p * 1.7) * 5, -19 + Math.abs(Math.sin(p * 2.3)) * 3];
      hB = [6 + Math.sin(p * 1.3 + 1) * 5, -18 + Math.abs(Math.sin(p * 1.9)) * 3];
      bob = Math.abs(Math.sin(p * 2.3)) * 0.5;
    } else if (m === 'wave') {
      hF = [8 + Math.sin(p * 6) * 2, -46 + Math.sin(p * 6) * 3]; hB = [6, -20];
    } else { /* idle, holding a clipboard */
      bob = Math.sin(p * 0.9) * 0.4;
      hF = [8, -24]; hB = [4, -21];
    }

    var b = w.b;
    b.setAttribute('transform', 'scale(' + w.dir + ',1) rotate(' + lean.toFixed(1) + ' 0 -14) translate(0,' + (-bob).toFixed(2) + ')');
    w.g.setAttribute('transform', 'translate(' + w.x.toFixed(1) + ',' + w.y.toFixed(1) + ') scale(' + w.s.toFixed(3) + ')');
    setLine(w.legF, 0.5, -13, lf, -1.2 - Math.max(0, Math.cos(p)) * (m === 'walk' ? 3 : 0));
    setLine(w.legB, -0.5, -13, lb, -1.2 - Math.max(0, -Math.cos(p)) * (m === 'walk' ? 3 : 0));
    setLine(w.armF, sx, sy, hF[0], hF[1]); setDot(w.handF, hF[0], hF[1]);
    setLine(w.armB, -sx, sy, hB[0], hB[1]); setDot(w.handB, hB[0], hB[1]);
    w.sack.setAttribute('visibility', w.carry ? 'visible' : 'hidden');
    if (w.lamp) {
      w.lampG.setAttribute('transform', 'translate(' + (hF ? hF[0] : 8) + ',' + (hF ? hF[1] : -22) + ')');
      w.halo.setAttribute('cx', (hF[0]).toFixed(1)); w.halo.setAttribute('cy', (hF[1] + 2).toFixed(1));
    }
  };

  /* move along a route of stops; at a stop, do something and wait */
  Worker.prototype.step = function (dt, mul) {
    var w = this;
    w.p += dt * (w.mode === 'walk' ? 8.4 * mul : w.mode === 'wave' ? 1 : 4.2 * mul);
    if (!w.route) return;
    if (w.wait > 0) {
      w.wait -= dt * mul;
      if (w.mode === 'walk') w.mode = 'lift';
      if (w.wait <= 0) w.mode = 'walk';
      return;
    }
    var t = w.route[w.i];
    var dx = t.x - w.x;
    w.dir = dx >= 0 ? 1 : -1;
    var st = w.speed * mul * dt;
    if (Math.abs(dx) <= st) {
      w.x = t.x;
      if (t.fn) t.fn(w);
      w.wait = t.wait || 0.4;
      w.i = (w.i + 1) % w.route.length;
      w.dir = (w.route[w.i].x - w.x) >= 0 ? 1 : -1;
    } else {
      w.x += Math.sign(dx) * st;
    }
  };

  /* ── crates and carts ─────────────────────────────────────── */
  function Stack(x, y, flip) {
    this.n = 0; this.x = x; this.y = y; this.fade = 1; this.hold = 0;
    this.g = el('g', { transform: 'translate(' + x + ',' + y + ')' }, back);
    this.sacks = [];
    var pos = [[0, 0], [15, 0], [30, 0], [7, -11], [22, -11], [14, -22]];
    for (var i = 0; i < pos.length; i++) {
      var s = el('g', { transform: 'translate(' + (flip ? -pos[i][0] : pos[i][0]) + ',' + pos[i][1] + ')', visibility: 'hidden' }, this.g);
      el('rect', { x: -7, y: -11, width: 14, height: 11, rx: 3, fill: '#c9a779' }, s);
      el('path', { d: 'M-5 -7h10M-5 -4h10', stroke: '#8d6e45', 'stroke-width': 0.8 }, s);
      this.sacks.push(s);
    }
  }
  Stack.prototype.add = function () { if (this.n < 6) this.n++; };
  Stack.prototype.update = function (dt) {
    if (this.n >= 6) {
      this.hold += dt;
      if (this.hold > 1.6) { this.fade = Math.max(0, 1 - (this.hold - 1.6) * 1.6); }
      if (this.hold > 2.7) { this.n = 0; this.hold = 0; this.fade = 1; }
    }
    this.g.setAttribute('opacity', this.fade.toFixed(2));
    for (var i = 0; i < this.sacks.length; i++) this.sacks[i].setAttribute('visibility', i < this.n ? 'visible' : 'hidden');
  };

  /* ── the screw press ──────────────────────────────────────── */
  var press = { x: 452, y: 404 };
  var pg = el('g', { transform: 'translate(' + press.x + ',' + press.y + ')' }, back);
  el('rect', { x: -24, y: -6, width: 48, height: 6, rx: 1.5, fill: '#2d211c' }, pg);
  el('rect', { x: -20, y: -50, width: 5, height: 46, fill: '#4a3228' }, pg);
  el('rect', { x: 15, y: -50, width: 5, height: 46, fill: '#4a3228' }, pg);
  el('rect', { x: -22, y: -55, width: 44, height: 7, rx: 1.5, fill: '#5a3d30' }, pg);
  press.screw = el('rect', { x: -2.4, y: -48, width: 4.8, height: 28, fill: '#8a7464' }, pg);
  press.plate = el('rect', { x: -13, y: -22, width: 26, height: 5, rx: 1, fill: '#6f5648' }, pg);
  el('rect', { x: -11, y: -16, width: 22, height: 10, rx: 1, fill: '#b99163' }, pg);
  press.lever = el('line', { x1: -24, y1: -58, x2: 24, y2: -58, stroke: '#8a6a52', 'stroke-width': 3, 'stroke-linecap': 'round' }, pg);
  press.knobL = el('circle', { cx: -24, cy: -58, r: 3, fill: '#caa77a' }, pg);
  press.knobR = el('circle', { cx: 24, cy: -58, r: 3, fill: '#caa77a' }, pg);
  press.steam = [];
  for (var sp = 0; sp < 3; sp++) press.steam.push(el('circle', { cx: 0, cy: -60, r: 4, fill: '#e6d8c8', opacity: 0 }, pg));

  /* ── a sorting table ──────────────────────────────────────── */
  var tg = el('g', { transform: 'translate(730,416)' }, back);
  el('rect', { x: -36, y: -21, width: 72, height: 5, rx: 1, fill: '#6a4b38' }, tg);
  el('path', { d: 'M-32 -16v16M32 -16v16', stroke: '#3a2a22', 'stroke-width': 3 }, tg);
  [[-18, -21], [-2, -21], [14, -21], [24, -21]].forEach(function (q, i) {
    var s = el('g', { transform: 'translate(' + q[0] + ',' + q[1] + ')' }, tg);
    el('rect', { x: -6, y: -8, width: 12, height: 8, rx: 3, fill: i % 2 ? '#d1b389' : '#c9a779' }, s);
  });

  /* ── the crane ────────────────────────────────────────────── */
  var cr = el('g', { transform: 'translate(150,0)' }, back);
  el('rect', { x: -4, y: 256, width: 8, height: 146, fill: '#3b2a23' }, cr);
  el('path', { d: 'M-4 400 -16 408h32L4 400zM-4 262 100 262M-4 272 94 262', stroke: '#3b2a23', 'stroke-width': 4, fill: '#3b2a23' }, cr);
  el('path', { d: 'M-4 300 40 262M-4 330 20 262', stroke: '#3b2a23', 'stroke-width': 2, opacity: 0.8 }, cr);
  var crane = {};
  crane.trolley = el('rect', { x: -6, y: 258, width: 12, height: 8, rx: 1, fill: '#5a3d30' }, cr);
  crane.rope = el('line', { stroke: '#a89683', 'stroke-width': 1.2 }, cr);
  crane.crate = el('g', {}, cr);
  el('rect', { x: -10, y: 0, width: 20, height: 15, rx: 1.5, fill: '#8a6a45' }, crane.crate);
  el('path', { d: 'M-10 0 10 15M10 0 -10 15', stroke: '#5c452d', 'stroke-width': 1 }, crane.crate);
  crane.g1 = el('g', { transform: 'translate(100,0)' }, cr);   /* pile where it picks up */
  crane.g2 = el('g', { transform: 'translate(36,0)' }, cr);    /* pile where it sets down */
  [crane.g1, crane.g2].forEach(function (g) {
    var c = el('g', { transform: 'translate(0,386)' }, g);
    el('rect', { x: -10, y: 0, width: 20, height: 15, rx: 1.5, fill: '#8a6a45' }, c);
    el('path', { d: 'M-10 0 10 15M10 0 -10 15', stroke: '#5c452d', 'stroke-width': 1 }, c);
  });
  function updateCrane(t) {
    var ph = (t % 13) / 13, hx, hy, carrying = false;
    if (ph < 0.2) { hx = 100; hy = lerp(276, 372, ease(ph / 0.2)); }
    else if (ph < 0.4) { hx = 100; hy = lerp(372, 296, ease((ph - 0.2) / 0.2)); carrying = true; }
    else if (ph < 0.6) { hx = lerp(100, 36, ease((ph - 0.4) / 0.2)); hy = 296; carrying = true; }
    else if (ph < 0.8) { hx = 36; hy = lerp(296, 372, ease((ph - 0.6) / 0.2)); carrying = ph < 0.78; }
    else { hx = lerp(36, 100, ease((ph - 0.8) / 0.2)); hy = lerp(372, 276, ease((ph - 0.8) / 0.2)); }
    crane.trolley.setAttribute('x', hx - 6);
    setLine(crane.rope, hx, 266, hx, hy);
    crane.crate.setAttribute('transform', 'translate(' + hx + ',' + hy + ')');
    crane.crate.setAttribute('visibility', carrying || (ph >= 0.2 && ph < 0.8) ? 'visible' : 'hidden');
    crane.g1.setAttribute('visibility', ph < 0.2 ? 'visible' : 'hidden');
    crane.g2.setAttribute('visibility', ph >= 0.78 || ph < 0.2 ? 'visible' : 'hidden');
  }

  /* ── a handcart that fills and rolls away ─────────────────── */
  var cart = { x: 940, y: 418, off: 0, state: 'wait', n: 0, t: 0 };
  cart.g = el('g', {}, back);
  cart.body = el('g', {}, cart.g);
  el('rect', { x: -22, y: -18, width: 44, height: 10, rx: 2, fill: '#4b3427' }, cart.body);
  el('path', { d: 'M-22 -18v-8M22 -18v-8M-22 -26h44', stroke: '#3a2a22', 'stroke-width': 2, fill: 'none' }, cart.body);
  el('path', { d: 'M22 -18 40 -22', stroke: '#3a2a22', 'stroke-width': 2.4 }, cart.body);
  cart.wheels = [el('circle', { cx: -12, cy: -6, r: 6, fill: '#2b1f1a', stroke: '#8a6a52', 'stroke-width': 1.2 }, cart.body), el('circle', { cx: 12, cy: -6, r: 6, fill: '#2b1f1a', stroke: '#8a6a52', 'stroke-width': 1.2 }, cart.body)];
  cart.sacks = [];
  for (var cs = 0; cs < 4; cs++) {
    var q = el('g', { transform: 'translate(' + (-14 + cs * 9.5) + ',-18)', visibility: 'hidden' }, cart.body);
    el('rect', { x: -5.5, y: -9, width: 11, height: 9, rx: 3, fill: '#c9a779' }, q);
    cart.sacks.push(q);
  }

  /* ── people ───────────────────────────────────────────────── */
  var stackA = new Stack(238, 424, false);
  var stackB = { add: function () { if (cart.n < 4) cart.n++; } };

  var folks = [];
  function add(o) { var w = new Worker(o); folks.push(w); return w; }

  function pick(w) { w.carry = true; }
  function dropA(w) { w.carry = false; stackA.add(); }
  function dropB(w) { w.carry = false; stackB.add(); }

  /* loaders: gate to the left-hand stack */
  for (var i = 0; i < 3; i++) {
    var wa = add({ x: 560 - i * 70, y: 414 + i * 8, mode: 'walk', speed: 33 + i * 3,
      route: [{ x: 560, fn: pick, wait: 0.55 }, { x: 272, fn: dropA, wait: 0.5 }] });
    wa.carry = i === 1;
  }
  /* loaders: gate to the handcart */
  for (var j = 0; j < 2; j++) {
    add({ x: 650 + j * 90, y: 420 + j * 8, mode: 'walk', speed: 35,
      route: [{ x: 650, fn: pick, wait: 0.5 }, { x: 905, fn: dropB, wait: 0.5 }] }).carry = j === 0;
  }
  add({ x: 214, y: 428, mode: 'lift', dir: 1 });                                  /* stacker */
  var presser = add({ x: 478, y: 410, mode: 'press', dir: -1 });                              /* at the press */
  add({ x: 706, y: 420, mode: 'sort', dir: 1 });                                  /* sorters */
  add({ x: 754, y: 422, mode: 'sort', dir: -1 });
  var boss = add({ x: 602, y: 432, mode: 'idle', dir: -1, shirt: '#e8dfc9', cap: '#f4eedd' });
  var watch = add({ x: 40, y: 250, s: 0.8, mode: 'walk', speed: 15, lamp: true, shirt: '#33414f', cap: '#2e3a47',
    route: [{ x: 40, wait: 1.6 }, { x: 1000, wait: 1.6 }] });
  watch.o.keepMode = true;

  folks.sort(function (a, b) { return a.y - b.y; }).forEach(function (w) { people.appendChild(w.g); });

  /* ── the loop ─────────────────────────────────────────────── */
  var raf = 0, last = 0, clock = 0, visible = false;

  function frameFn(now) {
    if (!visible) { raf = 0; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;

    var mul = 1;
    var alarm = frame.classList.contains('is-siren');
    if (frame.classList.contains('is-running')) mul = 1.3;
    if (alarm) mul = 2.1;

    for (var i = 0; i < folks.length; i++) {
      var w = folks[i];
      if (w === boss) w.mode = alarm ? 'wave' : 'idle';
      w.step(dt, w === watch ? 1 : mul);
      if (w === watch && w.mode === 'lift') w.mode = 'idle';
      w.draw();
    }
    stackA.update(dt);

    /* press: lever, screw, platen, steam */
    var a = Math.sin(presser.p);
    var ang = a * 0.5;
    var lx = Math.cos(ang) * 24, ly = Math.sin(ang) * 24;
    setLine(press.lever, -lx, -58 - ly, lx, -58 + ly);
    press.knobL.setAttribute('cx', -lx); press.knobL.setAttribute('cy', -58 - ly);
    press.knobR.setAttribute('cx', lx); press.knobR.setAttribute('cy', -58 + ly);
    var down = (1 + a) / 2;
    press.plate.setAttribute('y', (-24 + down * 7).toFixed(1));
    press.screw.setAttribute('height', (26 + down * 7).toFixed(1));
    for (var s = 0; s < press.steam.length; s++) {
      var u = ((clock * 0.5 + s / 3) % 1);
      press.steam[s].setAttribute('cy', (-62 - u * 26).toFixed(1));
      press.steam[s].setAttribute('cx', (Math.sin(u * 5 + s) * 6).toFixed(1));
      press.steam[s].setAttribute('r', (3 + u * 6).toFixed(1));
      press.steam[s].setAttribute('opacity', (Math.sin(u * Math.PI) * 0.35 * (0.4 + down)).toFixed(2));
    }

    updateCrane(clock);

    /* handcart */
    cart.t += dt * mul;
    if (cart.state === 'wait') {
      if (cart.n >= 4 && cart.t > 0.8) { cart.state = 'go'; cart.t = 0; }
    } else if (cart.state === 'go') {
      cart.off += 70 * dt * mul;
      if (cart.off > 220) { cart.state = 'back'; cart.n = 0; cart.off = -220; }
    } else if (cart.state === 'back') {
      cart.off = Math.min(0, cart.off + 110 * dt * mul);
      if (cart.off >= 0) { cart.state = 'wait'; cart.t = 0; }
    }
    cart.g.setAttribute('transform', 'translate(' + (cart.x + cart.off).toFixed(1) + ',' + cart.y + ')');
    cart.g.setAttribute('opacity', (cart.state === 'go' ? Math.max(0, 1 - cart.off / 220) : cart.state === 'back' ? 1 - Math.abs(cart.off) / 220 : 1).toFixed(2));
    var spin = cart.state === 'wait' ? 0 : cart.off * 0.2;
    cart.wheels.forEach(function (c) { c.setAttribute('transform', 'rotate(' + (spin * 10) + ' ' + c.getAttribute('cx') + ' -6)'); });
    for (var k = 0; k < cart.sacks.length; k++) cart.sacks[k].setAttribute('visibility', k < cart.n ? 'visible' : 'hidden');

    raf = requestAnimationFrame(frameFn);
  }

  function start() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frameFn); } }

  if (reduced) {
    /* a still, mid-shift picture for people who ask for less motion */
    stackA.n = 4; cart.n = 3;
    folks.forEach(function (w) { w.p = 1.4; w.draw(); });
    stackA.update(0); updateCrane(3);
    for (var r = 0; r < cart.sacks.length; r++) cart.sacks[r].setAttribute('visibility', r < cart.n ? 'visible' : 'hidden');
    return;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) start();
    }, { threshold: 0.05 }).observe(frame);
  } else { visible = true; start(); }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { visible = false; } else {
      var r = frame.getBoundingClientRect();
      visible = r.bottom > 0 && r.top < window.innerHeight; start();
    }
  });

  /* a little depth: the yard leans toward the pointer */
  frame.addEventListener('pointermove', function (e) {
    var r = frame.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    svg.style.transform = 'perspective(1200px) rotateY(' + (x * 3.2).toFixed(2) + 'deg) rotateX(' + (-y * 2.4).toFixed(2) + 'deg) scale(1.02)';
  });
  frame.addEventListener('pointerleave', function () { svg.style.transform = ''; });
})();
