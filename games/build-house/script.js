/* ============ Build a House! game logic ============
   A building site with a dashed outline for every piece. Drag each piece from the tray
   onto its outline (it snaps in with a "plonk" and a note), or just tap a piece and it
   flies into place by itself. When everything is built it comes alive:
     house:  the lights go on, smoke puffs, an animal family waves from the windows
     barn:   the farm animals come out to say hello
     rocket: the engine roars and it blasts off into the sky
   Then the next build. The whole scene is one SVG, so it scales to any screen.
   Site coordinates: a 400 x 360 box (ground at y = 330). The tray sits below the site
   on tall screens and to the right of it on wide screens.                            */

(function () {
  'use strict';

  const { Sound, fx, rand, shuffle, later, centerOf, reduceMotion, hz } = window.Kit;

  const NS = 'http://www.w3.org/2000/svg';
  const S = 'stroke="#2b1d5c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const NOTES = ['C5', 'E5', 'G5', 'A5', 'C6', 'E6'];

  /* ---------- Blueprints: pieces drawn around (0,0), slot = where the centre goes ---------- */
  const BUILDS = [
    { id: 'house', pieces: [
      { id: 'walls', slot: [200, 255], hw: 110, hh: 75, z: 0, art: `<rect x="-110" y="-75" width="220" height="150" rx="6" fill="#ffd9a8" ${S}/><path d="M-110 -35 H110 M-110 5 H110 M-110 45 H110" stroke="#f2b97a" stroke-width="3" fill="none"/>` },
      { id: 'chimney', slot: [262, 112], hw: 16, hh: 28, z: 1, art: `<rect x="-16" y="-28" width="32" height="56" rx="3" fill="#c96a4a" ${S}/><rect x="-20" y="-32" width="40" height="12" rx="3" fill="#a8553a" ${S}/>` },
      { id: 'roof', slot: [200, 140], hw: 130, hh: 50, z: 2, art: `<path d="M-132 46 L0 -50 L132 46 Z" fill="#ff7a5c" ${S}/><path d="M-90 16 L0 -50 L90 16" fill="none" stroke="#ffa08a" stroke-width="5"/>` },
      { id: 'door', slot: [200, 290], hw: 26, hh: 40, z: 3, art: `<rect x="-26" y="-40" width="52" height="80" rx="8" fill="#b07cff" ${S}/><circle cx="14" cy="4" r="4" fill="#ffd23d" ${S}/>` },
      { id: 'winL', slot: [135, 230], hw: 26, hh: 24, z: 3, cls: 'win', art: `<rect class="glass" x="-26" y="-24" width="52" height="48" rx="5" fill="#bfe8ff" ${S}/><path d="M0 -24 V24 M-26 0 H26" ${S}/>` },
      { id: 'winR', slot: [265, 230], hw: 26, hh: 24, z: 3, cls: 'win', art: `<rect class="glass" x="-26" y="-24" width="52" height="48" rx="5" fill="#bfe8ff" ${S}/><path d="M0 -24 V24 M-26 0 H26" ${S}/>` }
    ] },
    { id: 'barn', pieces: [
      { id: 'walls', slot: [195, 255], hw: 100, hh: 75, z: 0, art: `<rect x="-100" y="-75" width="200" height="150" rx="4" fill="#e8534a" ${S}/><path d="M-60 -75 V75 M-20 -75 V75 M20 -75 V75 M60 -75 V75" stroke="#c43f37" stroke-width="3"/>` },
      { id: 'silo', slot: [342, 240], hw: 28, hh: 90, z: 1, art: `<path d="M-28 90 V-62 Q-28 -90 0 -90 Q28 -90 28 -62 V90 Z" fill="#9db4d8" ${S}/><path d="M-28 -40 H28 M-28 0 H28 M-28 40 H28" stroke="#7d93b8" stroke-width="3"/>` },
      { id: 'roof', slot: [195, 142], hw: 122, hh: 45, z: 2, art: `<path d="M-122 42 L-92 -8 L0 -45 L92 -8 L122 42 Z" fill="#8f2f2a" ${S}/>` },
      { id: 'door', slot: [195, 285], hw: 42, hh: 45, z: 3, cls: 'barn-door', art: `<rect x="-42" y="-45" width="84" height="90" rx="4" fill="#fff6ea" ${S}/><path d="M-42 -45 L42 45 M42 -45 L-42 45" stroke="#e8534a" stroke-width="6"/><rect x="-42" y="-45" width="84" height="90" rx="4" fill="none" ${S}/>` },
      { id: 'loft', slot: [195, 150], hw: 22, hh: 22, z: 3, art: `<circle r="22" fill="#ffe27a" ${S}/><path d="M0 -22 V22 M-22 0 H22" ${S}/>` }
    ] },
    { id: 'rocket', pieces: [
      { id: 'body', slot: [200, 205], hw: 42, hh: 92, z: 1, art: `<rect x="-42" y="-92" width="84" height="184" rx="34" fill="#f4f7ff" ${S}/><path d="M-42 50 H42" stroke="#4fc3f7" stroke-width="8"/>` },
      { id: 'nose', slot: [200, 92], hw: 42, hh: 40, z: 2, art: `<path d="M-42 30 Q-38 -24 0 -46 Q38 -24 42 30 Z" fill="#ff5e4d" ${S}/>` },
      { id: 'finL', slot: [148, 268], hw: 26, hh: 40, z: 0, art: `<path d="M22 -40 L-26 30 L-20 42 L22 26 Z" fill="#ffc93c" ${S}/>` },
      { id: 'finR', slot: [252, 268], hw: 26, hh: 40, z: 0, art: `<path d="M-22 -40 L26 30 L20 42 L-22 26 Z" fill="#ffc93c" ${S}/>` },
      { id: 'window', slot: [200, 170], hw: 24, hh: 24, z: 3, art: `<circle r="24" fill="#4fc3f7" ${S}/><circle cx="-7" cy="-8" r="7" fill="#fff" opacity=".7"/>` }
    ] }
  ];

  const $ = (id) => document.getElementById(id);
  const svg = $('build');
  let b = 0, build = null, pieces = [], placed = 0, busy = true, wide = false, hintTimer = 0, drag = null;
  let gGhost, gPlaced, gTray, gFx;

  const el = (tag, attrs, parent, html) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (html) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  };

  /* ---------- Layout ---------- */
  function layout() {
    wide = innerWidth > innerHeight * 1.15;
    svg.setAttribute('viewBox', wide ? '0 0 700 380' : '0 0 400 610');
    const tray = svg.querySelector('.tray-bg');
    if (tray) {
      if (wide) { tray.setAttribute('x', 418); tray.setAttribute('y', 14); tray.setAttribute('width', 270); tray.setAttribute('height', 352); }
      else { tray.setAttribute('x', 10); tray.setAttribute('y', 372); tray.setAttribute('width', 380); tray.setAttribute('height', 228); }
    }
    trayPositions();
  }
  function trayPositions() {
    const waiting = pieces.filter(p => !p.placed);
    const cols = wide ? 2 : 3;
    const box = wide ? { x: 418, y: 14, w: 270, h: 352 } : { x: 10, y: 372, w: 380, h: 228 };
    const rows = Math.max(1, Math.ceil(pieces.length / cols));
    const cw = box.w / cols, ch = box.h / rows;
    pieces.forEach((p, k) => {
      if (p.placed) return;
      const c = p.trayIndex % cols, r = Math.floor(p.trayIndex / cols);
      p.home = [box.x + cw * (c + 0.5), box.y + ch * (r + 0.5)];
      p.homeS = Math.min(1, (cw * 0.8) / (p.hw * 2), (ch * 0.78) / (p.hh * 2));
      if (!drag || drag.p !== p) setT(p, p.home[0], p.home[1], p.homeS);
    });
    return waiting;
  }
  function setT(p, x, y, s) { p.x = x; p.y = y; p.s = s; p.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`); }

  /* ---------- A new build ---------- */
  function newBuild() {
    busy = true;
    clearHint();
    build = BUILDS[b++ % BUILDS.length];
    placed = 0;
    svg.innerHTML = '';
    svg.dataset.build = build.id;
    el('rect', { x: -400, y: 330, width: 1600, height: 400, fill: '#8fe0a3' }, svg);
    el('path', { d: 'M-400 330 H1200', stroke: '#2b1d5c', 'stroke-width': 4 }, svg);
    el('rect', { class: 'tray-bg', rx: 26, fill: '#e9c08f', stroke: '#2b1d5c', 'stroke-width': 4 }, svg);
    gGhost = el('g', { class: 'ghosts' }, svg);
    gPlaced = el('g', { class: 'placed' }, svg);
    gFx = el('g', { class: 'extras' }, svg);
    gTray = el('g', { class: 'tray' }, svg);
    const order = shuffle(build.pieces.map((_, k) => k));
    pieces = build.pieces.map((d, k) => {
      el('g', { class: 'ghost', transform: `translate(${d.slot[0]} ${d.slot[1]})` }, gGhost, d.art);
      const g = el('g', { class: 'piece' + (d.cls ? ' ' + d.cls : ''), tabindex: 0, role: 'button', 'aria-label': 'Building piece' }, gTray, d.art);
      g.style.setProperty('--k', k);
      return { ...d, g, placed: false, trayIndex: order.indexOf(k), x: 0, y: 0, s: 1 };
    });
    layout();
    svg.setAttribute('aria-label', `Building site: build a ${build.id}`);
    Sound.boing(2);
    later(() => { busy = false; scheduleHint(); }, reduceMotion ? 100 : 600);
  }

  /* ---------- Placing ---------- */
  function animateTo(p, x, y, s, ms, done) {
    const x0 = p.x, y0 = p.y, s0 = p.s, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const arc = Math.sin(k * Math.PI) * (ms > 300 ? -50 : 0);
      setT(p, x0 + (x - x0) * e, y0 + (y - y0) * e + arc, s0 + (s - s0) * e);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  }

  function place(p) {
    p.placed = true;
    clearHint();
    // keep the drawing order (walls behind roof behind windows)
    const after = [...gPlaced.children].find(c => pieces.find(q => q.g === c).z > p.z);
    gPlaced.insertBefore(p.g, after || null);
    animateTo(p, p.slot[0], p.slot[1], 1, reduceMotion ? 80 : 420, () => {
      p.g.classList.add('snap');
      placed++;
      Sound.run(() => {
        Sound.tone({ type: 'sine', f: [[0, 220], [0.08, 110]], dur: 0.12, vol: 0.3, attack: 0.003 });     // plonk
        Sound.noise({ dur: 0.08, vol: 0.12, filter: { type: 'lowpass', f: 900 } });
        Sound.marimba(hz(NOTES[(placed - 1) % NOTES.length]), 0.06, 0.26, 0.7);
      });
      const r = p.g.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, ['#ffd23d', '#ffffff', '#ff7eb6'], 8, Math.max(r.width, 60) * 0.7);
      if (placed === pieces.length) later(finish, 400);
      else scheduleHint();
    });
  }

  function goHome(p) {
    Sound.run(() => Sound.tone({ type: 'sine', f: [[0, 700], [0.25, 400]], dur: 0.25, vol: 0.1 }));
    animateTo(p, p.home[0], p.home[1], p.homeS, 300);
  }

  /* ---------- Done! ---------- */
  function finish() {
    busy = true;
    const r = svg.getBoundingClientRect();
    if (build.id === 'house') {
      svg.classList.add('lit');
      smoke(262, 78);
      [['dog', 135, 232], ['cat', 265, 232], ['rabbit', 200, 284]].forEach(([id, x, y], k) =>
        later(() => { const im = el('image', { href: Kit.animalSrc(id), x: x - 24, y: y - 26, width: 48, height: 48, class: 'resident' }, gFx); im.style.setProperty('--k', k); Sound.call(id); }, 400 + k * 450));
    } else if (build.id === 'barn') {
      svg.classList.add('open');
      [['cow', 92, 300], ['pig', 300, 306], ['chicken', 255, 312]].forEach(([id, x, y], k) =>
        later(() => { el('image', { href: Kit.animalSrc(id), x: x - 30, y: y - 40, width: 60, height: 60, class: 'resident' }, gFx); Sound.call(id); }, 300 + k * 500));
    } else {
      el('path', { class: 'flame', d: 'M-26 0 Q0 70 26 0 Q0 22 -26 0 Z', fill: '#ff9f43', stroke: '#2b1d5c', 'stroke-width': 4, transform: 'translate(200 296)' }, gPlaced);
      Sound.run(() => { Sound.noise({ dur: 2.4, vol: 0.2, attack: 0.6, filter: { type: 'lowpass', f: 700 }, to: 2500 }); Sound.slideUp(2); });
      later(() => svg.classList.add('launch'), 700);
    }
    later(() => {
      Sound.fanfare();
      fx.confetti(r.left + r.width * (wide ? 0.3 : 0.5), r.top + r.height * 0.25, 60);
      fx.floaties({ left: r.left, top: r.top, width: wide ? r.width * 0.6 : r.width, height: r.height * 0.6 }, reduceMotion ? 5 : 12);
    }, 1500);
    later(() => { svg.classList.remove('lit', 'open', 'launch'); newBuild(); }, 5200);
  }

  function smoke(x, y) {
    for (let k = 0; k < 6; k++) later(() => {
      const c = el('circle', { cx: x, cy: y, r: 10, class: 'puff', fill: '#fff' }, gFx);
      later(() => c.remove(), 2000);
    }, k * 380);
  }

  /* ---------- Drag (or tap) ---------- */
  function toSvg(e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  svg.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('.piece');
    const p = g && pieces.find(q => q.g === g);
    if (!p || p.placed || busy || drag) return;
    e.preventDefault();
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const at = toSvg(e);
    drag = { p, id: e.pointerId, dx: p.x - at.x, dy: p.y - at.y, sx: e.clientX, sy: e.clientY, moved: false };
    gTray.appendChild(g);           // on top
    g.classList.add('held');
    Sound.tap();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
    if (!drag.moved) return;
    const at = toSvg(e);
    setT(drag.p, at.x + drag.dx, at.y + drag.dy, Math.min(1, drag.p.s + 0.08));
    const near = Math.hypot(drag.p.x - drag.p.slot[0], drag.p.y - drag.p.slot[1]) < 70;
    gGhost.children[pieces.indexOf(drag.p)].classList.toggle('near', near);
  });
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { p, moved } = drag;
    drag = null;
    p.g.classList.remove('held');
    [...gGhost.children].forEach(c => c.classList.remove('near'));
    if (!moved) { place(p); return; }                        // a tap: it flies in by itself
    if (Math.hypot(p.x - p.slot[0], p.y - p.slot[1]) < 70) place(p);
    else goHome(p);
  }
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest && e.target.closest('.piece');
    const p = g && pieces.find(q => q.g === g);
    if (p && !p.placed && !busy && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); place(p); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || busy || e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') return;
    if (e.key.length !== 1) return;
    const p = pieces.find(q => !q.placed);
    if (p) place(p);
  });

  /* ---------- Hint: the next piece wiggles and its outline glows ---------- */
  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => {
      const p = pieces.find(q => !q.placed);
      if (p && !busy && !drag) {
        p.g.classList.remove('nudge'); void p.g.getBoundingClientRect(); p.g.classList.add('nudge');
        const gh = gGhost.children[pieces.indexOf(p)];
        gh.classList.add('near'); later(() => gh.classList.remove('near'), 1500);
        Sound.twinkle(0.07);
      }
      scheduleHint();
    }, 6000);
  }
  function clearHint() { clearTimeout(hintTimer); }

  let lastWide = null;
  addEventListener('resize', () => { const w = innerWidth > innerHeight * 1.15; if (w !== lastWide) { lastWide = w; layout(); } });

  Kit.setup({ id: 'build-house', how: () => {
    const p = pieces.find(q => !q.placed);
    if (!p) return [];
    const m = svg.getScreenCTM();
    return [{ drag: [p.g, { x: p.slot[0] * m.a + m.e, y: p.slot[1] * m.d + m.f }] }];
  } });
  newBuild();
  lastWide = wide;
})();
