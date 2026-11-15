/* ============ Count the Ducks! game logic ============
   The pond shows faint duck shapes: that's how many ducks are coming (3, 4, 5 ...).
   Every tap brings one duck splashing in. Its number pops up big and plays a note that
   climbs the scale (1 = do, 2 = re, 3 = mi ...), so counting sounds like going upstairs.
   All spots full: the big number shows, each duck quacks its number in turn, confetti,
   then they paddle away and a new count begins. Numbers up to 10. No losing.          */

(function () {
  'use strict';

  const { Sound, fx, later, centerOf, reduceMotion, hz } = window.Kit;

  const ROUNDS = [3, 4, 2, 5, 3, 6, 4, 7, 5, 8, 3, 9, 6, 10];
  const STEPS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const DIGIT_COLORS = ['#ff5e4d', '#ff9f43', '#ffc93c', '#3dd68c', '#4fc3f7', '#b07cff', '#ff7eb6', '#ff5e4d', '#ff9f43', '#3dd68c'];

  const $ = (id) => document.getElementById(id);
  const pond = $('pond');
  const spotsEl = $('spots');
  const goal = $('goal');
  let round = 0, target = 3, count = 0, busy = true, hintTimer = 0;

  function newRound() {
    busy = true;
    clearHint();
    target = ROUNDS[round++ % ROUNDS.length];
    count = 0;
    spotsEl.innerHTML = '';
    spotsEl.style.setProperty('--cols', Math.min(target, 5));
    spotsEl.style.setProperty('--rows', Math.ceil(target / 5));
    for (let k = 0; k < target; k++) {
      const s = document.createElement('div');
      s.className = 'spot';
      s.innerHTML = Kit.animalImg('duck', 'ghost') + `<span class="num" style="--nc:${DIGIT_COLORS[k]}">${k + 1}</span>`;
      spotsEl.appendChild(s);
    }
    // The goal: a big number with that many dots
    goal.innerHTML = `<span class="dots">${'<i></i>'.repeat(target)}</span>`;
    goal.setAttribute('aria-label', `${target} ducks`);
    goal.className = 'goal';
    Sound.run(() => Sound.rep(target, 0.09, (at, k) => Sound.musicBox(hz(STEPS[k]), at, 0.1, 0.4)));
    later(() => { busy = false; scheduleHint(); }, reduceMotion ? 100 : 500);
  }

  function addDuck() {
    if (busy || count >= target) return;
    clearHint();
    const spot = spotsEl.children[count];
    count++;
    spot.classList.add('filled');
    const duck = document.createElement('div');
    duck.className = 'duck';
    duck.innerHTML = Kit.animalImg('duck');
    spot.appendChild(duck);
    const n = count;
    Sound.run(() => {
      Sound.noise({ dur: 0.25, vol: 0.12, filter: { type: 'lowpass', f: 1800 }, to: 500 });     // splash
      Sound.marimba(hz(STEPS[n - 1]), 0.12, 0.3, 0.9);
      Sound.musicBox(hz(STEPS[n - 1]) * 2, 0.2, 0.1, 0.6);
    });
    const c = centerOf(spot);
    fx.burst(c.x, c.y + c.h * 0.3, ['#9fdcff', '#ffffff'], 8, c.w * 0.6);
    goal.querySelectorAll('i')[n - 1].classList.add('on');
    if (count === target) later(done, 700);
    else scheduleHint();
  }

  function done() {
    busy = true;
    goal.innerHTML = `<span class="big">${target}</span>`;
    goal.classList.add('win');
    const ducks = [...spotsEl.querySelectorAll('.spot')];
    ducks.forEach((s, k) => later(() => {
      s.classList.add('quack');
      Sound.run(() => {
        Sound.tone({ type: 'sawtooth', f: [[0, hz(STEPS[k]) * 1.5], [0.12, hz(STEPS[k]) * 1.2]], dur: 0.16, vol: 0.14, filter: { type: 'bandpass', f: 1200, q: 4 } });
        Sound.musicBox(hz(STEPS[k]), 0, 0.12, 0.5);
      });
    }, k * 260));
    const t = ducks.length * 260 + 200;
    later(() => {
      Sound.fanfare();
      const r = pond.getBoundingClientRect();
      fx.confetti(r.left + r.width / 2, r.top + r.height * 0.3, 60);
      fx.floaties(r, reduceMotion ? 5 : 12);
    }, t);
    later(() => { spotsEl.classList.add('away'); Sound.slideUp(0.4); }, t + 2000);
    later(() => { spotsEl.classList.remove('away'); newRound(); }, t + 2700);
  }

  pond.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); addDuck(); });
  pond.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addDuck(); } });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target === pond) return;
    if (e.key.length === 1 || e.key === 'Enter') addDuck();
  });

  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => {
      const s = spotsEl.children[count];
      if (s && !busy) { s.classList.remove('nudge'); void s.offsetWidth; s.classList.add('nudge'); Sound.twinkle(0.07); }
      scheduleHint();
    }, 6000);
  }
  function clearHint() { clearTimeout(hintTimer); }

  Kit.setup();
  newRound();
})();
