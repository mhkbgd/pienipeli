/* ============ Decorate the Cake! game logic ============
   A big cake on a plate and a tray of decorations: strawberries, cherries, candles,
   stars, hearts, flowers, sprinkles, blueberries, chocolate. Drag any of them onto the
   cake and it sticks right where it lands (squish + a note). Tap one and it hops onto
   the cake by itself. There's no right way: it's all about making.
   🎉 lights the candles (adding some if there are none) and plays a birthday tune;
   tap the cake to blow them out. The shared ↻ (start again) brings a fresh cake.   */

(function () {
  'use strict';

  const { Sound, fx, rand, pick, later, reduceMotion, hz } = window.Kit;

  const S = 'stroke="#2b1d5c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  // Decorations, drawn in a box around (0,0) roughly 50 x 50
  const ITEMS = {
    strawberry: `<path d="M0 22 C-20 10 -22 -12 -10 -16 Q0 -20 10 -16 C22 -12 20 10 0 22 Z" fill="#ff4f6d" ${S}/><path d="M-10 -16 L-4 -24 L0 -16 L4 -24 L10 -16 Z" fill="#7ad36b" ${S}/><g fill="#fff3b0"><circle cx="-6" cy="-4" r="1.8"/><circle cx="5" cy="-6" r="1.8"/><circle cx="0" cy="5" r="1.8"/><circle cx="-8" cy="7" r="1.6"/><circle cx="8" cy="5" r="1.6"/></g>`,
    cherry: `<path d="M0 -6 Q4 -22 14 -26" fill="none" ${S}/><circle cy="6" r="14" fill="#d9203a" ${S}/><circle cx="-5" cy="1" r="4" fill="#fff" opacity=".6"/>`,
    candle: `<rect x="-6" y="-22" width="12" height="40" rx="3" fill="#7ad3ff" ${S}/><path d="M-6 -12 L6 -18 M-6 0 L6 -6 M-6 12 L6 6" stroke="#fff" stroke-width="3"/><path d="M0 -22 V-28" ${S}/><path class="flame" d="M0 -46 Q9 -34 0 -27 Q-9 -34 0 -46 Z" fill="#ffc93c" stroke="#ff7a1a" stroke-width="2"/>`,
    star: `<path d="M0 -20 L6 -6 L21 -6 L9 3 L13 18 L0 9 L-13 18 L-9 3 L-21 -6 L-6 -6 Z" fill="#ffd23d" ${S}/>`,
    heart: `<path d="M0 18 C-26 0 -18 -22 0 -10 C18 -22 26 0 0 18 Z" fill="#ff7eb6" ${S}/>`,
    flower: `<g fill="#fff">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(Math.cos(a * Math.PI / 180) * 10).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * 10).toFixed(1)}" r="8" ${S}/>`).join('')}</g><circle r="7" fill="#ffc93c" ${S}/>`,
    sprinkles: ['#ff5e4d', '#4fc3f7', '#ffc93c', '#3dd68c', '#b07cff', '#ff7eb6'].map((c, k) => `<rect x="-3" y="-8" width="6" height="16" rx="3" fill="${c}" stroke="#2b1d5c" stroke-width="1.5" transform="translate(${[-14, 2, 14, -6, 10, -16][k]} ${[-10, -14, -2, 6, 12, 10][k]}) rotate(${k * 47})"/>`).join(''),
    blueberry: `<circle r="13" fill="#5b6ee1" ${S}/><path d="M-4 -9 L0 -5 L4 -9" fill="none" stroke="#2b1d5c" stroke-width="2"/><circle cx="-5" cy="-3" r="3" fill="#fff" opacity=".5"/>`,
    chocolate: `<rect x="-16" y="-12" width="32" height="24" rx="4" fill="#8a5a35" ${S}/><path d="M-16 0 H16 M0 -12 V12" stroke="#6e4526" stroke-width="2.5"/>`
  };
  const FLAVOURS = [
    { cake: '#ffd9a8', icing: '#ffffff', drip: '#ff9fc6' },
    { cake: '#c98b5b', icing: '#ffe1ef', drip: '#8a5a35' },
    { cake: '#fff3b0', icing: '#bfe8ff', drip: '#4fc3f7' },
    { cake: '#ffc4de', icing: '#ffffff', drip: '#b07cff' },
    { cake: '#d8f5c8', icing: '#fff7e0', drip: '#3dd68c' }
  ];
  const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
  const BIRTHDAY = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
    ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]];   // Happy Birthday (public domain)

  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const cake = $('cake');
  const tray = $('tray');
  let flavour = Math.floor(Math.random() * 5), layer = null, party = false, noteN = 0, partyTimer = 0;

  // Cake shape (viewBox 400 x 340); decorations stick inside these areas
  const CAKE_AREAS = [{ x: 70, y: 150, w: 260, h: 140 }, { x: 115, y: 60, w: 170, h: 100 }];
  const onCake = (x, y) => CAKE_AREAS.some(a => x > a.x && x < a.x + a.w && y > a.y - 10 && y < a.y + a.h);

  function drawCake() {
    const f = FLAVOURS[flavour % FLAVOURS.length];
    const drips = (x0, x1, y, n) => {
      let d = `M${x0} ${y}`;
      const step = (x1 - x0) / n;
      for (let k = 0; k < n; k++) {
        const xa = x0 + k * step, len = 14 + ((k * 37) % 18);
        d += ` L${xa + step * 0.2} ${y} Q${xa + step * 0.2} ${y + len} ${xa + step * 0.5} ${y + len} Q${xa + step * 0.8} ${y + len} ${xa + step * 0.8} ${y}`;
      }
      return d + ` L${x1} ${y} L${x1} ${y - 14} L${x0} ${y - 14} Z`;
    };
    cake.innerHTML = `
      <g ${S}>
        <ellipse cx="200" cy="300" rx="180" ry="30" fill="#fff" stroke-width="4"/>
        <ellipse cx="200" cy="296" rx="150" ry="20" fill="#eef4ff" stroke="none"/>
        <rect x="70" y="150" width="260" height="140" rx="22" fill="${f.cake}" stroke-width="4"/>
        <path d="${drips(70, 330, 166, 9)}" fill="${f.drip}" stroke-width="4"/>
        <rect x="70" y="146" width="260" height="22" rx="11" fill="${f.icing}" stroke-width="4"/>
        <rect x="115" y="60" width="170" height="100" rx="20" fill="${f.cake}" stroke-width="4"/>
        <path d="${drips(115, 285, 76, 6)}" fill="${f.drip}" stroke-width="4"/>
        <rect x="115" y="56" width="170" height="22" rx="11" fill="${f.icing}" stroke-width="4"/>
        <path d="M90 230 Q200 250 310 230" fill="none" stroke="${f.icing}" stroke-width="8"/>
      </g>
      <g class="decor"></g>`;
    layer = cake.querySelector('.decor');
  }

  /* ---------- Tray ---------- */
  Object.entries(ITEMS).forEach(([id, art]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'item';
    b.dataset.item = id;
    b.setAttribute('aria-label', id);
    b.innerHTML = `<svg viewBox="-30 -30 60 60" aria-hidden="true">${art}</svg>`;
    tray.appendChild(b);
  });

  /* ---------- Sticking things on ---------- */
  function stick(id, x, y) {
    const g = document.createElementNS(NS, 'g');
    const rot = id === 'candle' ? rand(-6, 6) : rand(-25, 25);
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${id === 'sprinkles' ? 1.1 : 0.95})`);
    g.setAttribute('class', 'deco deco-' + id + (party && id === 'candle' ? ' lit' : ''));
    g.innerHTML = `<g class="squish">${ITEMS[id]}</g>`;
    // candles behind fruit a little: insert candles first
    if (id === 'candle') layer.insertBefore(g, layer.firstChild); else layer.appendChild(g);
    while (layer.children.length > 70) layer.removeChild(layer.children[id === 'candle' ? layer.children.length - 1 : 0]);
    const n = NOTES[noteN++ % NOTES.length];
    Sound.run(() => {
      Sound.tone({ type: 'sine', f: [[0, 520], [0.1, 220]], dur: 0.12, vol: 0.2, attack: 0.003 });   // squish
      Sound.noise({ dur: 0.1, vol: 0.08, filter: { type: 'bandpass', f: 1200, q: 1 } });
      Sound.marimba(hz(n), 0.05, 0.22, 0.6);
    });
    const r = g.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, ['#ffd23d', '#ffffff', '#ff7eb6'], 6, 40);
  }

  function toCake(clientX, clientY) {
    const pt = cake.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(cake.getScreenCTM().inverse());
  }
  function randomSpot() {
    const a = pick(CAKE_AREAS);
    return { x: rand(a.x + 20, a.x + a.w - 20), y: rand(a.y + 4, a.y + Math.min(a.h - 20, 90)) };
  }

  /* ---------- Drag from the tray ---------- */
  let drag = null;
  tray.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.item');
    if (!b || drag) return;
    e.preventDefault();
    try { tray.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = b.innerHTML;
    document.body.appendChild(ghost);
    drag = { id: b.dataset.item, ghost, pid: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
    moveGhost(e.clientX, e.clientY);
    b.classList.remove('pick'); void b.offsetWidth; b.classList.add('pick');
    Sound.tap();
  });
  function moveGhost(x, y) { drag.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -60%)`; }
  tray.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
    moveGhost(e.clientX, e.clientY);
  });
  function end(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const { id, ghost, moved } = drag;
    drag = null;
    if (!moved) { ghost.remove(); const p = randomSpot(); stick(id, p.x, p.y); return; }     // tap: hops on
    const r = ghost.getBoundingClientRect();
    const p = toCake(r.left + r.width / 2, r.top + r.height / 2);
    if (e.type === 'pointerup' && onCake(p.x, p.y)) { ghost.remove(); stick(id, p.x, p.y); }
    else { ghost.classList.add('drop'); later(() => ghost.remove(), 450); Sound.run(() => Sound.tone({ type: 'sine', f: [[0, 600], [0.3, 300]], dur: 0.3, vol: 0.08 })); }
  }
  tray.addEventListener('pointerup', end);
  tray.addEventListener('pointercancel', end);
  tray.addEventListener('click', (e) => { const b = e.target.closest('.item'); if (b && e.detail === 0) { const p = randomSpot(); stick(b.dataset.item, p.x, p.y); } });

  /* ---------- Party! ---------- */
  function lightCandles() {
    if (party) return;
    if (!layer.querySelector('.deco-candle')) [[160, 64], [200, 60], [240, 64]].forEach(([x, y]) => stick('candle', x, y));
    party = true;
    layer.querySelectorAll('.deco-candle').forEach((c, k) => later(() => { c.classList.add('lit'); Sound.run(() => Sound.noise({ dur: 0.15, vol: 0.08, filter: { type: 'highpass', f: 2000 } })); }, 200 + k * 120));
    later(() => {
      const t = Sound.run(() => Sound.melody(BIRTHDAY, { bpm: 150, voice: Sound.musicBox })) || 9;
      const r = cake.getBoundingClientRect();
      fx.floaties(r, reduceMotion ? 6 : 14, ['🎈', '⭐', '💖', '🎉', '✨']);
      partyTimer = later(() => { fx.confetti(r.left + r.width / 2, r.top + r.height * 0.3, 60); }, t * 1000);
    }, 700);
    cake.classList.add('party');
  }
  function blowOut() {
    if (!party) return;
    party = false;
    cake.classList.remove('party');
    Sound.run(() => Sound.noise({ dur: 0.7, vol: 0.2, attack: 0.05, filter: { type: 'bandpass', f: 1400, q: 0.6 }, to: 500 }));
    layer.querySelectorAll('.deco-candle.lit').forEach((c, k) => later(() => c.classList.remove('lit'), k * 60));
    later(() => { Sound.yay(); const r = cake.getBoundingClientRect(); fx.confetti(r.left + r.width / 2, r.top + r.height * 0.3, 50); }, 500);
  }
  $('partyBtn').addEventListener('click', lightCandles);
  cake.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (party) { blowOut(); return; }
    // tapping the cake drops sprinkles where you tap
    const p = toCake(e.clientX, e.clientY);
    if (onCake(p.x, p.y)) stick('sprinkles', p.x, p.y);
  });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') return;
    if (e.key.length === 1) { const p = randomSpot(); stick(pick(Object.keys(ITEMS)), p.x, p.y); }
  });

  Kit.setup({ id: 'decorate-cake', how: () => [
    { drag: [() => tray.querySelector('[data-item="strawberry"]'), cake] },
    { drag: [() => tray.querySelector('[data-item="candle"]'), cake] },
    { tap: () => document.getElementById('partyBtn') }] });
  drawCake();
})();
