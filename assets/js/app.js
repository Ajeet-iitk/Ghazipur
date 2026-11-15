/* ══════════════════════════════════════════════════════════════
   GHAZIPUR — the guide: language, motion, interactions.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var lang = store.get('gzp.lang') || 'en';
  if (!window.I18N[lang]) lang = 'en';
  var themeMode = store.get('gzp.theme') || 'auto';
  var themeLock = themeMode === 'night' || themeMode === 'day';
  var skyOverride = null, skyOverrideUntil = 0;
  var audioOn = false;

  /* ── tiny helpers ─────────────────────────────────────────── */
  function pick(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  }
  function L(key) {
    var d = window.I18N[lang] || window.I18N.en;
    return d[key] !== undefined ? d[key] : (window.I18N.en[key] || '');
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  /* shorten to the last whole word, so cards never cut mid-word */
  function clip(s, n) {
    s = String(s);
    if (s.length <= n) return s;
    var cut = s.slice(0, n);
    var sp = cut.lastIndexOf(' ');
    if (sp > n * 0.55) cut = cut.slice(0, sp);
    return cut.replace(/[\s,;:.\u2014\u2013-]+$/, '') + '\u2026';
  }

  var TOAST = {
    en: {
      audioOn: 'The river is playing. Adjust it in the mixer.',
      audioOff: 'Sound paused.',
      diya: 'A diya, set adrift.',
      bell: 'The bell rings across the water.',
      sky: 'The hour has turned.',
      skyAuto: 'The sky follows your scroll again.',
      lang: 'Language switched.',
      night: 'Night mode.',
      day: 'Day mode.',
      autoTheme: 'Following the sky again.',
      sfxOn: 'Interface sounds on.',
      sfxOff: 'Interface sounds off.',
      copy: 'Copied.',
      place: 'Open a place.',
      naav: 'The boat is in the water.',
      aarti: 'The ghat is lit for the evening.',
      siren: 'The yard siren sounds.',
      train: 'The trolley runs the yard line.',
      ghat: 'The steps are full of small lives.'
    },
    hi: {
      audioOn: 'नदी बज रही है। मिक्सर में बदलिए।',
      audioOff: 'आवाज़ रुकी।',
      diya: 'एक दीया बह चला।',
      bell: 'घंटी पानी पर गूँज उठी।',
      sky: 'घड़ी का पहर बदल गया।',
      skyAuto: 'आसमान फिर आपके स्क्रॉल के साथ चलेगा।',
      lang: 'भाषा बदल गई।',
      night: 'रात का रंग।',
      day: 'दिन का रंग।',
      autoTheme: 'फिर आसमान के साथ।',
      sfxOn: 'इंटरफ़ेस की आवाज़ें चालू।',
      sfxOff: 'इंटरफ़ेस की आवाज़ें बंद।',
      copy: 'कॉपी हो गया।',
      place: 'एक जगह खोलिए।',
      naav: 'नाव पानी में उतर गई।',
      aarti: 'घाट शाम के लिए जगमगा उठा।',
      siren: 'अहाते का सायरन गूँजा।',
      train: 'ट्रॉली अहाते की पटरी पर चली।',
      ghat: 'सीढ़ियाँ छोटी-छोटी ज़िंदगियों से भरी हैं।'
    },
    eh: {
      audioOn: 'Nadi baj rahi hai. Mixer mein badliye.',
      audioOff: 'Awaaz ruki.',
      diya: 'Ek diya, bah chala.',
      bell: 'Ghanti paani par goonj uthi.',
      sky: 'Ghadi ka pehar badal gaya.',
      skyAuto: 'Aasman phir aapke scroll ke saath chalega.',
      lang: 'Language badal gayi.',
      night: 'Night mode.',
      day: 'Day mode.',
      autoTheme: 'Phir aasman ke saath.',
      sfxOn: 'Interface sounds on.',
      sfxOff: 'Interface sounds off.',
      copy: 'Copy ho gaya.',
      place: 'Ek jagah kholiye.',
      naav: 'Naav paani mein utar gayi.',
      aarti: 'Ghat shaam ke liye jagmaga utha.',
      siren: 'Ahaate ka siren goonja.',
      train: 'Trolley ahaate ki patri par chali.',
      ghat: 'Seedhiyan chhoti-chhoti zindagiyon se bhari hain.'
    }
  };
  var tst = function (k) { return (TOAST[lang] || TOAST.en)[k] || TOAST.en[k] || ''; };

  /* toast */
  var toastEl = $('#toast'), toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }

  /* ══════════════════════════════════════════════════════════
     ART — eight small SVG paintings, drawn in code
     ══════════════════════════════════════════════════════════ */
  var ART = {
    arch: {
      sky: ['#fbe0b0', '#eda672'], sun: '#fff0c9',
      inner: function () {
        var t = '';
        /* far grove */
        t += '<path d="M0 176c34-14 62-4 92-8s54-12 84-6 58 12 92 6 70-10 100-4v76H0z" fill="#9c7a5b" opacity=".55"/>';
        t += '<rect y="196" width="400" height="44" fill="#8a674c"/>';
        /* wall */
        t += '<path d="M52 196v-78h296v78z" fill="#b2855c"/>';
        t += '<path d="M52 118h296v12H52z" fill="#c99a6d"/>';
        /* three arches */
        [[84, 42, 22], [172, 56, 28], [260, 42, 22]].forEach(function (a) {
          var x = a[0], h = a[1], r = a[2];
          t += '<path d="M' + x + ' 196v-' + h + 'c0-' + (r - 2) + ' ' + (r - 6) + '-' + r + ' ' + r + '-' + r +
            's' + r + ' ' + (r - 6) + ' ' + r + ' ' + r + 'v' + h + 'z" fill="#6a4b39"/>';
        });
        /* crenellations */
        for (var i = 0; i < 12; i++) {
          t += '<rect x="' + (56 + i * 24) + '" y="108" width="13" height="12" fill="#a37853"/>';
        }
        /* vines */
        t += '<path d="M64 196c8-30 22-52 44-68M118 196c-2-26 6-46 20-62M296 196c-6-34-20-54-40-68" stroke="#5e7a4c" stroke-width="2.6" fill="none" opacity=".85"/>';
        for (var v = 0; v < 14; v++) {
          t += '<ellipse cx="' + (66 + v * 17) + '" cy="' + (152 - (v % 4) * 16) + '" rx="6" ry="3" class="art-leaf" fill="#6c8a54" opacity=".8"/>';
        }
        t += '<path d="M188 90c9-4 19-4 26 0" stroke="#5c4436" stroke-width="1.4" fill="none" opacity=".5"/>';
        return t;
      }
    },
    garden: {
      sky: ['#dfeae4', '#f7ecda'], sun: '#fff8e6',
      inner: function () {
        var t = '';
        t += '<circle cx="86" cy="72" r="30" fill="#fff6e2" opacity=".8"/>';
        t += '<path d="M0 168c44-16 84 2 122-8s66-16 104-8 84 12 120 4 46-8 54-6v90H0z" fill="#8aa090" opacity=".55"/>';
        /* tomb */
        t += '<rect x="214" y="132" width="122" height="44" fill="#efe8d8"/>';
        t += '<path d="M214 132c10-4 20 2 30-2s22 2 32-2 22 2 32-2 20 2 28-2v10H214z" fill="#ded5c2"/>';
        t += '<path d="M246 132c0-26 13-44 29-44s29 18 29 44z" fill="#f2ecdd"/>';
        t += '<rect x="272" y="78" width="6" height="12" fill="#cfc5b0"/>';
        t += '<circle cx="275" cy="74" r="4" fill="#cfc5b0"/>';
        t += '<path d="M236 176v-22c0-10 7-18 16-18s16 8 16 18v22z" fill="#c9bda6" opacity=".8"/>';
        /* cypress */
        [[170, 74], [186, 60], [334, 66], [352, 82]].forEach(function (c) {
          t += '<path d="M' + c[0] + ' 176c-6-20-2-' + c[1] + ' 6-' + c[1] + 's12 ' + (c[1] - 20) + ' 6 ' + c[1] + 'z" class="art-sway" fill="#5f7a63" opacity=".9"/>';
        });
        /* tank */
        t += '<path d="M16 240l34-46h300l34 46z" fill="#cfcbb8"/>';
        t += '<path d="M40 236l28-38h264l28 38z" fill="#8fb3ac"/>';
        t += '<path d="M70 226h260" stroke="#e8f0e8" stroke-width="1.5" opacity=".55"/>';
        t += '<path d="M96 214h208" stroke="#dcebe4" stroke-width="1" opacity=".4"/>';
        t += '<path d="M188 210c0-8 5-14 12-14s12 6 12 14z" fill="#d9e2d6" opacity=".6"/>';
        return t;
      }
    },
    dome: {
      sky: ['#c8d6d8', '#eef0e4'], sun: '#f4f2e2',
      inner: function () {
        var t = '';
        t += '<ellipse cx="96" cy="52" rx="54" ry="16" fill="#e7ece8" opacity=".7"/>';
        t += '<ellipse cx="288" cy="38" rx="66" ry="18" fill="#e2e9e5" opacity=".55"/>';
        t += '<path d="M0 170c40-12 80 0 120-6s70-12 110-6 80 10 120 4 40-4 50-2v80H0z" fill="#8fa596" opacity=".5"/>';
        /* plinth */
        t += '<rect x="96" y="186" width="208" height="12" fill="#d8d3c2"/>';
        t += '<rect x="108" y="172" width="184" height="14" fill="#e7e1d0"/>';
        /* columns */
        for (var i = 0; i < 6; i++) {
          t += '<rect x="' + (120 + i * 30) + '" y="128" width="7" height="44" fill="#efe9d8"/>';
          t += '<rect x="' + (117 + i * 30) + '" y="124" width="13" height="5" fill="#d9d2bf"/>';
        }
        t += '<rect x="108" y="118" width="184" height="8" fill="#eae4d2"/>';
        /* dome */
        t += '<path d="M146 118c0-34 25-54 54-54s54 20 54 54z" fill="#f4efe0"/>';
        t += '<path d="M152 118c0-30 22-48 48-48s48 18 48 48" fill="none" stroke="#dcd5c1" stroke-width="1.4"/>';
        t += '<rect x="197" y="50" width="6" height="16" fill="#d5cdb8"/>';
        t += '<circle cx="200" cy="46" r="5" fill="#d5cdb8"/>';
        /* river + graves */
        t += '<rect y="198" width="400" height="42" fill="#8ea9a4"/>';
        t += '<path d="M0 210h400M0 222h400M0 232h400" stroke="#e3eeea" stroke-width="1" opacity=".35"/>';
        t += '<ellipse cx="72" cy="206" rx="22" ry="6" fill="#7d968f" opacity=".55"/>';
        t += '<ellipse cx="336" cy="210" rx="26" ry="7" fill="#7d968f" opacity=".4"/>';
        return t;
      }
    },
    ghat: {
      sky: ['#fbd9b0', '#efa878'], sun: '#fff2cf',
      inner: function () {
        var t = '';
        t += '<circle cx="286" cy="76" r="30" fill="#ffeec4" opacity=".9"/>';
        t += '<path d="M0 168c40-14 78 2 116-4s72-14 110-6 76 12 116 2 46-8 58-6v86H0z" fill="#a9815f" opacity=".45"/>';
        /* temple */
        t += '<path d="M74 196v-44h56v44z" fill="#8f6a4e"/>';
        t += '<path d="M78 152l24-58 24 58z" fill="#9d7554"/>';
        t += '<rect x="99" y="86" width="6" height="12" fill="#b98a60"/>';
        t += '<path d="M92 176v-18c0-8 5-14 12-14s12 6 12 14v18z" fill="#6d4e3a"/>';
        /* water */
        t += '<rect y="186" width="400" height="54" fill="#7f9f9e"/>';
        t += '<path d="M0 198h400M0 210h400M0 222h400M0 232h400" stroke="#dfeae4" stroke-width="1" opacity=".3"/>';
        /* steps */
        for (var i = 0; i < 6; i++) {
          var w = 120 + i * 34, x = 400 - w;
          t += '<rect x="' + x + '" y="' + (186 - i * 12) + '" width="' + w + '" height="12" fill="#' + (i % 2 ? 'd3ad84' : 'c69d74') + '"/>';
        }
        t += '<rect x="286" y="150" width="96" height="8" fill="#b98f68"/>';
        /* boat */
        t += '<path class="art-boat" d="M188 214c14 6 40 6 56 0l-6 8h-44z" fill="#5f4636" opacity=".85"/>';
        t += '<path class="art-boat" d="M214 214v-16" stroke="#5f4636" stroke-width="2"/>';
        t += '<path class="art-boat" d="M214 200l14 8" stroke="#5f4636" stroke-width="1.6"/>';
        return t;
      }
    },
    cave: {
      sky: ['#e9c7a4', '#c2846b'], sun: '#f8dcb6',
      inner: function () {
        var t = '';
        t += '<circle cx="318" cy="64" r="26" fill="#f6d8ae" opacity=".8"/>';
        t += '<path d="M0 240V128c40-28 80-40 126-30s58 24 96 20 74-28 112-18 48 26 66 34v106z" fill="#8b6a55"/>';
        t += '<path d="M0 240V170c46-24 92-30 140-16s72 20 118 8 92-18 142-2v80z" fill="#6d5144"/>';
        t += '<path d="M150 240v-44c0-26 22-46 50-46s50 20 50 46v44z" fill="#332722"/>';
        t += '<path d="M162 240v-42c0-21 17-37 38-37s38 16 38 37v42z" fill="#241b18"/>';
        /* seated figure */
        t += '<circle cx="200" cy="212" r="9" fill="#1a1412"/>';
        t += '<path d="M200 221c-13 0-22 8-24 19h48c-2-11-11-19-24-19z" fill="#1a1412"/>';
        /* trees */
        [[44, 96], [72, 70], [346, 82], [374, 100]].forEach(function (c) {
          t += '<path d="M' + c[0] + ' 240c-8-30-3-' + c[1] + ' 7-' + c[1] + 's15 ' + (c[1] - 30) + ' 7 ' + c[1] + 'z" class="art-sway" fill="#4d5f45" opacity=".85"/>';
        });
        t += '<path d="M24 236c22-10 40-4 58-8" stroke="#3d4a38" stroke-width="2" fill="none" opacity=".6"/>';
        return t;
      }
    },
    pillar: {
      sky: ['#f4e0bc', '#d9ae7d'], sun: '#fff4d8',
      inner: function () {
        var t = '';
        t += '<circle cx="322" cy="58" r="28" fill="#fdf0c8" opacity=".85"/>';
        t += '<path d="M0 182c50-12 90 2 130-4s70-12 110-6 90 12 160 2v66H0z" fill="#b18f63" opacity=".7"/>';
        t += '<rect y="214" width="400" height="26" fill="#a08056"/>';
        /* pillar */
        t += '<path d="M188 214l4-14h16l4 14z" fill="#c9ad83"/>';
        t += '<path d="M194 200l3-98h6l3 98z" fill="#d6bb90"/>';
        t += '<path d="M196 102h8v-8h-8z" fill="#c3a476"/>';
        t += '<path d="M190 94h20v6h-20z" fill="#d9c093"/>';
        /* lion capital */
        t += '<circle cx="200" cy="84" r="9" fill="#d9c093"/>';
        t += '<circle cx="200" cy="84" r="4" fill="#b5986b"/>';
        /* fields */
        t += '<path d="M0 224c60-6 110 4 160-2M240 220c50-6 100 2 160-4" stroke="#8a6c48" stroke-width="1.4" fill="none" opacity=".5"/>';
        /* birds */
        t += '<path d="M96 58c4-4 8-4 12 0M108 52c3-3 6-3 9 0M140 70c3-3 6-3 9 0" stroke="#7a5c3f" stroke-width="1.4" fill="none"/>';
        t += '<path d="M60 226c0-14 8-24 20-24s20 10 20 24z" fill="#6f7d4f" opacity=".55"/>';
        return t;
      }
    },
    fort: {
      sky: ['#f0cda2', '#d1935f'], sun: '#fce3b4',
      inner: function () {
        var t = '';
        t += '<circle cx="96" cy="62" r="26" fill="#fbe2b4" opacity=".85"/>';
        t += '<path d="M0 176c50-16 96-2 140-8s76-14 116-6 96 12 144 0v78H0z" fill="#a37a55" opacity=".6"/>';
        /* wall */
        t += '<rect x="0" y="150" width="400" height="90" fill="#b58257"/>';
        t += '<path d="M0 150h400v10H0z" fill="#c99769"/>';
        for (var i = 0; i < 13; i++) {
          t += '<rect x="' + (i * 31) + '" y="138" width="16" height="14" fill="#a87750"/>';
        }
        /* bastion */
        t += '<path d="M232 240v-58c0-20 16-34 36-34s36 14 36 34v58z" fill="#c08c5f"/>';
        t += '<path d="M232 176h72v52h-72z" fill="#b88358"/>';
        t += '<path d="M228 176h80v8h-80z" fill="#cf9c6c"/>';
        t += '<rect x="244" y="196" width="10" height="14" fill="#7c5438"/>';
        t += '<rect x="282" y="196" width="10" height="14" fill="#7c5438"/>';
        /* flag */
        t += '<rect x="266" y="112" width="2.5" height="34" fill="#6d4a34"/>';
        t += '<path class="art-flag" d="M268 112l26 7-26 8z" fill="#b8503f"/>';
        /* scatter */
        t += '<path d="M40 226c18-6 34 0 50-4M318 220c18-6 34 0 50-4" stroke="#8a613f" stroke-width="1.4" fill="none" opacity=".5"/>';
        return t;
      }
    },
    tank: {
      sky: ['#eed6ba', '#c79a79'], sun: '#fbe6c2',
      inner: function () {
        var t = '';
        t += '<circle cx="300" cy="62" r="24" fill="#f8dfb4" opacity=".8"/>';
        t += '<path d="M0 164c44-10 84 2 122-4s66-10 104-4 88 8 132 2 34-4 42-2v84H0z" fill="#9c7f65" opacity=".55"/>';
        /* distant tomb */
        t += '<rect x="56" y="132" width="70" height="30" fill="#d9c8b0" opacity=".85"/>';
        t += '<path d="M64 132c0-18 11-30 27-30s27 12 27 30z" fill="#e5d6c0" opacity=".9"/>';
        t += '<rect x="88" y="96" width="5" height="10" fill="#cbb59a" opacity=".9"/>';
        /* pavilion */
        t += '<rect x="286" y="120" width="8" height="46" fill="#d6c2a8"/>';
        t += '<rect x="332" y="120" width="8" height="46" fill="#d6c2a8"/>';
        t += '<path d="M278 120h70v8h-70z" fill="#e1cfb6"/>';
        t += '<path d="M284 112c0-10 12-18 29-18s29 8 29 18z" fill="#e9d9c0"/>';
        /* tank */
        t += '<path d="M52 240l22-58h252l22 58z" fill="#c3ab90"/>';
        t += '<path d="M76 234l18-46h212l18 46z" fill="#8fa9a1"/>';
        t += '<path d="M104 220h192M118 208h164" stroke="#dceae3" stroke-width="1.2" opacity=".35"/>';
        t += '<path d="M52 240l22-58M348 240l-22-58" stroke="#b39a7f" stroke-width="3"/>';
        return t;
      }
    }
  };


  /* ── the little lives inside each picture ─────────────────── */
  function halo(x, y) { return '<circle class="art-halo" cx="' + x + '" cy="' + y + '" r="46" fill="#fff4cf"/>'; }
  function cloud(x, y, d, s) {
    return '<g class="art-cloud" style="animation-delay:-' + d + 's;animation-duration:' + (48 + d) + 's" opacity=".5"><g transform="translate(' + x + ',' + y + ') scale(' + (s || 1) + ')">' +
      '<ellipse rx="34" ry="8.5" fill="#fff"/><ellipse cx="22" cy="-6" rx="22" ry="8" fill="#fff"/><ellipse cx="-20" cy="-4" rx="18" ry="7" fill="#fff"/></g></g>';
  }
  function bird(y, d, t, sc) {
    return '<g class="art-fly" style="animation-delay:-' + d + 's;animation-duration:' + t + 's"><g transform="translate(0,' + y + ') scale(' + (sc || 1) + ')">' +
      '<path class="art-wing" d="M0 0q5-6 10 0q5-6 10 0" stroke="#5a4436" stroke-width="1.6" fill="none"/></g></g>';
  }
  function waves(y0, n, col) {
    var h = '', i;
    for (i = 0; i < n; i++) {
      h += '<path class="art-wave" style="animation-duration:' + (7 + i * 2) + 's" d="M-40 ' + (y0 + i * 11) + 'q15-4 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" stroke="' + (col || '#fff') + '" stroke-width="1.3" fill="none" opacity=".35"/>';
    }
    return h;
  }
  function motes(y, n, col) {
    var h = '', i;
    for (i = 0; i < n; i++) {
      h += '<circle class="art-mote" style="animation-delay:-' + (i * 1.7) + 's;animation-duration:' + (7 + (i % 3) * 2) + 's" cx="' + (60 + i * 52) + '" cy="' + y + '" r="1.6" fill="' + (col || '#fff2cf') + '"/>';
    }
    return h;
  }
  function ripple(x, y, n) {
    var h = '', i;
    for (i = 0; i < n; i++) h += '<ellipse class="art-ripple" style="animation-delay:-' + (i * 1.5) + 's" cx="' + x + '" cy="' + y + '" rx="26" ry="6" fill="none" stroke="#fff" stroke-width="1.3"/>';
    return h;
  }
  function glow(x, y, r) { return '<circle class="art-flicker" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#ffb45a"/>'; }

  var LIVE = {
    arch: function () {
      return cloud(70, 34, 6, 0.9) + bird(44, 0, 15, 1) + bird(60, 5, 18, .8) + bird(34, 10, 21, .7) + motes(190, 7);
    },
    garden: function () {
      return halo(86, 72) + cloud(300, 36, 9, 1) +
        '<g clip-path="inset(0)">' + waves(208, 3) + '</g>' + ripple(200, 212, 2) +
        '<g class="art-flit"><ellipse cx="150" cy="110" rx="4" ry="2.4" fill="#f6d27a"/><ellipse cx="154" cy="107" rx="3" ry="2" fill="#f0b25a"/></g>' + bird(50, 3, 20, .8);
    },
    dome: function () {
      return cloud(110, 50, 2, 1.2) + cloud(300, 36, 20, 1.4) + waves(206, 3) + bird(100, 4, 16, .8) + bird(88, 9, 19, .7) + bird(112, 14, 22, .6);
    },
    ghat: function () {
      return halo(286, 76) + cloud(80, 44, 5, 1) + waves(194, 4) +
        '<g class="art-bob"><ellipse cx="150" cy="226" rx="5" ry="2" fill="#7a4a30"/><path class="art-flicker" d="M150 224c-2-3-1-6 0-8 1 2 2 5 0 8z" fill="#ffd27a"/></g>' + bird(52, 2, 19, .8);
    },
    cave: function () {
      return halo(318, 64) + glow(200, 214, 30) +
        '<path class="art-rise" d="M200 168c-8-10 8-16 0-28" stroke="#e8dccb" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path class="art-rise r2" d="M206 170c-8-10 8-16 0-28" stroke="#e8dccb" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path class="art-rise r3" d="M194 170c-8-10 8-16 0-28" stroke="#e8dccb" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        motes(150, 5, '#ffe9a8') + bird(40, 3, 20, .8);
    },
    pillar: function () {
      var spokes = '', i, st = '';
      for (i = 0; i < 8; i++) spokes += '<path d="M0 0L-7 -70L7 -70z" transform="rotate(' + (i * 45) + ')" fill="#fff4cf"/>';
      for (i = 0; i < 22; i++) st += '<path class="art-sway" style="animation-delay:-' + (i * 0.3) + 's" d="M' + (18 + i * 18) + ' 226q1-10 3-16" stroke="#8d9a5a" stroke-width="1.4" fill="none"/>';
      return '<g class="art-spin" transform="translate(322 58)" opacity=".16"><g>' + spokes + '</g></g>' + halo(322, 58) +
        cloud(90, 40, 4, 1) + bird(70, 0, 14, .9) + bird(84, 6, 17, .7) + st;
    },
    fort: function () {
      return halo(96, 62) + cloud(250, 40, 7, 1.1) + bird(60, 1, 16, 1) +
        glow(249, 203, 12) + glow(287, 203, 12) +
        '<ellipse class="art-drift" cx="40" cy="214" rx="26" ry="3" fill="#e9c996" opacity=".35"/><ellipse class="art-drift d2" cx="200" cy="222" rx="30" ry="3" fill="#e9c996" opacity=".3"/>';
    },
    tank: function () {
      return halo(300, 62) + cloud(100, 40, 3, 1) + ripple(200, 214, 3) + waves(196, 3) +
        glow(313, 140, 10) +
        '<g class="art-drift d3"><ellipse cx="120" cy="212" rx="7" ry="3" fill="#f2ead8"/><circle cx="126" cy="208" r="2.4" fill="#f2ead8"/></g>' + bird(52, 5, 18, .8);
    }
  };

  function artSVG(kind, uid, label) {
    var a = ART[kind] || ART.ghat;
    var vign = 'vig' + uid, sky = 'sky' + uid, glow = 'glow' + uid;
    return '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(label) + '">' +
      '<defs>' +
      '<linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + a.sky[0] + '"/><stop offset="1" stop-color="' + a.sky[1] + '"/></linearGradient>' +
      '<radialGradient id="' + glow + '" cx=".5" cy=".5" r=".5">' +
      '<stop offset="0" stop-color="' + a.sun + '" stop-opacity=".55"/><stop offset="1" stop-color="' + a.sun + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + vign + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#241a12" stop-opacity=".26"/></linearGradient>' +
      '</defs>' +
      '<rect width="400" height="250" fill="url(#' + sky + ')"/>' +
      '<circle cx="200" cy="150" r="130" fill="url(#' + glow + ')"/>' +
      a.inner() +
      (LIVE[kind] ? '<g class="art-live">' + LIVE[kind]() + '</g>' : '') +
      '<rect width="400" height="250" fill="url(#' + vign + ')"/>' +
      '</svg>';
  }

  /* ══════════════════════════════════════════════════════════
     RENDERERS
     ══════════════════════════════════════════════════════════ */
  function renderTicker() {
    var el = $('#tickerTrack');
    if (!el) return;
    var words = lang === 'hi'
      ? ['गंगा', 'घाट', 'चिहल सतून', 'आम', 'गुलाब जल', 'लौंगलता', 'अफ़ीम', 'छठ', 'बिरहा', 'पव्हारी बाबा']
      : ['Ganga', 'Ghats', 'Chihal Satun', 'Aam', 'Gulab Jal', 'Launglata', 'Afeem', 'Chhath', 'Birha', 'Pavhari Baba'];
    var html = '';
    for (var r = 0; r < 2; r++) {
      for (var i = 0; i < words.length; i++) {
        html += '<span>' + esc(words[i]) + '</span><span aria-hidden="true">·</span>';
      }
    }
    el.innerHTML = html;
  }

  function renderRivers() {
    var el = $('#riverList');
    if (!el) return;
    el.innerHTML = window.DATA.rivers.map(function (r) {
      return '<li><b>' + esc(lang === 'hi' ? r.hi : r.n) + '</b><span>' + esc(pick(r.t)) + '</span></li>';
    }).join('');
  }

  function renderGhats() {
    if (window.Riverfront) window.Riverfront.build();
  }

  function renderTimeline() {
    var el = $('#timeline');
    if (!el) return;
    el.innerHTML = window.DATA.timeline.map(function (e) {
      return '<li class="tl-item rev"><span class="tl-year">' + esc(e.y) + '</span>' +
        '<div class="tl-body"><h3>' + esc(pick(e.t)) + '</h3><p>' + esc(pick(e.d)) + '</p></div></li>';
    }).join('');
  }

  function renderPlaces() {
    var el = $('#placeGrid');
    if (!el) return;
    el.innerHTML = window.DATA.places.map(function (p, i) {
      var name = pick(p.n);
      return '<button type="button" class="place-card rev" data-place="' + p.id + '" aria-label="' + esc(name) + '">' +
        '<span class="place-art">' + artSVG(p.art, 'p' + i, name) + '</span>' +
        '<span class="place-body">' +
        '<span class="place-kind">' + esc(pick(p.k)) + '</span>' +
        (p.game ? '<span class="place-game"><svg class="ic" aria-hidden="true"><use href="#i-play"/></svg>' + esc(L('pillar.pill')) + '</span>' : '') +
        '<h3>' + esc(name) + '</h3>' +
        '<span class="place-era">' + esc(p.era) + '</span>' +
        '<p>' + esc(clip(pick(p.d), 118)) + '</p>' +
        '<span class="place-open">' + (lang === 'hi' ? 'पढ़िए' : 'Read') +
        ' <svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></span>' +
        '</span></button>';
    }).join('');
  }

  function renderFestivals() {
    if (window.Festivals) window.Festivals.build();
  }

  function renderPhrases() {
    var el = $('#phraseList');
    if (!el) return;
    el.innerHTML = window.DATA.phrases.map(function (p, i) {
      return '<li class="phrase"><button type="button" class="phrase-btn" data-phrase="' + i + '">' +
        '<span><span class="phrase-deva" lang="hi">' + esc(p.deva) + '</span>' +
        '<span class="phrase-mean">' + esc(pick(p.m)) + '</span></span>' +
        '<span class="phrase-latin">' + esc(p.latin) + '</span>' +
        '<svg class="ic" aria-hidden="true"><use href="#i-sound"/></svg>' +
        '</button></li>';
    }).join('');
  }

  function renderPeople() {
    var el = $('#peopleGrid');
    if (!el) return;
    el.innerHTML = window.DATA.people.map(function (p) {
      return '<article class="person rev"><span class="person-mono" aria-hidden="true">' + esc(p.mono) + '</span>' +
        '<div><h3>' + esc(pick(p.n)) + '</h3><p>' + esc(pick(p.r)) + '</p>' +
        '<p class="person-note">' + esc(pick(p.note)) + '</p></div></article>';
    }).join('');
  }

  function renderExplore() {
    var el = $('#exploreGrid');
    if (!el) return;
    el.innerHTML = window.DATA.explore.map(function (x) {
      return '<article class="ex-card rev">' +
        '<span class="ex-ic"><svg class="ic" aria-hidden="true"><use href="#' + x.icon + '"/></svg></span>' +
        '<h3>' + esc(pick(x.t)) + '</h3><p>' + esc(pick(x.d)) + '</p>' +
        '<button type="button" class="ex-act" data-act="' + x.act + '">' + esc(pick(x.b)) +
        ' <svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
        '</article>';
    }).join('');
  }

  function renderMixer() {
    var rows = $('#mixerRows');
    if (!rows) return;
    var names = {
      drone: { en: 'Tanpura', hi: 'तानपुरा', eh: 'Tanpura' },
      flute: { en: 'Bansuri', hi: 'बाँसुरी', eh: 'Bansuri' },
      water: { en: 'Water', hi: 'पानी', eh: 'Paani' },
      birds: { en: 'Birds', hi: 'चिड़ियाँ', eh: 'Chidiyan' }
    };
    rows.innerHTML = Object.keys(names).map(function (id) {
      var v = Math.round(window.Ambient.getLevel(id) * 100);
      return '<div class="mix-row"><label for="mx-' + id + '">' + esc(pick(names[id])) + '</label>' +
        '<output id="out-' + id + '" for="mx-' + id + '">' + v + '%</output>' +
        '<input type="range" id="mx-' + id + '" data-mix="' + id + '" min="0" max="100" value="' + v + '" /></div>';
    }).join('');
  }

  function renderAtlas() {
    var el = $('#atlasSpots');
    if (!el) return;
    el.innerHTML = window.DATA.spots.map(function (s, i) {
      var name = pick(s.n);
      var anchor = s.x > 640 ? 'end' : 'start';
      var dx = s.x > 640 ? -14 : 14;
      return '<g class="spot" data-spot="' + i + '" tabindex="0" role="button" aria-label="' + esc(name) + '">' +
        '<circle class="spot-halo" cx="' + s.x + '" cy="' + s.y + '" r="20"/>' +
        '<circle class="spot-ring" cx="' + s.x + '" cy="' + s.y + '" r="13"/>' +
        '<circle class="spot-dot" cx="' + s.x + '" cy="' + s.y + '" r="4.5"/>' +
        '<text class="spot-label" x="' + (s.x + dx) + '" y="' + (s.y + 5) + '" text-anchor="' + anchor + '">' + esc(name) + '</text>' +
        '</g>';
    }).join('');
  }

  function renderRail() {
    var el = $('#rail');
    if (!el) return;
    var items = [
      { id: 'top', n: '00', k: 'hero.foot' },
      { id: 'river', n: '01', k: 'nav.river' },
      { id: 'story', n: '02', k: 'nav.story' },
      { id: 'places', n: '03', k: 'nav.places' },
      { id: 'poppy', n: '04', k: 'nav.poppy' },
      { id: 'living', n: '05', k: 'nav.living' },
      { id: 'people', n: '06', k: 'nav.living' },
      { id: 'atlas', n: '07', k: 'nav.atlas' },
      { id: 'explore', n: '08', k: 'nav.explore' }
    ];
    el.innerHTML = items.map(function (c) {
      return '<a href="#' + c.id + '" data-rail="' + c.id + '"><span>' + esc(c.n) + ' · ' + esc(L(c.k)) + '</span><i></i></a>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════════════
     LANGUAGE
     ══════════════════════════════════════════════════════════ */
  function applyLang(next, announce) {
    lang = window.I18N[next] ? next : 'en';
    store.set('gzp.lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');

    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = L(key);
      if (val) el.textContent = val;
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      var val = L(el.getAttribute('data-i18n-aria'));
      if (val) el.setAttribute('aria-label', val);
    });

    var ph = $('#paletteInput');
    if (ph) ph.placeholder = lang === 'hi' ? 'ग़ाज़ीपुर में खोजिए…' : lang === 'eh' ? 'Ghazipur mein dhoondhiye…' : 'Search Ghazipur…';

    $$('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    renderTicker(); renderRivers(); renderGhats(); renderTimeline(); renderPlaces();
    renderFestivals(); renderPhrases(); renderPeople(); renderExplore(); renderAtlas();
    renderRail(); renderMixer();
    bindCards();
    observeReveals();
    updateDockLabels();

    var yardTrain = $('#yardTrain'), yardLabel = $('#yardTrainLabel');
    if (yardTrain && yardLabel) {
      yardLabel.textContent = L(yardTrain.getAttribute('aria-pressed') === 'true' ? 'poppy.yardTrainStop' : 'poppy.yardTrain');
    }
    if (window.Naav && window.Naav.refresh) window.Naav.refresh();
    if (window.Nature && window.Nature.refresh) window.Nature.refresh();
    if (window.Pillar && window.Pillar.refresh) window.Pillar.refresh();

    if (announce) {
      window.Ambient.chime();
      toast(lang === 'hi' ? 'भाषा: हिन्दी' : lang === 'eh' ? 'Language: Hinglish' : 'Language: English');
    }
  }

  /* ══════════════════════════════════════════════════════════
     THEME
     ══════════════════════════════════════════════════════════ */
  function setTheme(mode, announce) {
    var resolved = mode;
    if (mode === 'auto') resolved = currentSky() > 0.76 ? 'night' : 'day';
    themeLock = mode !== 'auto';
    document.documentElement.setAttribute('data-theme', resolved);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'night' ? '#0b1717' : '#f6efe2');
    var btn = $('#themeBtn');
    if (btn) {
      btn.setAttribute('aria-pressed', resolved === 'night' ? 'true' : 'false');
      btn.setAttribute('aria-label', resolved === 'night' ? 'Switch to day' : 'Switch to night');
    }
    if (announce) toast(tst(mode === 'auto' ? 'autoTheme' : resolved === 'night' ? 'night' : 'day'));
  }

  function currentSky() { return skyOverride !== null ? skyOverride : skyFromScroll(); }

  function toggleTheme() {
    var now = document.documentElement.getAttribute('data-theme');
    themeMode = now === 'night' ? 'day' : 'night';
    store.set('gzp.theme', themeMode);
    skyOverride = null; skyOverrideUntil = 0;
    setTheme(themeMode, false);
    if (window.Scene) window.Scene.setTime(themeMode === 'night' ? 0.995 : 0.16);
    window.Ambient.chime();
  }

  /* ══════════════════════════════════════════════════════════
     SCROLL → SKY
     ══════════════════════════════════════════════════════════ */
  var sceneSections = [];
  function collectSections() {
    sceneSections = $$('[data-scene]').map(function (el) {
      return { el: el, v: parseFloat(el.getAttribute('data-scene')) || 0.5, top: el.offsetTop };
    });
    sceneSections.sort(function (a, b) { return a.top - b.top; });
  }

  function skyFromScroll() {
    if (!sceneSections.length) return 0.18;
    var y = window.scrollY + window.innerHeight * 0.42;
    var prev = sceneSections[0], next = sceneSections[sceneSections.length - 1];
    for (var i = 0; i < sceneSections.length; i++) {
      if (sceneSections[i].top <= y) prev = sceneSections[i];
      if (sceneSections[i].top > y) { next = sceneSections[i]; break; }
    }
    var a = prev.top, b = next.top;
    var f = b > a ? clamp((y - a) / (b - a), 0, 1) : 0;
    f = f * f * (3 - 2 * f);
    return prev.v + (next.v - prev.v) * f;
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      var head = $('#siteHead');
      if (head) head.classList.toggle('is-stuck', y > 24);

      var now = performance.now();
      var sky;
      if (themeLock) {
        sky = themeMode === 'night' ? 0.995 : 0.16;
      } else {
        sky = skyOverride !== null && now < skyOverrideUntil ? skyOverride : skyFromScroll();
        if (skyOverride !== null && now >= skyOverrideUntil) skyOverride = null;
      }
      if (window.Scene) window.Scene.setTime(sky);

      if (themeMode === 'auto' && !themeLock) {
        /* hysteresis on the *smoothed* sky, so the page never flickers at the seam */
        var smoothed = window.Scene && window.Scene.getDay ? window.Scene.getDay() : sky;
        var current = document.documentElement.getAttribute('data-theme');
        var want = current;
        if (smoothed > 0.855) want = 'night';
        else if (smoothed < 0.735) want = 'day';
        if (want !== current) setTheme('auto', false);
      }

      var active = null;
      sceneSections.forEach(function (s) { if (s.top - 140 <= y) active = s.el.id; });
      $$('.site-nav a').forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + active);
      });
      $$('#rail a').forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('data-rail') === active);
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     DETAIL SHEET
     ══════════════════════════════════════════════════════════ */
  var sheet = $('#sheet'), lastFocus = null;
  function openPlace(id) {
    var p = window.DATA.places.filter(function (x) { return x.id === id; })[0];
    if (!p || !sheet) return;
    lastFocus = document.activeElement;
    var name = pick(p.n);
    $('#sheetArt').innerHTML = artSVG(p.art, 'sheet', name);
    $('#sheetKind').textContent = pick(p.k);
    $('#sheetTitle').textContent = name;
    $('#sheetMeta').textContent = p.era;
    $('#sheetText').innerHTML = '<p>' + esc(pick(p.d)) + '</p>' +
      (p.game ? '<p><button type="button" class="btn btn-solid" data-game="' + p.game + '"><svg class="ic"><use href="#i-play"/></svg><span>' + esc(L('pillar.openBtn')) + '</span></button></p>' : '');
    sheet.hidden = false;
    document.body.classList.add('sheet-open');
    var close = $('.sheet-close', sheet);
    setTimeout(function () { if (close) close.focus(); }, 60);
    window.Ambient.chime();
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.body.classList.remove('sheet-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (sheet) {
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-sheet-close]')) closeSheet();
      var g = e.target.closest('[data-game]');
      if (g && g.getAttribute('data-game') === 'pillar') { closeSheet(); if (window.Pillar) window.Pillar.open(); }
    });
  }

  /* ══════════════════════════════════════════════════════════
     SEARCH
     ══════════════════════════════════════════════════════════ */
  var palette = $('#palette'), palInput = $('#paletteInput'), palResults = $('#paletteResults');
  var palIndex = [], palCursor = 0;

  var KIND = {
    en: { chapter: 'Chapter', place: 'Place', person: 'Person', festival: 'Festival', river: 'River', feature: 'Feature', phrase: 'Phrase' },
    hi: { chapter: 'अध्याय', place: 'जगह', person: 'व्यक्ति', festival: 'त्योहार', river: 'नदी', feature: 'सुविधा', phrase: 'वाक्य' },
    eh: { chapter: 'Chapter', place: 'Jagah', person: 'Insaan', festival: 'Tyohar', river: 'Nadi', feature: 'Feature', phrase: 'Vaakya' }
  };

  function buildIndex() {
    var idx = [];
    function add(title, sub, kind, icon, action, kw) {
      idx.push({ t: title, s: sub, k: kind, icon: icon, a: action, kw: (kw || '').toLowerCase() });
    }
    [
      ['top', 'hero.foot'], ['river', 'river.title'], ['story', 'story.title'],
      ['places', 'places.title'], ['poppy', 'poppy.title'], ['living', 'living.title'],
      ['people', 'people.title'], ['atlas', 'atlas.title'], ['explore', 'explore.title']
    ].forEach(function (c) {
      add(L(c[1]), L('nav.' + (c[0] === 'top' ? 'explore' : c[0])) || '', 'chapter', 'i-arrow',
        { type: 'section', id: c[0] }, c[0]);
    });
    window.DATA.places.forEach(function (p) {
      add(pick(p.n), pick(p.k), 'place', 'i-pin', { type: 'place', id: p.id }, p.era + ' ' + pick(p.d));
    });
    window.DATA.people.forEach(function (p) {
      add(pick(p.n), pick(p.r), 'person', 'i-spark', { type: 'section', id: 'people' }, pick(p.note));
    });
    window.DATA.festivals.forEach(function (f) {
      add(pick(f.n), pick(f.w), 'festival', 'i-lamp', { type: 'section', id: 'living' }, pick(f.d));
    });
    window.DATA.rivers.forEach(function (r) {
      add(lang === 'hi' ? r.hi : r.n, pick(r.t), 'river', 'i-sound', { type: 'section', id: 'river' }, r.n);
    });
    window.DATA.phrases.forEach(function (p) {
      add(p.deva, pick(p.m), 'phrase', 'i-music', { type: 'section', id: 'living' }, p.latin);
    });
    window.DATA.explore.forEach(function (x) {
      add(pick(x.t), pick(x.b), 'feature', x.icon, { type: 'act', act: x.act }, pick(x.d));
    });
    palIndex = idx;
  }

  function paletteOpen() {
    if (!palette) return;
    buildIndex();
    palette.hidden = false;
    document.body.classList.add('palette-open');
    palInput.value = '';
    renderPalette('');
    setTimeout(function () { palInput.focus(); }, 50);
  }
  function paletteClose() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    document.body.classList.remove('palette-open');
  }

  function renderPalette(q) {
    var query = q.trim().toLowerCase();
    var res = palIndex.filter(function (e) {
      if (!query) return true;
      return (e.t + ' ' + e.s + ' ' + e.kw).toLowerCase().indexOf(query) !== -1;
    });
    var score = function (e) {
      var t = e.t.toLowerCase();
      return t.indexOf(query) === 0 ? 0 : t.indexOf(query) > 0 ? 1 : 2;
    };
    if (query) res.sort(function (a, b) { return score(a) - score(b); });
    res = res.slice(0, 8);
    palCursor = 0;
    if (!res.length) {
      palResults.innerHTML = '<li class="palette-empty">' +
        (lang === 'hi' ? 'कुछ नहीं मिला।' : lang === 'eh' ? 'Kuch nahi mila.' : 'Nothing found.') + '</li>';
      return;
    }
    palResults.innerHTML = res.map(function (e, i) {
      var kind = (KIND[lang] || KIND.en)[e.k] || e.k;
      return '<li><button class="palette-item' + (i === 0 ? ' is-cursor' : '') + '" data-i="' + i + '">' +
        '<span class="pi-ic"><svg class="ic" aria-hidden="true"><use href="#' + e.icon + '"/></svg></span>' +
        '<span><span class="pi-title">' + esc(e.t) + '</span><span class="pi-sub">' + esc(e.s) + '</span></span>' +
        '<span class="pi-kind">' + esc(kind) + '</span></button></li>';
    }).join('');
    palResults._data = res;
    $$('.palette-item', palResults).forEach(function (b) {
      b.addEventListener('click', function () { activatePalette(parseInt(b.getAttribute('data-i'), 10)); });
      b.addEventListener('mousemove', function () {
        var i = parseInt(b.getAttribute('data-i'), 10);
        if (i === palCursor) return;
        palCursor = i;
        $$('.palette-item', palResults).forEach(function (x, j) { x.classList.toggle('is-cursor', j === i); });
      });
    });
  }

  function activatePalette(i) {
    var res = palResults._data || [];
    var e = res[i];
    if (!e) return;
    paletteClose();
    if (e.a.type === 'section') {
      scrollTo(e.a.id);
    } else if (e.a.type === 'place') {
      scrollTo('places');
      setTimeout(function () { openPlace(e.a.id); }, 500);
    } else if (e.a.type === 'act') {
      setTimeout(function () { runAction(e.a.act); }, 250);
    }
    window.Ambient.chime();
  }

  if (palInput) {
    palInput.addEventListener('input', function () { renderPalette(palInput.value); });
    palInput.addEventListener('keydown', function (e) {
      var items = $$('.palette-item', palResults);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        palCursor = (palCursor + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        items.forEach(function (x, j) { x.classList.toggle('is-cursor', j === palCursor); });
        items[palCursor].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activatePalette(palCursor);
      } else if (e.key === 'Escape') {
        paletteClose();
      }
    });
  }
  if (palette) {
    palette.addEventListener('click', function (e) {
      if (e.target === palette) paletteClose();
    });
  }
  var palEsc = $('#paletteEsc');
  if (palEsc) palEsc.addEventListener('click', paletteClose);

  /* ══════════════════════════════════════════════════════════
     ACTIONS
     ══════════════════════════════════════════════════════════ */
  var SKIES = [0.18, 0.34, 0.55, 0.72, 0.86, 1];
  var skyStep = 0;

  function previewSky(v) {
    skyOverride = v;
    skyOverrideUntil = performance.now() + 6500;
    if (window.Scene) window.Scene.setTime(v);
    if (themeMode === 'auto') setTheme('auto', false);
  }

  function runAction(act) {
    if (act === 'toggle') { toggleAudio(); }
    else if (act === 'mixer') { toggleMixer(true); }
    else if (act === 'sky') {
      skyStep = (skyStep + 1) % SKIES.length;
      previewSky(SKIES[skyStep]);
      toast(tst('sky'));
    }
    else if (act === 'diya') {
      if (window.Scene) window.Scene.releaseDiya(5);
      window.Ambient.plop();
      toast(tst('diya'));
    }
    else if (act === 'bell') {
      window.Ambient.bell();
      if (window.Scene) window.Scene.shake();
      toast(tst('bell'));
    }
    else if (act === 'search') { paletteOpen(); }
    else if (act === 'atlas') { scrollTo('atlas'); }
    else if (act === 'lang') {
      var order = ['en', 'hi', 'eh'];
      applyLang(order[(order.indexOf(lang) + 1) % 3], true);
    }
    else if (act === 'phrases') {
      scrollTo('living');
      setTimeout(function () {
        var el = $('#phraseList');
        if (el) { el.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 900 }); }
      }, 500);
    }
    else if (act === 'theme') {
      if (themeMode === 'auto') { themeMode = 'night'; setTheme('night', true); }
      else if (themeMode === 'night') { themeMode = 'day'; setTheme('day', true); }
      else { themeMode = 'auto'; setTheme('auto', true); }
      store.set('gzp.theme', themeMode);
      if (window.Scene) {
        if (themeMode === 'auto') window.Scene.setTime(skyFromScroll());
        else window.Scene.setTime(themeMode === 'night' ? 0.995 : 0.16);
      }
    }
    else if (act === 'places') {
      var p = window.DATA.places[Math.floor(Math.random() * window.DATA.places.length)];
      openPlace(p.id);
    }
    else if (act === 'sfx') {
      var box = $('#sfxToggle');
      if (box) { box.checked = !box.checked; box.dispatchEvent(new Event('change')); }
    }
    else if (act === 'naav') { openNaav(); }
    else if (act === 'pillar') { if (window.Pillar) window.Pillar.open(); }
    else if (act === 'monsoon') {
      scrollTo('top');
      setTimeout(function () { if (window.Nature) window.Nature.setSeason('monsoon'); }, 500);
    }
    else if (act === 'wildlife') {
      scrollTo('top');
      setTimeout(function () { if (window.Nature) window.Nature.call(); }, 600);
    }
    else if (act === 'aarti') { aarti(); }
    else if (act === 'yard-siren') {
      scrollTo('poppy');
      setTimeout(function () {
        var b = $('#yardSiren');
        if (b) b.click();
      }, 700);
      toast(tst('siren'));
    }
    else if (act === 'yard-train') {
      scrollTo('poppy');
      setTimeout(function () {
        var b = $('#yardTrain');
        if (b) b.click();
      }, 700);
      toast(tst('train'));
    }
    else if (act === 'ghat-life') {
      scrollTo('top');
      themeMode = 'auto';
      store.set('gzp.theme', 'auto');
      previewSky(0.18);
      toast(tst('ghat'));
    }
  }

  function openNaav() {
    if (window.Naav) { window.Naav.open(); toast(tst('naav')); }
  }

  function aarti() {
    previewSky(0.98);
    if (window.Scene) {
      window.Scene.setTime(0.98);
      window.Scene.releaseDiya(8);
    }
    window.Ambient.bell();
    toast(tst('aarti'));
  }

  /* the yard: a trolley you can run, a siren you can sound */
  var yardFrame = $('#yard'), yardTrain = $('#yardTrain'), yardSiren = $('#yardSiren');
  var yardClack = null, sirenTimer = null;

  function yardTrainOn(on) {
    if (!yardFrame || !yardTrain) return;
    yardFrame.classList.toggle('is-running', on);
    yardTrain.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = $('#yardTrainLabel');
    if (label) label.textContent = L(on ? 'poppy.yardTrainStop' : 'poppy.yardTrain');
    if (on) {
      window.Ambient.whistle();
      clearInterval(yardClack);
      yardClack = setInterval(function () {
        if (!yardFrame.classList.contains('is-running')) { clearInterval(yardClack); return; }
        window.Ambient.clack();
      }, 860);
    } else {
      clearInterval(yardClack);
      yardClack = null;
    }
  }

  function bindYard() {
    if (yardTrain) {
      yardTrain.addEventListener('click', function () {
        yardTrainOn(yardTrain.getAttribute('aria-pressed') !== 'true');
      });
    }
    if (yardSiren) {
      yardSiren.addEventListener('click', function () {
        if (!yardSiren) return;
        var already = yardFrame && yardFrame.classList.contains('is-siren');
        if (yardFrame) yardFrame.classList.add('is-siren');
        yardSiren.setAttribute('aria-pressed', 'true');
        if (!already) window.Ambient.siren();
        clearTimeout(sirenTimer);
        sirenTimer = setTimeout(function () {
          if (yardFrame) yardFrame.classList.remove('is-siren');
          yardSiren.setAttribute('aria-pressed', 'false');
        }, 4300);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     AUDIO UI
     ══════════════════════════════════════════════════════════ */
  var dock = $('#audioDock'), dockSub = $('#dockSub'), mixer = $('#mixer');
  function updateDockLabels() {
    if (dockSub) dockSub.textContent = audioOn ? (lang === 'hi' ? 'चल रहा है' : lang === 'eh' ? 'chal raha hai' : 'now playing') : L('dock.sub');
  }
  function setAudioUI(on) {
    audioOn = on;
    if (dock) dock.setAttribute('data-on', on ? 'true' : 'false');
    $$('[data-sound="toggle"]').forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    updateDockLabels();
  }
  function toggleAudio() {
    var on = window.Ambient.toggle();
    setAudioUI(on);
    toast(tst(on ? 'audioOn' : 'audioOff'));
  }
  function toggleMixer(force) {
    if (!mixer) return;
    var open = typeof force === 'boolean' ? force : mixer.hidden;
    mixer.hidden = !open;
    var b = $('#mixerBtn');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && !audioOn) { /* start on demand */ }
  }

  /* ══════════════════════════════════════════════════════════
     BINDINGS
     ══════════════════════════════════════════════════════════ */
  function bindCards() {
    $$('[data-place]').forEach(function (b) {
      b.addEventListener('click', function () { openPlace(b.getAttribute('data-place')); });
    });
    $$('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { runAction(b.getAttribute('data-act')); });
    });
    $$('[data-phrase]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = window.DATA.phrases[parseInt(b.getAttribute('data-phrase'), 10)];
        if (!p) return;
        speak(p.deva);
        window.Ambient.chime();
      });
    });
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      toast(lang === 'hi' ? 'इस ब्राउज़र में आवाज़ नहीं है।' : 'This browser has no speech.');
      return;
    }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'hi-IN';
    u.rate = 0.86;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }

  function scrollTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  /* ══════════════════════════════════════════════════════════
     ATLAS
     ══════════════════════════════════════════════════════════ */
  function bindAtlas() {
    var wrap = $('#atlasSpots');
    if (!wrap) return;
    function show(i) {
      var s = window.DATA.spots[i];
      if (!s) return;
      $$('.spot', wrap).forEach(function (g) { g.classList.toggle('is-on', g.getAttribute('data-spot') === String(i)); });
      $('#atlasEyebrow').textContent = pick(s.kind);
      $('#atlasTitle').textContent = pick(s.n);
      $('#atlasText').textContent = pick(s.d);
    }
    function fromEvent(e) {
      var g = e.target.closest('.spot');
      if (!g) return;
      show(parseInt(g.getAttribute('data-spot'), 10));
    }
    wrap.addEventListener('mouseover', fromEvent);
    wrap.addEventListener('click', function (e) { fromEvent(e); window.Ambient.tick(); });
    wrap.addEventListener('focusin', fromEvent);
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fromEvent(e); }
    });
    show(0);
  }

  /* ══════════════════════════════════════════════════════════
     REVEALS
     ══════════════════════════════════════════════════════════ */
  var revObs = null;
  function observeReveals() {
    if (!('IntersectionObserver' in window)) {
      $$('.rev').forEach(function (e) { e.classList.add('in'); });
      return;
    }
    if (!revObs) {
      revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    }
    $$('.rev:not(.in)').forEach(function (e) { revObs.observe(e); });
  }

  /* ══════════════════════════════════════════════════════════
     START
     ══════════════════════════════════════════════════════════ */
  function boot() {
    applyLang(lang, false);
    setTheme(themeMode, false);

    if (themeMode === 'auto') {
      /* first paint: respect sky from the top */
      document.documentElement.setAttribute('data-theme', 'day');
    } else if (window.Scene) {
      window.Scene.setTime(themeMode === 'night' ? 0.995 : 0.16);
    }

    var heroNaav = $('#heroNaav');
    if (heroNaav) heroNaav.addEventListener('click', openNaav);
    bindYard();

    /* language buttons */
    $$('.lang button').forEach(function (b) {
      b.setAttribute('title', b.getAttribute('data-lang') === 'hi' ? 'हिन्दी' : b.getAttribute('data-lang') === 'eh' ? 'Hinglish' : 'English');
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang'), true); });
    });

    /* theme + search + menu */
    var themeBtn = $('#themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    var searchBtn = $('#searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', paletteOpen);
    var menuBtn = $('#menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    $$('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        window.Ambient.tick();
      });
    });

    /* audio */
    $$('[data-sound="toggle"]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); toggleAudio(); });
    });
    var mixerBtn = $('#mixerBtn');
    if (mixerBtn) mixerBtn.addEventListener('click', function () { toggleMixer(); });
    var mixerClose = $('#mixerClose');
    if (mixerClose) mixerClose.addEventListener('click', function () { toggleMixer(false); });
    var master = $('#masterVol');
    if (master) master.addEventListener('input', function () { window.Ambient.setMaster(master.value / 100); });
    var sfx = $('#sfxToggle');
    if (sfx) {
      var savedSfx = store.get('gzp.sfx');
      if (savedSfx === 'off') { sfx.checked = false; window.Ambient.setSfx(false); }
      sfx.addEventListener('change', function () {
        window.Ambient.setSfx(sfx.checked);
        store.set('gzp.sfx', sfx.checked ? 'on' : 'off');
        toast(tst(sfx.checked ? 'sfxOn' : 'sfxOff'));
        if (sfx.checked) window.Ambient.chime();
      });
    }
    var rows = $('#mixerRows');
    if (rows) {
      rows.addEventListener('input', function (e) {
        var id = e.target.getAttribute('data-mix');
        if (!id) return;
        var v = parseInt(e.target.value, 10);
        window.Ambient.setLevel(id, v / 100);
        var out = document.getElementById('out-' + id);
        if (out) out.textContent = v + '%';
      });
    }

    /* footer top */
    var top = $('#footTop');
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    /* keyboard */
    document.addEventListener('keydown', function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); paletteOpen(); }
      if (e.key === 'Escape') { paletteClose(); closeSheet(); toggleMixer(false); document.body.classList.remove('nav-open'); }
      if (e.key === '/' && !mod && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); paletteOpen(); }
    });

    /* hover ticks on the rail, very quiet */
    var lastTick = 0;
    $$('#rail a').forEach(function (a) {
      a.addEventListener('mouseenter', function () {
        var n = Date.now();
        if (n - lastTick > 240) { lastTick = n; window.Ambient.tick(); }
      });
    });

    bindAtlas();

    /* scene sync */
    collectSections();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { collectSections(); onScroll(); }, { passive: true });

    /* loader */
    setTimeout(function () { document.documentElement.classList.add('is-ready'); }, 700);
    window.addEventListener('load', function () {
      collectSections();
      onScroll();
      setTimeout(function () { document.documentElement.classList.add('is-ready'); }, 250);
    });

    /* reveal after dynamic render */
    observeReveals();
    setTimeout(observeReveals, 900);

    /* keep audio dock state in sync if user pauses via OS */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && audioOn) { /* ambient keeps running, scene pauses */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
