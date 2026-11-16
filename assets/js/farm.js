/* ══════════════════════════════════════════════════════════════
   RAMU'S FARM — a small animated farm near Ghazipur.
   Plough with a tractor, grow vegetables, feed and milk the cows, rear a calf,
   and put solar panels over the crops (agrovoltaics). A short story runs
   through it. Everything is drawn in code. Works with mouse and touch.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')'; }

  /* ── words, in English and Hindi ─────────────────────────── */
  var STR = {
    en: {
      back: 'Ghazipur', title: "Ajeet's Farm", tank: 'Water', power: 'Solar', drag: 'drag to look around',
      hoe: 'Hoe', tractor: 'Tractor', seed: 'Seeds', water: 'Water', harvest: 'Harvest', feed: 'Feed', milk: 'Milk', solar: 'Solar',
      tomato: 'Tomato', brinjal: 'Brinjal', cauli: 'Cauliflower', okra: 'Okra',
      sellVeg: 'Sell vegetables ({n})', sellMilk: 'Sell milk ({n})', buyHay: 'Buy hay · 5 for 5', buyCalf: 'Buy a calf · 40',
      day: 'Day', coins: 'coins',
      t_hoe: 'Hoe: tap a bare plot and Ajeet will turn the soil by hand.', t_tractor: 'Tractor: tap any plot, and the tractor ploughs that whole row.',
      t_seed: 'Seeds: pick a vegetable, then tap a ploughed plot. Each packet costs 2 coins.', t_water: 'Water: tap a planted plot. The tank refills faster with solar power.',
      t_harvest: 'Harvest: tap a ripe plot to pick the vegetables.', t_feed: 'Feed: tap a cow. Hungry cows give no milk.', t_milk: 'Milk: tap a cow whose bucket is full.', t_solar: 'Solar: build panels over a plot for 30 coins. Tap again to remove them.',
      next: 'Next', go: "Let's go",
      noCoins: 'Not enough coins.', noHay: 'No hay left. Buy some at the mandi.', noWater: 'The tank is empty. Wait for it to refill.', notReady: 'Not ready yet.', needPlough: 'Plough the plot first.', wrongSpot: 'Nothing to do there.', herdFull: 'The shed is full.',
      fedMsg: 'Munch, munch.', milkMsg: '+1 milk', sold: 'Sold for {n} coins.', nothingSell: 'Nothing to sell yet.', calfMsg: 'A calf is born!', grew: 'The calf has grown into a cow!', panelMsg: 'Panels up. Crops get shade, the farm gets power.', gridMsg: '+1 coin: surplus power sold to the grid', allDone: 'Story complete. Keep farming!',
      quest: 'Chapter {n} of 7', q0t: 'The tractor', q0d: 'Choose the Tractor, then tap a plot to plough its row.',
      q1t: 'First seeds', q1d: 'Choose Seeds and plant 3 plots ({a}/3).', q2t: 'Water', q2d: 'Water 3 plants ({a}/3).', q3t: 'The cows', q3d: 'Feed a cow, then milk her ({a}/2).',
      q4t: 'Agrovoltaics', q4d: 'Build a solar panel over a plot (Solar tool).', q5t: 'To the mandi', q5d: 'Harvest 3 vegetables and sell them ({a}/4).', q6t: 'A calf for Priya', q6d: 'Buy a calf at the mandi button.', q7t: 'The farm is yours', q7d: 'Grow, milk, power, sell. As you like.',
      Ajeet: 'Ajeet', Priya: 'Priya', Amma: 'Amma',
      s0: [['Ajeet', 'Good morning! The monsoon has gone and the soil is soft. Time to get the fields ready.'], ['Priya', 'Baba, can I drive the tractor?'], ['Ajeet', 'Ha ha, not yet, beti. Watch how it ploughs a whole row in one go.']],
      s0d: [['Ajeet', 'Look at that. Four hours of work with a hoe, done in four minutes.']],
      s1: [['Priya', 'Now we plant! Tomato, brinjal, cauliflower, okra. Which one will grow fastest?'], ['Ajeet', 'Okra, for sure. But the mandi pays more for cauliflower.']],
      s1d: [['Ajeet', 'Good seeds, good soil. Now the little ones need water.']],
      s2: [['Ajeet', 'Take the can. Water the roots, not the leaves. And not at noon, when the sun is fierce.']],
      s2d: [['Priya', 'The soil is dark and happy. Look, a sprout!']],
      s3: [['Amma', 'Ajeet, the cows are hungry, and I want fresh milk for the tea.'], ['Priya', 'I will help! Feed first, then milk.']],
      s3d: [['Amma', 'Ah, warm milk. Now this is a good morning.']],
      s4: [['Priya', 'Baba, the sun is so hot on the crops at noon. Poor tomatoes!'], ['Ajeet', 'The engineer from the town told me something clever. Panels over the crops, high up on stilts.'], ['Ajeet', 'The plants get shade and use less water. The panels make power for the pump and the lights. One field, two harvests: this is agrovoltaics.']],
      s4d: [['Priya', 'Now the tank fills fast, and our lamp will glow at night!']],
      s5: [['Ajeet', 'Pick the ripe vegetables and take them to the mandi. Use the Sell button.']],
      s5d: [['Ajeet', 'Coins in my pocket. Not bad for a few weeks.']],
      s6: [['Priya', 'Baba, can we have a calf? I will look after her, I promise.'], ['Ajeet', 'Hmm. Forty coins. Let us see if you can keep your word.']],
      s6d: [['Priya', 'I will call her Gauri!'], ['Ajeet', 'Good. Now the farm is truly a family.']],
      s7: [['Amma', 'Ajeet, look at the sunset over the field. Tractor, cows, panels, vegetables. Who would have thought.'], ['Ajeet', 'This is only the beginning. Keep growing!']]
    },
    hi: {
      back: 'गाजीपुर', title: 'अजीत का खेत', tank: 'पानी', power: 'सौर', drag: 'घुमाने के लिए खींचिए',
      hoe: 'कुदाल', tractor: 'ट्रैक्टर', seed: 'बीज', water: 'पानी', harvest: 'कटाई', feed: 'चारा', milk: 'दूध', solar: 'सौर',
      tomato: 'टमाटर', brinjal: 'बैंगन', cauli: 'फूलगोभी', okra: 'भिंडी',
      sellVeg: 'सब्ज़ी बेचिए ({n})', sellMilk: 'दूध बेचिए ({n})', buyHay: 'भूसा लीजिए · 5 का 5', buyCalf: 'बछड़ा लीजिए · 40',
      day: 'दिन', coins: 'सिक्के',
      t_hoe: 'कुदाल: ख़ाली क्यारी पर दबाइए, अजीत हाथ से मिट्टी पलटेगा।', t_tractor: 'ट्रैक्टर: किसी क्यारी पर दबाइए, ट्रैक्टर पूरी पंक्ति जोत देगा।',
      t_seed: 'बीज: सब्ज़ी चुनिए, फिर जुती क्यारी पर दबाइए। हर पैकेट 2 सिक्के।', t_water: 'पानी: बोई हुई क्यारी पर दबाइए। सौर ऊर्जा से टंकी जल्दी भरती है।',
      t_harvest: 'कटाई: पकी क्यारी पर दबाइए।', t_feed: 'चारा: गाय पर दबाइए। भूखी गाय दूध नहीं देती।', t_milk: 'दूध: जिस गाय की बाल्टी भरी हो उस पर दबाइए।', t_solar: 'सौर: क्यारी पर 30 सिक्कों में पैनल लगाइए। फिर दबाने पर हट जाते हैं।',
      next: 'आगे', go: 'चलिए',
      noCoins: 'सिक्के कम हैं।', noHay: 'भूसा ख़त्म। मंडी से लीजिए।', noWater: 'टंकी ख़ाली है। भरने दीजिए।', notReady: 'अभी तैयार नहीं।', needPlough: 'पहले क्यारी जोतिए।', wrongSpot: 'वहाँ कुछ करने को नहीं।', herdFull: 'बाड़ा भर गया है।',
      fedMsg: 'चबर-चबर।', milkMsg: '+1 दूध', sold: '{n} सिक्कों में बिका।', nothingSell: 'अभी बेचने को कुछ नहीं।', calfMsg: 'बछड़ा हुआ है!', grew: 'बछड़ा बड़ी गाय बन गया!', panelMsg: 'पैनल लग गए। फ़सल को छाँव, खेत को बिजली।', gridMsg: '+1 सिक्का: बची बिजली ग्रिड को बेची', allDone: 'कहानी पूरी। खेती चलती रहे!',
      quest: 'अध्याय {n} / 7', q0t: 'ट्रैक्टर', q0d: 'ट्रैक्टर चुनिए, फिर क्यारी पर दबाकर पंक्ति जोतिए।',
      q1t: 'पहले बीज', q1d: 'बीज चुनिए और 3 क्यारियाँ बोइए ({a}/3)।', q2t: 'पानी', q2d: '3 पौधों को पानी दीजिए ({a}/3)।', q3t: 'गायें', q3d: 'गाय को चारा दीजिए, फिर दूध दुहिए ({a}/2)।',
      q4t: 'एग्रीवोल्टेइक्स', q4d: 'किसी क्यारी पर सौर पैनल लगाइए (सौर औज़ार)।', q5t: 'मंडी तक', q5d: '3 सब्ज़ियाँ काटिए और बेचिए ({a}/4)।', q6t: 'प्रिया का बछड़ा', q6d: 'मंडी बटन से बछड़ा लीजिए।', q7t: 'खेत अब आपका', q7d: 'उगाइए, दुहिए, बिजली बनाइए, बेचिए। जैसा चाहें।',
      Ajeet: 'अजीत', Priya: 'प्रिया', Amma: 'अम्मा',
      s0: [['Ajeet', 'सुप्रभात! बरसात चली गई, मिट्टी नरम है। खेत तैयार करने का समय है।'], ['Priya', 'बाबा, मैं ट्रैक्टर चला लूँ?'], ['Ajeet', 'अभी नहीं बेटी। देखो, यह पूरी पंक्ति एक बार में जोत देता है।']],
      s0d: [['Ajeet', 'देखा? कुदाल से चार घंटे का काम, चार मिनट में।']],
      s1: [['Priya', 'अब बुवाई! टमाटर, बैंगन, फूलगोभी, भिंडी। कौन सबसे जल्दी उगेगा?'], ['Ajeet', 'भिंडी। पर मंडी में फूलगोभी के दाम ज़्यादा मिलते हैं।']],
      s1d: [['Ajeet', 'अच्छे बीज, अच्छी मिट्टी। अब नन्हों को पानी चाहिए।']],
      s2: [['Ajeet', 'झारी लो। जड़ों में पानी दो, पत्तों पर नहीं। और दोपहर की कड़ी धूप में नहीं।']],
      s2d: [['Priya', 'मिट्टी काली और ख़ुश है। देखो, अंकुर!']],
      s3: [['Amma', 'अजीत, गायें भूखी हैं, और चाय के लिए ताज़ा दूध चाहिए।'], ['Priya', 'मैं मदद करूँगी! पहले चारा, फिर दूध।']],
      s3d: [['Amma', 'आहा, गरम दूध। यही है अच्छी सुबह।']],
      s4: [['Priya', 'बाबा, दोपहर में फ़सल पर कितनी धूप पड़ती है। बेचारे टमाटर!'], ['Ajeet', 'शहर के इंजीनियर ने एक होशियारी की बात बताई। फ़सल के ऊपर खंभों पर पैनल।'], ['Ajeet', 'पौधों को छाँव मिलती है, पानी कम लगता है, और पैनल पंप और बत्ती के लिए बिजली बनाते हैं। एक खेत, दो फ़सलें: यही एग्रीवोल्टेइक्स है।']],
      s4d: [['Priya', 'अब टंकी जल्दी भरेगी और रात को हमारी बत्ती जलेगी!']],
      s5: [['Ajeet', 'पकी सब्ज़ियाँ तोड़ो और मंडी ले चलो। बेचने का बटन दबाओ।']],
      s5d: [['Ajeet', 'जेब में सिक्के। कुछ हफ़्तों के लिए बुरा नहीं।']],
      s6: [['Priya', 'बाबा, एक बछड़ा ले लें? मैं ख़ूब ध्यान रखूँगी, पक्का।'], ['Ajeet', 'हूँ। चालीस सिक्के। देखें तुम वादा निभाती हो या नहीं।']],
      s6d: [['Priya', 'मैं उसे गौरी बुलाऊँगी!'], ['Ajeet', 'ठीक है। अब खेत सच में परिवार है।']],
      s7: [['Amma', 'अजीत, खेत पर सूर्यास्त देखो। ट्रैक्टर, गायें, पैनल, सब्ज़ियाँ। किसने सोचा था।'], ['Ajeet', 'यह तो बस शुरुआत है। बढ़ते रहो!']]
    }
  };
  var lang = store.get('gzp.lang') === 'hi' ? 'hi' : 'en';
  function T(k, o) { var s = (STR[lang][k] !== undefined ? STR[lang][k] : STR.en[k]) || k; if (typeof s !== 'string') return s; return s.replace(/\{(\w+)\}/g, function (m, x) { return o && o[x] !== undefined ? o[x] : m; }); }

  /* ── the world ───────────────────────────────────────────── */
  var VW = 960, VH = 540;
  var cv = $('#farm'), g = cv.getContext('2d'), stage = $('#stage');
  var scale = 1, camX = 0, camY = 0, viewW = VW, viewH = VH, dpr = 1, userPan = 0;
  var CROPS = {
    tomato: { col: [214, 62, 42], grow: 22, price: 8, name: 'tomato' }, brinjal: { col: [110, 54, 128], grow: 26, price: 10, name: 'brinjal' },
    cauli: { col: [244, 240, 226], grow: 32, price: 14, name: 'cauli' }, okra: { col: [92, 160, 60], grow: 16, price: 6, name: 'okra' }
  };
  var DAY = 120;                                   /* seconds in one farm day */
  var S = { t: 0.04 * DAY, day: 1, coins: 20, hay: 8, veg: 0, milk: 0, tank: 60, power: 0, tool: 'hoe', crop: 'tomato', grid: 0 };
  var st = { rows: 0, seed: 0, water: 0, fed: 0, milked: 0, panels: 0, harvest: 0, sold: 0, calves: 0 };
  var plots = [];
  for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) plots.push({ r: r, c: c, x: 330 + c * 118, y: 318 + r * 76, w: 110, h: 66, state: 'empty', crop: null, prog: 0, water: 0, panel: false, plough: 0 });
  var cows = [], hens = [], dog, farmer, priya, amma, tractor, jobs = [], cur = null, floats = [], parts = [], clouds = [], birds = [], flies = [], talkQ = [], talkOpen = false, quest = 0, questLock = false, shown = {};
  var PEN = { x0: 716, x1: 926, y0: 392, y1: 506 }, PARK = { x: 220, y: 506 }, HOUSE = { x: 40, y: 170, w: 210, h: 150 }, TANK = { x: 668, y: 300 };

  function mkCow(i, calf) {
    var cols = [[[250, 246, 236], [150, 100, 60]], [[222, 188, 150], [250, 240, 224]], [[40, 34, 30], [250, 246, 236]], [[245, 242, 232], [60, 50, 44]]][i % 4];
    return { id: i, x: rnd(PEN.x0 + 20, PEN.x1 - 20), y: rnd(PEN.y0 + 30, PEN.y1 - 10), tx: 0, ty: 0, dir: 1, w: 0, hunger: rnd(0.3, 0.7), milk: rnd(0.2, 0.8), calf: !!calf, age: 0, wait: rnd(0, 3), chew: 0, c: cols, tail: rnd(0, 6), moo: 0 };
  }
  function init() {
    cows = [mkCow(0), mkCow(1)];
    for (var i = 0; i < 4; i++) hens.push({ x: rnd(60, 250), y: rnd(330, 420), tx: 0, ty: 0, dir: 1, w: 0, peck: rnd(0, 6), wait: rnd(0, 2) });
    dog = { x: 200, y: 400, dir: 1, w: 0, wag: 0 };
    farmer = { x: 280, y: 372, dir: 1, w: 0, act: null, actT: 0, vis: true, talk: 0 };
    priya = { x: 150, y: 420, dir: 1, w: 0, tx: 150, ty: 420, wait: 1, jump: 0 };
    amma = { x: 118, y: 322, st: 0 };
    tractor = { x: PARK.x, y: PARK.y, dir: 1, state: 'park', row: 0, w: 0, smoke: 0, plowed: 0 };
    for (i = 0; i < 6; i++) clouds.push({ x: rnd(0, VW), y: rnd(30, 120), s: rnd(0.6, 1.4), v: rnd(4, 10) });
    for (i = 0; i < 4; i++) birds.push({ x: rnd(0, VW), y: rnd(50, 150), v: rnd(30, 60), ph: rnd(0, 6) });
    for (i = 0; i < 5; i++) flies.push({ x: rnd(300, 700), y: rnd(300, 480), ph: rnd(0, 6), c: ['#f2a63b', '#e5557a', '#fff'][i % 3] });
  }

  /* ── sound: a few small synthesised sounds ───────────────── */
  var ac = null;
  function sfx(k) {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var t = ac.currentTime, o = ac.createOscillator(), gn = ac.createGain(); o.connect(gn); gn.connect(ac.destination);
      var f = { coin: [880, 1320, 0.16, 'sine'], tick: [520, 600, 0.06, 'triangle'], water: [300, 180, 0.2, 'sine'], moo: [150, 95, 0.7, 'sawtooth'], err: [200, 150, 0.12, 'square'], good: [660, 990, 0.3, 'sine'], engine: [70, 60, 0.4, 'sawtooth'] }[k] || [440, 440, 0.1, 'sine'];
      o.type = f[3]; o.frequency.setValueAtTime(f[0], t); o.frequency.exponentialRampToValueAtTime(f[1], t + f[2]);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(k === 'moo' ? 0.08 : 0.07, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + f[2] + 0.05);
      o.start(t); o.stop(t + f[2] + 0.08);
    } catch (e) {}
  }

  /* ── the sky and the light ───────────────────────────────── */
  var SKY = [
    [0.00, [250, 190, 150], [255, 224, 180]], [0.10, [140, 196, 232], [236, 232, 210]], [0.40, [96, 170, 226], [218, 238, 244]],
    [0.62, [226, 150, 110], [255, 206, 140]], [0.72, [40, 52, 108], [120, 86, 120]], [0.90, [14, 20, 54], [40, 52, 96]], [1.00, [250, 190, 150], [255, 224, 180]]
  ];
  function phase() { return (S.t % DAY) / DAY; }
  function sky(p) { for (var i = 0; i < SKY.length - 1; i++) { if (p >= SKY[i][0] && p <= SKY[i + 1][0]) { var f = (p - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return [mix(SKY[i][1], SKY[i + 1][1], f), mix(SKY[i][2], SKY[i + 1][2], f)]; } } return [SKY[0][1], SKY[0][2]]; }
  function sunH(p) { return p < 0.7 ? Math.sin(Math.PI * p / 0.7) : 0; }
  function night(p) { return p < 0.62 ? 0 : p < 0.74 ? (p - 0.62) / 0.12 : p < 0.92 ? 1 : 1 - (p - 0.92) / 0.08; }

  /* ── people: a farmer, a girl, a mother ──────────────────── */
  function arm(sx, sy, hx, hy, col, w) {
    var L = 12, dx = hx - sx, dy = hy - sy, d = Math.min(Math.hypot(dx, dy) || 0.01, L * 2 - 0.2), ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
    var a = d / 2, h = Math.sqrt(Math.max(0, L * L - a * a)), ex = sx + ux * a - uy * h, ey = sy + uy * a + ux * h;
    if (ey < sy - 2) { ex = sx + ux * a + uy * h; ey = sy + uy * a - ux * h; }
    g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
    g.strokeStyle = '#b07a52'; g.lineWidth = w - 0.8; g.beginPath(); g.moveTo(ex, ey); g.lineTo(sx + ux * d, sy + uy * d); g.stroke();
    g.fillStyle = '#b07a52'; g.beginPath(); g.arc(sx + ux * d, sy + uy * d, w * 0.55, 0, 6.283); g.fill();
  }
  /* o: kind, dir, w (walk phase), act ('hoe','water','harvest','feed','milk','cheer'), k (0..1 through the action), t (clock), s (scale) */
  function person(x, y, o) {
    var s = o.s || 1, dir = o.dir || 1, kind = o.kind, w = o.w || 0, t = o.t || 0, moving = o.moving, k = o.k || 0, act = o.act;
    var bob = moving ? Math.abs(Math.sin(w)) * 1.6 : Math.sin(t * 2) * 0.5;
    g.save(); g.translate(x, y); g.scale(dir * s, s);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 1, 13, 3.4, 0, 0, 6.283); g.fill();
    g.translate(0, -bob);
    var sw = moving ? Math.sin(w) * 7 : 0, skin = '#b07a52', skinD = '#946040';
    /* legs */
    if (kind === 'farmer') { g.fillStyle = '#f0ead8'; g.beginPath(); g.moveTo(-8, -22); g.lineTo(8, -22); g.lineTo(7 + sw * 0.4, -4); g.lineTo(2, -4); g.lineTo(0, -16); g.lineTo(-2, -4); g.lineTo(-7 - sw * 0.4, -4); g.closePath(); g.fill();
      g.strokeStyle = skin; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, -8); g.lineTo(-4 - sw, 0); g.moveTo(4, -8); g.lineTo(4 + sw, 0); g.stroke(); }
    else if (kind === 'girl') { g.strokeStyle = skin; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3, -14); g.lineTo(-3 - sw, -1); g.moveTo(3, -14); g.lineTo(3 + sw, -1); g.stroke();
      g.fillStyle = '#3a2a22'; g.beginPath(); g.ellipse(-3 - sw, 0, 3.4, 1.8, 0, 0, 6.283); g.ellipse(3 + sw, 0, 3.4, 1.8, 0, 0, 6.283); g.fill(); }
    else { g.fillStyle = '#c0302e'; g.beginPath(); g.moveTo(-9, -20); g.lineTo(9, -20); g.lineTo(11, -1); g.lineTo(-11, -1); g.closePath(); g.fill(); g.fillStyle = '#f0c25a'; g.fillRect(-11, -4, 22, 2); }
    /* body */
    if (kind === 'farmer') { g.fillStyle = '#f6efd8'; g.beginPath(); g.moveTo(-8, -46); g.quadraticCurveTo(0, -50, 8, -46); g.lineTo(9, -20); g.lineTo(-9, -20); g.closePath(); g.fill();
      g.strokeStyle = '#2f6fa0'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-7, -46); g.lineTo(5, -26); g.stroke(); g.strokeStyle = '#e8e0c8'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -47); g.lineTo(0, -34); g.stroke(); }
    else if (kind === 'girl') { g.fillStyle = '#f08a3a'; g.beginPath(); g.moveTo(-6, -40); g.quadraticCurveTo(0, -43, 6, -40); g.lineTo(11, -13); g.lineTo(-11, -13); g.closePath(); g.fill();
      g.fillStyle = '#ffd27a'; for (var q = 0; q < 4; q++) { g.beginPath(); g.arc(-6 + q * 4, -17 + (q % 2) * 2, 1.2, 0, 6.283); g.fill(); } g.fillStyle = '#e5557a'; g.fillRect(-6, -40, 12, 2); }
    else { g.fillStyle = '#c0302e'; g.beginPath(); g.moveTo(-8, -46); g.quadraticCurveTo(0, -50, 8, -46); g.lineTo(10, -20); g.lineTo(-10, -20); g.closePath(); g.fill(); g.fillStyle = '#f0c25a'; g.beginPath(); g.moveTo(-8, -46); g.lineTo(8, -46); g.lineTo(6, -41); g.lineTo(-8, -38); g.closePath(); g.fill(); }
    /* arms: idle swing, or the work they are doing */
    var sh = kind === 'girl' ? -39 : -44, sx = 6, aw = kind === 'girl' ? 3.2 : 4, sleeve = kind === 'farmer' ? '#f6efd8' : kind === 'girl' ? '#f08a3a' : '#c0302e';
    var tool = null, hxF = 10 + sw * 0.3, hyF = sh + 15, hxB = -10 - sw * 0.3, hyB = sh + 15;
    if (act === 'hoe') { var a = Math.sin(Math.min(1, k) * Math.PI); hxF = 14 - a * 4 + (1 - a) * 4; hyF = sh - 14 + a * 36; hxB = 9; hyB = sh - 8 + a * 30; tool = ['hoe', 14 + a * 10, hyF]; }
    else if (act === 'water') { hxF = 18; hyF = sh + 6; hxB = 6; hyB = sh + 10; tool = ['can', 18, hyF]; }
    else if (act === 'harvest') { var b = Math.sin(Math.min(1, k) * Math.PI * 2); hxF = 15 + b * 6; hyF = sh + 12 + b * 4; tool = ['sickle', hxF, hyF]; }
    else if (act === 'feed') { hxF = 14; hyF = sh + 12; hxB = 14; hyB = sh + 14; tool = ['hay', 17, sh + 13]; }
    else if (act === 'milk') { hxF = 12; hyF = sh + 22; hxB = 8; hyB = sh + 24; tool = ['bucket', 10, sh + 28]; }
    else if (act === 'cheer') { var c2 = Math.sin(t * 14) * 3; hxF = 8; hyF = sh - 18 + c2; hxB = -8; hyB = sh - 18 - c2; }
    else if (act === 'stir') { var s2 = Math.sin(t * 5) * 6; hxF = 14 + s2; hyF = sh + 16; hxB = 8; hyB = sh + 12; }
    arm(-sx, sh, hxB, hyB, sleeve, aw);
    /* head */
    var hy = kind === 'girl' ? -50 : -55, r = kind === 'girl' ? 8.2 : 8.6, blink = Math.sin(t * 0.9 + (o.ph || 0) * 3) > 0.985 || (t + (o.ph || 0)) % 4.7 < 0.1 ? 0.12 : 1;
    if (kind === 'girl') { g.fillStyle = '#241816'; var bs = Math.sin(t * 6 + w) * (moving ? 3 : 1);
      g.beginPath(); g.moveTo(-6, hy); g.quadraticCurveTo(-11 - bs, hy + 14, -9 - bs, hy + 24); g.lineTo(-6 - bs, hy + 24); g.quadraticCurveTo(-7, hy + 12, -3, hy + 3); g.fill();
      g.fillStyle = '#e5334a'; g.beginPath(); g.arc(-7.6 - bs, hy + 22, 2, 0, 6.283); g.fill(); }
    g.fillStyle = skin; g.beginPath(); g.ellipse(0, hy, r * 0.92, r, 0, 0, 6.283); g.fill();
    g.fillStyle = skinD; g.beginPath(); g.ellipse(-r * 0.9, hy + 1, 1.8, 2.8, 0, 0, 6.283); g.fill();
    if (kind === 'farmer') {
      g.fillStyle = '#d9822b'; g.beginPath(); g.ellipse(-0.5, hy - 6.4, 10, 6.6, 0, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(80,30,0,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-9, hy - 6); g.quadraticCurveTo(0, hy - 2, 9, hy - 6); g.moveTo(-8, hy - 9); g.quadraticCurveTo(0, hy - 5, 8, hy - 9); g.stroke();
      g.fillStyle = '#d9822b'; g.beginPath(); g.moveTo(-9, hy - 4); g.quadraticCurveTo(-14, hy + 2, -11, hy + 9); g.lineTo(-8, hy + 4); g.closePath(); g.fill();
    } else if (kind === 'girl') { g.fillStyle = '#241816'; g.beginPath(); g.arc(0, hy - 1.4, r * 1.02, Math.PI * 1.05, Math.PI * 1.98); g.fill(); g.beginPath(); g.moveTo(-r, hy - 1); g.quadraticCurveTo(0, hy - 6, r, hy - 1); g.lineTo(r, hy - 3); g.lineTo(-r, hy - 3); g.fill(); g.fillStyle = '#e5334a'; g.beginPath(); g.arc(5, hy - 8, 2.6, 0, 6.283); g.fill(); }
    else { g.fillStyle = '#c0302e'; g.beginPath(); g.moveTo(-r * 1.1, hy + 3); g.quadraticCurveTo(-r * 1.2, hy - 9, 0, hy - 10); g.quadraticCurveTo(r * 1.2, hy - 9, r * 1.1, hy + 4); g.lineTo(r * 0.6, hy - 2); g.quadraticCurveTo(0, hy - 6, -r * 0.6, hy - 2); g.closePath(); g.fill(); g.fillStyle = '#c0302e'; g.beginPath(); g.moveTo(-8, hy + 2); g.lineTo(-12, hy + 20); g.lineTo(-5, hy + 8); g.fill(); }
    /* face (looking toward the direction we face) */
    g.fillStyle = '#1c1512'; g.beginPath(); g.ellipse(3.2, hy - 0.6, 1.1, 1.5 * blink, 0, 0, 6.283); g.ellipse(-1.4, hy - 0.6, 1.1, 1.5 * blink, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2b2018'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(1.6, hy - 3.2); g.lineTo(4.8, hy - 3.6); g.moveTo(-3, hy - 3.4); g.lineTo(-0.4, hy - 3.2); g.stroke();
    g.strokeStyle = skinD; g.beginPath(); g.moveTo(1.2, hy + 0.5); g.lineTo(2.8, hy + 3); g.stroke();
    g.strokeStyle = '#6a2a1e'; g.lineWidth = 1.1; g.beginPath(); var sm = (o.mood || (act === 'cheer' ? 1 : 0.4)); g.arc(1.4, hy + 3.4, 2.6, 0.2, 0.2 + 2.7 * (0.5 + sm * 0.5)); g.stroke();
    if (kind === 'farmer') { g.fillStyle = '#2b2420'; g.beginPath(); g.moveTo(-1.5, hy + 3); g.quadraticCurveTo(2.4, hy + 1.6, 6.4, hy + 3.2); g.quadraticCurveTo(2.4, hy + 5.4, -1.5, hy + 3); g.fill(); }
    if (kind !== 'farmer') { g.fillStyle = '#d02a2a'; g.beginPath(); g.arc(1.6, hy - 5.2, 1, 0, 6.283); g.fill(); }
    if (kind === 'amma') { g.fillStyle = '#f0c25a'; g.beginPath(); g.arc(-r + 0.5, hy + 4, 1.4, 0, 6.283); g.fill(); }
    arm(sx, sh, hxF, hyF, sleeve, aw);
    if (kind === 'amma') { g.strokeStyle = '#f0c25a'; g.lineWidth = 1.4; g.beginPath(); g.arc(hxF - 1, hyF, 2.6, 0, 6.283); g.stroke(); }
    /* tools */
    if (tool) {
      g.save(); g.translate(tool[1], tool[2]);
      if (tool[0] === 'hoe') { g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-2, -26); g.lineTo(6, 14); g.stroke(); g.fillStyle = '#8a8f98'; g.beginPath(); g.moveTo(3, 10); g.lineTo(14, 16); g.lineTo(9, 20); g.lineTo(2, 15); g.closePath(); g.fill(); }
      else if (tool[0] === 'can') { g.fillStyle = '#4a8fb8'; g.fillRect(-6, -4, 12, 9); g.fillRect(4, -8, 12, 3); g.strokeStyle = '#4a8fb8'; g.lineWidth = 2; g.beginPath(); g.moveTo(5, -2); g.lineTo(17, -9); g.stroke(); g.fillStyle = 'rgba(160,215,255,.9)'; for (var d = 0; d < 4; d++) { g.beginPath(); g.arc(19 + d * 2, -4 + ((t * 40 + d * 6) % 18), 1.3, 0, 6.283); g.fill(); } }
      else if (tool[0] === 'sickle') { g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(2, 8); g.stroke(); g.strokeStyle = '#b8bec6'; g.lineWidth = 2.2; g.beginPath(); g.arc(8, -3, 9, Math.PI * 0.9, Math.PI * 1.85); g.stroke(); }
      else if (tool[0] === 'hay') { g.fillStyle = '#d8b25a'; g.beginPath(); g.ellipse(2, -2, 8, 5, -0.3, 0, 6.283); g.fill(); g.strokeStyle = '#a07a28'; g.lineWidth = 1; for (var h2 = -4; h2 < 6; h2 += 3) { g.beginPath(); g.moveTo(h2, -6); g.lineTo(h2 + 2, 2); g.stroke(); } }
      else if (tool[0] === 'bucket') { g.fillStyle = '#b8bec6'; g.beginPath(); g.moveTo(-6, -6); g.lineTo(6, -6); g.lineTo(4, 6); g.lineTo(-4, 6); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(-5, -6, 10, 2); }
      g.restore();
    }
    g.restore();
  }

  /* ── animals ─────────────────────────────────────────────── */
  function cow(c, t) {
    var s = c.calf ? 0.62 : 1, sw = Math.sin(c.w) * 5;
    g.save(); g.translate(c.x, c.y); g.scale(c.dir * s, s);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 2, 34, 6, 0, 0, 6.283); g.fill();
    g.strokeStyle = c.c[0] === undefined ? '#444' : 'rgb(' + c.c[1].join(',') + ')'; g.lineCap = 'round';
    function leg(x, ph, back) { g.strokeStyle = '#4a3a2e'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, -18); g.lineTo(x + Math.sin(c.w + ph) * 4, -2); g.stroke(); g.fillStyle = '#2a2018'; g.fillRect(x + Math.sin(c.w + ph) * 4 - 3, -4, 6, 4); }
    leg(-20, 0); leg(-10, 1.6); leg(14, 1.6); leg(24, 0);
    /* tail */
    g.strokeStyle = 'rgb(' + c.c[1].join(',') + ')'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-34, -32); g.quadraticCurveTo(-42 - Math.sin(t * 2 + c.tail) * 4, -22, -40 - Math.sin(t * 2 + c.tail) * 6, -8); g.stroke(); g.fillStyle = '#2a2018'; g.beginPath(); g.arc(-40 - Math.sin(t * 2 + c.tail) * 6, -6, 3, 0, 6.283); g.fill();
    /* body with patches */
    g.fillStyle = 'rgb(' + c.c[0].join(',') + ')'; g.beginPath(); g.ellipse(-2, -30, 36, 19, 0, 0, 6.283); g.fill();
    g.save(); g.beginPath(); g.ellipse(-2, -30, 36, 19, 0, 0, 6.283); g.clip(); g.fillStyle = 'rgb(' + c.c[1].join(',') + ')'; g.beginPath(); g.ellipse(-14 + c.id * 3, -38, 12, 9, 0.3, 0, 6.283); g.ellipse(14, -24, 9, 8, 0, 0, 6.283); g.fill(); g.restore();
    g.fillStyle = '#f0a8a8'; g.beginPath(); g.ellipse(14, -13, 6, 5, 0, 0, 6.283); g.fill();
    /* head: lowers to chew */
    var hd = 2 + Math.sin(c.chew * 6) * (c.chew > 0 ? 2 : 0), hang = c.hunger < 0.4 ? 0 : 7;
    g.translate(32, -38 + hang);
    g.fillStyle = 'rgb(' + c.c[0].join(',') + ')'; g.beginPath(); g.ellipse(6, hd, 15, 11, 0.15, 0, 6.283); g.fill();
    g.fillStyle = 'rgb(' + c.c[1].join(',') + ')'; g.beginPath(); g.ellipse(-2, -6, 9, 6, 0, 0, 6.283); g.fill();
    g.fillStyle = '#e8b8a0'; g.beginPath(); g.ellipse(16, hd + 4, 7, 6, 0, 0, 6.283); g.fill(); g.fillStyle = '#6a4a3a'; g.beginPath(); g.arc(19, hd + 3, 1.2, 0, 6.283); g.arc(19, hd + 7, 1.2, 0, 6.283); g.fill();
    g.fillStyle = '#d0a070'; g.beginPath(); g.moveTo(-3, -9); g.lineTo(-8, -20); g.lineTo(2, -12); g.fill(); g.beginPath(); g.moveTo(4, -9); g.lineTo(5, -21); g.lineTo(10, -10); g.fill();
    g.fillStyle = '#e8c8b0'; g.beginPath(); g.ellipse(-6, hd - 2, 6, 3, 0.5, 0, 6.283); g.fill();
    g.fillStyle = '#1c1512'; g.beginPath(); g.ellipse(8, hd - 2, 2, Math.sin(t * 0.7 + c.id) > 0.98 ? 0.4 : 2.2, 0, 0, 6.283); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(8.6, hd - 2.8, 0.7, 0, 6.283); g.fill();
    g.fillStyle = '#d0a020'; g.beginPath(); g.arc(2, hd + 11, 3, 0, 6.283); g.fill();
    g.restore();
    /* thought bubbles for hunger and milk */
    if (!c.calf) { var bx = c.x, by = c.y - 76;
      if (c.hunger > 0.7) bubble(bx, by, '#d8b25a', 'hay', t); else if (c.milk >= 1) bubble(bx, by, '#fff', 'milk', t); }
  }
  function bubble(x, y, col, kind, t) {
    var f = Math.sin(t * 4) * 2; g.save(); g.translate(x, y + f); g.fillStyle = 'rgba(255,255,255,.95)'; g.strokeStyle = 'rgba(60,40,10,.35)'; g.lineWidth = 1;
    g.beginPath(); g.arc(0, 0, 11, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-3, 9); g.lineTo(0, 15); g.lineTo(3, 9); g.fill();
    if (kind === 'hay') { g.fillStyle = '#d8b25a'; g.beginPath(); g.ellipse(0, 0, 6, 4, -0.3, 0, 6.283); g.fill(); g.strokeStyle = '#a07a28'; g.beginPath(); g.moveTo(-3, -3); g.lineTo(-1, 3); g.moveTo(2, -3); g.lineTo(4, 3); g.stroke(); }
    else { g.fillStyle = '#e6eef2'; g.strokeStyle = '#7a909c'; g.beginPath(); g.moveTo(-4, -5); g.lineTo(4, -5); g.lineTo(3, 5); g.lineTo(-3, 5); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }
  function hen(h, t) {
    g.save(); g.translate(h.x, h.y); g.scale(h.dir, 1);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 1, 8, 2.4, 0, 0, 6.283); g.fill();
    var pk = Math.max(0, Math.sin(h.peck * 5)) > 0.6 && h.wait > 0 ? 5 : 0;
    g.strokeStyle = '#d8a020'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-2, -5); g.lineTo(-2 + Math.sin(h.w) * 2, 0); g.moveTo(2, -5); g.lineTo(2 - Math.sin(h.w) * 2, 0); g.stroke();
    g.fillStyle = '#e6c8a0'; g.beginPath(); g.ellipse(0, -9, 8, 6, 0, 0, 6.283); g.fill(); g.fillStyle = '#c89860'; g.beginPath(); g.ellipse(-2, -9, 5, 3.6, 0.3, 0, 6.283); g.fill();
    g.fillStyle = '#e6c8a0'; g.beginPath(); g.moveTo(-6, -12); g.lineTo(-11, -17); g.lineTo(-4, -13); g.fill();
    g.fillStyle = '#e6c8a0'; g.beginPath(); g.arc(6, -14 + pk, 3.8, 0, 6.283); g.fill(); g.fillStyle = '#d02a2a'; g.beginPath(); g.arc(5, -18 + pk, 1.6, 0, 6.283); g.arc(6.6, -18 + pk, 1.2, 0, 6.283); g.fill();
    g.fillStyle = '#f0a020'; g.beginPath(); g.moveTo(9, -14 + pk); g.lineTo(13, -13 + pk); g.lineTo(9, -12 + pk); g.fill(); g.fillStyle = '#1c1512'; g.beginPath(); g.arc(7, -15 + pk, 0.8, 0, 6.283); g.fill();
    g.restore();
  }
  function moti(d, t) {
    g.save(); g.translate(d.x, d.y); g.scale(d.dir, 1);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 1, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#8a5a30'; g.lineWidth = 3; g.lineCap = 'round';
    for (var i = 0; i < 4; i++) { var x = i < 2 ? -8 + i * 4 : 6 + (i - 2) * 4; g.beginPath(); g.moveTo(x, -9); g.lineTo(x + Math.sin(d.w + i * 1.6) * 3, 0); g.stroke(); }
    g.strokeStyle = '#a06a38'; g.lineWidth = 3; g.beginPath(); g.moveTo(-11, -13); g.quadraticCurveTo(-16, -22 + Math.sin(t * 14) * 4, -13, -24 + Math.sin(t * 14) * 5); g.stroke();
    g.fillStyle = '#b07840'; g.beginPath(); g.ellipse(0, -13, 12, 7, 0, 0, 6.283); g.fill(); g.fillStyle = '#e8d0a8'; g.beginPath(); g.ellipse(2, -9, 8, 3, 0, 0, 6.283); g.fill();
    g.fillStyle = '#b07840'; g.beginPath(); g.ellipse(12, -19, 6.4, 5.6, 0, 0, 6.283); g.fill(); g.fillStyle = '#6a4220'; g.beginPath(); g.ellipse(9, -23, 2.6, 4, -0.3, 0, 6.283); g.fill(); g.fillStyle = '#e8d0a8'; g.beginPath(); g.ellipse(16, -17, 3.4, 2.6, 0, 0, 6.283); g.fill(); g.fillStyle = '#1c1512'; g.beginPath(); g.arc(17.6, -18, 1, 0, 6.283); g.arc(12, -20.4, 1, 0, 6.283); g.fill();
    g.fillStyle = '#e06a7a'; g.beginPath(); g.ellipse(16, -13.6, 1.6, 2.6 + Math.sin(t * 12), 0, 0, 6.283); g.fill();
    g.restore();
  }

  /* ── crops ───────────────────────────────────────────────── */
  function drawCrop(x, y, type, stage, t, ph) {
    var sway = Math.sin(t * 1.6 + ph) * (stage > 1 ? 1.6 : 0.8), C = CROPS[type].col;
    g.save(); g.translate(x, y);
    if (stage === 0) { g.fillStyle = 'rgba(70,40,20,.8)'; g.beginPath(); g.ellipse(0, 0, 8, 3, 0, 0, 6.283); g.fill(); g.fillStyle = '#d8c090'; g.beginPath(); g.arc(-3, -1, 1.2, 0, 6.283); g.arc(2, 0, 1.2, 0, 6.283); g.arc(4, -2, 1.2, 0, 6.283); g.fill(); g.restore(); return; }
    var h = stage === 1 ? 9 : stage === 2 ? 17 : 22;
    g.strokeStyle = '#4f8a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sway * 0.5, -h * 0.5, sway, -h); g.stroke();
    var lf = ['#6fae4a', '#5a9a3a'];
    for (var i = 0; i < (stage === 1 ? 2 : stage === 2 ? 4 : 5); i++) { var ly = -h * (0.25 + i * 0.16), sd = i % 2 ? 1 : -1, L = (stage === 1 ? 5 : 8) * (1 - i * 0.06);
      g.fillStyle = lf[i % 2]; g.beginPath(); g.moveTo(sway * (0.3 + i * 0.1), ly); g.quadraticCurveTo(sd * L + sway, ly - L * 0.8, sd * L * 1.5 + sway, ly - 1); g.quadraticCurveTo(sd * L + sway, ly + L * 0.2, sway * (0.3 + i * 0.1), ly); g.fill(); }
    if (stage === 3) {
      if (type === 'tomato') { for (var j = 0; j < 3; j++) { g.fillStyle = rgb(C); g.beginPath(); g.arc(-6 + j * 6 + sway * 0.5, -8 - (j % 2) * 5, 4, 0, 6.283); g.fill(); g.fillStyle = '#4f9a3c'; g.fillRect(-6 + j * 6 + sway * 0.5 - 1, -13 - (j % 2) * 5, 2, 2); } }
      else if (type === 'brinjal') { for (var j2 = 0; j2 < 2; j2++) { g.fillStyle = rgb(C); g.beginPath(); g.ellipse(-5 + j2 * 10 + sway * 0.5, -6, 3.4, 7, 0.2 - j2 * 0.4, 0, 6.283); g.fill(); g.fillStyle = '#4f9a3c'; g.fillRect(-6 + j2 * 10 + sway * 0.5, -13, 3, 2.6); } }
      else if (type === 'cauli') { g.fillStyle = rgb(C); g.beginPath(); g.arc(sway * 0.4, -12, 7, 0, 6.283); g.fill(); g.fillStyle = '#e0dcc8'; for (var j3 = 0; j3 < 4; j3++) { g.beginPath(); g.arc(-4 + j3 * 2.8 + sway * 0.4, -14 + (j3 % 2) * 3, 2.4, 0, 6.283); g.fill(); } }
      else { for (var j4 = 0; j4 < 3; j4++) { g.fillStyle = rgb(C); g.beginPath(); g.ellipse(-5 + j4 * 5 + sway * 0.5, -8 - (j4 % 2) * 3, 1.8, 6, 0.2 * (j4 - 1), 0, 6.283); g.fill(); } }
      g.fillStyle = 'rgba(255,255,255,' + (0.45 + 0.45 * Math.sin(t * 4 + ph)) + ')'; g.fillRect(8, -20 + Math.sin(t * 3 + ph) * 2, 2, 2);
    }
    g.restore();
  }

  /* ── scenery ─────────────────────────────────────────────── */
  function drawHouse(t, p) {
    var n = night(p), x = HOUSE.x, y = HOUSE.y;
    /* yard */
    g.fillStyle = '#c9a874'; g.beginPath(); g.ellipse(150, 372, 140, 52, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(120,80,40,.18)'; g.beginPath(); g.ellipse(150, 378, 120, 40, 0, 0, 6.283); g.fill();
    /* the house: mud walls, tiled roof, veranda */
    g.fillStyle = '#d9b48a'; g.fillRect(x, y + 60, 200, 94); g.fillStyle = '#c89e72'; g.fillRect(x, y + 120, 200, 34);
    g.fillStyle = '#b8562f'; g.beginPath(); g.moveTo(x - 14, y + 66); g.lineTo(x + 100, y); g.lineTo(x + 214, y + 66); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,20,5,.35)'; g.lineWidth = 1.2; for (var i = 1; i < 7; i++) { g.beginPath(); g.moveTo(x - 14 + i * 4, y + 66 - i * 9.4); g.lineTo(x + 214 - i * 4, y + 66 - i * 9.4); g.stroke(); }
    g.fillStyle = '#8a3a20'; g.fillRect(x + 150, y + 4, 16, 30);
    g.fillStyle = '#7a4a2a'; g.fillRect(x + 8, y + 96, 6, 58); g.fillRect(x + 186, y + 96, 6, 58); g.fillStyle = '#a05a30'; g.fillRect(x, y + 90, 200, 8);
    /* door and windows (the glow comes from the farm's solar power at night) */
    g.fillStyle = '#4a2a16'; g.beginPath(); g.moveTo(x + 80, y + 154); g.lineTo(x + 80, y + 112); g.quadraticCurveTo(x + 100, y + 96, x + 120, y + 112); g.lineTo(x + 120, y + 154); g.fill();
    var lit = n > 0.2 && S.power > 1;
    [x + 28, x + 142].forEach(function (wx) { g.fillStyle = lit ? 'rgba(255,214,120,.95)' : '#8a6a4a'; g.fillRect(wx, y + 106, 30, 26); g.strokeStyle = '#4a2a16'; g.lineWidth = 2; g.strokeRect(wx, y + 106, 30, 26); g.beginPath(); g.moveTo(wx + 15, y + 106); g.lineTo(wx + 15, y + 132); g.stroke(); });
    /* the roof's solar panel on the house once the farm has any panels */
    if (st.panels > 0) { g.fillStyle = '#2a4a7a'; g.beginPath(); g.moveTo(x + 40, y + 48); g.lineTo(x + 110, y + 14); g.lineTo(x + 136, y + 28); g.lineTo(x + 66, y + 62); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; for (var q = 1; q < 4; q++) { g.beginPath(); g.moveTo(x + 40 + q * 24, y + 48 - q * 8.5); g.lineTo(x + 66 + q * 24, y + 62 - q * 8.5); g.stroke(); } }
    /* chulha smoke */
    for (var s = 0; s < 3; s++) { var u = ((t * 0.35 + s / 3) % 1); g.fillStyle = 'rgba(220,214,204,' + (0.5 * (1 - u)) + ')'; g.beginPath(); g.arc(x + 158 + Math.sin(u * 5 + s) * 6, y - 2 - u * 40, 5 + u * 9, 0, 6.283); g.fill(); }
    /* charpai and tulsi */
    g.fillStyle = '#8a5a2a'; g.fillRect(190, 366, 56, 5); g.fillStyle = '#c0a060'; g.fillRect(192, 360, 52, 6); g.fillStyle = '#6a4a2a'; g.fillRect(192, 371, 3, 8); g.fillRect(241, 371, 3, 8);
    g.fillStyle = '#c0553a'; g.fillRect(22, 336, 14, 12); g.fillStyle = '#4f9a3c'; g.beginPath(); g.arc(29, 332, 8, 0, 6.283); g.fill();
    /* the chulha (cooking fire) with Amma */
    g.fillStyle = '#6a4a3a'; g.beginPath(); g.ellipse(88, 328, 14, 7, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,150,40,' + (0.7 + 0.3 * Math.sin(t * 9)) + ')'; g.beginPath(); g.ellipse(88, 326, 8, 3, 0, 0, 6.283); g.fill();
    g.fillStyle = '#b87040'; g.beginPath(); g.ellipse(88, 320, 11, 6, 0, 0, 6.283); g.fill(); g.fillStyle = '#d8d0c0'; g.beginPath(); g.ellipse(88, 317, 9, 3, 0, 0, 6.283); g.fill();
  }
  function drawBarn(t) {
    var x = 700, y = 250;
    g.fillStyle = '#b2623a'; g.fillRect(x, y + 70, 240, 110); g.fillStyle = '#9a4e2c'; g.beginPath(); g.moveTo(x - 10, y + 76); g.lineTo(x + 120, y + 6); g.lineTo(x + 250, y + 76); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,20,5,.4)'; g.lineWidth = 2; for (var i = 1; i < 8; i++) { g.beginPath(); g.moveTo(x + i * 30, y + 70); g.lineTo(x + i * 30, y + 180); g.stroke(); }
    g.fillStyle = '#3a2418'; g.fillRect(x + 90, y + 112, 60, 68); g.strokeStyle = '#d8b88a'; g.lineWidth = 3; g.strokeRect(x + 90, y + 112, 60, 68); g.beginPath(); g.moveTo(x + 90, y + 112); g.lineTo(x + 150, y + 180); g.moveTo(x + 150, y + 112); g.lineTo(x + 90, y + 180); g.stroke();
    g.fillStyle = '#d8b25a'; g.beginPath(); g.moveTo(x + 6, y + 180); g.quadraticCurveTo(x + 6, y + 132, x + 40, y + 126); g.quadraticCurveTo(x + 76, y + 132, x + 76, y + 180); g.closePath(); g.fill(); g.strokeStyle = '#a07a28'; g.lineWidth = 1; for (var h = 0; h < 8; h++) { g.beginPath(); g.moveTo(x + 14 + h * 8, y + 176); g.lineTo(x + 20 + h * 7, y + 140 + (h % 3) * 6); g.stroke(); }
    /* the pen fence */
    g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; for (var f = PEN.x0 - 6; f <= PEN.x1 + 10; f += 26) { g.beginPath(); g.moveTo(f, PEN.y0 - 18); g.lineTo(f, PEN.y0 + 2); g.stroke(); }
    g.beginPath(); g.moveTo(PEN.x0 - 6, PEN.y0 - 12); g.lineTo(PEN.x1 + 10, PEN.y0 - 12); g.moveTo(PEN.x0 - 6, PEN.y0 - 4); g.lineTo(PEN.x1 + 10, PEN.y0 - 4); g.stroke();
    /* the water tank on its stand */
    g.fillStyle = '#7a7a82'; g.fillRect(TANK.x - 10, TANK.y + 30, 4, 50); g.fillRect(TANK.x + 6, TANK.y + 30, 4, 50); g.fillStyle = '#4a7aa0'; g.beginPath(); g.ellipse(TANK.x, TANK.y + 26, 20, 7, 0, 0, 6.283); g.fill(); g.fillRect(TANK.x - 20, TANK.y + 4, 40, 22); g.fillStyle = '#5a8ab0'; g.beginPath(); g.ellipse(TANK.x, TANK.y + 4, 20, 7, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(160,215,255,.8)'; g.fillRect(TANK.x - 18, TANK.y + 26 - 22 * (S.tank / 100), 36, 22 * (S.tank / 100));
  }
  function drawGround(p) {
    var sk = sky(p), hz = 215;
    var gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, rgb(sk[0])); gr.addColorStop(1, rgb(sk[1])); g.fillStyle = gr; g.fillRect(-2, -2, VW + 4, hz + 2);
    var n = night(p);
    if (n > 0.05) { g.fillStyle = 'rgba(255,248,226,' + n + ')'; for (var i = 0; i < 50; i++) { g.globalAlpha = n * (0.4 + 0.5 * Math.sin(S.t * 2 + i)); g.fillRect((i * 97) % VW, (i * 31) % 160, 1.6, 1.6); } g.globalAlpha = 1; }
    var sp = p / 0.72, sx = 70 + sp * 820, sy = 150 - Math.sin(Math.PI * clamp(sp, 0, 1)) * 112;
    if (p < 0.74) { var gl = g.createRadialGradient(sx, sy, 0, sx, sy, 90); gl.addColorStop(0, 'rgba(255,236,170,.7)'); gl.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gl; g.fillRect(sx - 90, sy - 90, 180, 180); g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(sx, sy, 20, 0, 6.283); g.fill(); }
    if (n > 0.2) { var mx = 760 - (p - 0.7) * 400, my = 90; g.fillStyle = 'rgba(240,244,255,' + n + ')'; g.beginPath(); g.arc(mx, my, 16, 0, 6.283); g.fill(); g.fillStyle = rgb(sk[0], n); g.beginPath(); g.arc(mx + 7, my - 3, 14, 0, 6.283); g.fill(); }
    /* far fields and trees */
    g.fillStyle = rgb(mix([120, 160, 100], [30, 44, 60], n)); g.beginPath(); g.moveTo(0, hz); for (var x = 0; x <= VW; x += 40) g.lineTo(x, hz - 14 - Math.sin(x * 0.011) * 10 - Math.sin(x * 0.03) * 4); g.lineTo(VW, hz + 40); g.lineTo(0, hz + 40); g.fill();
    g.fillStyle = rgb(mix([86, 130, 70], [24, 36, 48], n)); for (var tx = 30; tx < VW; tx += 90) { g.beginPath(); g.arc(tx + (tx % 7) * 3, hz - 6, 14 + (tx % 5) * 2, 0, 6.283); g.fill(); }
    var gg = g.createLinearGradient(0, hz, 0, VH); gg.addColorStop(0, rgb(mix([138, 178, 100], [34, 52, 54], n))); gg.addColorStop(1, rgb(mix([102, 148, 76], [26, 42, 44], n))); g.fillStyle = gg; g.fillRect(-2, hz - 2, VW + 4, VH - hz + 4);
    /* a dirt lane */
    g.fillStyle = rgb(mix([196, 160, 108], [60, 56, 58], n)); g.beginPath(); g.moveTo(0, 470); g.quadraticCurveTo(300, 436, 700, 520); g.lineTo(700, 540); g.lineTo(0, 540); g.closePath(); g.fill();
    return { sx: sx, sy: sy };
  }

  /* ── plots, panels, tractor ──────────────────────────────── */
  function drawPlot(P, t, p) {
    var n = night(p), dry = [150, 112, 70], wet = [92, 62, 38];
    var soil = P.state === 'empty' ? [160, 140, 92] : mix(dry, wet, P.water);
    g.fillStyle = rgb(mix(soil, [24, 26, 40], n * 0.6)); g.beginPath(); g.moveTo(P.x + 6, P.y); g.lineTo(P.x + P.w - 6, P.y); g.lineTo(P.x + P.w, P.y + P.h); g.lineTo(P.x, P.y + P.h); g.closePath(); g.fill();
    if (P.state !== 'empty') { g.strokeStyle = 'rgba(40,24,10,.28)'; g.lineWidth = 2; for (var i = 1; i < 5; i++) { var yy = P.y + i * (P.h / 5); g.beginPath(); g.moveTo(P.x + 4 - i, yy); g.lineTo(P.x + P.w - 4 + i, yy); g.stroke(); } }
    if (P.plough > 0 && P.plough < 1) { g.fillStyle = 'rgba(160,140,92,1)'; g.fillRect(P.x + P.w * P.plough, P.y, P.w * (1 - P.plough), P.h); }
    g.strokeStyle = 'rgba(70,46,20,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(P.x + 6, P.y); g.lineTo(P.x + P.w - 6, P.y); g.lineTo(P.x + P.w, P.y + P.h); g.lineTo(P.x, P.y + P.h); g.closePath(); g.stroke();
    if (P.panel) { /* the shadow the panels throw */
      var tilt = (p - 0.36) * 40; g.fillStyle = 'rgba(20,24,40,' + (0.32 * sunH(p)) + ')'; g.beginPath(); g.moveTo(P.x + 10 + tilt, P.y + 6); g.lineTo(P.x + P.w - 4 + tilt, P.y + 6); g.lineTo(P.x + P.w - 2 + tilt, P.y + P.h - 6); g.lineTo(P.x + 8 + tilt, P.y + P.h - 6); g.closePath(); g.fill(); }
  }
  function drawCropsOn(P, t) {
    if (P.state === 'empty' || P.state === 'ploughed') return;
    var stage = P.state === 'seed' ? 0 : P.prog < 0.35 ? 1 : P.prog < 0.8 ? 2 : 3;
    for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) drawCrop(P.x + 22 + i * 32, P.y + 24 + j * 26, P.crop, stage, t, i * 2 + j);
  }
  function drawPanels(P, t, p) {
    if (!P.panel) return;
    var tilt = clamp((p - 0.36) * 2.4, -0.7, 0.7), x = P.x, y = P.y, top = y - 64;
    g.strokeStyle = '#8a8f98'; g.lineWidth = 3; [[x + 6, y + P.h - 2], [x + P.w - 6, y + P.h - 2], [x + 18, y + 6], [x + P.w - 18, y + 6]].forEach(function (s) { g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[0] + (s[1] > y + 20 ? -tilt * 6 : 0), s[1] - 62 + (s[1] > y + 20 ? 6 : -4)); g.stroke(); });
    for (var i = 0; i < 3; i++) {
      var px = x + 4 + i * 36, w = 32, dx = tilt * 14, py = top + 10 - i * 1; g.fillStyle = '#2a4f8a'; g.beginPath(); g.moveTo(px + dx, py); g.lineTo(px + w + dx, py); g.lineTo(px + w - dx * 0.4, py + 24); g.lineTo(px - dx * 0.4, py + 24); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,200,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + w / 2 + dx * 0.6, py); g.lineTo(px + w / 2 - dx * 0.2, py + 24); g.moveTo(px + dx * 0.8, py + 12); g.lineTo(px + w + dx * 0.4, py + 12); g.stroke();
      var gl = g.createLinearGradient(px, py, px + w, py + 24); gl.addColorStop(0, 'rgba(255,255,255,' + (0.35 * sunH(p)) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(px + dx * 0.5 - 2, py, w, 24);
    }
  }
  function drawTractor(t) {
    var T = tractor, driving = T.state !== 'park', w = T.w;
    g.save(); g.translate(T.x, T.y); g.scale(T.dir, 1);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 52, 7, 0, 0, 6.283); g.fill();
    /* the plough behind */
    g.strokeStyle = '#5a5a62'; g.lineWidth = 4; g.beginPath(); g.moveTo(-32, -20); g.lineTo(-58, -6); g.stroke(); g.fillStyle = '#6a6a72'; for (var i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-58 - i * 4, -6 + i * 2); g.lineTo(-68 - i * 4, 2 + i * 2); g.lineTo(-54 - i * 4, 2 + i * 2); g.fill(); }
    /* wheels */
    function wheel(x, r) { g.save(); g.translate(x, -r); g.fillStyle = '#26262a'; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill(); g.fillStyle = '#d8b030'; g.beginPath(); g.arc(0, 0, r * 0.52, 0, 6.283); g.fill(); g.rotate(w); g.strokeStyle = '#3a3a40'; g.lineWidth = 3; for (var k = 0; k < 6; k++) { g.rotate(1.047); g.beginPath(); g.moveTo(r * 0.55, 0); g.lineTo(r * 0.98, 0); g.stroke(); } g.restore(); }
    wheel(-22, 22); wheel(34, 13);
    /* body */
    g.fillStyle = '#d8402e'; g.beginPath(); g.moveTo(10, -22); g.lineTo(52, -22); g.lineTo(54, -36); g.lineTo(14, -44); g.closePath(); g.fill(); g.fillStyle = '#b8301e'; g.fillRect(10, -22, 44, 5);
    g.fillStyle = '#e6503c'; g.fillRect(-14, -44, 28, 24); g.fillStyle = '#26262a'; g.fillRect(44, -52, 5, 14);
    /* seat, mudguard, cab frame */
    g.fillStyle = '#c0342a'; g.beginPath(); g.arc(-22, -22, 24, Math.PI, 0); g.lineTo(-22, -22); g.fill(); g.fillStyle = '#3a3a40'; g.fillRect(-26, -50, 14, 6);
    g.strokeStyle = '#3a3a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(-28, -50); g.lineTo(-28, -82); g.lineTo(0, -82); g.lineTo(0, -50); g.stroke(); g.fillStyle = '#d8b030'; g.fillRect(-30, -86, 34, 5);
    /* the driver */
    if (driving) { g.save(); g.scale(T.dir, 1); g.scale(T.dir, 1); g.restore(); }
    g.restore();
    if (driving) person(T.x - T.dir * 14, T.y - 38, { kind: 'farmer', dir: T.dir, s: 0.8, t: t, act: 'cheer', k: 0, mood: 1 });
    /* exhaust puffs */
    if (driving) for (var s = 0; s < 3; s++) { var u = ((t * 1.4 + s / 3) % 1); g.fillStyle = 'rgba(60,60,64,' + (0.5 * (1 - u)) + ')'; g.beginPath(); g.arc(T.x + T.dir * 47 - T.dir * u * 10, T.y - 54 - u * 26, 3 + u * 7, 0, 6.283); g.fill(); }
  }

  /* ── tools and actions ───────────────────────────────────── */
  function plotAt(x, y) { for (var i = 0; i < plots.length; i++) { var P = plots[i]; if (x >= P.x - 4 && x <= P.x + P.w + 4 && y >= P.y - 6 && y <= P.y + P.h + 4) return P; } return null; }
  function cowAt(x, y) { for (var i = cows.length - 1; i >= 0; i--) { var c = cows[i], s = c.calf ? 0.62 : 1; if (x > c.x - 44 * s && x < c.x + 52 * s && y > c.y - 70 * s && y < c.y + 6) return c; } return null; }
  function say(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(say.h); say.h = setTimeout(function () { t.classList.remove('is-on'); }, 2200); }
  function pop(x, y, txt, col) { floats.push({ x: x, y: y, t: 0, txt: txt, col: col || '#fff' }); }
  function burst(x, y, n, col, up) { for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-50, 50), vy: -rnd(20, up || 90), life: rnd(0.4, 0.9), col: col || '#fff', r: rnd(1.5, 3) }); }
  function addJob(j) { if (jobs.length > 3) return; jobs.push(j); }
  function stand(x, y, dirX) { return { x: x, y: y }; }

  function tap(wx, wy) {
    if (talkOpen) return;
    var P = plotAt(wx, wy), C = cowAt(wx, wy), tool = S.tool;
    if (tool === 'tractor') { if (!P) { say(T('wrongSpot')); sfx('err'); return; } if (tractor.state !== 'park') return; tractor.state = 'go'; tractor.row = P.r; tractor.plowed = 0; sfx('engine'); return; }
    if (tool === 'feed') { if (!C) { say(T('wrongSpot')); sfx('err'); return; } if (S.hay <= 0) { say(T('noHay')); sfx('err'); return; } addJob({ type: 'feed', x: C.x - 40, y: C.y + 4, ref: C }); return; }
    if (tool === 'milk') { if (!C) { say(T('wrongSpot')); sfx('err'); return; } if (C.calf) { say(T('notReady')); return; } if (C.milk < 1) { say(T('notReady')); sfx('err'); return; } addJob({ type: 'milk', x: C.x - 42, y: C.y + 4, ref: C }); return; }
    if (!P) { say(T('wrongSpot')); sfx('err'); return; }
    var job = { x: P.x + P.w / 2, y: P.y + P.h + 12, ref: P };
    if (tool === 'hoe') { if (P.state !== 'empty') { say(T('wrongSpot')); return; } job.type = 'hoe'; }
    else if (tool === 'seed') { if (P.state !== 'ploughed') { say(P.state === 'empty' ? T('needPlough') : T('wrongSpot')); sfx('err'); return; } if (S.coins < 2) { say(T('noCoins')); sfx('err'); return; } job.type = 'seed'; job.crop = S.crop; }
    else if (tool === 'water') { if (P.state === 'empty' || P.state === 'ploughed') { say(T('wrongSpot')); return; } if (S.tank < 10) { say(T('noWater')); sfx('err'); return; } job.type = 'water'; }
    else if (tool === 'harvest') { if (P.state !== 'grow' || P.prog < 1) { say(T('notReady')); sfx('err'); return; } job.type = 'harvest'; }
    else if (tool === 'solar') { if (!P.panel && S.coins < 30) { say(T('noCoins')); sfx('err'); return; } job.type = 'solar'; }
    else return;
    addJob(job);
  }
  function finish(j) {
    var P = j.ref;
    if (j.type === 'hoe') { P.state = 'ploughed'; P.plough = 0; burst(P.x + P.w / 2, P.y + P.h / 2, 8, '#8a6a3a'); sfx('tick'); }
    else if (j.type === 'seed') { if (S.coins < 2 || P.state !== 'ploughed') return; S.coins -= 2; P.state = 'seed'; P.crop = j.crop; P.prog = 0; st.seed++; burst(P.x + P.w / 2, P.y + 20, 6, '#d8c090'); sfx('tick'); }
    else if (j.type === 'water') { if (S.tank < 10) return; S.tank -= 10; P.water = 1; st.water++; for (var i = 0; i < 12; i++) parts.push({ x: P.x + rnd(10, P.w - 10), y: P.y - 20, vx: 0, vy: rnd(60, 110), life: 0.5, col: '#8fd0f0', r: 2 }); sfx('water'); }
    else if (j.type === 'harvest') { if (P.state !== 'grow' || P.prog < 1) return; var n = 3 + (P.panel ? 1 : 0); S.veg += n; st.harvest += n; P.state = 'empty'; P.crop = null; P.prog = 0; burst(P.x + P.w / 2, P.y + 20, 14, '#ffd27a'); pop(P.x + P.w / 2, P.y, '+' + n, '#fff'); sfx('good'); }
    else if (j.type === 'solar') { if (P.panel) { P.panel = false; S.coins += 15; pop(P.x + 50, P.y - 20, '+15', '#ffd27a'); sfx('tick'); } else { S.coins -= 30; P.panel = true; st.panels++; say(T('panelMsg')); sfx('good'); burst(P.x + 50, P.y - 40, 16, '#ffe9a0', 60); } }
    else if (j.type === 'feed') { var C = j.ref; if (S.hay <= 0) return; S.hay--; C.hunger = Math.max(0, C.hunger - 0.65); C.chew = 3; st.fed++; pop(C.x, C.y - 70, T('fedMsg'), '#fff'); sfx('moo'); C.moo = 1; }
    else if (j.type === 'milk') { var C2 = j.ref; if (C2.milk < 1) return; C2.milk = 0; S.milk++; st.milked++; pop(C2.x, C2.y - 70, T('milkMsg'), '#fff'); for (var m = 0; m < 6; m++) parts.push({ x: C2.x - 6, y: C2.y - 20, vx: rnd(-15, 15), vy: -rnd(20, 50), life: 0.6, col: '#fff', r: 2 }); sfx('water'); }
  }
  var ACTDUR = { hoe: 0.9, seed: 0.6, water: 0.9, harvest: 0.8, solar: 1.0, feed: 0.8, milk: 1.1 };

  /* ── the market ──────────────────────────────────────────── */
  function market(k) {
    if (k === 'sellVeg') { if (S.veg <= 0) { say(T('nothingSell')); return; } var pr = 0, price = 0; S.veg > 0 && (price = Math.round(S.veg * 5.2)); S.coins += price; st.sold += S.veg; say(T('sold', { n: price })); S.veg = 0; sfx('coin'); burst(80, 470, 10, '#ffd27a'); }
    else if (k === 'sellMilk') { if (S.milk <= 0) { say(T('nothingSell')); return; } var pm = S.milk * 4; S.coins += pm; say(T('sold', { n: pm })); S.milk = 0; sfx('coin'); }
    else if (k === 'buyHay') { if (S.coins < 5) { say(T('noCoins')); sfx('err'); return; } S.coins -= 5; S.hay += 5; sfx('tick'); }
    else if (k === 'buyCalf') { if (S.coins < 40) { say(T('noCoins')); sfx('err'); return; } if (cows.length >= 5) { say(T('herdFull')); return; } S.coins -= 40; var c = mkCow(cows.length + 2, true); c.x = PEN.x0 + 30; c.y = PEN.y0 + 40; cows.push(c); st.calves++; say(T('calfMsg')); sfx('moo'); }
    refreshHud();
  }

  /* ── the story ───────────────────────────────────────────── */
  function drawPortrait(kind) {
    var pc = $('#portrait'), q = pc.getContext('2d'), old = g; g = q; q.clearRect(0, 0, 96, 96);
    q.save(); person(48, 150, { kind: kind, dir: 1, s: 2.1, t: performance.now() / 1000, mood: 1 }); q.restore(); g = old;
  }
  function talk(lines, cb) {
    if (!lines || !lines.length) { if (cb) cb(); return; }
    talkQ = lines.slice(); talkOpen = true; var box = $('#talk'); box.hidden = false;
    function show() {
      var l = talkQ.shift(); if (!l) { box.hidden = true; talkOpen = false; if (cb) cb(); return; }
      var kind = l[0] === 'Ajeet' ? 'farmer' : l[0] === 'Priya' ? 'girl' : 'amma'; $('#talkWho').textContent = T(l[0]); $('#talkText').textContent = l[1]; $('#talkNext').textContent = talkQ.length ? T('next') : T('go'); drawPortrait(kind);
    }
    show(); $('#talkNext').onclick = show;
  }
  var QUESTS = [
    function () { return st.rows >= 1; }, function () { return st.seed >= 3; }, function () { return st.water >= 3; }, function () { return st.fed >= 1 && st.milked >= 1; },
    function () { return st.panels >= 1; }, function () { return st.harvest >= 3 && st.sold >= 4; }, function () { return st.calves >= 1; }, function () { return false; }
  ];
  function progress(i) { return i === 1 ? st.seed : i === 2 ? st.water : i === 3 ? (st.fed >= 1 ? 1 : 0) + (st.milked >= 1 ? 1 : 0) : i === 5 ? Math.min(4, st.sold) : 0; }
  function showQuest() { $('#quest').innerHTML = '<em>' + T('quest', { n: quest + 1 }) + '</em><b>' + T('q' + quest + 't') + '</b>' + T('q' + quest + 'd', { a: progress(quest) }); }
  function startQuest(i) { quest = i; showQuest(); var key = 's' + i; if (!shown[key]) { shown[key] = 1; talk(STR[lang][key] || STR.en[key]); } }
  function checkQuest() {
    if (talkOpen || questLock) return;
    if (quest < 7 && QUESTS[quest]()) {
      questLock = true; var dk = 's' + quest + 'd'; sfx('good');
      talk(STR[lang][dk] || STR.en[dk], function () { questLock = false; startQuest(quest + 1); if (quest === 7) say(T('allDone')); });
    } else showQuest();
  }

  /* ── hud ─────────────────────────────────────────────────── */
  var lastHud = 0;
  function refreshHud() {
    $('#sCoins').textContent = S.coins; $('#sHay').textContent = S.hay; $('#sVeg').textContent = S.veg; $('#sMilk').textContent = S.milk;
    $('#mTank').style.width = S.tank + '%'; $('#mPower').style.width = S.power + '%';
    var m = document.querySelectorAll('#mandi button'); m[0].textContent = T('sellVeg', { n: S.veg }); m[1].textContent = T('sellMilk', { n: S.milk }); m[2].textContent = T('buyHay'); m[3].textContent = T('buyCalf');
    m[0].disabled = S.veg <= 0; m[1].disabled = S.milk <= 0; m[2].disabled = S.coins < 5; m[3].disabled = S.coins < 40;
    var p = phase(), hh = Math.floor((6 + p * 18) % 24), mm = Math.floor(((6 + p * 18) % 1) * 60);
    $('#clock').textContent = T('day') + ' ' + S.day + ' · ' + (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  var TOOLS = [
    ['hoe', 'M4 20L15 9M11 6l7 3-3 6', 'hoe'], ['tractor', 'M3 17h4M10 17h6M3 10h9l2 4h5v3M6 10V6h4', 'tractor'], ['seed', 'M12 4c4 3 5 7 0 12-5-5-4-9 0-12zM12 20v-4', 'seed'], ['water', 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z', 'water'],
    ['harvest', 'M5 19c0-8 5-13 14-13M5 19l3-3M9 13l3 1M13 9l1 3', 'harvest'], ['feed', 'M4 18c2-8 6-12 16-12M4 18h14M8 14l3-1M12 11l3-1', 'feed'], ['milk', 'M7 8h10l-1 11H8zM9 8V5h6v3', 'milk'], ['solar', 'M3 9l4 9h12l-2-9zM6 13h12M9 9l-1 9M14 9l1 9M12 3v3M5 4l2 2M19 4l-2 2', 'solar']
  ];
  function buildUi() {
    $('#tools').innerHTML = TOOLS.map(function (t) { return '<button type="button" class="tl" data-tool="' + t[0] + '" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + t[1] + '"/></svg><span>' + T(t[2]) + '</span></button>'; }).join('');
    $('#crops').innerHTML = Object.keys(CROPS).map(function (k) { var c = CROPS[k].col; return '<button type="button" class="cr" data-crop="' + k + '"><i style="background:rgb(' + c.join(',') + ');box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)"></i>' + T(k) + '</button>'; }).join('');
    document.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = T(e.getAttribute('data-t')); });
    $('#fmLang').textContent = lang === 'hi' ? 'En' : 'हि'; document.documentElement.setAttribute('data-lang', lang); document.documentElement.lang = lang;
    setTool(S.tool); setCrop(S.crop); refreshHud(); showQuest();
  }
  function setTool(t) {
    S.tool = t;
    document.querySelectorAll('.tl').forEach(function (b) { var on = b.getAttribute('data-tool') === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    $('#crops').hidden = t !== 'seed'; $('#tip').textContent = T('t_' + t);
  }
  function setCrop(c) { S.crop = c; document.querySelectorAll('.cr').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-crop') === c); }); }

  /* ── update ──────────────────────────────────────────────── */
  function moveTo(o, tx, ty, sp, dt) { var dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d < 2) return true; var m = Math.min(d, sp * dt); o.x += dx / d * m; o.y += dy / d * m; if (Math.abs(dx) > 1) o.dir = dx > 0 ? 1 : -1; o.w += dt * 11; return d - m < 2; }
  function update(dt) {
    var prevDay = Math.floor(S.t / DAY); S.t += dt; if (Math.floor(S.t / DAY) > prevDay) S.day++;
    var p = phase(), L = sunH(p), heat = L * L;
    /* power, water */
    var pan = 0; plots.forEach(function (P) { if (P.panel) pan++; });
    S.power = clamp(S.power + pan * L * 6 * dt - (night(p) > 0.4 && S.power > 0 ? 0.35 * dt : 0) - 0.02 * dt, 0, 100);
    S.tank = clamp(S.tank + (1.3 + (S.power > 4 ? pan * 2.2 : 0)) * dt, 0, 100); if (pan > 0 && S.power > 50) S.tank = clamp(S.tank + dt, 0, 100);
    if (S.power >= 99.5 && pan > 0) { S.grid += dt; if (S.grid > 6) { S.grid = 0; S.coins++; pop(TANK.x, TANK.y - 14, '+1', '#ffe08a'); if (!shown.grid) { shown.grid = 1; say(T('gridMsg')); } } }
    /* crops: thirst, heat, growth. Panels shade the crop, so it needs less water and does not wilt at noon. */
    plots.forEach(function (P) {
      if (P.state === 'seed' || P.state === 'grow') {
        P.water = Math.max(0, P.water - 0.011 * (1 + heat * 1.3) * (P.panel ? 0.45 : 1) * dt);
        var stress = (!P.panel && heat > 0.7) ? 0.55 : 1, thirst = P.water > 0.12 ? 1 : 0.15, rate = (1 / CROPS[P.crop].grow) * stress * thirst * (L > 0.02 ? 1 : 0.2);
        P.prog = Math.min(1, P.prog + rate * dt); if (P.state === 'seed' && P.prog > 0.08) P.state = 'grow';
      }
    });
    /* the farmer works through the job queue */
    if (tractor.state === 'park' && !farmer.vis) farmer.vis = true;
    if (farmer.vis) {
      if (!cur && jobs.length) { cur = jobs.shift(); cur.phase = 'walk'; cur.k = 0; }
      if (cur) {
        if (cur.phase === 'walk') { if (moveTo(farmer, cur.x, cur.y, 150, dt)) { cur.phase = 'act'; cur.k = 0; var tx = cur.ref.x !== undefined ? cur.ref.x + (cur.ref.w ? cur.ref.w / 2 : 0) : cur.x; farmer.dir = tx > farmer.x ? 1 : -1; } farmer.act = null; farmer.moving = cur.phase === 'walk'; }
        if (cur && cur.phase === 'act') { cur.k += dt / (ACTDUR[cur.type] || 0.8); farmer.act = cur.type === 'solar' ? 'hoe' : cur.type; farmer.k = cur.k; farmer.moving = false; if (cur.k >= 1) { finish(cur); cur = null; farmer.act = null; checkQuest(); refreshHud(); } }
      } else { farmer.act = null; farmer.moving = false; }
    }
    /* the tractor */
    var T = tractor;
    if (T.state === 'go') { var row = plots[T.row * 3]; if (moveTo(T, 250, row.y + row.h - 8, 170, dt)) { T.state = 'plough'; T.dir = 1; } T.w += dt * 8; farmer.vis = false; }
    else if (T.state === 'plough') { T.x += 70 * dt; T.w += dt * 5; for (var i = 0; i < 3; i++) { var P = plots[T.row * 3 + i]; if (P.state === 'empty' && T.x - 60 > P.x) { P.plough = clamp((T.x - 60 - P.x) / P.w, 0, 1); if (P.plough >= 1) { P.state = 'ploughed'; P.plough = 0; T.plowed++; burst(P.x + 55, P.y + 30, 6, '#8a6a3a'); } } }
      if (T.x > 700) { if (T.plowed > 0) st.rows++; T.state = 'back'; T.dir = -1; checkQuest(); } camFocus(T.x); }
    else if (T.state === 'back') { if (moveTo(T, PARK.x, PARK.y, 170, dt)) { T.state = 'park'; T.dir = 1; } T.w -= dt * 8; }
    /* cows */
    cows.forEach(function (c) {
      c.hunger = Math.min(1, c.hunger + 0.011 * dt); if (c.hunger < 0.55 && !c.calf) c.milk = Math.min(1, c.milk + 0.03 * dt); c.chew = Math.max(0, c.chew - dt); c.moo = Math.max(0, c.moo - dt);
      if (c.calf) { c.age += dt; if (c.age > 45) { c.calf = false; say(T('grew')); } }
      c.wait -= dt; if (c.wait <= 0 && (!c.tx || Math.hypot(c.tx - c.x, c.ty - c.y) < 4)) { c.tx = rnd(PEN.x0 + 24, PEN.x1 - 24); c.ty = rnd(PEN.y0 + 34, PEN.y1 - 6); c.wait = rnd(2, 6); }
      if (c.tx && Math.hypot(c.tx - c.x, c.ty - c.y) > 3) moveTo(c, c.tx, c.ty, 16, dt);
    });
    hens.forEach(function (h) { h.peck += dt; h.wait -= dt; if (h.wait <= 0 && (!h.tx || Math.hypot(h.tx - h.x, h.ty - h.y) < 3)) { h.tx = rnd(50, 260); h.ty = rnd(332, 428); h.wait = rnd(1, 3.5); } if (h.tx && Math.hypot(h.tx - h.x, h.ty - h.y) > 3 && h.wait < 0.8) moveTo(h, h.tx, h.ty, 26, dt); });
    /* the dog follows the farmer at a respectful distance; Priya wanders and cheers */
    var fx = farmer.vis ? farmer.x - farmer.dir * 36 : T.x, fy = (farmer.vis ? farmer.y : T.y) + 6; if (Math.hypot(fx - dog.x, fy - dog.y) > 14) moveTo(dog, fx, fy, 110, dt);
    priya.wait -= dt; if (priya.wait <= 0 && Math.hypot(priya.tx - priya.x, priya.ty - priya.y) < 4) { priya.tx = rnd(80, 280); priya.ty = rnd(380, 440); priya.wait = rnd(2, 5); }
    priya.moving = Math.hypot(priya.tx - priya.x, priya.ty - priya.y) > 4; if (priya.moving) moveTo(priya, priya.tx, priya.ty, 50, dt);
    /* weather */
    clouds.forEach(function (c) { c.x += c.v * dt; if (c.x > VW + 120) c.x = -140; });
    birds.forEach(function (b) { b.x += b.v * dt; b.ph += dt * 9; if (b.x > VW + 40) { b.x = -40; b.y = rnd(40, 150); } });
    flies.forEach(function (f) { f.ph += dt * 3; });
    floats.forEach(function (f) { f.t += dt; }); floats = floats.filter(function (f) { return f.t < 1.4; });
    parts.forEach(function (q) { q.life -= dt; q.vy += 180 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }); parts = parts.filter(function (q) { return q.life > 0; });
    lastHud += dt; if (lastHud > 0.25) { lastHud = 0; refreshHud(); checkQuest(); }
    camUpdate(dt);
  }

  /* ── camera: fits the farm on a wide screen; pans on a phone ── */
  var camTarget = null;
  function camFocus(x) { camTarget = x; }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    scale = h / VH; viewW = w / scale; viewH = VH;
    if (viewW > VW) { scale = w / VW; viewW = VW; viewH = h / scale; }
    camX = clamp(camX, 0, Math.max(0, VW - viewW)); camY = viewH < VH ? (VH - viewH) / 2 : 0;
    $('.fm-pan').classList.toggle('is-on', viewW < VW - 4);
  }
  function camUpdate(dt) {
    if (viewW >= VW - 1) { camX = 0; return; }
    userPan = Math.max(0, userPan - dt);
    var focus = camTarget !== null ? camTarget : (farmer.vis ? farmer.x : tractor.x);
    if (cur && cur.x) focus = cur.x; camTarget = null;
    if (userPan <= 0) camX += (clamp(focus - viewW / 2, 0, VW - viewW) - camX) * Math.min(1, dt * 2.2);
  }

  /* ── draw ────────────────────────────────────────────────── */
  function draw() {
    var t = S.t, p = phase(), n = night(p), L = sunH(p);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, -camX * dpr * scale, -camY * dpr * scale);
    g.clearRect(camX - 4, camY - 4, viewW + 8, viewH + 8);
    var sun = drawGround(p);
    clouds.forEach(function (c) { g.fillStyle = 'rgba(255,255,255,' + (0.78 - n * 0.5) + ')'; g.beginPath(); g.ellipse(c.x, c.y, 46 * c.s, 12 * c.s, 0, 0, 6.283); g.ellipse(c.x + 24 * c.s, c.y - 8 * c.s, 30 * c.s, 11 * c.s, 0, 0, 6.283); g.ellipse(c.x - 24 * c.s, c.y - 4 * c.s, 26 * c.s, 9 * c.s, 0, 0, 6.283); g.fill(); });
    birds.forEach(function (b) { g.strokeStyle = 'rgba(40,40,50,' + (0.8 - n * 0.6) + ')'; g.lineWidth = 1.6; var fl = Math.sin(b.ph) * 5; g.beginPath(); g.moveTo(b.x - 8, b.y + fl); g.quadraticCurveTo(b.x - 3, b.y - 3, b.x, b.y); g.quadraticCurveTo(b.x + 3, b.y - 3, b.x + 8, b.y + fl); g.stroke(); });
    drawBarn(t); drawHouse(t, p);
    plots.forEach(function (P) { drawPlot(P, t, p); });
    plots.forEach(function (P) { drawCropsOn(P, t); });
    /* things that stand on the ground, drawn back to front */
    var ents = [];
    cows.forEach(function (c) { ents.push({ y: c.y, f: function () { cow(c, t); } }); });
    hens.forEach(function (h) { ents.push({ y: h.y, f: function () { hen(h, t); } }); });
    ents.push({ y: dog.y, f: function () { moti(dog, t); } });
    ents.push({ y: priya.y, f: function () { person(priya.x, priya.y, { kind: 'girl', dir: priya.dir, w: priya.w, moving: priya.moving, t: t, ph: 1.3, s: 0.78, act: st.sold > 0 && Math.sin(t * 0.3) > 0.97 ? 'cheer' : null }); } });
    ents.push({ y: amma.y, f: function () { person(amma.x, amma.y, { kind: 'amma', dir: -1, t: t, ph: 2.1, act: 'stir', s: 0.95 }); } });
    if (farmer.vis) ents.push({ y: farmer.y, f: function () { person(farmer.x, farmer.y, { kind: 'farmer', dir: farmer.dir, w: farmer.w, moving: farmer.moving, t: t, act: farmer.act, k: farmer.k, s: 1 }); } });
    ents.push({ y: tractor.y, f: function () { drawTractor(t); } });
    ents.sort(function (a, b) { return a.y - b.y; }).forEach(function (e) { e.f(); });
    plots.forEach(function (P) { drawPanels(P, t, p); });
    /* butterflies, particles */
    flies.forEach(function (f) { var x = f.x + Math.sin(f.ph) * 40, y = f.y + Math.sin(f.ph * 1.7) * 14; g.fillStyle = f.c; var w2 = Math.abs(Math.sin(f.ph * 6)) * 4 + 1; g.beginPath(); g.ellipse(x - w2 * 0.6, y, w2, 3, 0, 0, 6.283); g.ellipse(x + w2 * 0.6, y, w2, 3, 0, 0, 6.283); g.fill(); });
    parts.forEach(function (q) { g.globalAlpha = clamp(q.life * 2, 0, 1); g.fillStyle = q.col; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 6.283); g.fill(); }); g.globalAlpha = 1;
    floats.forEach(function (f) { g.globalAlpha = 1 - f.t / 1.4; g.font = '700 15px Inter, sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.4)'; g.fillText(f.txt, f.x + 1, f.y - f.t * 34 + 1); g.fillStyle = f.col; g.fillText(f.txt, f.x, f.y - f.t * 34); }); g.globalAlpha = 1; g.textAlign = 'left';
    /* night: a blue wash, with lamps lit by the farm's own power */
    if (n > 0.02) { g.fillStyle = 'rgba(10,16,48,' + (0.55 * n) + ')'; g.fillRect(camX - 4, camY - 4, viewW + 8, viewH + 8);
      if (S.power > 1) { [[268, 330], [660, 300], [700, 400]].forEach(function (l) { var gl = g.createRadialGradient(l[0], l[1], 0, l[0], l[1], 90); gl.addColorStop(0, 'rgba(255,214,120,' + (0.55 * n) + ')'); gl.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gl; g.fillRect(l[0] - 90, l[1] - 90, 180, 180); g.fillStyle = 'rgba(255,230,160,' + n + ')'; g.beginPath(); g.arc(l[0], l[1], 3, 0, 6.283); g.fill(); }); } }
  }

  /* ── input ───────────────────────────────────────────────── */
  var ptr = null;
  function world(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale + camX, y: (e.clientY - r.top) / scale + camY }; }
  cv.addEventListener('pointerdown', function (e) { ptr = { x: e.clientX, y: e.clientY, cx: camX, moved: false, id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  cv.addEventListener('pointermove', function (e) { if (!ptr) return; var dx = e.clientX - ptr.x; if (Math.abs(dx) > 8) ptr.moved = true; if (ptr.moved && viewW < VW - 1) { camX = clamp(ptr.cx - dx / scale, 0, VW - viewW); userPan = 2.5; } });
  cv.addEventListener('pointerup', function (e) { if (ptr && !ptr.moved) { var w = world(e); tap(w.x, w.y); } ptr = null; });
  cv.addEventListener('pointercancel', function () { ptr = null; });
  $('#tools').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) { setTool(b.getAttribute('data-tool')); sfx('tick'); } });
  $('#crops').addEventListener('click', function (e) { var b = e.target.closest('[data-crop]'); if (b) { setCrop(b.getAttribute('data-crop')); sfx('tick'); } });
  $('#mandi').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b && !b.disabled) market(b.getAttribute('data-m')); });
  $('#fmLang').addEventListener('click', function () { lang = lang === 'hi' ? 'en' : 'hi'; store.set('gzp.lang', lang); buildUi(); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { last = 0; });

  /* ── go ──────────────────────────────────────────────────── */
  var last = 0;
  function frame(now) {
    if (!last) last = now; var dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw(); requestAnimationFrame(frame);
  }
  init(); buildUi(); resize();
  setTimeout(function () { resize(); startQuest(0); }, 400);
  window.Farm = { _s: function () { return { S: S, st: st, quest: quest, plots: plots.map(function (p) { return p.state; }), cows: cows.length, tractor: tractor.state }; }, _tap: tap, _market: market, _tool: setTool, _crop: setCrop };
  requestAnimationFrame(frame);
})();
