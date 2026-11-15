/* ============ Trace the Letter! game logic ============
   A big letter made of fat "roads" with a dotted middle line. Drag a finger along it:
   a rainbow trail follows the finger and every bit of the letter it passes lights up,
   with little rising notes. When each stroke is (mostly) covered, it fills with colour;
   when the whole letter is done it bounces, its picture pops out (B is for Bear) and
   the next letter comes. Any order and any direction count. No losing.

   Letters are strokes in a 100 x 100 box: lists of points made with line() and arc().  */

(function () {
  'use strict';

  const { Sound, fx, rand, later, reduceMotion, hz } = window.Kit;
  const { LETTERS, ORDER } = window.ABC;

  /* ---------- Stroke shapes ---------- */
  function line(x1, y1, x2, y2) {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
    return Array.from({ length: n + 1 }, (_, k) => [x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]);
  }
  // Arc from angle a0 to a1 (degrees, 0 = right, 90 = down), either direction
  function arc(cx, cy, rx, ry, a0, a1) {
    const len = Math.abs(a1 - a0) / 180 * Math.PI * (rx + ry) / 2;
    const n = Math.max(4, Math.ceil(len / 2));
    return Array.from({ length: n + 1 }, (_, k) => {
      const a = (a0 + (a1 - a0) * k / n) * Math.PI / 180;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });
  }
  const join = (...parts) => parts.flat();

  const SHAPES = {
    A: [line(50, 12, 22, 88), line(50, 12, 78, 88), line(33, 60, 67, 60)],
    B: [line(28, 12, 28, 88), join(line(28, 12, 50, 12), arc(50, 31, 20, 19, -90, 90), line(50, 50, 28, 50)),
        join(line(28, 50, 53, 50), arc(53, 69, 22, 19, -90, 90), line(53, 88, 28, 88))],
    C: [arc(54, 50, 32, 38, -45, -315)],
    D: [line(28, 12, 28, 88), join(line(28, 12, 44, 12), arc(44, 50, 30, 38, -90, 90), line(44, 88, 28, 88))],
    E: [line(30, 12, 30, 88), line(30, 12, 70, 12), line(30, 50, 62, 50), line(30, 88, 70, 88)],
    F: [line(30, 12, 30, 88), line(30, 12, 70, 12), line(30, 50, 62, 50)],
    G: [arc(54, 50, 32, 38, -45, -315), join(line(56, 54, 77, 54), line(77, 54, 77, 76))],
    H: [line(28, 12, 28, 88), line(72, 12, 72, 88), line(28, 50, 72, 50)],
    I: [line(50, 12, 50, 88), line(34, 12, 66, 12), line(34, 88, 66, 88)],
    J: [line(40, 12, 78, 12), join(line(62, 12, 62, 66), arc(44, 66, 18, 21, 0, 180))],
    K: [line(30, 12, 30, 88), line(72, 12, 30, 56), line(44, 44, 74, 88)],
    L: [join(line(32, 12, 32, 88), line(32, 88, 72, 88))],
    M: [join(line(22, 88, 24, 12), line(24, 12, 50, 62), line(50, 62, 76, 12), line(76, 12, 78, 88))],
    N: [join(line(26, 88, 26, 12), line(26, 12, 74, 88), line(74, 88, 74, 12))],
    O: [arc(50, 50, 30, 38, -90, 270)],
    P: [line(30, 88, 30, 12), join(line(30, 12, 52, 12), arc(52, 32, 20, 20, -90, 90), line(52, 52, 30, 52))],
    Q: [arc(50, 48, 30, 36, -90, 270), line(58, 66, 80, 90)],
    R: [line(30, 88, 30, 12), join(line(30, 12, 52, 12), arc(52, 32, 20, 20, -90, 90), line(52, 52, 30, 52)), line(48, 52, 74, 88)],
    S: [join(arc(50, 31, 21, 19, -30, -270), arc(50, 69, 22, 19, -90, 150))],
    T: [line(22, 12, 78, 12), line(50, 12, 50, 88)],
    U: [join(line(28, 12, 28, 60), arc(50, 60, 22, 28, 180, 0), line(72, 60, 72, 12))],
    V: [join(line(24, 12, 50, 88), line(50, 88, 76, 12))],
    W: [join(line(14, 12, 30, 88), line(30, 88, 50, 36), line(50, 36, 70, 88), line(70, 88, 86, 12))],
    X: [line(26, 12, 74, 88), line(74, 12, 26, 88)],
    Y: [line(26, 12, 50, 50), join(line(74, 12, 50, 50), line(50, 50, 50, 88))],
    Z: [join(line(26, 12, 74, 12), line(74, 12, 26, 88), line(26, 88, 74, 88))]
  };

  const DONE = 0.82;     // a stroke counts when this much of it is covered
  const REACH = 8.5;     // how close (in letter units) the finger must pass
  const TRAIL = ['#ff5e4d', '#ff9f43', '#ffc93c', '#3dd68c', '#4fc3f7', '#b07cff', '#ff7eb6'];
  const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'];

  const $ = (id) => document.getElementById(id);
  const svg = $('trace');
  const board = $('board');
  const reward = $('reward');
  let i = 0;
  let strokes = [];        // [{ pts: [[x,y]...], hit: Set, done: bool, el }]
  let busy = false;
  let drawing = null;      // current trail path element
  let trailPts = [];
  let noteN = 0;
  let lastNote = 0;
  let hintTimer = 0;
  let guideAnim = null;

  const toD = (pts) => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent = svg) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  function build() {
    const l = ORDER[i];
    const color = LETTERS[l].color;
    svg.innerHTML = '';
    svg.setAttribute('aria-label', 'Letter ' + l + ' to trace');
    board.style.setProperty('--c', color);
    reward.className = 'reward';
    reward.innerHTML = '';
    const gRoad = el('g', { class: 'roads' });
    const gFill = el('g', { class: 'fills' });
    el('g', { class: 'trails' });
    const gDots = el('g', { class: 'dots' });
    strokes = SHAPES[l].map((pts) => {
      const d = toD(pts);
      el('path', { d, class: 'road-edge' }, gRoad);
      el('path', { d, class: 'road' }, gRoad);
      el('path', { d, class: 'mid' }, gRoad);
      const fill = el('path', { d, class: 'fill', stroke: color }, gFill);
      const len = fill.getTotalLength();
      fill.style.strokeDasharray = len;
      fill.style.strokeDashoffset = len;
      return { pts, hit: new Set(), done: false, fill, len };
    });
    // A green start dot on each stroke
    strokes.forEach((s, k) => {
      const [x, y] = s.pts[0];
      el('circle', { cx: x, cy: y, r: 4.4, class: 'start' + (k === 0 ? ' first' : '') }, gDots);
    });
    board.classList.remove('done');
    board.classList.add('enter');
    later(() => board.classList.remove('enter'), 450);
    busy = false;
    scheduleHint();
  }

  /* ---------- Tracing ---------- */
  function toSvg(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }

  function mark(p) {
    let fresh = 0;
    strokes.forEach((s) => {
      if (s.done) return;
      s.pts.forEach(([x, y], k) => {
        if (!s.hit.has(k) && Math.hypot(x - p.x, y - p.y) < REACH) { s.hit.add(k); fresh++; }
      });
      const frac = s.hit.size / s.pts.length;
      s.fill.style.strokeDashoffset = s.len * (1 - Math.min(1, frac / DONE) * 0.999);
      if (frac >= DONE) completeStroke(s);
    });
    if (fresh) {
      const now = performance.now();
      if (now - lastNote > 110) {
        lastNote = now;
        const n = NOTES[noteN++ % NOTES.length];
        Sound.run(() => Sound.musicBox(hz(n), 0, 0.12, 0.6));
      }
    }
  }

  function completeStroke(s) {
    s.done = true;
    s.fill.style.strokeDashoffset = 0;
    s.fill.classList.add('pop');
    Sound.run(() => { Sound.marimba(hz('C5'), 0, 0.22, 0.5); Sound.marimba(hz('G5'), 0.08, 0.22, 0.6); });
    if (strokes.every(x => x.done)) letterDone();
  }

  function letterDone() {
    busy = true;
    clearHint();
    const l = ORDER[i], d = LETTERS[l];
    board.classList.add('done');
    svg.querySelector('.trails').innerHTML = '';
    later(() => {
      reward.innerHTML = Kit.picImg(d.pic) + `<span class="w"><b>${d.word[0]}</b>${d.word.slice(1)}</span>`;
      reward.classList.add('show');
      Sound.fanfare();
      if (d.call) later(() => Sound.call(d.call), 800);
      const r = board.getBoundingClientRect();
      fx.confetti(r.left + r.width / 2, r.top + r.height * 0.4, 50, TRAIL);
      fx.floaties(r, reduceMotion ? 5 : 12);
    }, 300);
    later(() => next(1), 3600);
  }

  function next(dir) {
    clearHint();
    i = (i + dir + ORDER.length) % ORDER.length;
    Sound.boing(1);
    build();
  }

  svg.addEventListener('pointerdown', (e) => {
    if (busy || e.button > 0) return;
    e.preventDefault();
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    clearHint();
    const p = toSvg(e);
    trailPts = [[p.x, p.y]];
    drawing = el('path', { class: 'trail', stroke: TRAIL[Math.floor(rand(0, TRAIL.length))], d: toD(trailPts) }, svg.querySelector('.trails'));
    mark(p);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drawing || busy) return;
    const p = toSvg(e);
    const last = trailPts[trailPts.length - 1];
    if (Math.hypot(p.x - last[0], p.y - last[1]) < 0.8) return;
    trailPts.push([p.x, p.y]);
    drawing.setAttribute('d', toD(trailPts));
    mark(p);
  });
  const lift = () => {
    if (!drawing) return;
    const done = drawing;
    drawing = null;
    done.classList.add('fade');
    later(() => done.remove(), 1200);
    if (!busy) scheduleHint();
  };
  svg.addEventListener('pointerup', lift);
  svg.addEventListener('pointercancel', lift);

  $('prev').addEventListener('click', () => { if (!busy) next(-1); });
  $('next').addEventListener('click', () => { if (!busy) next(1); });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && LETTERS[k] && !busy) { i = ORDER.indexOf(k); Sound.boing(1); build(); }
    else if (e.key === 'ArrowRight' && !busy) next(1);
    else if (e.key === 'ArrowLeft' && !busy) next(-1);
  });

  /* ---------- Hint: a glowing dot runs along the next stroke ---------- */
  function hint() {
    const s = strokes.find(x => !x.done);
    if (!s || busy) return;
    const g = el('circle', { r: 4, class: 'guide' });
    const pts = s.pts;
    let k = 0;
    clearInterval(guideAnim);
    guideAnim = setInterval(() => {
      if (k >= pts.length) { clearInterval(guideAnim); g.remove(); return; }
      g.setAttribute('cx', pts[k][0]); g.setAttribute('cy', pts[k][1]);
      k += 1;
    }, 28);
    Sound.twinkle(0.07);
  }
  function scheduleHint() { clearHint(); hintTimer = setTimeout(() => { hint(); scheduleHint(); }, 6000); }
  function clearHint() { clearTimeout(hintTimer); }

  Kit.setup({ id: 'trace-letter', how: () => {
    const s = strokes.find(x => !x.done);
    if (!s) return [];
    const m = svg.getScreenCTM();
    return [{ path: s.pts.map(([x, y]) => ({ x: x * m.a + m.e, y: y * m.d + m.f })) }];
  } });
  build();
})();
