/* ============ Tap Tap Race! game logic ============
   Three animal racers wait at the start line. Tap one to pick your racer.
   3-2-1 (three beeps), then every tap (anywhere, or any key) zooms your car forward
   with a "vroom". The other cars roll along too, but your racer always gets to the
   flag first, and then everybody crosses and gets a gold medal. Tap again to race
   with new friends. No timer, no losing.                                            */

(function () {
  'use strict';

  const { Sound, fx, rand, shuffle, bag, later, centerOf, reduceMotion, hz } = window.Kit;

  const COLORS = ['#ff5e4d', '#4fc3f7', '#ffc93c', '#3dd68c', '#b07cff', '#ff7eb6'];
  const nextTeam = bag([['rabbit', 'turtle', 'elephant'], ['dog', 'cat', 'pig'], ['lion', 'tiger', 'zebra'],
    ['monkey', 'panda', 'fox'], ['frog', 'duck', 'chicken'], ['cow', 'sheep', 'horse'], ['penguin', 'owl', 'kangaroo']]);

  const $ = (id) => document.getElementById(id);
  const track = $('track');
  const hint = $('pickHint');
  let racers = [];          // { el, p (0..1), mine, done }
  let phase = 'pick';       // pick | count | race | finish
  let raf = 0, last = 0;

  const CAR = (color) => `<svg viewBox="0 0 160 90" class="car-art" aria-hidden="true"><g stroke="#2b1d5c" stroke-width="4" stroke-linejoin="round">
    <path d="M10 62 Q8 40 30 38 L52 36 Q62 14 92 14 Q118 14 126 36 L142 40 Q156 44 154 62 Z" fill="${color}"/>
    <path d="M60 36 Q68 22 90 22 Q110 22 116 36 Z" fill="#dff4ff"/>
    <rect x="4" y="56" width="154" height="12" rx="6" fill="#2b1d5c"/>
    <circle cx="146" cy="50" r="5" fill="#fff3b0"/>
    <g class="wheel"><circle cx="40" cy="70" r="15" fill="#4a4a6a"/><path d="M40 58 V82 M28 70 H52" stroke="#ffc93c" stroke-width="3"/></g>
    <g class="wheel"><circle cx="122" cy="70" r="15" fill="#4a4a6a"/><path d="M122 58 V82 M110 70 H134" stroke="#ffc93c" stroke-width="3"/></g></g>
    <text x="78" y="56" text-anchor="middle" class="car-num"></text></svg>`;

  function setup() {
    cancelAnimationFrame(raf);
    phase = 'pick';
    track.innerHTML = '<div class="finish" aria-hidden="true"></div>';
    const team = nextTeam();
    const colors = shuffle(COLORS);
    racers = team.map((id, k) => {
      const lane = document.createElement('div');
      lane.className = 'lane';
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'racer';
      el.setAttribute('aria-label', 'Pick the ' + id);
      el.innerHTML = `<span class="driver">${Kit.animalImg(id)}</span>${CAR(colors[k])}<span class="medal" aria-hidden="true"></span>`;
      lane.appendChild(el);
      track.appendChild(lane);
      return { el, id, p: 0, mine: false, done: false, speed: rand(0.035, 0.05) };
    });
    hint.hidden = false;
    hint.classList.remove('gone');
    place();
    Sound.boing(3);
  }

  function place() {
    racers.forEach(r => {
      const lane = r.el.parentElement;
      const max = lane.clientWidth - r.el.offsetWidth;
      r.el.style.transform = `translateX(${(r.p * max).toFixed(1)}px)`;
    });
  }

  /* ---------- Pick, count down, race ---------- */
  function pick(r) {
    r.mine = true;
    r.el.classList.add('mine');
    hint.classList.add('gone');
    Sound.call(r.id);
    phase = 'count';
    const beep = (f, at) => Sound.run(() => Sound.tone({ type: 'square', f: [[0, f]], at, dur: 0.18, vol: 0.1, filter: { f: 2000 } }));
    beep(523, 0.6); beep(523, 1.2); beep(523, 1.8); beep(1046, 2.4);
    track.classList.add('countdown');
    later(() => { track.classList.remove('countdown'); phase = 'race'; last = performance.now(); raf = requestAnimationFrame(tick); }, reduceMotion ? 600 : 2500);
  }

  function boost() {
    const me = racers.find(r => r.mine);
    if (!me || me.done) return;
    me.p = Math.min(1, me.p + 0.055);
    me.el.classList.remove('zoom'); void me.el.offsetWidth; me.el.classList.add('zoom');
    const f = 180 + me.p * 260;
    Sound.run(() => {
      Sound.tone({ type: 'sawtooth', f: [[0, f], [0.18, f * 1.6], [0.3, f * 1.3]], dur: 0.32, vol: 0.09, filter: { f: 900, q: 2 } });
      Sound.noise({ dur: 0.18, vol: 0.05, filter: { type: 'lowpass', f: 600 } });
    });
    const c = centerOf(me.el);
    fx.rise(c.x - c.w * 0.5, c.y + c.h * 0.2, '💨', { size: 30, dx: -60, rise: 10, dur: 0.8 });
    if (me.p >= 1) finish(me);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const me = racers.find(r => r.mine);
    racers.forEach(r => {
      if (r.mine || r.done) return;
      // Others roll along but never pass your racer before it wins
      const cap = me.done ? 1 : Math.min(0.94, me.p + 0.12);
      // after your win, the others hurry over the line (about a second) to get their medals
      const v = me.done ? Math.max(0.5, r.speed * 4) : r.speed;
      if (r.p < cap) r.p = Math.min(cap, r.p + v * dt);
      if (r.p >= 1 && !r.done) { r.done = true; medal(r); }
    });
    place();
    if (racers.every(r => r.done)) { allDone(); return; }
    raf = requestAnimationFrame(tick);
  }

  function finish(me) {
    me.done = true;
    phase = 'finish';
    place();
    medal(me);
    Sound.fanfare();
    later(() => Sound.call(me.id), 700);
    const c = centerOf(me.el);
    fx.confetti(c.x, c.y, 70);
  }

  function medal(r) {
    r.el.classList.add('won');
    r.el.querySelector('.medal').textContent = '🥇';
    Sound.run(() => Sound.musicBox(hz('E6'), 0, 0.12, 0.6));
  }

  function allDone() {
    const r = track.getBoundingClientRect();
    fx.floaties(r, reduceMotion ? 6 : 14, ['🥇', '⭐', '🏁', '✨', '💛']);
    track.classList.add('party');
    later(() => { track.classList.remove('party'); phase = 'again'; }, 1800);
  }

  /* ---------- Taps ---------- */
  function onTap(e) {
    if (phase === 'pick') {
      const el = e && e.target.closest && e.target.closest('.racer');
      const r = racers.find(x => x.el === el) || (!e || !e.target.closest ? racers[0] : null);
      if (r) pick(r);
    } else if (phase === 'race') boost();
    else if (phase === 'again') setup();
  }
  document.querySelector('.stage').addEventListener('pointerdown', (e) => {
    if (e.button > 0 || e.target.closest('.corner-btn')) return;
    e.preventDefault();
    onTap(e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') return;
    if (e.key === 'Enter' && e.target.closest && e.target.closest('.racer') && phase === 'pick') { onTap(e); return; }
    if (e.key.length === 1 || e.key === 'Enter' || e.key.startsWith('Arrow')) { e.preventDefault(); onTap(null); }
  });
  addEventListener('resize', place);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && phase === 'race') last = performance.now(); });

  Kit.setup({ id: 'tap-race', how: () => phase === 'pick'
    ? [{ tap: () => racers[1] && racers[1].el }]
    : [{ tap: track }, { tap: track }, { tap: track }] });
  setup();
})();
