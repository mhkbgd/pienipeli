/* ============ Pienipeli: landing page ============
   A few poppable balloons float through the hero, a small taste of Baby Pop. */

(() => {
  'use strict';

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const layer = document.getElementById('heroBalloons');
  if (!layer) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PALETTES = [
    ['#ffe3ef', '#ffa6cb', '#f77fb0'],
    ['#e0f2ff', '#8ecbff', '#62aef0'],
    ['#fffbd0', '#ffe27a', '#f5c94a'],
    ['#efe4ff', '#c6a8ff', '#a583f0'],
    ['#dcfbec', '#9fe8c3', '#6fd3a2'],
  ];
  const BITS = ['⭐', '✨', '💖', '💛', '💫'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const count = () => (innerWidth < 600 ? 3 : 5);

  function spawn(midFlight) {
    const h = layer.clientHeight;
    const size = Math.round(rand(56, 84));
    const dur = rand(14, 22);
    const [c1, c2, c3] = pick(PALETTES);

    const el = document.createElement('div');
    el.className = 'hb';
    el.style.cssText =
      `--size:${size}px;--c1:${c1};--c2:${c2};--c3:${c3};--h:${h}px;` +
      `--dur:${dur}s;--delay:${midFlight ? -rand(0, dur * 0.85) : 0}s;--sd:${-rand(0, 4)}s;`;
    // Keep balloons mostly to the right on wide screens so the headline stays readable
    const minX = innerWidth > 900 ? 0.5 : 0.05;
    el.style.left = rand(layer.clientWidth * minX, layer.clientWidth - size - 10) + 'px';
    el.innerHTML = '<div class="sway"><div class="balloon"><i class="face"></i></div><span class="string"></span></div>';

    el.addEventListener('animationend', e => { if (e.animationName === 'rise') { el.remove(); spawn(false); } });
    el.querySelector('.balloon').addEventListener('pointerdown', e => {
      e.preventDefault();
      pop(el);
    });
    layer.appendChild(el);
  }

  function pop(el) {
    if (el.classList.contains('popped')) return;
    const b = el.querySelector('.balloon').getBoundingClientRect();
    const box = layer.getBoundingClientRect();
    const x = b.left - box.left + b.width / 2;
    const y = b.top - box.top + b.height / 2;
    el.classList.add('popped');
    setTimeout(() => { el.remove(); setTimeout(() => spawn(false), 1200); }, 300);

    for (let i = 0; i < 9; i++) {
      const s = document.createElement('span');
      const a = (i / 9) * Math.PI * 2;
      const d = rand(40, 80);
      s.className = 'spark';
      s.textContent = pick(BITS);
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.addEventListener('animationend', () => s.remove());
      layer.appendChild(s);
    }
  }

  for (let i = 0; i < count(); i++) spawn(true);
})();
