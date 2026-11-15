/* ============ Bubble Bath! game logic ============
   A muddy animal sits in the bath. Rub it (or tap it) with one finger or many:
   the mud wipes away under your finger, soap bubbles float up and pop, and it squeaks.
   When it is (nearly) clean: the last mud fades, the animal shakes itself dry, sparkles,
   a happy tune plays, and the next muddy friend slides into the tub.
   Tap the rubber duck for a squeak. No words, no scores, no timer, no losing.

   The animal and its mud are two canvases of the same size. The mud is drawn only
   where the animal is (masked by the animal's own shape) and only above the water,
   so "how much mud is left" is a simple pixel count.                                 */

(function () {
  'use strict';

  const { Sound, fx, rand, pick, bag, later, centerOf, reduceMotion, hz } = window.Kit;

  // Animals from the shared picture library (assets/animals/<id>.svg); each id is also its call.
  // Only light-coloured animals, so the brown mud always shows up clearly.
  const ANIMALS = ['pig', 'cow', 'sheep', 'panda', 'rabbit', 'cat', 'frog', 'tiger', 'giraffe', 'zebra',
    'elephant', 'mouse', 'goat', 'dog', 'chicken', 'fox'];
  const nextAnimal = bag(ANIMALS);

  const MUD = ['#8a5a35', '#7a4c2b', '#9b6a40', '#6e4526', '#a87848'];
  const SIZE = 320;            // canvas pixels (CSS scales it)
  const WATER = 0.66;          // the water line (fraction of height): no mud below it
  const BRUSH = 30;            // wipe radius in canvas pixels
  const DONE_AT = 0.18;        // clean when less than this much mud is left

  const $ = (id) => document.getElementById(id);
  const tub = $('tub');
  const pet = $('pet');
  const petCanvas = $('petCanvas');
  const mudCanvas = $('mudCanvas');
  const duck = $('duck');
  const pc = petCanvas.getContext('2d');
  const mc = mudCanvas.getContext('2d', { willReadFrequently: true });
  petCanvas.width = petCanvas.height = mudCanvas.width = mudCanvas.height = SIZE;

  let animal = null;
  let busy = true;
  let startMud = 1;
  let lastCheck = 0;
  let lastScrubSound = 0;
  let lastBubble = 0;
  let hintTimer = 0;
  const pointers = new Map();   // pointerId -> last canvas point

  // animal = { id, img }: the picture is drawn onto both canvases at the same spot
  const PAD = SIZE * 0.04;
  function drawAnimal(ctx, keep) {
    if (!keep) ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(animal.img, PAD, PAD * 0.5, SIZE - PAD * 2, SIZE - PAD * 2);
  }

  function paintMud() {
    mc.globalCompositeOperation = 'source-over';
    mc.clearRect(0, 0, SIZE, SIZE);
    // Big splats
    for (let i = 0; i < 12; i++) {
      const x = rand(SIZE * 0.1, SIZE * 0.9), y = rand(SIZE * 0.08, SIZE * WATER);
      const r = rand(SIZE * 0.07, SIZE * 0.13);
      mc.fillStyle = pick(MUD);
      blob(x, y, r);
      // drips and freckles around each splat
      for (let k = 0; k < 4; k++) {
        mc.beginPath();
        mc.arc(x + rand(-r * 1.4, r * 1.4), y + rand(-r * 1.4, r * 1.4), rand(3, 9), 0, Math.PI * 2);
        mc.fill();
      }
    }
    // Keep the mud only on the animal, and only above the water
    mc.globalCompositeOperation = 'destination-in';
    drawAnimal(mc, true);
    mc.globalCompositeOperation = 'destination-out';
    mc.fillRect(0, SIZE * WATER, SIZE, SIZE);
    // Little shiny bits on the mud so it looks squishy
    mc.globalCompositeOperation = 'source-atop';
    mc.fillStyle = 'rgba(255, 230, 200, .25)';
    for (let i = 0; i < 26; i++) {
      mc.beginPath();
      mc.ellipse(rand(0, SIZE), rand(0, SIZE * WATER), rand(3, 8), rand(2, 4), rand(0, 3), 0, Math.PI * 2);
      mc.fill();
    }
    // From now on, drawing erases: fully opaque so one swipe wipes cleanly
    mc.globalCompositeOperation = 'destination-out';
    mc.fillStyle = mc.strokeStyle = '#000';
  }

  function blob(x, y, r) {
    mc.beginPath();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * rand(0.75, 1.15);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i === 0) mc.moveTo(px, py); else mc.quadraticCurveTo(x + Math.cos(a - 0.35) * r * 1.2, y + Math.sin(a - 0.35) * r * 1.2, px, py);
    }
    mc.fill();
  }

  // How much mud is left (count every 4th pixel's alpha, fast enough at 320 x 320)
  function mudLeft() {
    const d = mc.getImageData(0, 0, SIZE, SIZE).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++;
    return n;
  }

  /* ---------- Sounds made for this game ---------- */
  function scrubSound() {
    Sound.run(() => {
      // squeaky-clean rub: a short bright squeak + soapy swish
      const f = rand(1300, 2000);
      Sound.tone({ type: 'sine', f: [[0, f], [0.06, f * 1.25]], dur: 0.08, vol: 0.07, attack: 0.005, vib: { rate: 40, depth: 40 } });
      Sound.noise({ dur: 0.12, vol: 0.08, filter: { type: 'bandpass', f: rand(3000, 5000), q: 1.4 } });
    });
  }
  function bubbleSound() {
    Sound.run(() => {
      const f = rand(500, 900);
      Sound.tone({ type: 'sine', f: [[0, f], [0.07, f * 2.2]], dur: 0.09, vol: 0.12, attack: 0.003 });
    });
  }
  function splash() {
    Sound.run(() => {
      Sound.noise({ dur: 0.7, vol: 0.22, attack: 0.02, filter: { type: 'lowpass', f: 3000 }, to: 400 });
      Sound.rep(5, 0.07, at => Sound.tone({ type: 'sine', f: [[0, rand(400, 700)], [0.06, rand(900, 1400)]], at: 0.1 + at, dur: 0.07, vol: 0.08 }));
    });
  }
  function shakeSound() {
    Sound.run(() => {
      Sound.noise({ dur: 0.6, vol: 0.14, attack: 0.05, filter: { type: 'bandpass', f: 1800, q: 0.7 } });
      Sound.tone({ type: 'sawtooth', f: [[0, 200], [0.6, 220]], dur: 0.6, vol: 0.08, filter: { f: 700 }, trem: { rate: 18, depth: 1 } });
    });
  }
  function cleanTune() {
    Sound.run(() => {
      Sound.melody([['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['E5', 0.5], ['C6', 1.5]], { bpm: 200, voice: Sound.marimba });
      [1568, 1976, 2349, 2637, 3136, 3520].forEach((fr, i) =>
        Sound.tone({ type: 'sine', f: [[0, fr]], at: 0.9 + i * 0.07, dur: 0.3, vol: 0.06, attack: 0.005, release: 0.25 }));
    });
  }
  function squeak() {
    Sound.run(() => {
      Sound.tone({ type: 'square', f: [[0, 900], [0.08, 1400], [0.2, 1100]], dur: 0.22, vol: 0.1, filter: { f: 2500, q: 3 }, vib: { rate: 25, depth: 40 } });
      Sound.tone({ type: 'square', f: [[0, 1000], [0.1, 1500]], at: 0.26, dur: 0.16, vol: 0.08, filter: { f: 2500, q: 3 } });
    });
  }

  /* ---------- Rounds ---------- */
  async function newAnimal() {
    busy = true;
    clearHint();
    const id = nextAnimal();
    let img;
    try { img = await Kit.loadAnimal(id); } catch (err) { later(newAnimal, 300); return; }
    animal = { id, img };
    drawAnimal(pc);
    paintMud();
    startMud = Math.max(1, mudLeft());
    mudCanvas.style.transition = 'none';
    mudCanvas.style.opacity = '1';
    pet.className = 'pet enter';
    pet.setAttribute('aria-label', 'A muddy animal in the bath');
    splash();
    later(() => {
      pet.classList.remove('enter');
      Sound.call(animal.id);
      busy = false;
      scheduleHint();
    }, reduceMotion ? 300 : 900);
  }

  function finish() {
    busy = true;
    clearHint();
    pointers.clear();
    mudCanvas.style.transition = 'opacity .6s';
    mudCanvas.style.opacity = '0';
    tub.classList.remove('scrub');
    later(() => {
      pet.classList.add('shake');
      shakeSound();
      const c = centerOf(pet);
      for (let i = 0; i < 4; i++) later(() => fx.burst(c.x, c.y - c.h * 0.1, ['#9fdcff', '#c8ecff', '#ffffff'], 12, c.w * 0.7), i * 140);
    }, 500);
    later(() => {
      pet.classList.remove('shake');
      pet.classList.add('happy');
      pet.setAttribute('aria-label', 'A clean, happy animal');
      cleanTune();
      later(() => Sound.call(animal.id), 1000);
      const box = pet.getBoundingClientRect();
      fx.floaties(box, reduceMotion ? 6 : 14, ['✨', '⭐', '🌟', '💖', '🫧', '✨']);
      fx.confetti(box.left + box.width / 2, box.top + box.height * 0.3, 40, ['#9fdcff', '#ff8fb3', '#ffd23d', '#b995ff', '#ffffff']);
    }, 1400);
    later(() => {
      pet.classList.remove('happy');
      pet.classList.add('leave');
      Sound.slideUp(0.4);
    }, 4000);
    later(newAnimal, 4600);
  }

  /* ---------- Rubbing ---------- */
  function toCanvas(e) {
    const r = mudCanvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * SIZE, y: (e.clientY - r.top) / r.height * SIZE };
  }

  function wipe(from, to) {
    mc.lineCap = 'round';
    mc.lineWidth = BRUSH * 2;
    mc.beginPath();
    mc.moveTo(from.x, from.y);
    mc.lineTo(to.x, to.y);
    mc.stroke();
    mc.beginPath();
    mc.arc(to.x, to.y, BRUSH, 0, Math.PI * 2);
    mc.fill();
  }

  function bubbles(e, n) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'bubble';
      const s = rand(16, 46);
      b.style.width = b.style.height = s + 'px';
      b.style.left = e.clientX + rand(-30, 30) + 'px';
      b.style.top = e.clientY + rand(-20, 20) + 'px';
      b.style.setProperty('--dx', rand(-60, 60) + 'px');
      b.style.setProperty('--rise', rand(90, 220) + 'px');
      b.style.setProperty('--dur', rand(1.1, 2) + 's');
      b.addEventListener('animationend', () => b.remove(), { once: true });
      $('fx').appendChild(b);
    }
  }

  function rub(e, first) {
    const p = toCanvas(e);
    const prev = first ? p : (pointers.get(e.pointerId) || p);
    pointers.set(e.pointerId, p);
    wipe(prev, p);

    const now = performance.now();
    const moved = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (first || now - lastScrubSound > 110 && moved > 2) {
      lastScrubSound = now;
      scrubSound();
    }
    if (first || now - lastBubble > 90) {
      lastBubble = now;
      if (document.querySelectorAll('.bubble').length < 40) {
        bubbles(e, first ? 4 : 1);
        if (Math.random() < 0.5) later(bubbleSound, rand(300, 900));
      }
    }
    if (now - lastCheck > 250) {
      lastCheck = now;
      if (mudLeft() / startMud < DONE_AT) finish();
    }
  }

  pet.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (busy) return;
    clearHint();
    tub.classList.add('scrub');
    try { pet.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    rub(e, true);
  });
  pet.addEventListener('pointermove', (e) => {
    if (busy || !pointers.has(e.pointerId)) return;
    rub(e, false);
  });
  function lift(e) {
    pointers.delete(e.pointerId);
    if (!pointers.size) { tub.classList.remove('scrub'); if (!busy) scheduleHint(); }
  }
  pet.addEventListener('pointerup', lift);
  pet.addEventListener('pointercancel', lift);
  pet.addEventListener('lostpointercapture', lift);

  // Keyboard: any key scrubs a random muddy spot
  document.addEventListener('keydown', (e) => {
    if (busy || e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Escape') return;
    const r = mudCanvas.getBoundingClientRect();
    const fake = { pointerId: -1, clientX: r.left + r.width * rand(0.25, 0.75), clientY: r.top + r.height * rand(0.15, 0.6) };
    rub(fake, true);
    pointers.delete(-1);
  });

  /* ---------- Rubber duck ---------- */
  duck.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    duck.classList.remove('squeak');
    void duck.offsetWidth;
    duck.classList.add('squeak');
    squeak();
    const c = centerOf(duck);
    bubbles({ clientX: c.x, clientY: c.y - c.h * 0.3 }, 3);
  });
  duck.addEventListener('click', (e) => { if (e.detail === 0) squeak(); });

  /* ---------- Gentle hint: a sponge swipes across the mud ---------- */
  function hint() {
    if (busy) return;
    pet.classList.remove('hint');
    void pet.offsetWidth;
    pet.classList.add('hint');
    Sound.twinkle();
    pet.addEventListener('animationend', (ev) => { if (ev.animationName === 'spongeSwipe') pet.classList.remove('hint'); });
  }
  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => { hint(); scheduleHint(); }, 6000);
  }
  function clearHint() { clearTimeout(hintTimer); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearHint();
    else if (!busy) scheduleHint();
  });

  Kit.setup({
    id: 'bubble-bath',
    how: () => [{ rub: pet }],
    // The first animal's hello was silent (sound needs a tap first): replay it.
    onFirstTap(e) { if (!e.target.closest('#pet, #duck, .corner-btn') && animal) Sound.call(animal.id); }
  });

  // Rubber duck: the duck from the picture library
  duck.innerHTML = Kit.animalImg('duck', '', '');

  newAnimal();
})();
