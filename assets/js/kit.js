/* ============ Pienipeli kit: shared by the toddler games ============
   Used by Peekaboo, Bubble Bath, Color Splash, Animal Band and Bedtime.

   Kit.Sound  Every sound and every tune is generated live with the Web Audio API.
              No audio files, no speech: only music, chimes and playful animal calls.
              (The tone/noise helpers and animal calls match Feed the Animals' sounds.js.)
   Kit.Music  Note names -> Hz, a melody player and a music-box voice.
   Kit.fx     Floating hearts/stars, confetti bursts, sparkles.
   Kit.setup  Grown-up corner buttons (sound, full screen), first-tap audio unlock,
              and toddler-proofing (no zoom, no context menu, no double-tap).

   Load after ../../assets/js/app.js:   <script src="../../assets/js/kit.js"></script>   */

(() => {
  'use strict';

  /* ---------- Small helpers ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const later = (fn, ms) => setTimeout(fn, ms);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }

  // A queue that hands out every item once (shuffled) before repeating, never the same twice in a row.
  function bag(items) {
    let q = [], last = null;
    return () => {
      if (!q.length) {
        q = shuffle(items);
        if (q.length > 1 && q[0] === last) q.push(q.shift());
      }
      last = q.shift();
      return last;
    };
  }

  // Settings remembered on this device only
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pienipeli-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pienipeli-' + k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } }
  };

  /* =====================================================================
     Sound
     ===================================================================== */
  let ctx = null, master = null;
  let muted = store.get('muted', false);

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        // A gentle limiter so many fingers at once never get harsh or loud
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6;
        comp.attack.value = 0.004; comp.release.value = 0.2;
        master.connect(comp).connect(ctx.destination);
      } catch (err) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume(); // needs a user gesture
    return ctx;
  }

  // A shaped oscillator note. f is a list of [seconds, Hz] points to glide through.
  function tone({ type = 'sine', f = [[0, 440]], at = 0, dur = 0.4, vol = 0.3,
                  attack = 0.02, release = 0.08, filter, vib, trem, decay } = {}) {
    const t = ctx.currentTime + 0.02 + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f[0][1], t);
    for (let i = 1; i < f.length; i++) o.frequency.linearRampToValueAtTime(f[i][1], t + f[i][0]);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    if (decay) {
      // plucked / music-box shape: fast attack, smooth exponential fade
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    } else {
      g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
    }

    let node = o;
    if (filter) {
      const bq = ctx.createBiquadFilter();
      bq.type = filter.type || 'lowpass';
      bq.frequency.setValueAtTime(filter.f, t);
      if (filter.to) bq.frequency.linearRampToValueAtTime(filter.to, t + dur);
      bq.Q.value = filter.q || 1;
      node.connect(bq); node = bq;
    }
    const lfos = [];
    if (vib) { // pitch wobble
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = vib.rate; lg.gain.value = vib.depth;
      l.connect(lg).connect(o.frequency); lfos.push(l);
    }
    if (trem) { // volume flutter
      const tg = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
      tg.gain.value = 1 - trem.depth / 2;
      l.frequency.value = trem.rate; lg.gain.value = trem.depth / 2;
      l.connect(lg).connect(tg.gain); lfos.push(l);
      node.connect(tg); node = tg;
    }
    node.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    lfos.forEach(l => { l.start(t); l.stop(t + dur + 0.05); });
  }

  // Filtered noise (splash, whoosh, scrub, snore)
  let noiseBuf = null;
  function noise({ at = 0, dur = 0.3, vol = 0.2, attack = 0.01, filter = { type: 'bandpass', f: 1000, q: 1 }, to } = {}) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + 0.02 + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bq = ctx.createBiquadFilter();
    bq.type = filter.type; bq.frequency.setValueAtTime(filter.f, t); bq.Q.value = filter.q || 1;
    if (to) bq.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq).connect(g).connect(master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  const rep = (times, gap, fn) => { for (let i = 0; i < times; i++) fn(i * gap, i); };

  /* ---------- Music ---------- */
  const SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  // 'C4', 'F#5', 'Bb3' -> Hz
  function hz(name) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return 440;
    const n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
    return 440 * Math.pow(2, n / 12);
  }

  // Music box / glockenspiel: bright, plucked, with a soft octave shimmer
  function musicBox(freq, at = 0, vol = 0.22, len = 1.2) {
    tone({ type: 'sine', f: [[0, freq]], at, dur: len, vol, attack: 0.004, decay: true });
    tone({ type: 'triangle', f: [[0, freq * 2]], at, dur: len * 0.5, vol: vol * 0.28, attack: 0.002, decay: true });
    tone({ type: 'sine', f: [[0, freq * 3]], at, dur: len * 0.25, vol: vol * 0.12, attack: 0.002, decay: true });
  }

  // Soft round "marimba" for jingles
  function marimba(freq, at = 0, vol = 0.24, len = 0.5) {
    tone({ type: 'sine', f: [[0, freq]], at, dur: len, vol, attack: 0.003, decay: true });
    tone({ type: 'sine', f: [[0, freq * 4]], at, dur: 0.08, vol: vol * 0.25, attack: 0.001, decay: true });
  }

  // Play a melody: notes = [['E4', beats], ...] ('-' is a rest).
  // Returns its length in seconds. voice(freq, atSeconds, beatSeconds) makes each note.
  function melody(notes, { bpm = 120, voice = musicBox, at = 0, vol } = {}) {
    const beat = 60 / bpm;
    let t = at;
    notes.forEach(([n, beats]) => {
      if (n !== '-') voice(hz(n), t, vol === undefined ? undefined : vol, Math.max(0.35, beats * beat * 1.6));
      t += beats * beat;
    });
    return t - at;
  }

  /* ---------- Animal calls (playful synthesized imitations) ---------- */
  const CALLS = {
    monkey: () => {
      rep(3, 0.2, at => tone({ type: 'triangle', f: [[0, 480], [0.13, 920]], at, dur: 0.16, vol: 0.32 }));
      tone({ type: 'sawtooth', f: [[0, 950], [0.28, 600]], at: 0.62, dur: 0.32, vol: 0.22, filter: { type: 'bandpass', f: 1500 } });
    },
    rabbit: () => { // sniff sniff + a tiny squeak
      rep(4, 0.11, at => noise({ at, dur: 0.07, vol: 0.25, filter: { type: 'highpass', f: 2500 } }));
      tone({ type: 'sine', f: [[0, 1800], [0.08, 2500], [0.14, 2100]], at: 0.5, dur: 0.15, vol: 0.14 });
    },
    cat: () => tone({ type: 'sawtooth', f: [[0, 480], [0.18, 780], [0.5, 560], [0.75, 400]], dur: 0.8, vol: 0.28,
      filter: { type: 'bandpass', f: 1400, to: 800, q: 2 }, vib: { rate: 6, depth: 14 } }),
    dog: () => rep(2, 0.3, at => {
      tone({ type: 'square', f: [[0, 330], [0.13, 170]], at, dur: 0.17, vol: 0.32, filter: { f: 900, q: 2 } });
      noise({ at, dur: 0.12, vol: 0.18, filter: { type: 'bandpass', f: 700, q: 1.5 } });
    }),
    elephant: () => {
      tone({ type: 'sawtooth', f: [[0, 340], [0.12, 720], [0.8, 640], [1.05, 480]], dur: 1.1, vol: 0.3,
        filter: { type: 'bandpass', f: 1300, q: 0.8 }, vib: { rate: 5, depth: 18 } });
      noise({ dur: 0.9, vol: 0.06, filter: { type: 'bandpass', f: 1800, q: 1 } });
    },
    cow: () => tone({ type: 'sawtooth', f: [[0, 140], [0.3, 158], [1.3, 118]], dur: 1.4, vol: 0.45,
      attack: 0.12, release: 0.3, filter: { f: 260, to: 900, q: 4 } }),
    pig: () => rep(2, 0.24, at => tone({ type: 'square', f: [[0, 190], [0.14, 140]], at, dur: 0.16, vol: 0.3,
      filter: { f: 650, q: 8 } })),
    bear: () => tone({ type: 'sawtooth', f: [[0, 150], [0.4, 230], [0.9, 120]], dur: 1.0, vol: 0.4,
      filter: { f: 550, q: 3 }, trem: { rate: 16, depth: 0.7 } }),
    panda: () => rep(2, 0.3, at => tone({ type: 'sawtooth', f: [[0, 520], [0.2, 420]], at, dur: 0.24, vol: 0.2,
      filter: { type: 'bandpass', f: 1200, q: 2 }, trem: { rate: 14, depth: 0.6 } })),
    mouse: () => rep(3, 0.17, at => tone({ type: 'sine', f: [[0, 2300], [0.07, 3000], [0.12, 2500]], at, dur: 0.12, vol: 0.18 })),
    horse: () => tone({ type: 'sawtooth', f: [[0, 760], [0.12, 1050], [1.0, 480]], dur: 1.05, vol: 0.22,
      filter: { type: 'bandpass', f: 1500, q: 1 }, vib: { rate: 15, depth: 70 } }),
    sheep: () => tone({ type: 'sawtooth', f: [[0, 330], [0.7, 300]], dur: 0.85, vol: 0.32,
      filter: { type: 'bandpass', f: 1100, q: 1.5 }, trem: { rate: 8, depth: 0.8 } }),
    // Big cats: a soft, friendly rumble (never a scary roar for little ones)
    lion: () => {
      tone({ type: 'sawtooth', f: [[0, 110], [0.3, 150], [1.0, 90]], dur: 1.05, vol: 0.32, attack: 0.12,
        filter: { f: 480, to: 300, q: 2 }, trem: { rate: 22, depth: 0.5 } });
      noise({ dur: 0.9, vol: 0.06, attack: 0.1, filter: { type: 'lowpass', f: 500 } });
    },
    tiger: () => tone({ type: 'sawtooth', f: [[0, 95], [0.4, 120], [0.9, 80]], dur: 1.0, vol: 0.35, attack: 0.1,
      filter: { f: 420, q: 3 }, trem: { rate: 28, depth: 0.6 } }),
    penguin: () => rep(2, 0.32, at => tone({ type: 'sawtooth', f: [[0, 700], [0.08, 1000], [0.22, 760]], at, dur: 0.24, vol: 0.22,
      filter: { type: 'bandpass', f: 1300, q: 3 } })),
    chick: () => rep(3, 0.2, at => tone({ type: 'sine', f: [[0, 2400], [0.1, 3200], [0.14, 2800]], at, dur: 0.15, vol: 0.18 })),
    koala: () => tone({ type: 'sawtooth', f: [[0, 120], [0.3, 170], [0.7, 110]], dur: 0.8, vol: 0.3,
      filter: { f: 500, q: 3 }, trem: { rate: 20, depth: 0.7 } }),
    hippo: () => rep(2, 0.45, at => tone({ type: 'sawtooth', f: [[0, 110], [0.3, 90]], at, dur: 0.38, vol: 0.38,
      filter: { f: 400, q: 4 }, trem: { rate: 12, depth: 0.6 } })),
    duck: () => rep(3, 0.26, at => tone({ type: 'sawtooth', f: [[0, 580], [0.16, 460]], at, dur: 0.19, vol: 0.3,
      filter: { type: 'bandpass', f: 1100, q: 5 } })),
    giraffe: () => tone({ type: 'sine', f: [[0, 160], [0.4, 200], [0.9, 150]], dur: 1.0, vol: 0.4, attack: 0.1, release: 0.3,
      vib: { rate: 4, depth: 6 } }),
    frog: () => rep(2, 0.32, at => tone({ type: 'square', f: [[0, 260], [0.1, 180], [0.2, 240]], at, dur: 0.22, vol: 0.22,
      filter: { f: 800, q: 6 }, trem: { rate: 40, depth: 0.8 } })),
    owl: () => {
      tone({ type: 'sine', f: [[0, 420], [0.1, 470], [0.4, 400]], dur: 0.45, vol: 0.3, attack: 0.06, release: 0.2 });
      tone({ type: 'sine', f: [[0, 400], [0.1, 450], [0.5, 380]], at: 0.6, dur: 0.55, vol: 0.3, attack: 0.06, release: 0.25 });
    },
    fox: () => rep(3, 0.16, at => tone({ type: 'triangle', f: [[0, 900], [0.06, 1300], [0.12, 1000]], at, dur: 0.13, vol: 0.2 })),
    hamster: () => rep(4, 0.1, at => tone({ type: 'sine', f: [[0, 2600], [0.05, 3200]], at, dur: 0.07, vol: 0.14 }))
  };

  // Animals in the shared picture library that borrow a close cousin's call
  const CALL_ALIAS = {
    chicken: 'chick', rooster: 'chick', parrot: 'chick', eagle: 'owl', peacock: 'chick',
    zebra: 'horse', deer: 'horse', camel: 'cow', goat: 'sheep', wolf: 'dog', kangaroo: 'rabbit',
    dolphin: 'penguin', whale: 'hippo', shark: 'hippo', turtle: 'frog', crocodile: 'hippo',
    snake: 'mouse', butterfly: 'chick', bee: 'mouse', octopus: 'frog'
  };
  const callFor = (id) => CALLS[id] || CALLS[CALL_ALIAS[id]] || CALLS.chick;

  // Every sound goes through here: silent when muted or when Web Audio is missing.
  const play = (fn) => (...args) => { if (!muted && ensure()) return fn(...args); return 0; };

  const Sound = {
    unlock() { ensure(); },
    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      store.set('muted', m);
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    },
    // Raw building blocks for each game's own sounds (call only inside Sound.run)
    tone, noise, rep, hz, musicBox, marimba, melody,
    get now() { return ctx ? ctx.currentTime : 0; },
    run: play((fn) => fn()),

    call: play((id) => callFor(id)()),
    hasCall: (id) => !!CALLS[id],

    // Soft "pop" for any touch
    tap: play(() => tone({ type: 'sine', f: [[0, 600], [0.07, 1000]], dur: 0.09, vol: 0.18, attack: 0.005 })),

    // Boing-boing (hops, arrivals)
    boing: play((n = 1) => rep(n, 0.2, (at, i) =>
      tone({ type: 'sine', f: [[0, 220 + i * 40], [0.14, 520 + i * 60]], at, dur: 0.16, vol: 0.22, vib: { rate: 18, depth: 20 } }))),

    // Slide whistle up (something pops out)
    slideUp: play((dur = 0.35) => tone({ type: 'sine', f: [[0, 400], [dur, 1300]], dur, vol: 0.16, attack: 0.02, vib: { rate: 7, depth: 18 } })),
    slideDown: play((dur = 0.4) => tone({ type: 'sine', f: [[0, 1200], [dur, 380]], dur, vol: 0.14, attack: 0.02, vib: { rate: 7, depth: 18 } })),

    // Happy rising arpeggio + sparkle
    yay: play(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) =>
        tone({ type: 'triangle', f: [[0, fr]], at: i * 0.09, dur: 0.3, vol: 0.22, attack: 0.005, release: 0.22 }));
      [1568, 1976, 2349, 2637, 3136].forEach((fr, i) =>
        tone({ type: 'sine', f: [[0, fr]], at: 0.4 + i * 0.08, dur: 0.35, vol: 0.09, attack: 0.005, release: 0.3 }));
    }),

    // Little twinkle (hints, sparkles)
    twinkle: play((vol = 0.08) => [1175, 1568, 1976].forEach((fr, i) =>
      tone({ type: 'sine', f: [[0, fr]], at: i * 0.08, dur: 0.3, vol, attack: 0.005, release: 0.25 }))),

    // A cheerful "ta-da" fanfare for finishing a round
    fanfare: play(() => {
      const n = ['C5', 'E5', 'G5', 'C6'];
      [[0, 0], [1, 0.12], [2, 0.24], [3, 0.42]].forEach(([i, at]) => marimba(hz(n[i]), at, 0.26, 0.6));
      [hz('C5'), hz('E5'), hz('G5')].forEach(fr => tone({ type: 'triangle', f: [[0, fr]], at: 0.42, dur: 0.9, vol: 0.09, attack: 0.01, release: 0.6 }));
      [1568, 1976, 2349, 2637, 3136, 3520].forEach((fr, i) =>
        tone({ type: 'sine', f: [[0, fr]], at: 0.6 + i * 0.07, dur: 0.35, vol: 0.06, attack: 0.005, release: 0.3 }));
    }),

    // Silly "hmm?" two-note question (never a buzzer)
    hmm: play(() => {
      tone({ type: 'sine', f: [[0, 520], [0.12, 470]], dur: 0.16, vol: 0.16 });
      tone({ type: 'sine', f: [[0, 470], [0.16, 620]], at: 0.2, dur: 0.2, vol: 0.16 });
    })
  };

  /* =====================================================================
     Animal pictures
     One shared drawing per animal in assets/animals/<id>.svg (made from Find the
     Animal's drawings by tools/build-animal-pictures.mjs), used by every game.
     ===================================================================== */
  const here = document.currentScript && document.currentScript.src;
  const ANIMAL_DIR = here ? new URL('../animals/', here).href : '../../assets/animals/';
  const animalSrc = (id) => ANIMAL_DIR + id + '.svg';
  // Any picture from the library: 'animals/bear' or 'things/apple'
  const picSrc = (path) => new URL('../' + path + '.svg', ANIMAL_DIR).href;
  const picImg = (path, cls = '') => `<img class="${cls}" src="${picSrc(path)}" alt="" draggable="false" decoding="async">`;
  // <img> markup for an animal (alt text for screen readers, never spoken aloud)
  const animalImg = (id, cls = '', alt = '') =>
    `<img class="${cls}" src="${animalSrc(id)}" alt="${alt}" draggable="false" decoding="async">`;
  // Load pictures ahead of time (Bubble Bath draws them onto a canvas)
  const imgCache = new Map();
  function loadAnimal(id) {
    if (!imgCache.has(id)) {
      imgCache.set(id, new Promise((resolve, reject) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = animalSrc(id);
      }));
    }
    return imgCache.get(id);
  }

  /* =====================================================================
     Effects
     ===================================================================== */
  let fxLayer = null;
  function layer() {
    if (!fxLayer) {
      fxLayer = document.getElementById('fx');
      if (!fxLayer) {
        fxLayer = document.createElement('div');
        fxLayer.id = 'fx'; fxLayer.className = 'fx'; fxLayer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(fxLayer);
      }
    }
    return fxLayer;
  }

  const FLOATIES = ['💖', '⭐', '🌟', '💛', '💕', '✨', '💗', '⭐'];
  const CONFETTI = ['#ff8fb3', '#ffd23d', '#7cd6ff', '#9be38f', '#b995ff', '#ffa94d'];

  const fx = {
    // Hearts and stars floating up from a box ({left, top, width, height})
    floaties(box, count, list) {
      const n = count || (reduceMotion ? 6 : 14);
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'float';
        s.textContent = pick(list || FLOATIES);
        s.style.left = box.left + box.width * rand(0.15, 0.85) + 'px';
        s.style.top = box.top + box.height * rand(0.2, 0.7) + 'px';
        s.style.fontSize = rand(28, 58) + 'px';
        s.style.setProperty('--dx', rand(-130, 130) + 'px');
        s.style.setProperty('--rise', rand(160, Math.max(220, box.height * 0.9)) + 'px');
        s.style.setProperty('--rot', rand(-40, 40) + 'deg');
        s.style.setProperty('--dur', rand(1.7, 2.8) + 's');
        s.style.animationDelay = rand(0, 0.6) + 's';
        s.addEventListener('animationend', () => s.remove(), { once: true });
        layer().appendChild(s);
      }
    },

    // Confetti burst from a point
    confetti(cx, cy, count = 40, colors) {
      if (reduceMotion) return;
      for (let i = 0; i < count; i++) {
        const c = document.createElement('span');
        c.className = 'confetti';
        c.style.background = pick(colors || CONFETTI);
        if (i % 3 === 0) c.style.borderRadius = '50%';
        layer().appendChild(c);
        const ang = rand(-Math.PI, 0);
        const dist = rand(120, Math.min(420, window.innerWidth * 0.6));
        const ex = cx + Math.cos(ang) * dist;
        const ey = cy + Math.sin(ang) * dist;
        const fall = window.innerHeight + 40;
        const spin = rand(-720, 720);
        c.animate([
          { transform: `translate(${cx}px, ${cy}px) rotate(0deg) scale(.4)`, opacity: 1 },
          { transform: `translate(${ex}px, ${ey}px) rotate(${spin / 3}deg) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${ex + rand(-60, 60)}px, ${fall}px) rotate(${spin}deg) scale(1)`, opacity: 0.9 }
        ], { duration: rand(1800, 2600), easing: 'cubic-bezier(.2, .7, .4, 1)', fill: 'forwards' })
          .onfinish = () => c.remove();
      }
    },

    // Little dots bursting out of a point (paint drops, water drops, crumbs)
    burst(x, y, colors, count = 10, spread = 80) {
      for (let i = 0; i < count; i++) {
        const c = document.createElement('span');
        c.className = 'drop';
        c.style.background = pick(colors);
        const s = rand(8, 18);
        c.style.width = c.style.height = s + 'px';
        layer().appendChild(c);
        const ang = rand(0, Math.PI * 2);
        const d = rand(spread * 0.4, spread);
        c.animate([
          { transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(.5)`, opacity: 1 },
          { transform: `translate(${x + Math.cos(ang) * d}px, ${y + Math.sin(ang) * d}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${x + Math.cos(ang) * d * 1.1}px, ${y + Math.sin(ang) * d * 1.1 + 30}px) translate(-50%, -50%) scale(.6)`, opacity: 0 }
        ], { duration: rand(500, 800), easing: 'ease-out', fill: 'forwards' }).onfinish = () => c.remove();
      }
    },

    // One emoji (♪, ✨, 💤 ...) drifting up from a point
    rise(x, y, text, { size = 40, color, dx = rand(-40, 40), rise = 120, dur = 1.4 } = {}) {
      const s = document.createElement('span');
      s.className = 'float';
      s.textContent = text;
      if (color) s.style.color = color;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.fontSize = size + 'px';
      s.style.setProperty('--dx', dx + 'px');
      s.style.setProperty('--rise', rise + 'px');
      s.style.setProperty('--rot', rand(-20, 20) + 'deg');
      s.style.setProperty('--dur', dur + 's');
      s.addEventListener('animationend', () => s.remove(), { once: true });
      layer().appendChild(s);
    }
  };

  /* =====================================================================
     Page setup: corner buttons, audio unlock, toddler-proofing
     ===================================================================== */
  const tr = (k, f) => (window.PP_I18N ? PP_I18N.t(k, f) : f);

  // setup({ id, how, restart, onFirstTap })
  //   how:     () => demo steps for the "how to play" hand (see assets/js/chrome.js)
  //   restart: optional soft restart; by default the game reloads
  function setup({ onFirstTap, how, restart, id } = {}) {
    // Browsers only allow audio after a tap. onFirstTap lets a game replay a sound
    // that was silent because sound wasn't allowed yet.
    let unlocked = false;
    document.addEventListener('pointerdown', (e) => {
      if (unlocked) return;
      unlocked = true;
      Sound.unlock();
      if (onFirstTap) onFirstTap(e);
    }, { capture: true });
    document.addEventListener('keydown', () => Sound.unlock(), { capture: true, once: true });

    const home = document.querySelector('.corner-btn.home');
    const soundBtn = document.getElementById('soundBtn');
    const fullBtn = document.getElementById('fullBtn');
    let isFull = false;
    const labels = () => {
      if (home) { home.setAttribute('aria-label', tr('chrome.home', 'All games')); home.title = home.getAttribute('aria-label'); }
      if (soundBtn) {
        const on = !Sound.isMuted();
        soundBtn.firstElementChild.textContent = on ? '🔊' : '🔇';
        soundBtn.setAttribute('aria-pressed', String(on));
        soundBtn.setAttribute('aria-label', on ? tr('chrome.soundOff', 'Sound off') : tr('chrome.soundOn', 'Sound on'));
        soundBtn.title = soundBtn.getAttribute('aria-label');
      }
      if (fullBtn) {
        fullBtn.setAttribute('aria-label', isFull ? tr('chrome.exitFull', 'Exit full screen') : tr('chrome.full', 'Full screen'));
        fullBtn.title = fullBtn.getAttribute('aria-label');
      }
    };
    if (soundBtn) soundBtn.addEventListener('click', () => { Sound.setMuted(!Sound.isMuted()); labels(); Sound.tap(); });

    // Fullscreen API on Android/desktop/iPad, an "Add to Home Screen" tip on iPhone,
    // hidden when the game was opened full screen from its home-screen icon.
    if (fullBtn && window.Pienipeli) {
      Pienipeli.fullscreenButton(fullBtn, {
        onChange(full) {
          isFull = full;
          fullBtn.firstElementChild.textContent = full ? '🗗' : '⛶';
          labels();
        }
      });
    }
    labels();
    if (window.PP_I18N) { PP_I18N.onChange(labels); }

    if (window.PPChrome) PPChrome.init({ id, how, restart });

    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());   // iOS pinch
    document.addEventListener('dblclick', (e) => e.preventDefault());
  }

  window.Kit = { Sound, fx, setup, store, rand, pick, shuffle, bag, later, centerOf, reduceMotion, hz, animalSrc, animalImg, loadAnimal, picSrc, picImg };
})();
