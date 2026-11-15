/* ============ Animal Band! game logic ============
   Six animals, each singing one note of the C major pentatonic scale, so any mix of
   taps (or a whole hand mashing the screen) always sounds nice.

   🥁 button: a soft backing beat (drum, shaker, bass) to play along with.
   🎵 button: song time. A traditional nursery tune plays one note per tap: whatever
              animal (or key) is tapped, the next note of the song plays and the right
              animal sings it, so even the littlest player "plays" the song. When the
              song ends: fanfare + confetti.
   No words, no scores, no timer, no losing.                                        */

(function () {
  'use strict';

  const { Sound, fx, rand, later, centerOf, reduceMotion, hz } = window.Kit;

  // Low to high. Each animal (a picture from assets/animals/) has its own singing voice for its note.
  const BAND = [
    { id: 'cow', note: 'C4', color: '#ff8f8f', voice: 'moo',   key: '1' },
    { id: 'pig', note: 'D4', color: '#ffb36b', voice: 'oink',  key: '2' },
    { id: 'dog', note: 'E4', color: '#ffe066', voice: 'woof',  key: '3' },
    { id: 'cat', note: 'G4', color: '#8fe08a', voice: 'meow',  key: '4' },
    { id: 'duck', note: 'A4', color: '#7cc8ff', voice: 'quack', key: '5' },
    { id: 'chicken', note: 'C5', color: '#c39bff', voice: 'tweet', key: '6' }
  ];
  const byNote = Object.fromEntries(BAND.map((b, i) => [b.note, i]));

  // Traditional nursery tunes that only use the band's five notes (C D E G A)
  const SONGS = [
    // Mary Had a Little Lamb
    ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4',
     'E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'C4'],
    // Hot Cross Buns
    ['E4', 'D4', 'C4', 'E4', 'D4', 'C4', 'C4', 'C4', 'C4', 'C4', 'D4', 'D4', 'D4', 'D4', 'E4', 'D4', 'C4'],
    // Band Parade (our own little tune: up the scale and back home)
    ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4', 'D4', 'E4', 'E4', 'D4', 'C4',
     'G4', 'A4', 'G4', 'E4', 'D4', 'E4', 'C4', 'C5']
  ];

  const $ = (id) => document.getElementById(id);
  const bandEl = $('band');
  const beatBtn = $('beatBtn');
  const songBtn = $('songBtn');
  const progress = $('progress');

  let song = null;      // { notes, i } while song time is on
  let songNo = 0;
  let hintTimer = 0;
  let cheering = false;

  /* ---------- Build the stage ---------- */
  BAND.forEach((b, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'player';
    el.dataset.i = i;
    el.style.setProperty('--c', b.color);
    el.style.setProperty('--i', i);
    el.setAttribute('aria-label', 'Note ' + (i + 1));
    el.innerHTML = `<span class="pad" aria-hidden="true"></span><span class="who" aria-hidden="true">${Kit.animalImg(b.id)}</span>`;
    bandEl.appendChild(el);
  });
  const players = [...bandEl.querySelectorAll('.player')];

  /* ---------- Singing voices ---------- */
  // Every voice is a real musical note with a little animal flavour on top.
  function sing(i, at = 0) {
    const b = BAND[i];
    const f = hz(b.note);
    Sound.run(() => {
      const T = Sound.tone;
      switch (b.voice) {
        case 'moo':   // low, warm, scoops up into the note
          T({ type: 'sawtooth', f: [[0, f * 0.9], [0.12, f], [0.6, f]], at, dur: 0.65, vol: 0.32, attack: 0.05, release: 0.2, filter: { f: 500, to: 1100, q: 3 }, vib: { rate: 5, depth: 3 } });
          T({ type: 'sine', f: [[0, f]], at, dur: 0.6, vol: 0.2, attack: 0.04, release: 0.2 });
          break;
        case 'oink':  // short nasal bounces
          T({ type: 'square', f: [[0, f * 1.1], [0.08, f], [0.4, f]], at, dur: 0.45, vol: 0.2, attack: 0.01, release: 0.15, filter: { f: 900, q: 7 } });
          T({ type: 'sine', f: [[0, f]], at, dur: 0.45, vol: 0.2, attack: 0.01, release: 0.2 });
          break;
        case 'woof':  // round, a quick "w" bend
          T({ type: 'triangle', f: [[0, f * 0.8], [0.05, f], [0.5, f]], at, dur: 0.5, vol: 0.34, attack: 0.008, decay: true });
          T({ type: 'square', f: [[0, f * 0.85], [0.06, f]], at, dur: 0.12, vol: 0.06, filter: { f: 900, q: 2 } });
          break;
        case 'meow':  // a glide up and settling on the note
          T({ type: 'sawtooth', f: [[0, f * 0.84], [0.14, f * 1.06], [0.3, f]], at, dur: 0.6, vol: 0.18, attack: 0.03, release: 0.2, filter: { type: 'bandpass', f: f * 3, q: 1.5 }, vib: { rate: 6, depth: 6 } });
          T({ type: 'sine', f: [[0, f * 0.84], [0.14, f * 1.04], [0.3, f]], at, dur: 0.6, vol: 0.18, attack: 0.03, release: 0.2 });
          break;
        case 'quack': // buzzy, bright
          T({ type: 'sawtooth', f: [[0, f * 1.08], [0.06, f], [0.4, f]], at, dur: 0.42, vol: 0.18, attack: 0.008, release: 0.15, filter: { type: 'bandpass', f: f * 2.5, q: 4 } });
          T({ type: 'sine', f: [[0, f]], at, dur: 0.42, vol: 0.18, attack: 0.008, release: 0.18 });
          break;
        default:      // tweet: a whistle with a chirp on top
          T({ type: 'sine', f: [[0, f * 1.12], [0.05, f], [0.5, f]], at, dur: 0.55, vol: 0.28, attack: 0.006, decay: true, vib: { rate: 9, depth: 6 } });
          T({ type: 'sine', f: [[0, f * 4], [0.04, f * 5]], at, dur: 0.06, vol: 0.05 });
      }
    });
  }

  /* ---------- Playing ---------- */
  function bounce(i) {
    const el = players[i];
    el.classList.remove('sing');
    void el.offsetWidth;
    el.classList.add('sing');
    const c = centerOf(el.querySelector('.who'));
    fx.rise(c.x, c.y - c.h * 0.4, Math.random() < 0.5 ? '♪' : '♫', {
      size: rand(34, 52), color: BAND[i].color, rise: rand(120, 200), dx: rand(-50, 50), dur: 1.5
    });
  }

  function hit(i) {
    clearHint();
    if (cheering) return;
    if (song) {
      // Song time: any tap plays the next note of the song
      const n = song.notes[song.i++];
      const j = byNote[n];
      sing(j);
      bounce(j);
      showProgress();
      if (song.i >= song.notes.length) finishSong();
      else { markNext(); scheduleHint(); }
    } else {
      sing(i);
      bounce(i);
    }
  }

  bandEl.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const p = e.target.closest('.player');
    if (!p) return;
    e.preventDefault();
    hit(Number(p.dataset.i));
  });
  bandEl.addEventListener('click', (e) => {
    const p = e.target.closest('.player');
    if (p && e.detail === 0) hit(Number(p.dataset.i));
  });

  // Keyboard: 1-6 or the home row play the animals; any other letter plays something.
  const HOME = 'asdfgh';
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') return;
    const k = e.key.toLowerCase();
    let i = BAND.findIndex((b) => b.key === k);
    if (i < 0) i = HOME.indexOf(k);
    if (i < 0 && k.length === 1) i = k.charCodeAt(0) % BAND.length;
    if (i >= 0) hit(i);
  });

  /* ---------- Song time ---------- */
  function startSong() {
    song = { notes: SONGS[songNo % SONGS.length], i: 0 };
    songNo++;
    document.body.classList.add('song');
    songBtn.setAttribute('aria-pressed', 'true');
    progress.innerHTML = song.notes.map(() => '<i></i>').join('');
    progress.hidden = false;
    Sound.twinkle(0.12);
    markNext();
    scheduleHint();
  }
  function stopSong() {
    song = null;
    document.body.classList.remove('song');
    songBtn.setAttribute('aria-pressed', 'false');
    progress.hidden = true;
    players.forEach((p) => p.classList.remove('next'));
    clearHint();
  }
  function markNext() {
    const j = byNote[song.notes[song.i]];
    players.forEach((p, k) => p.classList.toggle('next', k === j));
  }
  function showProgress() {
    const dots = progress.children;
    for (let k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k < song.i);
  }
  function finishSong() {
    cheering = true;
    players.forEach((p) => p.classList.remove('next'));
    later(() => {
      Sound.fanfare();
      bandEl.classList.add('cheer');
      const r = bandEl.getBoundingClientRect();
      fx.confetti(r.left + r.width / 2, r.top + r.height * 0.3, 70, BAND.map((b) => b.color));
      fx.floaties(r, reduceMotion ? 6 : 16, ['🎵', '🎶', '⭐', '💖', '🌟', '✨']);
    }, 500);
    later(() => {
      bandEl.classList.remove('cheer');
      cheering = false;
      stopSong();
    }, 3200);
  }

  songBtn.addEventListener('click', () => {
    if (cheering) return;
    if (song) stopSong(); else startSong();
  });

  // Hint during song time: the next animal glows and gives a tiny hum
  function scheduleHint() {
    clearHint();
    if (!song) return;
    hintTimer = setTimeout(() => {
      if (!song) return;
      const j = byNote[song.notes[song.i]];
      players[j].classList.remove('nudge');
      void players[j].offsetWidth;
      players[j].classList.add('nudge');
      Sound.twinkle(0.06);
      scheduleHint();
    }, 6000);
  }
  function clearHint() { clearTimeout(hintTimer); }

  /* ---------- Backing beat (drum, shaker, bass) ---------- */
  const BPM = 96;
  const STEP = 60 / BPM / 2;                      // eighth notes
  const BASS = ['C3', 'C3', 'G2', 'G2', 'A2', 'A2', 'G2', 'G2'];   // one note per bar
  let beatOn = false, beatTimer = 0, nextT = 0, step = 0;

  function scheduleBeat() {
    // Look ahead a little and queue up the next notes precisely on the audio clock.
    const now = Sound.now;
    if (nextT < now) nextT = now + 0.05;
    while (nextT < now + 0.25) {
      const at = nextT - now;
      const s = step % 8;
      const bar = Math.floor(step / 8) % BASS.length;
      Sound.run(() => {
        if (s === 0 || s === 4) {     // soft kick
          Sound.tone({ type: 'sine', f: [[0, 130], [0.12, 50]], at, dur: 0.18, vol: 0.32, attack: 0.003, decay: true });
        }
        if (s === 2 || s === 6) {     // gentle clap
          Sound.noise({ at, dur: 0.12, vol: 0.09, filter: { type: 'bandpass', f: 1600, q: 0.8 } });
        }
        Sound.noise({ at, dur: 0.05, vol: s % 2 ? 0.035 : 0.05, filter: { type: 'highpass', f: 6000 } }); // shaker
        if (s === 0 || s === 3 || s === 6) { // bouncy bass
          const n = hz(BASS[bar]);
          Sound.tone({ type: 'triangle', f: [[0, n]], at, dur: 0.3, vol: 0.2, attack: 0.005, decay: true });
        }
      });
      nextT += STEP;
      step++;
    }
  }
  function setBeat(on) {
    beatOn = on;
    beatBtn.setAttribute('aria-pressed', String(on));
    document.body.classList.toggle('beat', on);
    clearInterval(beatTimer);
    if (on) {
      Sound.unlock();
      step = 0; nextT = 0;
      scheduleBeat();
      beatTimer = setInterval(scheduleBeat, 60);
    }
  }
  beatBtn.addEventListener('click', () => setBeat(!beatOn));
  document.body.style.setProperty('--beat', (60 / BPM) + 's');

  // Stop the beat in the background so it never plays from a hidden tab
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (beatOn) setBeat(false); clearHint(); }
  });

  Kit.setup({ id: 'animal-band', how: () => [
    { tap: () => document.querySelector('.player:nth-child(1)') },
    { tap: () => document.querySelector('.player:nth-child(4)') },
    { tap: () => document.querySelector('.player:nth-child(6)') }] });
})();
