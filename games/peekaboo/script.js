/* ============ Peekaboo! game logic ============
   Round:  3 hiding places pop in (bush, curtain or gift box), each hiding an animal.
   Tap a hiding place: it opens with a "pee-ka-BOO" tune and the animal pops out and calls.
   Tap a found animal: it says hello again.
   All found: fanfare + confetti, everyone cheers, then the hiding places close and new
   animals hide. No words, no scores, no timer, no losing.                                  */

(function () {
  'use strict';

  const { Sound, fx, rand, pick, shuffle, bag, later, centerOf, reduceMotion, hz } = window.Kit;

  // Animals from the shared picture library (assets/animals/<id>.svg); each id is also its call
  const ANIMALS = ['dog', 'cat', 'rabbit', 'bear', 'panda', 'tiger', 'lion', 'cow', 'pig', 'monkey',
    'chicken', 'penguin', 'mouse', 'horse', 'frog', 'owl', 'fox', 'elephant', 'duck', 'sheep',
    'giraffe', 'zebra', 'goat', 'kangaroo', 'turtle', 'parrot'];
  const nextAnimal = bag(ANIMALS);

  const KINDS = ['bush', 'curtain', 'box'];
  const CURTAINS = ['#ff8fb3', '#b995ff', '#ff9a6b', '#5fc6ff'];
  const BOXES = [['#ff8fb3', '#ffe066'], ['#7cd6ff', '#ff8fb3'], ['#9be38f', '#b995ff'], ['#ffd23d', '#5fc6ff'], ['#b995ff', '#9be38f']];

  const SPOTS = 3;
  const stage = document.getElementById('stage');
  let busy = true;     // between rounds: taps ignored
  let found = 0;
  let hintTimer = 0;

  /* ---------- Drawings (each piece is its own SVG in a 200 x 200 box) ---------- */
  const svg = (cls, body) =>
    `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">${body}</svg>`;

  function bushHalf(side) {
    const flip = side === 'r' ? ' transform="translate(200 0) scale(-1 1)"' : '';
    return svg('piece half half-' + side, `<g${flip}>
      <circle cx="58" cy="150" r="52" fill="#4fbf6a"/>
      <circle cx="104" cy="160" r="46" fill="#4fbf6a"/>
      <circle cx="40" cy="104" r="40" fill="#5fcf78"/>
      <circle cx="80" cy="76" r="44" fill="#6fd98a"/>
      <circle cx="112" cy="110" r="44" fill="#5fcf78"/>
      <circle cx="116" cy="48" r="30" fill="#7fe398"/>
      <circle cx="64" cy="66" r="12" fill="#9cefb2" opacity=".8"/>
      <circle cx="98" cy="96" r="9" fill="#9cefb2" opacity=".8"/>
      <circle cx="46" cy="128" r="7" fill="#ff8fb3"/><circle cx="46" cy="128" r="3" fill="#fff3a8"/>
      <circle cx="94" cy="140" r="7" fill="#fff"/><circle cx="94" cy="140" r="3" fill="#ffd23d"/>
      <circle cx="84" cy="44" r="6" fill="#ff8fb3"/><circle cx="84" cy="44" r="2.5" fill="#fff3a8"/>
    </g>`);
  }

  function curtainParts(color) {
    const fold = (x) => `<path d="M${x},28 C${x - 6},80 ${x + 6},130 ${x},190" stroke="rgba(0,0,0,.12)" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const half = (side) => {
      const flip = side === 'r' ? ' transform="translate(200 0) scale(-1 1)"' : '';
      return svg('piece half half-' + side, `<g${flip}>
        <path d="M14,24 H104 V184 Q92,196 80,184 Q68,196 56,184 Q44,196 32,184 Q20,196 14,186 Z" fill="${color}"/>
        ${fold(36)}${fold(60)}${fold(84)}
        <path d="M14,24 H104 V40 H14 Z" fill="rgba(255,255,255,.25)"/>
      </g>`);
    };
    return svg('piece back', `
        <rect x="14" y="22" width="172" height="170" rx="14" fill="#fff7d6"/>
        <circle cx="150" cy="60" r="18" fill="#fff0a8"/>`) +
      half('l') + half('r') +
      svg('piece rod', `<rect x="4" y="12" width="192" height="14" rx="7" fill="#b07a4f"/>
        <circle cx="8" cy="19" r="10" fill="#d39a66"/><circle cx="192" cy="19" r="10" fill="#d39a66"/>`);
  }

  function boxParts([main, ribbon]) {
    return svg('piece body', `
        <rect x="28" y="96" width="144" height="96" rx="12" fill="${main}"/>
        <rect x="28" y="96" width="144" height="18" fill="rgba(0,0,0,.08)"/>
        <rect x="88" y="96" width="24" height="96" fill="${ribbon}"/>
        <circle cx="54" cy="150" r="6" fill="rgba(255,255,255,.5)"/>
        <circle cx="146" cy="134" r="5" fill="rgba(255,255,255,.5)"/>
        <circle cx="140" cy="170" r="7" fill="rgba(255,255,255,.5)"/>`) +
      svg('piece lid', `
        <ellipse cx="78" cy="58" rx="26" ry="16" fill="${ribbon}" transform="rotate(-20 78 58)"/>
        <ellipse cx="122" cy="58" rx="26" ry="16" fill="${ribbon}" transform="rotate(20 122 58)"/>
        <circle cx="100" cy="66" r="11" fill="${ribbon}"/>
        <rect x="16" y="70" width="168" height="34" rx="10" fill="${main}"/>
        <rect x="16" y="70" width="168" height="10" rx="5" fill="rgba(255,255,255,.3)"/>
        <rect x="88" y="70" width="24" height="34" fill="${ribbon}"/>`);
  }

  function makeSpot(kind, animal, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'spot';
    b.dataset.kind = kind;
    b.dataset.state = 'closed';
    b.style.setProperty('--i', i);
    b.setAttribute('aria-label', 'Hiding place');
    b._animal = animal;
    let cover;
    if (kind === 'bush') cover = bushHalf('l') + bushHalf('r');
    else if (kind === 'curtain') cover = curtainParts(pick(CURTAINS));
    else cover = boxParts(pick(BOXES));
    // The curtain's backdrop must sit behind the animal; everything else in front.
    const back = kind === 'curtain' ? cover.slice(0, cover.indexOf('</svg>') + 6) : '';
    const front = kind === 'curtain' ? cover.slice(back.length) : cover;
    b.innerHTML = back +
      `<span class="peeker" aria-hidden="true">${Kit.animalImg(animal, 'who')}` +
      `<span class="paw paw-l"></span><span class="paw paw-r"></span></span>` +
      `<span class="cover">${front}</span>`;
    return b;
  }

  /* ---------- Sounds made for this game ---------- */
  // "pee-ka-BOO!": a slide-whistle pop and three bright notes
  function peekabooTune() {
    Sound.run(() => {
      Sound.tone({ type: 'sine', f: [[0, 380], [0.22, 1100]], dur: 0.24, vol: 0.14, attack: 0.02, vib: { rate: 9, depth: 20 } });
      Sound.marimba(hz('G5'), 0.22, 0.26, 0.4);
      Sound.marimba(hz('E5'), 0.38, 0.26, 0.4);
      Sound.marimba(hz('C6'), 0.56, 0.3, 0.9);
      Sound.tone({ type: 'triangle', f: [[0, hz('C5')]], at: 0.56, dur: 0.5, vol: 0.08, attack: 0.01, release: 0.3 });
    });
  }
  // A soft "hee-hee-hee" giggle made of tiny falling chirps
  function giggle() {
    Sound.run(() => Sound.rep(4, 0.11, (at, i) =>
      Sound.tone({ type: 'sine', f: [[0, 1200 - i * 60], [0.07, 900 - i * 60]], at, dur: 0.09, vol: 0.12, attack: 0.005, vib: { rate: 30, depth: 30 } })));
  }
  // Leaves rustling / curtain swish / lid closing
  function closeSound() {
    Sound.run(() => {
      Sound.noise({ dur: 0.45, vol: 0.12, attack: 0.15, filter: { type: 'bandpass', f: 2200, q: 0.8 }, to: 900 });
      Sound.tone({ type: 'sine', f: [[0, 900], [0.35, 420]], dur: 0.38, vol: 0.1, vib: { rate: 8, depth: 15 } });
    });
  }
  function rustle(kind) {
    Sound.run(() => {
      if (kind === 'box') Sound.rep(2, 0.12, at => Sound.tone({ type: 'sine', f: [[0, 300], [0.06, 220]], at, dur: 0.08, vol: 0.12 }));
      else Sound.noise({ dur: 0.3, vol: 0.08, attack: 0.05, filter: { type: 'bandpass', f: 3000, q: 1 } });
    });
  }

  /* ---------- Rounds ---------- */
  function newRound() {
    busy = true;
    found = 0;
    clearHint();
    stage.innerHTML = '';
    const kinds = shuffle(KINDS.concat(KINDS)).slice(0, SPOTS);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < SPOTS; i++) frag.appendChild(makeSpot(kinds[i], nextAnimal(), i));
    stage.appendChild(frag);
    Sound.boing(SPOTS);
    later(() => {
      stage.querySelectorAll('.spot').forEach(s => s.classList.add('in'));
      busy = false;
      scheduleHint();
    }, reduceMotion ? 200 : 700);
  }

  function open(spot) {
    spot.dataset.state = 'open';
    spot.setAttribute('aria-label', 'Peekaboo!');
    found++;
    peekabooTune();
    later(() => Sound.call(spot._animal), 750);
    later(giggle, 1500);
    const c = centerOf(spot);
    later(() => {
      fx.floaties({ left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h }, reduceMotion ? 3 : 6, ['✨', '⭐', '💛', '💖']);
    }, 250);
    if (found === SPOTS) {
      busy = true;
      clearHint();
      later(allFound, 2200);
    } else {
      scheduleHint();
    }
  }

  function allFound() {
    stage.classList.add('cheer');
    Sound.fanfare();
    const r = stage.getBoundingClientRect();
    fx.confetti(r.left + r.width / 2, r.top + r.height * 0.4, 60);
    fx.floaties(r, reduceMotion ? 6 : 16);
    later(() => {
      stage.classList.remove('cheer');
      stage.querySelectorAll('.spot').forEach(s => { s.dataset.state = 'closed'; });
      closeSound();
    }, 2600);
    later(() => {
      stage.querySelectorAll('.spot').forEach(s => s.classList.add('away'));
      Sound.slideDown(0.4);
    }, 3500);
    later(newRound, 4000);
  }

  function boop(spot) {
    const who = spot.querySelector('.peeker');
    if (who.classList.contains('boop')) return;
    who.classList.add('boop');
    who.addEventListener('animationend', () => who.classList.remove('boop'), { once: true });
    Sound.call(spot._animal);
  }

  function onTap(spot) {
    if (!spot || spot.classList.contains('away')) return;
    if (spot.dataset.state === 'closed') {
      if (busy) return;
      open(spot);
    } else if (!stage.classList.contains('cheer')) {
      boop(spot);
    }
  }

  // Fingers and mouse: react on touch-down (feels instant for toddlers).
  stage.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    onTap(e.target.closest('.spot'));
  });
  // Keyboard (Enter / Space on a focused spot) fires a click with detail 0.
  stage.addEventListener('click', (e) => {
    if (e.detail === 0) onTap(e.target.closest('.spot'));
  });
  // Babies love bashing keys: any other key opens the next hiding place.
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab' || e.key === 'Escape') return;
    const closed = [...stage.querySelectorAll('.spot[data-state="closed"]:not(.away)')];
    if (closed.length) onTap(pick(closed));
    else {
      const open = [...stage.querySelectorAll('.spot[data-state="open"]')];
      if (open.length) onTap(pick(open));
    }
  });

  /* ---------- Gentle hints: a hiding place wiggles ---------- */
  function hint() {
    const closed = [...stage.querySelectorAll('.spot[data-state="closed"]:not(.away)')];
    if (!closed.length || busy) return;
    const s = pick(closed);
    s.classList.remove('wiggle');
    void s.offsetWidth;
    s.classList.add('wiggle');
    rustle(s.dataset.kind);
    s.addEventListener('animationend', () => s.classList.remove('wiggle'), { once: true });
  }
  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => { hint(); scheduleHint(); }, rand(5000, 7000));
  }
  function clearHint() { clearTimeout(hintTimer); }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearHint();
    else if (!busy) scheduleHint();
  });

  Kit.setup({ id: 'peekaboo', how: () => {
    const s = stage.querySelector('.spot[data-state="closed"]:not(.away)');
    return s ? [{ tap: s }] : [];
  } });
  newRound();
})();
