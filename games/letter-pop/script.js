/* ============ Letter Pop! game logic ============
   Balloons with letters float up the sky. Tap one: it pops in sparkles, the letter
   shows big in the middle with its picture (B is for Bear) and its own note plays.
   On a keyboard, every letter key pops a balloon with that letter. No losing.       */

(function () {
  'use strict';

  const { Sound, fx, rand, bag, later, reduceMotion, hz } = window.Kit;
  const { LETTERS, ORDER } = window.ABC;

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const flash = $('flash');
  const nextLetter = bag(ORDER);
  const max = () => (innerWidth < 600 ? 5 : 7);
  let flashTimer = 0;

  function spawn(letter, midFlight) {
    const l = letter || nextLetter();
    const d = LETTERS[l];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'balloon';
    b.dataset.l = l;
    b.setAttribute('aria-label', 'Balloon ' + l);
    const size = Math.round(Math.min(innerWidth, innerHeight) * rand(0.2, 0.26));
    const dur = rand(9, 14);
    b.style.cssText = `--c:${d.color};--size:${size}px;--dur:${dur}s;--delay:${midFlight ? -rand(0, dur * 0.8) : 0}s;--sway:${rand(2.5, 4)}s;` +
      `left:${rand(4, 96 - size / innerWidth * 100)}%`;
    b.innerHTML = `<span class="skin"><span class="ltr">${l}</span></span><span class="string"></span>`;
    b.addEventListener('animationend', (e) => {
      if (e.animationName !== 'rise') return;
      b.remove();
      top();
    });
    stage.appendChild(b);
    return b;
  }
  function top() { while (stage.querySelectorAll('.balloon:not(.popped)').length < max()) spawn(null, false); }

  function pop(b) {
    if (!b || b.classList.contains('popped')) return;
    b.classList.add('popped');
    const l = b.dataset.l, d = LETTERS[l];
    const r = b.querySelector('.skin').getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, [d.color, '#fff', '#ffd23d'], 14, r.width * 0.9);
    Sound.run(() => {
      Sound.noise({ dur: 0.12, vol: 0.18, filter: { type: 'highpass', f: 1500 } });
      Sound.tone({ type: 'sine', f: [[0, 900], [0.08, 300]], dur: 0.1, vol: 0.18, attack: 0.002 });
      Sound.marimba(hz(d.note), 0.08, 0.26, 0.8);
      Sound.musicBox(hz(d.note) * 2, 0.2, 0.1, 0.7);
    });
    later(() => b.remove(), 300);
    later(top, 700);
    show(l);
  }

  function show(l) {
    const d = LETTERS[l];
    clearTimeout(flashTimer);
    flash.style.setProperty('--c', d.color);
    flash.innerHTML = `<div class="card"><span class="big">${l}${l.toLowerCase()}</span>${Kit.picImg(d.pic, 'pic')}<span class="w"><b>${d.word[0]}</b>${d.word.slice(1)}</span></div>`;
    flash.setAttribute('aria-label', `${l} is for ${d.word}`);
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
    if (d.call) later(() => Sound.call(d.call), 450);
    flashTimer = setTimeout(() => flash.classList.remove('show'), 1900);
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const b = e.target.closest('.balloon');
    if (b) { e.preventDefault(); pop(b); return; }
    // Tap the empty sky: a new balloon right there
    const nb = spawn(null, false);
    nb.style.left = Math.max(0, e.clientX - nb.offsetWidth / 2) + 'px';
    Sound.tap();
  });
  stage.addEventListener('click', (e) => { if (e.detail === 0) pop(e.target.closest('.balloon')); });

  // Keyboard: a letter key pops a balloon with that letter (making one if needed)
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toUpperCase();
    if (k.length !== 1) return;
    const l = LETTERS[k] ? k : ORDER[Math.floor(rand(0, ORDER.length))];
    const b = [...stage.querySelectorAll('.balloon:not(.popped)')].find(x => x.dataset.l === l) || spawn(l, true);
    pop(b);
  });

  Kit.setup({ id: 'letter-pop', how: () => {
    const b = [...stage.querySelectorAll('.balloon:not(.popped) .skin')].find(s => { const r = s.getBoundingClientRect(); return r.top > 90 && r.bottom < innerHeight - 40; });
    return b ? [{ tap: b }] : [];
  } });
  for (let k = 0; k < max(); k++) spawn(null, !reduceMotion);
})();
