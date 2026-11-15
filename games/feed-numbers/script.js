/* ============ Feed the Numbers! game logic ============
   A friendly monster has a number on its tummy (and that many dots). Drag apples from
   the basket into its mouth, or just tap an apple and it flies in. Munch! A dot lights
   up and a note climbs. When the number is reached the monster dances, then a new
   monster comes with a new number. A full monster pats its tummy and the extra apple
   rolls back: never a "wrong", just a giggle. Numbers 1 to 6.                         */

(function () {
  'use strict';

  const { Sound, fx, rand, pick, later, centerOf, reduceMotion, hz } = window.Kit;

  const ROUNDS = [1, 2, 3, 2, 4, 3, 5, 2, 4, 6, 3, 5];
  const BODIES = ['#7ad36b', '#b07cff', '#4fc3f7', '#ff9f43', '#ff7eb6', '#ffc93c'];
  const STEPS = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'];
  const APPLES = 7;

  const $ = (id) => document.getElementById(id);
  const monster = $('monster');
  const basket = $('basket');
  let round = 0, target = 1, eaten = 0, busy = true, hintTimer = 0;

  function monsterSVG(color, n) {
    const dots = Array.from({ length: n }, (_, k) => {
      const x = 100 + (k - (n - 1) / 2) * 17;
      return `<circle class="dot" cx="${x}" cy="196" r="6.5"/>`;
    }).join('');
    return `<svg viewBox="0 0 200 220" class="mon" aria-hidden="true">
      <g stroke="#2b1d5c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <path class="arm arm-l" d="M30 130 Q6 120 10 98" fill="none" stroke-width="12"/><path d="M30 130 Q6 120 10 98" fill="none" stroke="${color}" stroke-width="5"/>
        <path class="arm arm-r" d="M170 130 Q194 120 190 98" fill="none" stroke-width="12"/><path d="M170 130 Q194 120 190 98" fill="none" stroke="${color}" stroke-width="5"/>
        <path d="M66 36 L56 8 L82 28 Z" fill="#fff3b0"/><path d="M134 36 L144 8 L118 28 Z" fill="#fff3b0"/>
        <path d="M100 28 C40 28 22 80 26 130 C30 176 60 190 100 190 C140 190 170 176 174 130 C178 80 160 28 100 28 Z" fill="${color}"/>
        <ellipse cx="100" cy="150" rx="42" ry="30" fill="#fff" opacity=".9"/>
        <circle cx="74" cy="70" r="17" fill="#fff"/><circle cx="126" cy="70" r="17" fill="#fff"/>
      </g>
      <g class="pupils"><circle cx="76" cy="72" r="8" fill="#2b1d5c"/><circle cx="128" cy="72" r="8" fill="#2b1d5c"/><circle cx="79" cy="68" r="3" fill="#fff"/><circle cx="131" cy="68" r="3" fill="#fff"/></g>
      <g class="happy-eyes" fill="none" stroke="#2b1d5c" stroke-width="5" stroke-linecap="round"><path d="M62 74 Q74 60 86 74"/><path d="M114 74 Q126 60 138 74"/></g>
      <ellipse cx="56" cy="96" rx="9" ry="5" fill="#ff8fab" opacity=".6"/><ellipse cx="144" cy="96" rx="9" ry="5" fill="#ff8fab" opacity=".6"/>
      <g class="mouth" stroke="#2b1d5c" stroke-width="4" stroke-linejoin="round">
        <g class="m-open"><ellipse cx="100" cy="106" rx="26" ry="18" fill="#5b2333"/><path d="M84 94 L88 102 L92 94 M108 94 L112 102 L116 94" fill="#fff" stroke-width="2"/><ellipse cx="100" cy="116" rx="12" ry="5" fill="#ff7e9b" stroke="none"/></g>
        <g class="m-chew"><ellipse cx="100" cy="106" rx="18" ry="7" fill="#5b2333"/></g>
        <g class="m-happy"><path d="M72 98 Q100 136 128 98 Z" fill="#5b2333"/><path d="M90 116 Q100 110 110 116 Q100 122 90 116 Z" fill="#ff7e9b" stroke="none"/></g>
      </g>
      <circle class="target" cx="100" cy="106" r="2" fill="none"/>
      <text class="num" x="100" y="164" text-anchor="middle">${n}</text>
      <g stroke="#2b1d5c" stroke-width="2.5">${dots}</g>
    </svg>`;
  }

  function appleSVG() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#2b1d5c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M50 26 Q48 14 56 8" fill="none" stroke-width="5"/><path d="M54 18 Q70 6 80 16 Q70 28 54 18 Z" fill="#7ad36b"/>
      <path d="M50 28 C34 18 12 26 14 52 C16 78 34 94 50 86 C66 94 84 78 86 52 C88 26 66 18 50 28 Z" fill="#ff5e5e"/></g>
      <ellipse cx="32" cy="44" rx="6" ry="10" fill="#fff" opacity=".55" transform="rotate(25 32 44)"/></svg>`;
  }

  function newRound() {
    busy = true;
    clearHint();
    target = ROUNDS[round % ROUNDS.length];
    const color = BODIES[round % BODIES.length];
    round++;
    eaten = 0;
    monster.innerHTML = monsterSVG(color, target);
    monster.dataset.mood = 'hungry';
    monster.setAttribute('aria-label', `A hungry monster that wants ${target} apple${target > 1 ? 's' : ''}`);
    monster.classList.remove('leave');
    monster.classList.add('enter');
    basket.innerHTML = '';
    for (let k = 0; k < APPLES; k++) {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'apple';
      a.style.setProperty('--k', k);
      a.setAttribute('aria-label', 'Apple');
      a.innerHTML = appleSVG();
      basket.appendChild(a);
    }
    Sound.boing(2);
    later(() => {
      monster.classList.remove('enter');
      Sound.run(() => Sound.rep(target, 0.12, (at, k) => Sound.musicBox(hz(STEPS[k]), at, 0.12, 0.5)));
      busy = false;
      scheduleHint();
    }, reduceMotion ? 150 : 800);
  }

  const mouth = () => centerOf(monster.querySelector('.target'));
  const overMonster = (x, y) => { const r = monster.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; };

  /* ---------- Eating ---------- */
  function feed(apple) {
    if (eaten >= target) { full(apple); return; }
    busy = true;
    clearHint();
    apple.classList.add('used');
    const from = centerOf(apple), to = mouth();
    const cur = new DOMMatrix(getComputedStyle(apple).transform);
    monster.dataset.mood = 'ready';
    apple.animate([
      { transform: `translate(${cur.e}px, ${cur.f}px)` },
      { transform: `translate(${cur.e + (to.x - from.x) * 0.5}px, ${cur.f + (to.y - from.y) * 0.5 - 70}px) rotate(-30deg) scale(1.1)`, offset: 0.5 },
      { transform: `translate(${cur.e + to.x - from.x}px, ${cur.f + to.y - from.y}px) scale(.2)` }
    ], { duration: reduceMotion ? 200 : 500, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
      apple.style.visibility = 'hidden';
      eaten++;
      monster.dataset.mood = 'chew';
      const n = eaten;
      Sound.run(() => {
        Sound.rep(3, 0.16, (at) => Sound.noise({ at, dur: 0.07, vol: 0.28, filter: { type: 'bandpass', f: 1500 + Math.random() * 800, q: 1.2 } }));
        Sound.marimba(hz(STEPS[n - 1]), 0.5, 0.3, 0.8);
      });
      fx.burst(to.x, to.y, ['#ff5e5e', '#fff0d6'], 7, 60);
      monster.querySelectorAll('.dot')[n - 1].classList.add('on');
      later(() => {
        if (eaten === target) party();
        else { monster.dataset.mood = 'hungry'; busy = false; scheduleHint(); }
      }, 650);
    };
  }

  function full(apple) {
    monster.dataset.mood = 'full';
    Sound.run(() => {
      Sound.tone({ type: 'sine', f: [[0, 300], [0.3, 200]], dur: 0.35, vol: 0.2, vib: { rate: 10, depth: 10 } });   // "mm-mm"
      Sound.tone({ type: 'sine', f: [[0, 280], [0.3, 190]], at: 0.4, dur: 0.35, vol: 0.2, vib: { rate: 10, depth: 10 } });
    });
    back(apple);
    later(() => { if (monster.dataset.mood === 'full') monster.dataset.mood = 'happy'; }, 900);
  }

  function back(apple) {
    apple.style.transition = 'transform .45s cubic-bezier(.3, 1.5, .5, 1)';
    apple.style.transform = '';
    later(() => { apple.style.transition = ''; }, 450);
  }

  function party() {
    monster.dataset.mood = 'happy';
    Sound.fanfare();
    const r = monster.getBoundingClientRect();
    fx.confetti(r.left + r.width / 2, r.top + r.height * 0.4, 50);
    fx.floaties(r, reduceMotion ? 5 : 12);
    later(() => { monster.classList.add('leave'); basket.querySelectorAll('.apple').forEach(a => a.classList.add('away')); Sound.slideUp(0.4); }, 2400);
    later(newRound, 3000);
  }

  /* ---------- Drag (or tap) an apple ---------- */
  let drag = null;
  basket.addEventListener('pointerdown', (e) => {
    const a = e.target.closest('.apple');
    if (!a || busy || a.classList.contains('used') || drag) return;
    e.preventDefault();
    try { a.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    drag = { a, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    a.classList.add('held');
    Sound.tap();
  });
  basket.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 10) drag.moved = true;
    if (drag.moved) {
      drag.a.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
      monster.classList.toggle('over', overMonster(e.clientX, e.clientY));
    }
  });
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { a, moved } = drag;
    drag = null;
    a.classList.remove('held');
    monster.classList.remove('over');
    if (!moved || (e.type === 'pointerup' && overMonster(e.clientX, e.clientY))) feed(a);
    else back(a);
  }
  basket.addEventListener('pointerup', end);
  basket.addEventListener('pointercancel', end);
  basket.addEventListener('click', (e) => { const a = e.target.closest('.apple'); if (a && e.detail === 0 && !busy && !a.classList.contains('used')) feed(a); });
  monster.addEventListener('pointerdown', () => {
    if (busy) return;
    monster.classList.remove('boop'); void monster.offsetWidth; monster.classList.add('boop');
    Sound.run(() => Sound.tone({ type: 'sawtooth', f: [[0, 160], [0.3, 240], [0.6, 150]], dur: 0.6, vol: 0.2, filter: { f: 700, q: 3 }, trem: { rate: 18, depth: 0.6 } }));
  });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || busy || e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') return;
    const a = basket.querySelector('.apple:not(.used)');
    if (a && (e.key.length === 1 || e.key === 'Enter')) { e.preventDefault(); feed(a); }
  });

  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => {
      const a = basket.querySelector('.apple:not(.used)');
      if (a && !busy) { a.classList.remove('nudge'); void a.offsetWidth; a.classList.add('nudge'); Sound.twinkle(0.07); }
      scheduleHint();
    }, 6000);
  }
  function clearHint() { clearTimeout(hintTimer); }

  Kit.setup();
  newRound();
})();
