/* ============ Baby Pop! v2 ============
   Endless, gentle balloon popping. No scores, no timers, no losing.
   - Every key pops a balloon (except Escape, which leaves full screen)
   - Speed control, full screen, drag-to-pop, rare rainbow balloons */

(() => {
  'use strict';

  // ---------- Elements ----------
  const $ = id => document.getElementById(id);
  const stage = $('stage'), fx = $('fx');
  const muteBtn = $('muteBtn'), restartBtn = $('restartBtn');
  const slowBtn = $('slowBtn'), fastBtn = $('fastBtn'), fsBtn = $('fsBtn');
  const dots = [...$('dots').children];
  const counterEl = $('counter'), countEl = $('count');

  // Soft pastel palettes: [highlight, main, shade]
  const PALETTES = [
    ['#ffe3ef', '#ffa6cb', '#f77fb0'], // pink
    ['#e0f2ff', '#8ecbff', '#62aef0'], // blue
    ['#fffbd0', '#ffe27a', '#f5c94a'], // yellow
    ['#efe4ff', '#c6a8ff', '#a583f0'], // purple
    ['#dcfbec', '#9fe8c3', '#6fd3a2'], // mint
  ];
  const BITS = ['⭐', '✨', '💖', '💛', '💫', '🩷', '💜'];
  const WORDS = ['Pop!', 'Yay!', 'Wheee!', 'Boop!', 'Hooray!'];

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ---------- Saved settings (speed + mute) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('babypop-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('babypop-' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  // ---------- Speed ----------
  const SPEEDS = [0.5, 0.75, 1, 1.5, 2.2];
  let speedIdx = Math.min(SPEEDS.length - 1, Math.max(0, store.get('speed', 2)));
  const speed = () => SPEEDS[speedIdx];

  function setSpeed(i) {
    speedIdx = Math.min(SPEEDS.length - 1, Math.max(0, i));
    store.set('speed', speedIdx);
    dots.forEach((d, n) => d.classList.toggle('on', n === speedIdx));
    // Change the pace of balloons that are already floating
    stage.querySelectorAll('.float').forEach(w =>
      w.getAnimations().forEach(a => a.updatePlaybackRate && a.updatePlaybackRate(speed())));
  }

  // How many balloons float at once (fewer on small screens)
  const targetCount = () => (innerWidth < 600 ? 6 : innerWidth < 1000 ? 8 : 11);

  // ---------- Sound (Web Audio API, no files needed) ----------
  let audioCtx = null;
  let muted = store.get('muted', false);
  // Two octaves of a happy pentatonic scale: each key gets its own note
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); // needs a user gesture
  }

  function playPop(noteIdx) {
    if (muted || !audioCtx) return;
    const t = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.value = 0.5;
    master.connect(audioCtx.destination);

    // 1) A tiny "pop" burst of noise
    const len = Math.floor(audioCtx.sampleRate * 0.07);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    noise.connect(filter).connect(master);
    noise.start(t);

    // 2) A cute rising "bloop"
    const f = NOTES[noteIdx !== undefined ? noteIdx % NOTES.length : Math.floor(Math.random() * 6)];
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 0.7, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.3);

    // 3) A little sparkle chime
    const chime = audioCtx.createOscillator();
    const cg = audioCtx.createGain();
    chime.type = 'triangle';
    chime.frequency.value = f * 2;
    cg.gain.setValueAtTime(0.0001, t + 0.06);
    cg.gain.exponentialRampToValueAtTime(0.25, t + 0.08);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    chime.connect(cg).connect(master);
    chime.start(t + 0.06);
    chime.stop(t + 0.4);
  }

  // ---------- Pop counter ----------
  let popCount = 0;
  function showCount(bump) {
    countEl.textContent = popCount;
    counterEl.setAttribute('aria-label', 'Balloons popped: ' + popCount);
    if (bump) { // restart the little "boing" animation on every pop
      counterEl.classList.remove('bump');
      void counterEl.offsetWidth;
      counterEl.classList.add('bump');
    }
  }

  // ---------- Balloons ----------
  function spawnBalloon(startMidFlight = false) {
    const base = Math.max(90, Math.min(170, Math.min(innerWidth, innerHeight) * 0.22));
    const size = Math.round(base * rand(0.85, 1.15));
    const [c1, c2, c3] = pick(PALETTES);
    const dur = rand(16, 26);
    const isRainbow = Math.random() < 0.08;

    const wrap = document.createElement('div');
    wrap.className = 'float' + (isRainbow ? ' rainbow' : '');
    wrap.style.setProperty('--size', size + 'px');
    wrap.style.setProperty('--c1', c1);
    wrap.style.setProperty('--c2', isRainbow ? '#ffffff' : c2);
    wrap.style.setProperty('--c3', isRainbow ? '#c6a8ff' : c3);
    wrap.style.setProperty('--dur', dur + 's');
    wrap.style.setProperty('--delay', startMidFlight ? -rand(0, dur * 0.8) + 's' : '0s');
    wrap.style.setProperty('--sway-delay', -rand(0, 4) + 's');
    wrap.style.left = rand(0, Math.max(0, innerWidth - size)) + 'px';

    wrap.innerHTML =
      '<div class="sway"><div class="balloon"><i class="face"></i></div><span class="string"></span></div>';

    wrap.addEventListener('animationend', e => {
      if (e.animationName === 'rise') wrap.remove(); // floated away
    });
    stage.appendChild(wrap);

    // Apply the current speed to the new balloon
    wrap.getAnimations().forEach(a => { a.playbackRate = speed(); });
  }

  function popBalloon(wrap, noteIdx) {
    if (!wrap || wrap.classList.contains('popped')) return;
    ensureAudio();

    const rect = wrap.querySelector('.balloon').getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const color = getComputedStyle(wrap).getPropertyValue('--c2').trim();
    const rainbow = wrap.classList.contains('rainbow');

    wrap.classList.add('popped');
    setTimeout(() => wrap.remove(), 320);

    popCount++;
    showCount(true);

    playPop(noteIdx);
    if (navigator.vibrate) navigator.vibrate(15);
    burst(x, y, rainbow ? null : color, rect.width, rainbow);
  }

  // Sparkles, hearts, stars, confetti, a ripple and sometimes a happy word
  function burst(x, y, color, width, big = false) {
    const count = big ? 28 : 14;
    const reach = width * (big ? 1.4 : 0.9);
    const ringColor = color || pick(PALETTES)[1];

    const ring = document.createElement('div');
    ring.className = 'ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.setProperty('--rc', ringColor);
    ring.style.setProperty('--rs', width * 1.6 + 'px');
    ring.addEventListener('animationend', () => ring.remove());
    fx.appendChild(ring);

    if (big || Math.random() < 0.25) {
      const w = document.createElement('div');
      w.className = 'word';
      w.textContent = big ? 'Wow!' : pick(WORDS);
      w.style.left = x + 'px';
      w.style.top = y + 'px';
      w.style.setProperty('--rc', ringColor);
      w.addEventListener('animationend', () => w.remove());
      fx.appendChild(w);
    }

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
      const dist = rand(reach * 0.5, reach * 1.2);
      const isDot = i % 3 === 0;
      el.className = isDot ? 'bit dot' : 'bit';
      if (isDot) {
        el.style.setProperty('--s', rand(10, 18) + 'px');
        el.style.background = color || pick(PALETTES)[1];
      } else {
        el.textContent = pick(BITS);
        el.style.setProperty('--s', rand(22, 36) + 'px');
      }
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      el.style.setProperty('--rot', rand(-90, 90) + 'deg');
      el.addEventListener('animationend', () => el.remove());
      fx.appendChild(el);
    }
  }

  // ---------- Pointer input (mouse, touchpad, touch, pen) ----------
  let pointerDown = false;
  stage.addEventListener('pointerdown', e => {
    pointerDown = true;
    ensureAudio();
    const balloon = e.target.closest('.balloon');
    if (balloon) { e.preventDefault(); popBalloon(balloon.closest('.float')); }
  });
  // Dragging a finger or the mouse across balloons pops them too
  stage.addEventListener('pointermove', e => {
    if (!pointerDown) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const balloon = el && el.closest && el.closest('.balloon');
    if (balloon) popBalloon(balloon.closest('.float'));
  });
  const release = () => { pointerDown = false; };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('blur', release);
  document.addEventListener('contextmenu', e => e.preventDefault());

  // ---------- Keyboard: every key plays, only Escape is left alone ----------
  let lastKey = 0;
  function keyNote(code) { // same key = same note
    let n = 0;
    for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
    return n % NOTES.length;
  }
  function handleKey(e) {
    if (e.key === 'Escape') return;                       // Escape exits full screen
    if (e.ctrlKey || e.metaKey || e.altKey) return;       // keep browser shortcuts working
    e.preventDefault();
    if (e.type === 'keyup') return;                       // (stops Space/Enter "clicking" buttons)
    const now = performance.now();
    if (now - lastKey < 90) return;                       // gentle limit when a key is held
    lastKey = now;
    ensureAudio();

    const note = keyNote(e.code || e.key || 'x');
    const visible = [...stage.querySelectorAll('.float:not(.popped)')].filter(w => {
      const r = w.querySelector('.balloon').getBoundingClientRect();
      return r.top > 0 && r.bottom < innerHeight && r.right > 0 && r.left < innerWidth;
    });
    if (visible.length) {
      popBalloon(pick(visible), note);
    } else {
      // No balloon on screen yet: still celebrate with a sparkle
      playPop(note);
      burst(rand(innerWidth * .2, innerWidth * .8), rand(innerHeight * .2, innerHeight * .7), pick(PALETTES)[1], 120);
    }
  }
  document.addEventListener('keydown', handleKey);
  document.addEventListener('keyup', handleKey);

  // ---------- Buttons ----------
  // blur() after each click so keys never end up "pressing" a focused button
  const press = (btn, fn) => btn.addEventListener('click', () => { ensureAudio(); fn(); btn.blur(); });

  function showMute() {
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }
  press(muteBtn, () => { muted = !muted; store.set('muted', muted); showMute(); if (!muted) playPop(); });

  press(restartBtn, () => {
    stage.innerHTML = ''; fx.innerHTML = '';
    popCount = 0; showCount(false);
    fillBalloons(true);
  });

  press(slowBtn, () => setSpeed(speedIdx - 1));
  press(fastBtn, () => setSpeed(speedIdx + 1));

  // Full screen (hidden where the browser can't do it, e.g. iPhone Safari)
  const root = document.documentElement;
  const canFS = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  const inFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!canFS) fsBtn.hidden = true;
  press(fsBtn, () => {
    if (inFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
  });
  function showFS() {
    fsBtn.textContent = inFS() ? '🗗' : '⛶';
    fsBtn.setAttribute('aria-label', inFS() ? 'Exit full screen' : 'Full screen');
  }
  document.addEventListener('fullscreenchange', showFS);
  document.addEventListener('webkitfullscreenchange', showFS);

  // ---------- Endless loop ----------
  function fillBalloons(initial) {
    for (let i = 0; i < targetCount(); i++) spawnBalloon(initial);
  }
  // Top up balloons gently; faster speed refills faster
  (function topUp() {
    if (stage.querySelectorAll('.float:not(.popped)').length < targetCount()) spawnBalloon(false);
    setTimeout(topUp, 700 / speed());
  })();

  // ---------- Twinkling stars ----------
  const starsEl = $('stars');
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.textContent = '✦';
    s.style.left = rand(0, 100) + '%';
    s.style.top = rand(0, 70) + '%';
    s.style.fontSize = rand(10, 22) + 'px';
    s.style.animationDelay = -rand(0, 3) + 's';
    s.style.animationDuration = rand(2.5, 5) + 's';
    starsEl.appendChild(s);
  }

  // ---------- Start ----------
  showMute();
  showFS();
  setSpeed(speedIdx);
  fillBalloons(true);
})();
