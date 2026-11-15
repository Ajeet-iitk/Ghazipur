/* ══════════════════════════════════════════════════════════════
   GHAZIPUR — the river, in sound.
   Everything here is synthesised at runtime with the Web Audio API.
   There are no audio files to load.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ctx = null, master = null, comp = null, verb = null, verbGain = null;
  var fx = null;                 /* effects bus: works even if the ambience is off */
  var chans = {};
  var noiseBuf = null;
  var started = false, playing = false, sfxOn = true;
  var masterLevel = 0.62;
  var timers = [];
  var droneNodes = [];

  var BASE = 138.59;              /* C#3 — a comfortable tonic */
  var SCALE = [1, 1.122, 1.26, 1.335, 1.498, 1.682, 1.888, 2];
  var melodyIndex = 3, melodyDir = 1;

  var LEVELS = { drone: 0.62, flute: 0.52, water: 0.38, birds: 0.30 };

  /* ── helpers ──────────────────────────────────────────────── */
  function t() { return ctx ? ctx.currentTime : 0; }

  function later(fn, ms) {
    var id = setTimeout(function () {
      timers = timers.filter(function (x) { return x !== id; });
      if (playing) fn();
    }, ms);
    timers.push(id);
    return id;
  }

  function makeNoise(seconds, brown) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c), last = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
        else d[i] = w;
      }
    }
    return buf;
  }

  function makeImpulse(seconds, decay) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function gainNode(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
  function filter(type, f, q) {
    var b = ctx.createBiquadFilter();
    b.type = type; b.frequency.value = f; if (q) b.Q.value = q;
    return b;
  }

  /* ── build the world ──────────────────────────────────────── */
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 30;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.5;

    master = gainNode(0.0001);
    master.connect(comp);
    comp.connect(ctx.destination);

    fx = gainNode(0.82);
    fx.connect(comp);

    verb = ctx.createConvolver();
    verb.buffer = makeImpulse(3.4, 2.6);
    verbGain = gainNode(0.55);
    verb.connect(verbGain);
    verbGain.connect(master);

    noiseBuf = makeNoise(4, true);

    /* channel strips */
    ['drone', 'flute', 'water', 'birds'].forEach(function (id) {
      var g = gainNode(0.0001);
      g.connect(master);
      var send = gainNode(id === 'drone' ? 0.10 : 0.5);
      g.connect(send);
      send.connect(verb);
      chans[id] = { gain: g, send: send };
    });

    /* ── drone: three soft strings of a tanpura ── */
    var dF = filter('lowpass', 1100, 0.6);
    dF.connect(chans.drone.gain);

    [ [BASE / 2, 'sine', 0.55], [BASE * 1.5, 'triangle', 0.18], [BASE, 'sine', 0.30] ].forEach(function (o) {
      var osc = ctx.createOscillator();
      osc.type = o[1];
      osc.frequency.value = o[0];
      osc.detune.value = (Math.random() - 0.5) * 6;
      var g = gainNode(o[2] * 0.10);
      osc.connect(g);
      g.connect(dF);
      osc.start();
      droneNodes.push(osc);
    });

    /* slow filter breathing */
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    var lfoG = gainNode(220);
    lfo.connect(lfoG);
    lfoG.connect(dF.frequency);
    lfo.start();
    droneNodes.push(lfo);

    /* ── water: filtered noise, lapping ── */
    var wSrc = ctx.createBufferSource();
    wSrc.buffer = makeNoise(4, true);
    wSrc.loop = true;
    var wF = filter('lowpass', 620, 0.4);
    var wG = gainNode(0.16);
    wSrc.connect(wF); wF.connect(wG); wG.connect(chans.water.gain);
    wSrc.start();
    droneNodes.push(wSrc);

    var wLfo = ctx.createOscillator();
    wLfo.frequency.value = 0.13;
    var wLfoG = gainNode(0.055);
    wLfo.connect(wLfoG); wLfoG.connect(wG.gain);
    wLfo.start();
    droneNodes.push(wLfo);

    var hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuf; hiss.loop = true;
    var hF = filter('bandpass', 2400, 0.7);
    var hG = gainNode(0.045);
    hiss.connect(hF); hF.connect(hG); hG.connect(chans.water.gain);
    hiss.start();
    droneNodes.push(hiss);

    started = true;
  }

  /* ── voices ───────────────────────────────────────────────── */
  function pluck(freq, when, amp) {
    var out = gainNode(0.0001);
    out.connect(chans.drone.gain);
    var send = gainNode(0.35);
    out.connect(send); send.connect(verb);
    var partials = [1, 2, 3, 4.02, 5.4];
    var gains = [1, 0.42, 0.24, 0.12, 0.07];
    var dur = 4.2;
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * partials[i];
      o.detune.value = (Math.random() - 0.5) * 4;
      var g = gainNode(0.0001);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(amp * gains[i], when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur * (1 - i * 0.09));
      o.connect(g); g.connect(out);
      o.start(when); o.stop(when + dur + 0.2);
    }
    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(amp * 0.55, when + 0.02);
    out.gain.exponentialRampToValueAtTime(0.0001, when + 3.6);
  }

  function tanpuraLoop() {
    if (!playing) return;
    var seq = [BASE / 2, BASE * 0.75, BASE, BASE];
    var when = t() + 0.05;
    for (var i = 0; i < seq.length; i++) {
      pluck(seq[i], when + i * 1.35, 0.10);
    }
    later(tanpuraLoop, 4 * 1350 + 120);
  }

  function fluteNote() {
    if (!playing) return;

    melodyIndex += melodyDir * (Math.random() < 0.72 ? 1 : 2);
    if (melodyIndex > 7) { melodyIndex = 6; melodyDir = -1; }
    if (melodyIndex < 0) { melodyIndex = 1; melodyDir = 1; }
    if (Math.random() < 0.12) melodyDir *= -1;

    var freq = BASE * 2 * SCALE[Math.max(0, Math.min(7, melodyIndex))];
    var when = t() + 0.06;
    var dur = 2.4 + Math.random() * 2.6;

    var out = gainNode(0.0001);
    out.connect(chans.flute.gain);

    var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2;
    var g2 = gainNode(0.06);
    o2.connect(g2); g2.connect(out);

    var vib = ctx.createOscillator(); vib.frequency.value = 4.4;
    var vibG = gainNode(freq * 0.004);
    vib.connect(vibG); vibG.connect(o1.frequency);

    var breath = ctx.createBufferSource(); breath.buffer = noiseBuf; breath.loop = true;
    var bp = filter('bandpass', freq * 1.9, 1.1);
    var bg = gainNode(0.012);
    breath.connect(bp); bp.connect(bg); bg.connect(out);

    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(0.085, when + 0.45);
    out.gain.setValueAtTime(0.085, when + dur * 0.6);
    out.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    o1.connect(out);
    o1.start(when); o2.start(when); vib.start(when); breath.start(when);
    var end = when + dur + 0.15;
    o1.stop(end); o2.stop(end); vib.stop(end); breath.stop(end);

    later(fluteNote, (dur + 1.4 + Math.random() * 3.8) * 1000);
  }

  function chirp(when) {
    var f0 = 2200 + Math.random() * 1600;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.42, when + 0.045);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.9, when + 0.10);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.05, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    o.connect(g);
    g.connect(chans.birds.gain);
    var s = gainNode(0.4); g.connect(s); s.connect(verb);
    o.start(when); o.stop(when + 0.2);
  }

  function birdLoop() {
    if (!playing) return;
    var n = 1 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) chirp(t() + 0.05 + i * (0.14 + Math.random() * 0.12));
    later(birdLoop, 4500 + Math.random() * 11000);
  }

  /* ── effects ──────────────────────────────────────────────── */
  function bellSound() {
    if (!ctx) return;
    if (!playing) start();
    var when = t() + 0.02;
    var base = 300 + Math.random() * 18;
    var partials = [1, 2.02, 2.98, 4.16, 5.43, 6.79];
    var amps = [1, 0.55, 0.42, 0.24, 0.14, 0.08];
    var out = gainNode(1);
    out.connect(master);
    var send = gainNode(0.6); out.connect(send); send.connect(verb);
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * partials[i];
      var g = gainNode(0.0001);
      var dec = 5.5 - i * 0.55;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.10 * amps[i], when + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      o.connect(g); g.connect(out);
      o.start(when); o.stop(when + dec + 0.1);
    }
    /* strike transient */
    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var nf = filter('bandpass', 1800, 1.4);
    var ng = gainNode(0.0001);
    ng.gain.setValueAtTime(0.0001, when);
    ng.gain.exponentialRampToValueAtTime(0.09, when + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    nz.connect(nf); nf.connect(ng); ng.connect(out);
    nz.start(when); nz.stop(when + 0.15);
  }

  /* a hanging temple bell: bright brass strike, long hum; n picks one of five pitches */
  function templeBell(n) {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.01;
    var base = [262, 294, 330, 392, 440][(n | 0) % 5] * (1 + (Math.random() - 0.5) * 0.004);
    var partials = [1, 2.0, 2.76, 5.4, 8.9], amps = [1, 0.6, 0.45, 0.2, 0.09];
    var out = gainNode(0.9); out.connect(fx);
    var send = gainNode(0.7); out.connect(send); send.connect(verb);
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = base * partials[i];
      var g = gainNode(0.0001), dec = 4.2 - i * 0.6;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.13 * amps[i], when + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      o.connect(g); g.connect(out);
      o.start(when); o.stop(when + dec + 0.1);
    }
    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var nf = filter('bandpass', 3200, 1.2), ng = gainNode(0.0001);
    ng.gain.setValueAtTime(0.0001, when);
    ng.gain.exponentialRampToValueAtTime(0.07, when + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    nz.connect(nf); nf.connect(ng); ng.connect(out);
    nz.start(when); nz.stop(when + 0.1);
  }

  function chime() {
    if (!ctx || !playing || !sfxOn) return;
    var when = t() + 0.01;
    [1046.5, 1568, 2093].forEach(function (f, i) {
      var o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      var g = gainNode(0.0001);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.030 / (i + 1), when + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.75 - i * 0.15);
      o.connect(g); g.connect(master);
      var s = gainNode(0.5); g.connect(s); s.connect(verb);
      o.start(when); o.stop(when + 0.9);
    });
  }

  function plop() {
    if (!ctx || !playing || !sfxOn) return;
    var when = t() + 0.01;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(620 + Math.random() * 180, when);
    o.frequency.exponentialRampToValueAtTime(170, when + 0.16);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.075, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    o.connect(g); g.connect(master);
    var s = gainNode(0.35); g.connect(s); s.connect(verb);
    o.start(when); o.stop(when + 0.3);

    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var nf = filter('lowpass', 900, 0.8);
    var ng = gainNode(0.0001);
    ng.gain.setValueAtTime(0.0001, when);
    ng.gain.exponentialRampToValueAtTime(0.05, when + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    nz.connect(nf); nf.connect(ng); ng.connect(master);
    nz.start(when); nz.stop(when + 0.16);
  }

  function tick() {
    if (!ctx || !playing || !sfxOn) return;
    var when = t() + 0.005;
    var o = ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = 1850 + Math.random() * 300;
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.014, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when + 0.08);
  }

  /* ── machine and water effects ─────────────────────────────── */
  function ensureFx() {
    if (!ctx) build();
    if (ctx.state === 'suspended') ctx.resume();
    return !!ctx;
  }

  function oar(power) {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.01;
    var amp = 0.085 * (power === undefined ? 1 : Math.max(0.2, Math.min(1.4, power)));

    /* the blade pulling through water */
    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var bp = filter('bandpass', 1100, 0.75);
    bp.frequency.setValueAtTime(1500, when);
    bp.frequency.exponentialRampToValueAtTime(320, when + 0.34);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(amp, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.38);
    nz.connect(bp); bp.connect(g); g.connect(fx);
    var send = gainNode(0.22); g.connect(send); send.connect(verb);
    nz.start(when); nz.stop(when + 0.42);

    /* the wooden knock in the rowlock */
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(168, when);
    o.frequency.exponentialRampToValueAtTime(78, when + 0.13);
    var og = gainNode(0.0001);
    og.gain.setValueAtTime(0.0001, when);
    og.gain.exponentialRampToValueAtTime(0.038, when + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 0.17);
    o.connect(og); og.connect(fx);
    o.start(when); o.stop(when + 0.2);
  }

  function coin() {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.01;
    [880, 1174.66, 1567.98].forEach(function (f, i) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      var g = gainNode(0.0001);
      var at = when + i * 0.055;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.055 / (i * 0.6 + 1), at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.55 - i * 0.08);
      o.connect(g); g.connect(fx);
      var s = gainNode(0.55); g.connect(s); s.connect(verb);
      o.start(at); o.stop(at + 0.62);
    });
  }

  function thud() {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.01;
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(96, when);
    o.frequency.exponentialRampToValueAtTime(48, when + 0.22);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.16, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
    o.connect(g); g.connect(fx);
    o.start(when); o.stop(when + 0.3);

    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var lp = filter('lowpass', 520, 0.8);
    var ng = gainNode(0.0001);
    ng.gain.setValueAtTime(0.0001, when);
    ng.gain.exponentialRampToValueAtTime(0.05, when + 0.008);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    nz.connect(lp); lp.connect(ng); ng.connect(fx);
    nz.start(when); nz.stop(when + 0.2);
  }

  function clack() {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.005;
    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var bp = filter('bandpass', 2600, 1.5);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.022, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
    nz.connect(bp); bp.connect(g); g.connect(fx);
    nz.start(when); nz.stop(when + 0.1);
  }


  /* ── weather: rain, thunder, and a splash for the river's own animals ── */
  var rainNode = null, rainLevel = 0;

  function applyRain() {
    if (!rainNode || !ctx) return;
    var v = sfxOn ? rainLevel : 0;
    rainNode.g.gain.setTargetAtTime(Math.max(0.0001, v * 0.13), t(), 0.9);
  }

  function setRain(level) {
    rainLevel = Math.max(0, Math.min(1, level));
    if (!rainNode) {
      if (rainLevel <= 0 || !ensureFx()) return;
      var white = makeNoise(3, false);
      var hiSrc = ctx.createBufferSource(); hiSrc.buffer = white; hiSrc.loop = true;
      var hp = filter('highpass', 1100, 0.5), lp = filter('lowpass', 7600, 0.5);
      var g = gainNode(0.0001);
      hiSrc.connect(hp); hp.connect(lp); lp.connect(g);
      /* the low patter on leaves and roofs */
      var loSrc = ctx.createBufferSource(); loSrc.buffer = noiseBuf; loSrc.loop = true;
      var bp = filter('bandpass', 520, 0.7);
      var lg = gainNode(0.9);
      loSrc.connect(bp); bp.connect(lg); lg.connect(g);
      g.connect(fx);
      var send = gainNode(0.18); g.connect(send); send.connect(verb);
      hiSrc.start(); loSrc.start();
      rainNode = { g: g };
    }
    applyRain();
  }

  function thunder() {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.02, dur = 3.6;
    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var lp = filter('lowpass', 900, 0.7);
    lp.frequency.setValueAtTime(900, when);
    lp.frequency.exponentialRampToValueAtTime(90, when + dur);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.55, when + 0.08);
    g.gain.exponentialRampToValueAtTime(0.16, when + 0.7);
    g.gain.exponentialRampToValueAtTime(0.34, when + 1.05);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    nz.connect(lp); lp.connect(g); g.connect(fx);
    var send = gainNode(0.5); g.connect(send); send.connect(verb);
    nz.start(when); nz.stop(when + dur + 0.1);

    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(62, when);
    o.frequency.exponentialRampToValueAtTime(30, when + 1.5);
    var og = gainNode(0.0001);
    og.gain.setValueAtTime(0.0001, when);
    og.gain.exponentialRampToValueAtTime(0.24, when + 0.1);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 1.7);
    o.connect(og); og.connect(fx);
    o.start(when); o.stop(when + 1.8);
  }

  function splash(size) {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.005, a = 0.05 * (size === undefined ? 1 : size);
    var nz = ctx.createBufferSource(); nz.buffer = noiseBuf;
    var bp = filter('bandpass', 1500, 0.8);
    bp.frequency.setValueAtTime(1900, when);
    bp.frequency.exponentialRampToValueAtTime(380, when + 0.4);
    var g = gainNode(0.0001);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(a, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.45);
    nz.connect(bp); bp.connect(g); g.connect(fx);
    var send = gainNode(0.3); g.connect(send); send.connect(verb);
    nz.start(when); nz.stop(when + 0.5);
  }

  /* an electromechanical factory siren: a rotor, a horn, and a warning */
  function siren() {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.02;
    var dur = 3.5;

    var out = gainNode(0.0001);
    out.connect(fx);
    var send = gainNode(0.3); out.connect(send); send.connect(verb);

    /* a little grit, so it reads as a machine and not a synth patch */
    var shaper = ctx.createWaveShaper();
    var curve = new Float32Array(1024);
    for (var i = 0; i < 1024; i++) {
      var x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(x * 3.2);
    }
    shaper.curve = curve;
    var lp = filter('lowpass', 2600, 0.7);
    shaper.connect(lp); lp.connect(out);

    var o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(280, when);
    o1.frequency.linearRampToValueAtTime(660, when + 0.9);
    o1.frequency.setValueAtTime(660, when + 1.9);
    o1.frequency.linearRampToValueAtTime(300, when + 3.3);
    o1.connect(shaper);

    var o2 = ctx.createOscillator(); o2.type = 'square';
    o2.frequency.setValueAtTime(420, when);
    o2.frequency.linearRampToValueAtTime(990, when + 0.9);
    o2.frequency.setValueAtTime(990, when + 1.9);
    o2.frequency.linearRampToValueAtTime(450, when + 3.3);
    var o2g = gainNode(0.16);
    o2.connect(o2g); o2g.connect(shaper);

    /* air moving through the horn */
    var air = ctx.createBufferSource(); air.buffer = noiseBuf; air.loop = true;
    var ap = filter('bandpass', 1350, 1.1);
    var ag = gainNode(0.012);
    air.connect(ap); ap.connect(ag); ag.connect(out);

    /* a slow wobble, the way a rotor loads and unloads */
    var lfo = ctx.createOscillator(); lfo.frequency.value = 7.4;
    var lfoG = gainNode(0.018);
    lfo.connect(lfoG); lfoG.connect(out.gain);

    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(0.14, when + 0.12);
    out.gain.setValueAtTime(0.14, when + 2.8);
    out.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    o1.start(when); o2.start(when); air.start(when); lfo.start(when);
    o1.stop(when + dur + 0.1); o2.stop(when + dur + 0.1);
    air.stop(when + dur + 0.1); lfo.stop(when + dur + 0.1);
  }

  /* a short two-tone factory hooter, used by the yard railway */
  function whistle() {
    if (!sfxOn || !ensureFx()) return;
    var when = t() + 0.01;
    [[392, 0], [523.25, 0.26]].forEach(function (n) {
      var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = n[0];
      var g = gainNode(0.0001);
      var at = when + n[1];
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.055, at + 0.03);
      g.gain.setValueAtTime(0.055, at + 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
      o.connect(g); g.connect(fx);
      var s = gainNode(0.4); g.connect(s); s.connect(verb);
      o.start(at); o.stop(at + 0.4);
    });
  }

  /* ── transport ────────────────────────────────────────────── */
  function applyLevels() {
    if (!ctx) return;
    var when = t();
    Object.keys(chans).forEach(function (id) {
      chans[id].gain.gain.setTargetAtTime(LEVELS[id], when, 0.15);
    });
  }

  function start() {
    if (!started) build();
    if (playing) return;
    playing = true;
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(t());
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t());
    master.gain.linearRampToValueAtTime(masterLevel, t() + 1.6);
    applyLevels();
    later(function () { tanpuraLoop(); }, 600);
    later(function () { fluteNote(); }, 2200);
    later(function () { birdLoop(); }, 4200);
    document.documentElement.setAttribute('data-audio', 'on');
  }

  function stop() {
    if (!ctx || !playing) return;
    playing = false;
    timers.forEach(clearTimeout);
    timers = [];
    master.gain.cancelScheduledValues(t());
    master.gain.setValueAtTime(master.gain.value, t());
    master.gain.linearRampToValueAtTime(0.0001, t() + 0.9);
    document.documentElement.setAttribute('data-audio', 'off');
  }

  function toggle() {
    if (!started) { start(); return true; }
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) { stop(); return false; }
    start(); return true;
  }

  window.Ambient = {
    start: start,
    stop: stop,
    toggle: toggle,
    isOn: function () { return playing; },
    setLevel: function (id, v) { LEVELS[id] = Math.max(0, Math.min(1, v)); applyLevels(); },
    getLevel: function (id) { return LEVELS[id]; },
    setMaster: function (v) {
      masterLevel = Math.max(0, Math.min(1, v)) * 0.95;
      if (ctx && playing) {
        master.gain.setTargetAtTime(masterLevel, t(), 0.1);
      }
      if (ctx && fx) fx.gain.setTargetAtTime(0.82 * Math.max(0.05, masterLevel), t(), 0.1);
    },
    setSfx: function (on) { sfxOn = !!on; applyRain(); },
    setRain: setRain,
    thunder: thunder,
    splash: splash,
    sfxEnabled: function () { return sfxOn; },
    getMaster: function () { return masterLevel; },
    bell: bellSound,
    templeBell: templeBell,
    chime: chime,
    plop: plop,
    tick: tick,
    oar: oar,
    coin: coin,
    thud: thud,
    clack: clack,
    siren: siren,
    whistle: whistle
  };
})();
