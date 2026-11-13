/* ============ Feed the Animals: sounds ============
   Every sound is generated live with the Web Audio API: no audio files, nothing
   fetched from the internet. Browsers only allow sound after the first tap, so
   the very first animal call may be silent until the child touches the screen.
   If Web Audio is unavailable, every function here simply does nothing.
   (The tone/noise helpers and animal calls match Find the Animal's sounds.js.) */

(() => {
  'use strict';

  let ctx = null, master = null;
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
      } catch (err) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume(); // needs a user gesture
    return ctx;
  }

  // ---------- Building blocks ----------
  // A shaped oscillator note. f is a list of [seconds, Hz] points to glide through.
  function tone({ type = 'sine', f = [[0, 440]], at = 0, dur = 0.4, vol = 0.3,
                  attack = 0.02, release = 0.08, filter, vib, trem } = {}) {
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
    node.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    lfos.forEach(l => { l.start(t); l.stop(t + dur + 0.05); });
  }

  // Filtered noise (crunch, whoosh, sniff)
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

  // ---------- Animal calls (by animal id) ----------
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
    squirrel: () => rep(5, 0.09, at => tone({ type: 'triangle', f: [[0, 1600], [0.05, 2200]], at, dur: 0.06, vol: 0.18 })),
    chick: () => rep(3, 0.2, at => tone({ type: 'sine', f: [[0, 2400], [0.1, 3200], [0.14, 2800]], at, dur: 0.15, vol: 0.18 })),
    giraffe: () => tone({ type: 'sine', f: [[0, 160], [0.4, 200], [0.9, 150]], dur: 1.0, vol: 0.4, attack: 0.1, release: 0.3,
      vib: { rate: 4, depth: 6 } }),
    koala: () => tone({ type: 'sawtooth', f: [[0, 120], [0.3, 170], [0.7, 110]], dur: 0.8, vol: 0.3,
      filter: { f: 500, q: 3 }, trem: { rate: 20, depth: 0.7 } }),
    hippo: () => rep(2, 0.45, at => tone({ type: 'sawtooth', f: [[0, 110], [0.3, 90]], at, dur: 0.38, vol: 0.38,
      filter: { f: 400, q: 4 }, trem: { rate: 12, depth: 0.6 } })),
    duck: () => rep(3, 0.26, at => tone({ type: 'sawtooth', f: [[0, 580], [0.16, 460]], at, dur: 0.19, vol: 0.3,
      filter: { type: 'bandpass', f: 1100, q: 5 } }))
  };

  // Play only when sound is on and Web Audio works.
  const play = (fn) => (...args) => { if (!muted && ensure()) fn(...args); };

  const Sound = {
    unlock() { ensure(); },
    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    },

    // The animal's own voice
    call: play((id) => (CALLS[id] || CALLS.monkey)()),

    // Boing-boing as the animal hops in
    hops: play((n = 3) => rep(n, 0.2, (at, i) =>
      tone({ type: 'sine', f: [[0, 220 + i * 40], [0.14, 520 + i * 60]], at, dur: 0.16, vol: 0.22, vib: { rate: 18, depth: 20 } }))),

    // Soft "pop" when a plate is touched
    tap: play(() => tone({ type: 'sine', f: [[0, 600], [0.07, 1000]], dur: 0.09, vol: 0.18, attack: 0.005 })),

    // Rising whistle + whoosh while the food flies
    whoosh: play((dur = 0.75) => {
      noise({ dur, vol: 0.12, attack: dur * 0.5, filter: { type: 'bandpass', f: 500, q: 2 }, to: 2600 });
      tone({ type: 'sine', f: [[0, 500], [dur * 0.55, 1300], [dur, 900]], dur, vol: 0.1, attack: 0.05, release: 0.2 });
    }),

    // Gulp as the food lands in the mouth
    gulp: play(() => {
      tone({ type: 'sine', f: [[0, 520], [0.12, 160]], dur: 0.16, vol: 0.4, attack: 0.005 });
      tone({ type: 'sine', f: [[0, 260], [0.1, 120]], at: 0.12, dur: 0.12, vol: 0.25, attack: 0.005 });
    }),

    // Munch munch munch (crunchy little bites), then "mmm!"
    chew: play((bites = 6, gap = 0.2) => {
      rep(bites, gap, at => {
        noise({ at, dur: 0.07, vol: 0.32, filter: { type: 'bandpass', f: 1400 + Math.random() * 900, q: 1.2 } });
        tone({ type: 'sine', f: [[0, 180], [0.05, 120]], at, dur: 0.06, vol: 0.15, attack: 0.003 });
      });
      tone({ type: 'triangle', f: [[0, 300], [0.25, 360], [0.5, 290]], at: bites * gap, dur: 0.55, vol: 0.2,
        attack: 0.08, release: 0.25, filter: { f: 900 }, vib: { rate: 6, depth: 6 } });
    }),

    // Happy rising arpeggio + sparkle
    yay: play(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) =>
        tone({ type: 'triangle', f: [[0, fr]], at: i * 0.09, dur: 0.3, vol: 0.22, attack: 0.005, release: 0.22 }));
      [1568, 1976, 2349, 2637, 3136].forEach((fr, i) =>
        tone({ type: 'sine', f: [[0, fr]], at: 0.4 + i * 0.08, dur: 0.35, vol: 0.09, attack: 0.005, release: 0.3 }));
    }),

    // Silly "blblbl" raspberry for food the animal doesn't want: funny, never a buzzer
    nope: play(() => {
      tone({ type: 'sawtooth', f: [[0, 240], [0.45, 190]], dur: 0.5, vol: 0.2,
        filter: { f: 700, q: 2 }, trem: { rate: 26, depth: 1 } });
      tone({ type: 'sine', f: [[0, 600], [0.1, 480]], at: 0.6, dur: 0.12, vol: 0.16 });
      tone({ type: 'sine', f: [[0, 480], [0.1, 600]], at: 0.74, dur: 0.14, vol: 0.16 });
    }),

    // Little twinkle when the right food wiggles as a hint
    hint: play(() => [1175, 1568, 1976].forEach((fr, i) =>
      tone({ type: 'sine', f: [[0, fr]], at: i * 0.08, dur: 0.3, vol: 0.08, attack: 0.005, release: 0.25 })))
  };

  window.FEED_Sound = Sound;
})();
