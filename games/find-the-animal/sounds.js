/* ============ Find the Animal: sounds ============
   Every sound is generated live with the Web Audio API, so there are no audio
   files to download and nothing is fetched from the internet.
   Animal sounds are playful cartoon imitations, built from a few tiny "recipes".
   If Web Audio is unavailable, every function here simply does nothing.          */

(() => {
  'use strict';

  let ctx = null, master = null, musicBus = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(ctx.destination);
        musicBus = ctx.createGain();
        musicBus.gain.value = 0.5;
        musicBus.connect(master);
      } catch (err) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume(); // needs a user gesture
    return ctx;
  }

  // ---------- Building blocks ----------
  // A shaped oscillator note. f is a list of [seconds, Hz] points to glide through.
  function tone({ type = 'sine', f = [[0, 440]], at = 0, dur = 0.4, vol = 0.3,
                  attack = 0.02, release = 0.08, filter, vib, trem, out } = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + 0.02 + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f[0][1], t);
    for (let i = 1; i < f.length; i++) o.frequency.linearRampToValueAtTime(f[i][1], t + f[i][0]);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);

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
    node.connect(g).connect(out || master);
    o.start(t); o.stop(t + dur + 0.05);
    lfos.forEach(l => { l.start(t); l.stop(t + dur + 0.05); });
  }

  // Filtered noise (breath, hiss, splash)
  let noiseBuf = null;
  function noise({ at = 0, dur = 0.3, vol = 0.2, attack = 0.01, filter = { type: 'bandpass', f: 1000, q: 1 } } = {}) {
    if (!ensure()) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + 0.02 + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bq = ctx.createBiquadFilter();
    bq.type = filter.type; bq.frequency.value = filter.f; bq.Q.value = filter.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq).connect(g).connect(master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  const rep = (times, gap, fn) => { for (let i = 0; i < times; i++) fn(i * gap, i); };

  // ---------- Animal sound recipes ----------
  const R = {
    meow: () => tone({ type: 'sawtooth', f: [[0, 480], [0.18, 780], [0.5, 560], [0.75, 400]], dur: 0.8, vol: 0.28,
      filter: { type: 'bandpass', f: 1400, to: 800, q: 2 }, vib: { rate: 6, depth: 14 } }),
    woof: () => rep(2, 0.3, at => {
      tone({ type: 'square', f: [[0, 330], [0.13, 170]], at, dur: 0.17, vol: 0.32, filter: { f: 900, q: 2 } });
      noise({ at, dur: 0.12, vol: 0.18, filter: { type: 'bandpass', f: 700, q: 1.5 } });
    }),
    moo: () => tone({ type: 'sawtooth', f: [[0, 140], [0.3, 158], [1.3, 118]], dur: 1.4, vol: 0.45,
      attack: 0.12, release: 0.3, filter: { f: 260, to: 900, q: 4 } }),
    neigh: () => tone({ type: 'sawtooth', f: [[0, 760], [0.12, 1050], [1.0, 480]], dur: 1.05, vol: 0.22,
      filter: { type: 'bandpass', f: 1500, q: 1 }, vib: { rate: 15, depth: 70 } }),
    baa: () => tone({ type: 'sawtooth', f: [[0, 330], [0.7, 300]], dur: 0.85, vol: 0.32,
      filter: { type: 'bandpass', f: 1100, q: 1.5 }, trem: { rate: 8, depth: 0.8 } }),
    bleat: () => tone({ type: 'sawtooth', f: [[0, 430], [0.6, 380]], dur: 0.7, vol: 0.3,
      filter: { type: 'bandpass', f: 1300, q: 1.5 }, trem: { rate: 12, depth: 0.9 } }),
    oink: () => rep(2, 0.24, at => tone({ type: 'square', f: [[0, 190], [0.14, 140]], at, dur: 0.16, vol: 0.3,
      filter: { f: 650, q: 8 } })),
    sniff: () => rep(4, 0.11, at => noise({ at, dur: 0.07, vol: 0.25, filter: { type: 'highpass', f: 2500 } })),
    squeak: () => rep(3, 0.17, at => tone({ type: 'sine', f: [[0, 2300], [0.07, 3000], [0.12, 2500]], at, dur: 0.12, vol: 0.18 })),
    trumpet: () => {
      tone({ type: 'sawtooth', f: [[0, 340], [0.12, 720], [0.8, 640], [1.05, 480]], dur: 1.1, vol: 0.3,
        filter: { type: 'bandpass', f: 1300, q: 0.8 }, vib: { rate: 5, depth: 18 } });
      noise({ dur: 0.9, vol: 0.06, filter: { type: 'bandpass', f: 1800, q: 1 } });
    },
    roar: () => {
      tone({ type: 'sawtooth', f: [[0, 110], [0.3, 150], [1.1, 85]], dur: 1.2, vol: 0.45, attack: 0.1,
        filter: { f: 520, to: 300, q: 2 }, trem: { rate: 24, depth: 0.6 } });
      noise({ dur: 1.0, vol: 0.12, attack: 0.1, filter: { type: 'lowpass', f: 500 } });
    },
    growl: () => tone({ type: 'sawtooth', f: [[0, 95], [0.4, 120], [0.9, 80]], dur: 1.0, vol: 0.45, attack: 0.1,
      filter: { f: 420, q: 3 }, trem: { rate: 28, depth: 0.7 } }),
    monkey: () => {
      rep(3, 0.2, at => tone({ type: 'triangle', f: [[0, 480], [0.13, 920]], at, dur: 0.16, vol: 0.32 }));
      tone({ type: 'sawtooth', f: [[0, 950], [0.28, 600]], at: 0.62, dur: 0.32, vol: 0.22, filter: { type: 'bandpass', f: 1500 } });
    },
    yip: () => rep(3, 0.22, at => tone({ type: 'sawtooth', f: [[0, 800], [0.07, 1350], [0.14, 900]], at, dur: 0.15, vol: 0.22,
      filter: { type: 'bandpass', f: 1500, q: 1.5 } })),
    howl: () => tone({ type: 'triangle', f: [[0, 340], [0.5, 700], [1.4, 640], [1.9, 400]], dur: 1.9, vol: 0.35,
      attack: 0.2, release: 0.4, vib: { rate: 5, depth: 10 } }),
    grumble: () => tone({ type: 'sawtooth', f: [[0, 150], [0.4, 230], [0.9, 120]], dur: 1.0, vol: 0.4,
      filter: { f: 550, q: 3 }, trem: { rate: 16, depth: 0.7 } }),
    boing: () => rep(2, 0.35, at => tone({ type: 'sine', f: [[0, 180], [0.25, 620]], at, dur: 0.3, vol: 0.35,
      vib: { rate: 18, depth: 25 } })),
    squawk: () => rep(2, 0.32, at => tone({ type: 'sawtooth', f: [[0, 700], [0.08, 1000], [0.22, 760]], at, dur: 0.24, vol: 0.22,
      filter: { type: 'bandpass', f: 1300, q: 3 } })),
    quack: () => rep(3, 0.26, at => tone({ type: 'sawtooth', f: [[0, 580], [0.16, 460]], at, dur: 0.19, vol: 0.3,
      filter: { type: 'bandpass', f: 1100, q: 5 } })),
    cluck: () => {
      rep(3, 0.13, at => tone({ type: 'square', f: [[0, 720], [0.05, 520]], at, dur: 0.07, vol: 0.2,
        filter: { type: 'bandpass', f: 1200, q: 3 } }));
      tone({ type: 'sawtooth', f: [[0, 520], [0.1, 950], [0.32, 620]], at: 0.46, dur: 0.36, vol: 0.22,
        filter: { type: 'bandpass', f: 1300, q: 3 } });
    },
    crow: () => {
      const notes = [[600, 0.14], [820, 0.12], [720, 0.14], [920, 0.14]];
      let at = 0;
      notes.forEach(([fr, d]) => { tone({ type: 'sawtooth', f: [[0, fr], [d, fr * 1.05]], at, dur: d, vol: 0.22,
        filter: { type: 'bandpass', f: 1500, q: 2 } }); at += d + 0.02; });
      tone({ type: 'sawtooth', f: [[0, 1000], [0.2, 1080], [0.75, 700]], at, dur: 0.8, vol: 0.22,
        filter: { type: 'bandpass', f: 1500, q: 2 }, vib: { rate: 8, depth: 20 } });
    },
    hoot: () => {
      tone({ type: 'sine', f: [[0, 400], [0.05, 430], [0.3, 380]], dur: 0.32, vol: 0.45, attack: 0.05 });
      tone({ type: 'sine', f: [[0, 400], [0.08, 430], [0.6, 360]], at: 0.5, dur: 0.65, vol: 0.45, attack: 0.06, release: 0.2 });
    },
    whistle: () => {
      tone({ type: 'sine', f: [[0, 1500], [0.1, 2400]], dur: 0.12, vol: 0.25 });
      tone({ type: 'sine', f: [[0, 2400], [0.12, 1600]], at: 0.18, dur: 0.14, vol: 0.25 });
      tone({ type: 'sine', f: [[0, 1800], [0.3, 2600]], at: 0.42, dur: 0.35, vol: 0.22, vib: { rate: 20, depth: 120 } });
    },
    screech: () => {
      tone({ type: 'sawtooth', f: [[0, 2300], [0.65, 1400]], dur: 0.7, vol: 0.14,
        filter: { type: 'bandpass', f: 2400, q: 2 }, vib: { rate: 28, depth: 90 } });
      noise({ dur: 0.5, vol: 0.05, filter: { type: 'highpass', f: 3000 } });
    },
    peacock: () => rep(2, 0.6, at => tone({ type: 'sawtooth', f: [[0, 700], [0.15, 1250], [0.48, 900]], at, dur: 0.5, vol: 0.2,
      filter: { type: 'bandpass', f: 1500, q: 2 } })),
    dolphin: () => {
      rep(8, 0.035, at => noise({ at, dur: 0.02, vol: 0.2, filter: { type: 'highpass', f: 3000 } }));
      tone({ type: 'sine', f: [[0, 2800], [0.2, 4600], [0.4, 3400], [0.55, 5000]], at: 0.32, dur: 0.6, vol: 0.13 });
    },
    whale: () => {
      tone({ type: 'sine', f: [[0, 170], [0.8, 420], [1.6, 260], [2.2, 190]], dur: 2.2, vol: 0.5,
        attack: 0.3, release: 0.5, vib: { rate: 3, depth: 8 } });
      tone({ type: 'triangle', f: [[0, 340], [0.8, 840], [1.6, 520]], dur: 1.8, vol: 0.08, attack: 0.3, release: 0.5 });
    },
    bubbles: () => rep(6, 0.1, at => {
      const base = 300 + Math.random() * 500;
      tone({ type: 'sine', f: [[0, base], [0.07, base * 2.2]], at, dur: 0.08, vol: 0.25, attack: 0.005 });
    }),
    ribbit: () => rep(2, 0.32, (at, i) => tone({ type: 'square', f: [[0, i ? 260 : 210]], at, dur: i ? 0.14 : 0.2, vol: 0.28,
      filter: { type: 'bandpass', f: 800, q: 3 }, trem: { rate: 45, depth: 1 } })),
    hiss: () => noise({ dur: 1.0, vol: 0.18, attack: 0.2, filter: { type: 'highpass', f: 4000 } }),
    snap: () => {
      tone({ type: 'sawtooth', f: [[0, 100], [0.5, 85]], dur: 0.55, vol: 0.35, filter: { f: 380, q: 3 }, trem: { rate: 30, depth: 0.7 } });
      rep(2, 0.18, at => noise({ at: 0.6 + at, dur: 0.06, vol: 0.4, filter: { type: 'bandpass', f: 1600, q: 1 } }));
    },
    buzz: () => tone({ type: 'sawtooth', f: [[0, 210], [0.5, 245], [1.0, 205]], dur: 1.1, vol: 0.18,
      filter: { f: 1300, q: 1 }, trem: { rate: 9, depth: 0.5 }, vib: { rate: 5, depth: 14 } }),
    hum: () => tone({ type: 'sine', f: [[0, 160], [0.4, 200], [0.9, 150]], dur: 1.0, vol: 0.4, attack: 0.1, release: 0.3,
      vib: { rate: 4, depth: 6 } }),
    twinkle: () => [1568, 1976, 2349, 2637, 3136].forEach((fr, i) =>
      tone({ type: 'sine', f: [[0, fr]], at: i * 0.09, dur: 0.35, vol: 0.12, attack: 0.005, release: 0.3 })),
    chime: () => [784, 988, 1175].forEach((fr, i) =>
      tone({ type: 'triangle', f: [[0, fr]], at: i * 0.14, dur: 0.5, vol: 0.2, attack: 0.005, release: 0.4 })),
  };

  // ---------- Game sounds ----------
  const Sound = {
    unlock() { ensure(); },
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    },
    animal(name) { if (muted || !ensure()) return; (R[name] || R.chime)(); },
    // Happy rising arpeggio for a correct answer
    success() {
      if (muted || !ensure()) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) =>
        tone({ type: 'triangle', f: [[0, fr]], at: i * 0.08, dur: 0.3, vol: 0.22, attack: 0.005, release: 0.22 }));
    },
    // Soft, friendly "hmm?" for a wrong guess (never a buzzer)
    gentle() {
      if (muted || !ensure()) return;
      tone({ type: 'sine', f: [[0, 520], [0.12, 440]], dur: 0.16, vol: 0.2 });
      tone({ type: 'sine', f: [[0, 440], [0.12, 560]], at: 0.17, dur: 0.18, vol: 0.2 });
    },
    tap() {
      if (muted || !ensure()) return;
      tone({ type: 'sine', f: [[0, 880], [0.06, 1200]], dur: 0.08, vol: 0.12, attack: 0.005 });
    },
    // Big celebration after a full round
    fanfare() {
      if (muted || !ensure()) return;
      [[523.25, 0], [659.25, 0.15], [783.99, 0.3], [1046.5, 0.45], [783.99, 0.65], [1046.5, 0.8]].forEach(([fr, at], i) =>
        tone({ type: 'triangle', f: [[0, fr]], at, dur: i === 5 ? 0.7 : 0.18, vol: 0.24, attack: 0.005, release: i === 5 ? 0.5 : 0.1 }));
    },
  };

  // ---------- Optional background music: a soft music-box lullaby ----------
  const MELODY = [ // [note in Hz or 0 for rest, beats]
    [523, 1], [659, 1], [784, 1], [659, 1], [698, 1], [880, 1], [784, 2],
    [659, 1], [587, 1], [523, 1], [587, 1], [659, 2], [523, 2],
    [784, 1], [880, 1], [784, 1], [659, 1], [698, 1], [659, 1], [587, 2],
    [523, 1], [659, 1], [587, 1], [494, 1], [523, 3], [0, 1],
  ];
  const BEAT = 0.42;
  let musicTimer = null, musicIdx = 0, musicNext = 0;

  function scheduleMusic() {
    while (musicNext < ctx.currentTime + 0.6) {
      const [fr, beats] = MELODY[musicIdx];
      const at = Math.max(0, musicNext - ctx.currentTime - 0.02);
      if (fr) {
        tone({ type: 'sine', f: [[0, fr]], at, dur: beats * BEAT * 1.6, vol: 0.06, attack: 0.01, release: beats * BEAT, out: musicBus });
        tone({ type: 'sine', f: [[0, fr * 2]], at, dur: 0.3, vol: 0.015, attack: 0.005, release: 0.25, out: musicBus });
      }
      if (musicIdx % 4 === 0) // soft bass on the bar
        tone({ type: 'triangle', f: [[0, fr ? fr / 4 : 131]], at, dur: BEAT * 3, vol: 0.05, attack: 0.02, release: BEAT * 2, out: musicBus });
      musicNext += beats * BEAT;
      musicIdx = (musicIdx + 1) % MELODY.length;
    }
  }

  Sound.music = function (on) {
    if (on) {
      if (musicTimer || !ensure()) return;
      musicIdx = 0; musicNext = ctx.currentTime + 0.1;
      scheduleMusic();
      musicTimer = setInterval(scheduleMusic, 200);
    } else if (musicTimer) {
      clearInterval(musicTimer); musicTimer = null;
    }
  };
  // Quieter music while someone is talking
  Sound.duck = function (on) {
    if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.15 : 0.5, ctx.currentTime, 0.2);
  };

  window.FTA_Sound = Sound;
})();
