/* ============ Tilt Track! game logic ============
   A little car drives up a winding road. Steer by tilting the phone/tablet, by holding
   a finger on the left or right side (or dragging), or with the arrow keys. Stars on
   the road play a note when collected; every 10 stars there's a little party.
   Driving onto the grass just slows the car down with a bumpy rumble: no crashing,
   no losing, no end. The GO! button asks for motion access on iPhone (one tap).     */

(function () {
  'use strict';

  const { Sound, fx, rand, later, reduceMotion, hz } = window.Kit;

  const $ = (id) => document.getElementById(id);
  const canvas = $('road');
  const ctx = canvas.getContext('2d');
  const countEl = $('starsCount');
  const startBtn = $('startBtn');
  const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'];
  const CAR_COLORS = ['#ff5e4d', '#4fc3f7', '#b07cff', '#ff9f43'];

  let W = 0, H = 0, dpr = 1;
  let dist = 0;                 // how far we've driven (px)
  let carX = 0, carVX = 0;
  let steer = 0;                // -1 .. 1 from input
  let tilt = null;              // tilt steering when available
  let running = false, last = 0, raf = 0;
  let stars = [], nextStarAt = 300, collected = 0;
  let driver = null, carColor = CAR_COLORS[0];
  let bumpT = 0;

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!carX) carX = W / 2;
    draw();
  }

  /* ---------- The road ---------- */
  const roadW = () => Math.max(150, Math.min(W * 0.46, 360));
  const amp = () => Math.max(0, (W - roadW()) / 2 - 20);
  // Road centre at a given distance along the road
  const centerAt = (d) => W / 2 + amp() * (0.62 * Math.sin(d / 520) + 0.38 * Math.sin(d / 230 + 1.3));
  // Screen y -> distance: the car sits at 72% height; things above it are further along
  const carY = () => H * 0.72;
  const distAtY = (y) => dist + (carY() - y);

  function draw() {
    // grass with soft stripes
    ctx.fillStyle = '#8fe0a3';
    ctx.fillRect(0, 0, W, H);
    const stripe = 120;
    ctx.fillStyle = '#82d896';
    // stripes are fixed to the ground, so they slide down as the car drives up
    for (let y = ((carY() + dist) % (stripe * 2)) - stripe * 2; y < H; y += stripe * 2) ctx.fillRect(0, y, W, stripe);

    // flowers and trees beside the road (fixed to the road, scroll with it)
    for (let y = H + 60; y > -60; y -= 8) {
      const d = Math.round(distAtY(y));
      if (d % 160 > 7) continue;
      const seed = Math.floor(d / 160);
      const side = seed % 2 ? 1 : -1;
      const x = centerAt(d) + side * (roadW() / 2 + 34 + (seed * 37) % 60);
      if (x < -40 || x > W + 40) continue;
      if (seed % 3 === 0) tree(x, y); else flower(x, y, ['#ff7eb6', '#ffc93c', '#fff', '#b07cff'][seed % 4]);
    }

    // road: dark edge, grey road, white edges, dashed middle
    const rw = roadW();
    const strip = (offset, color, lw) => {
      ctx.beginPath();
      for (let y = -20; y <= H + 20; y += 10) {
        const x = centerAt(distAtY(y)) + offset;
        if (y === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strip(0, '#2b1d5c', rw + 12);
    strip(0, '#7b7b98', rw);
    strip(-rw / 2 + 8, '#ffffff', 5);
    strip(rw / 2 - 8, '#ffffff', 5);
    ctx.setLineDash([26, 26]);
    ctx.lineDashOffset = -dist;
    strip(0, '#ffe27a', 6);
    ctx.setLineDash([]);

    // stars
    stars.forEach(s => {
      const y = carY() - (s.d - dist);
      if (y < -40 || y > H + 40 || s.got) return;
      star(centerAt(s.d) + s.off, y, 20 + Math.sin(performance.now() / 180 + s.d) * 2);
    });

    // the car (top view) with the animal driver
    car(carX, carY());
  }

  function tree(x, y) {
    ctx.fillStyle = '#8a5a35'; ctx.fillRect(x - 5, y, 10, 18);
    ctx.beginPath(); ctx.arc(x, y - 6, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#3dbb6b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b1d5c'; ctx.stroke();
  }
  function flower(x, y, c) {
    ctx.fillStyle = c;
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd23d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b1d5c'; ctx.stroke();
  }
  function car(x, y) {
    const w = 64, h = 96;
    const tiltA = Math.max(-0.35, Math.min(0.35, carVX / 900));
    const bump = bumpT > 0 ? Math.sin(performance.now() / 30) * 2 : 0;
    ctx.save();
    ctx.translate(x + bump, y);
    ctx.rotate(tiltA);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(-w / 2 + 4, -h / 2 + 8, w, h, 20); ctx.fill();
    ctx.fillStyle = '#2b1d5c';
    [[-w / 2 - 6, -h / 2 + 12], [w / 2 - 6, -h / 2 + 12], [-w / 2 - 6, h / 2 - 34], [w / 2 - 6, h / 2 - 34]].forEach(([wx, wy]) => { rr(wx, wy, 12, 22, 5); ctx.fill(); });
    ctx.fillStyle = carColor; rr(-w / 2, -h / 2, w, h, 20); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#2b1d5c'; ctx.stroke();
    ctx.fillStyle = '#dff4ff'; rr(-w / 2 + 10, -h / 2 + 10, w - 20, 18, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(-w / 2 + 12, -h / 2 + 4, 5, 0, Math.PI * 2); ctx.arc(w / 2 - 12, -h / 2 + 4, 5, 0, Math.PI * 2); ctx.fill();
    if (driver) ctx.drawImage(driver, -30, -18, 60, 60);
    ctx.restore();
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  /* ---------- Game loop ---------- */
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const rw = roadW();
    const center = centerAt(dist);
    const offRoad = Math.abs(carX - center) > rw / 2 - 10;
    const speed = H * (offRoad ? 0.22 : 0.42);
    dist += speed * dt;

    // steering: tilt if we have it, otherwise touch/keys
    const s = tilt !== null && Math.abs(steer) < 0.01 ? tilt : steer;
    // Helping hand: with no steering, the car drifts gently back towards the road
    const assist = Math.abs(s) < 0.05 ? (center - carX) * 1.4 : 0;
    const targetV = s * W * 0.9 + assist;
    carVX += (targetV - carVX) * Math.min(1, dt * 6);
    carX = Math.max(30, Math.min(W - 30, carX + carVX * dt));

    if (offRoad) {
      bumpT = 0.2;
      if (Math.random() < dt * 6) Sound.run(() => Sound.noise({ dur: 0.08, vol: 0.05, filter: { type: 'lowpass', f: 300 } }));
    } else bumpT = Math.max(0, bumpT - dt);

    // stars ahead
    while (nextStarAt < dist + H) {
      stars.push({ d: nextStarAt, off: rand(-rw * 0.22, rw * 0.22), got: false });
      nextStarAt += rand(170, 280);
    }
    stars = stars.filter(st => st.d > dist - H);
    stars.forEach(st => {
      if (st.got) return;
      const dy = st.d - dist, dx = centerAt(st.d) + st.off - carX;
      // generous catch zone: little drivers don't have to be exact
      if (Math.abs(dy) < 50 && Math.abs(dx) < 64) collect(st, centerAt(st.d) + st.off, carY() - dy);
    });

    draw();
    raf = requestAnimationFrame(tick);
  }

  function collect(st, x, y) {
    st.got = true;
    const n = NOTES[collected % NOTES.length];
    collected++;
    countEl.querySelector('b').textContent = collected;
    countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    Sound.run(() => { Sound.musicBox(hz(n), 0, 0.2, 0.7); Sound.tone({ type: 'sine', f: [[0, hz(n) * 2]], at: 0.06, dur: 0.2, vol: 0.05, attack: 0.003, decay: true }); });
    fx.burst(x, y, ['#ffd23d', '#ffffff', '#ff7eb6'], 10, 60);
    if (collected % 10 === 0) {
      later(() => { Sound.fanfare(); fx.confetti(W / 2, H * 0.3, 60); fx.floaties({ left: 0, top: H * 0.2, width: W, height: H * 0.5 }, reduceMotion ? 5 : 12, ['⭐', '🌟', '✨', '💛']); }, 200);
    }
  }

  /* ---------- Input ---------- */
  // Touch/mouse: hold left or right of the car, or drag
  const held = new Map();
  function updateSteer() {
    if (!held.size) { steer = 0; return; }
    const x = [...held.values()].pop();
    const d = (x - carX) / (W * 0.25);
    steer = Math.max(-1, Math.min(1, d));
  }
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); held.set(e.pointerId, e.clientX); updateSteer(); });
  canvas.addEventListener('pointermove', (e) => { if (held.has(e.pointerId)) { held.set(e.pointerId, e.clientX); updateSteer(); } });
  const up = (e) => { held.delete(e.pointerId); updateSteer(); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', up);
  const keys = new Set();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
      keys.add(e.key); e.preventDefault();
      steer = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
    } else if (!running && (e.key === 'Enter' || e.key === ' ')) start();
  });
  document.addEventListener('keyup', (e) => {
    keys.delete(e.key);
    steer = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
  });

  // Tilt: left/right lean of the device, whichever way the screen is turned
  function onTilt(e) {
    if (e.gamma === null || e.beta === null) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let lean = e.gamma;
    if (angle === 90) lean = e.beta;
    else if (angle === -90 || angle === 270) lean = -e.beta;
    else if (angle === 180) lean = -e.gamma;
    tilt = Math.max(-1, Math.min(1, lean / 22));
    if (Math.abs(tilt) < 0.08) tilt = 0;
  }
  async function enableTilt() {
    if (typeof DeviceOrientationEvent === 'undefined') return;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();   // iPhone/iPad: needs this tap
        if (r !== 'granted') return;
      }
      addEventListener('deviceorientation', onTilt);
    } catch (err) { /* no tilt: touch and keys still work */ }
  }

  async function start() {
    if (running) return;
    running = true;
    startBtn.hidden = true;
    Sound.unlock();
    Sound.run(() => Sound.melody([['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 1]], { bpm: 220, voice: Sound.marimba }));
    enableTilt();
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  startBtn.addEventListener('click', start);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (running) { last = performance.now(); raf = requestAnimationFrame(tick); }
  });
  addEventListener('resize', resize);

  Kit.setup({ id: 'tilt-track', how: () => running
    ? [{ tap: { x: innerWidth * 0.8, y: innerHeight * 0.7 } }, { tap: { x: innerWidth * 0.2, y: innerHeight * 0.7 } }]
    : [{ tap: startBtn }] });
  const pick = ['dog', 'cat', 'rabbit', 'panda', 'monkey', 'pig', 'frog', 'lion'];
  carColor = CAR_COLORS[Math.floor(rand(0, CAR_COLORS.length))];
  Kit.loadAnimal(pick[Math.floor(rand(0, pick.length))]).then(img => { driver = img; draw(); }, () => {});
  resize();
})();
