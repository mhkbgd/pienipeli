/* ============ Number Train! game logic ============
   A train with numbered carriages (1, 2, 3 ...) waits on the track. Animals holding
   number signs wait above. Drag each animal into the carriage with the same number
   (or tap the animal, then the carriage). Right seat: it hops in with a toot.
   Other seat: it hops back, and the right carriage glows. All aboard: choo-choo, the
   train puffs away and comes back with new passengers. Trains of 3, 4 and 5. No losing. */

(function () {
  'use strict';

  const { Sound, fx, rand, shuffle, bag, later, centerOf, reduceMotion, hz } = window.Kit;

  const SIZES = [3, 3, 4, 4, 5, 3, 5, 4, 5];
  const CAR_COLORS = ['#ff5e4d', '#ffc93c', '#3dd68c', '#4fc3f7', '#b07cff'];
  const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5'];
  const nextAnimal = bag(['dog', 'cat', 'rabbit', 'pig', 'cow', 'bear', 'panda', 'monkey', 'lion', 'tiger', 'frog',
    'duck', 'chicken', 'mouse', 'fox', 'sheep', 'owl', 'penguin', 'elephant', 'zebra']);

  const $ = (id) => document.getElementById(id);
  const riders = $('riders');
  const train = $('train');
  let round = 0, n = 3, seated = 0, busy = true, selected = null, drag = null, hintTimer = 0;

  const ENGINE = `<svg viewBox="0 0 160 130" class="engine-art" aria-hidden="true"><g stroke="#2b1d5c" stroke-width="4" stroke-linejoin="round">
    <rect x="18" y="30" width="34" height="22" rx="4" fill="#2b1d5c"/>
    <path d="M14 26 h42 l-6 10 h-30 z" fill="#4a4a6a"/>
    <rect x="70" y="10" width="72" height="80" rx="10" fill="#ff5e4d"/>
    <rect x="84" y="24" width="44" height="32" rx="6" fill="#bfe8ff"/>
    <rect x="8" y="50" width="134" height="44" rx="12" fill="#ff5e4d"/>
    <rect x="2" y="88" width="148" height="12" rx="6" fill="#2b1d5c"/>
    <circle cx="16" cy="66" r="9" fill="#fff3b0"/>
    <circle cx="40" cy="108" r="17" fill="#4a4a6a"/><circle cx="40" cy="108" r="6" fill="#ffc93c"/>
    <circle cx="112" cy="108" r="17" fill="#4a4a6a"/><circle cx="112" cy="108" r="6" fill="#ffc93c"/></g>
    <circle cx="98" cy="40" r="4" fill="#2b1d5c"/><circle cx="114" cy="40" r="4" fill="#2b1d5c"/>
    <path d="M98 48 q8 6 16 0" fill="none" stroke="#2b1d5c" stroke-width="3" stroke-linecap="round"/></svg>`;

  function newRound() {
    busy = true;
    clearHint();
    n = SIZES[round++ % SIZES.length];
    seated = 0;
    selected = null;
    train.style.setProperty('--n', n);
    train.innerHTML = `<div class="engine">${ENGINE}<span class="steam s1"></span><span class="steam s2"></span></div>` +
      Array.from({ length: n }, (_, k) => `<button class="car" type="button" data-num="${k + 1}" style="--cc:${CAR_COLORS[k]}" aria-label="Carriage ${k + 1}">
        <span class="seat"></span><span class="num">${k + 1}</span><span class="wheel w1"></span><span class="wheel w2"></span></button>`).join('');
    riders.innerHTML = '';
    shuffle(Array.from({ length: n }, (_, k) => k + 1)).forEach((num, k) => {
      const r = document.createElement('button');
      r.type = 'button';
      r.className = 'rider';
      r.dataset.num = num;
      r.style.setProperty('--k', k);
      r.setAttribute('aria-label', 'Animal with number ' + num);
      r.innerHTML = Kit.animalImg(nextAnimal()) + `<span class="sign" style="--cc:${CAR_COLORS[num - 1]}">${num}</span>`;
      riders.appendChild(r);
    });
    train.classList.remove('leave');
    train.classList.add('arrive');
    Sound.run(() => chug(1.2));
    later(() => { train.classList.remove('arrive'); busy = false; scheduleHint(); }, reduceMotion ? 150 : 1200);
  }

  /* ---------- Sounds ---------- */
  function chug(dur) {
    const beats = Math.round(dur / 0.2);
    Sound.rep(beats, 0.2, (at, k) => Sound.noise({ at, dur: 0.12, vol: k % 2 ? 0.07 : 0.11, filter: { type: 'bandpass', f: 900, q: 0.8 } }));
  }
  function toot() {
    Sound.run(() => {
      [hz('A4'), hz('C#5'), hz('E5')].forEach(f => Sound.tone({ type: 'sawtooth', f: [[0, f]], dur: 0.5, vol: 0.06, attack: 0.03, release: 0.15, filter: { f: 1800 } }));
      [hz('A4'), hz('C#5'), hz('E5')].forEach(f => Sound.tone({ type: 'sawtooth', f: [[0, f]], at: 0.6, dur: 0.9, vol: 0.06, attack: 0.03, release: 0.3, filter: { f: 1800 } }));
    });
  }

  /* ---------- Seating ---------- */
  const carFor = (num) => train.querySelector(`.car[data-num="${num}"]`);
  function carAt(x, y) {
    return [...train.querySelectorAll('.car:not(.full)')].find(c => {
      const r = c.getBoundingClientRect();
      return x > r.left - 10 && x < r.right + 10 && y > r.top - 40 && y < r.bottom + 10;
    }) || null;
  }

  function seat(rider, car) {
    busy = true;
    clearHint();
    deselect();
    const num = Number(rider.dataset.num);
    const from = centerOf(rider);
    const seatEl = car.querySelector('.seat');
    seatEl.innerHTML = rider.querySelector('img').outerHTML;
    const to = centerOf(seatEl);
    rider.classList.add('gone');
    car.classList.add('full');
    seatEl.animate([
      { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(1.3)` },
      { transform: `translate(${(from.x - to.x) / 2}px, ${(from.y - to.y) / 2 - 60}px) scale(1.15)`, offset: 0.5 },
      { transform: 'none' }
    ], { duration: reduceMotion ? 150 : 550, easing: 'cubic-bezier(.3, .9, .4, 1)' });
    Sound.run(() => { Sound.slideDown(0.4); Sound.marimba(hz(NOTES[num - 1]), 0.45, 0.3, 0.8); });
    later(() => {
      car.classList.add('bounce');
      const c = centerOf(car);
      fx.floaties({ left: c.x - c.w / 2, top: c.y - c.h, width: c.w, height: c.h }, reduceMotion ? 2 : 4, ['⭐', '💛', '✨']);
      seated++;
      if (seated === n) later(allAboard, 500);
      else { busy = false; scheduleHint(); }
    }, 560);
  }

  function hopBack(rider, car) {
    Sound.hmm();
    if (car) { car.classList.remove('nope'); void car.offsetWidth; car.classList.add('nope'); }
    rider.style.transition = 'transform .45s cubic-bezier(.3, 1.5, .5, 1)';
    rider.style.transform = '';
    later(() => { rider.style.transition = ''; glow(carFor(rider.dataset.num)); }, 450);
    scheduleHint();
  }

  function allAboard() {
    toot();
    train.querySelectorAll('.car').forEach((c, k) => later(() => Sound.run(() => Sound.musicBox(hz(NOTES[k]), 0, 0.12, 0.5)), 1400 + k * 150));
    later(() => {
      train.classList.add('leave');
      Sound.run(() => chug(1.6));
      const r = train.getBoundingClientRect();
      fx.confetti(r.left + r.width / 2, r.top, 50, CAR_COLORS);
    }, 1500);
    later(newRound, 3300);
  }

  /* ---------- Drag, or tap then tap ---------- */
  riders.addEventListener('pointerdown', (e) => {
    const r = e.target.closest('.rider');
    if (!r || busy || r.classList.contains('gone') || drag) return;
    e.preventDefault();
    try { r.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    drag = { r, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    r.classList.add('held');
    Sound.tap();
  });
  riders.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 10) drag.moved = true;
    if (!drag.moved) return;
    drag.r.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
    const over = carAt(e.clientX, e.clientY);
    train.querySelectorAll('.car').forEach(c => c.classList.toggle('over', c === over));
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { r, moved } = drag;
    drag = null;
    r.classList.remove('held');
    train.querySelectorAll('.car').forEach(c => c.classList.remove('over'));
    if (!moved) { r.style.transform = ''; if (selected === r) deselect(); else select(r); return; }
    const car = e.type === 'pointerup' ? carAt(e.clientX, e.clientY) : null;
    if (!car) { hopBack(r, null); return; }
    if (car.dataset.num === r.dataset.num) seat(r, car); else hopBack(r, car);
  }
  riders.addEventListener('pointerup', endDrag);
  riders.addEventListener('pointercancel', endDrag);

  function select(r) {
    deselect();
    selected = r;
    r.classList.add('picked');
    Sound.run(() => Sound.musicBox(hz(NOTES[r.dataset.num - 1]), 0, 0.14, 0.5));
    glow(carFor(r.dataset.num));
  }
  function deselect() { if (selected) selected.classList.remove('picked'); selected = null; }

  train.addEventListener('pointerdown', (e) => {
    const car = e.target.closest('.car');
    if (!car || busy) return;
    e.preventDefault();
    if (car.classList.contains('full')) { car.classList.remove('bounce'); void car.offsetWidth; car.classList.add('bounce'); Sound.boing(1); return; }
    if (!selected) { glowRiderFor(car.dataset.num); return; }
    const r = selected;
    if (car.dataset.num === r.dataset.num) seat(r, car);
    else { deselect(); hopBack(r, car); }
  });
  riders.addEventListener('click', (e) => { const r = e.target.closest('.rider'); if (r && e.detail === 0 && !busy) select(r); });
  train.addEventListener('click', (e) => { const c = e.target.closest('.car'); if (c && e.detail === 0 && selected) { const r = selected; if (c.dataset.num === r.dataset.num) seat(r, c); else { deselect(); hopBack(r, c); } } });

  function glow(car) { if (!car) return; car.classList.remove('glow'); void car.offsetWidth; car.classList.add('glow'); }
  function glowRiderFor(num) {
    const r = riders.querySelector(`.rider[data-num="${num}"]:not(.gone)`);
    if (r) { r.classList.remove('nudge'); void r.offsetWidth; r.classList.add('nudge'); Sound.run(() => Sound.musicBox(hz(NOTES[num - 1]), 0, 0.12, 0.5)); }
  }

  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => {
      const r = riders.querySelector('.rider:not(.gone)');
      if (r && !busy && !drag) { r.classList.remove('nudge'); void r.offsetWidth; r.classList.add('nudge'); later(() => glow(carFor(r.dataset.num)), 500); Sound.twinkle(0.07); }
      scheduleHint();
    }, 7000);
  }
  function clearHint() { clearTimeout(hintTimer); }

  Kit.setup({ id: 'number-train', how: () => {
    const r = riders.querySelector('.rider:not(.gone)');
    return r ? [{ drag: [r, () => train.querySelector(`.car[data-num="${r.dataset.num}"]`)] }] : [];
  } });
  newRound();
})();
