/* ============ Alphabet Zoo! game logic ============
   A big letter card (Bb). Tap it: the letter jumps to the corner and its picture pops
   out (B is for Bear) with the letter's own note and the animal's call. Tap again for
   the next letter. Arrows (or swipes) go back and forth; the A–Z strip jumps anywhere.
   On a keyboard, pressing a letter shows that letter. No words spoken, no losing.    */

(function () {
  'use strict';

  const { Sound, fx, later, reduceMotion, hz } = window.Kit;
  const { LETTERS, ORDER } = window.ABC;

  const $ = (id) => document.getElementById(id);
  const card = $('card');
  const strip = $('strip');
  let i = 0;
  let revealed = false;
  let busy = false;

  /* ---------- A–Z strip ---------- */
  ORDER.forEach((l, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = l;
    b.style.setProperty('--c', LETTERS[l].color);
    b.setAttribute('aria-label', 'Letter ' + l);
    b.addEventListener('click', () => go(k, true));
    strip.appendChild(b);
  });

  function word(l) {
    const w = LETTERS[l].word;
    return `<span class="first">${w[0]}</span>${w.slice(1)}`;
  }

  function render() {
    const l = ORDER[i];
    const d = LETTERS[l];
    card.style.setProperty('--c', d.color);
    card.dataset.state = revealed ? 'open' : 'closed';
    card.setAttribute('aria-label', revealed ? `${l} is for ${d.word}` : `Letter ${l}`);
    card.innerHTML = `
      <span class="big-letter" aria-hidden="true"><span class="up">${l}</span><span class="low">${l.toLowerCase()}</span></span>
      <span class="pic" aria-hidden="true">${Kit.picImg(d.pic)}</span>
      <span class="word" aria-hidden="true">${word(l)}</span>`;
    [...strip.children].forEach((b, k) => b.classList.toggle('on', k === i));
    strip.children[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function letterSound(l) {
    const d = LETTERS[l];
    Sound.run(() => {
      Sound.tone({ type: 'sine', f: [[0, 380], [0.22, 1100]], dur: 0.24, vol: 0.12, attack: 0.02, vib: { rate: 9, depth: 18 } });
      Sound.marimba(hz(d.note), 0.2, 0.28, 0.8);
      Sound.musicBox(hz(d.note) * 2, 0.34, 0.12, 0.8);
    });
    if (d.call) later(() => Sound.call(d.call), 650);
    else later(() => Sound.twinkle(0.1), 500);
  }

  function reveal() {
    revealed = true;
    render();
    letterSound(ORDER[i]);
    const r = card.getBoundingClientRect();
    later(() => fx.floaties({ left: r.left, top: r.top, width: r.width, height: r.height }, reduceMotion ? 3 : 8, ['⭐', '✨', '💛', '💖']), 250);
    if (ORDER[i] === 'Z') later(() => { Sound.fanfare(); fx.confetti(r.left + r.width / 2, r.top + r.height / 3, 60); }, 900);
  }

  function go(k, open) {
    if (busy) return;
    busy = true;
    const dir = k >= i ? 1 : -1;
    card.classList.add(dir > 0 ? 'out-left' : 'out-right');
    Sound.boing(1);
    later(() => {
      i = (k + ORDER.length) % ORDER.length;
      revealed = false;
      render();
      card.classList.remove('out-left', 'out-right');
      card.classList.add(dir > 0 ? 'in-right' : 'in-left');
      later(() => {
        card.classList.remove('in-right', 'in-left');
        busy = false;
        if (open) reveal();
      }, reduceMotion ? 50 : 320);
    }, reduceMotion ? 50 : 220);
  }

  function tapCard() {
    if (busy) return;
    if (!revealed) reveal();
    else go(i + 1, false);
  }

  card.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); tapCard(); });
  card.addEventListener('click', (e) => { if (e.detail === 0) tapCard(); });
  $('prev').addEventListener('click', () => go(i - 1, false));
  $('next').addEventListener('click', () => go(i + 1, false));

  // Swipe left / right on the card area
  let sx = null;
  $('stage').addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  $('stage').addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    sx = null;
    if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1), false);
  });

  // Keyboard: letters jump to that letter, arrows move, space/enter taps
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && LETTERS[k]) { e.preventDefault(); if (ORDER[i] === k && !revealed) reveal(); else go(ORDER.indexOf(k), true); }
    else if (e.key === 'ArrowRight') go(i + 1, false);
    else if (e.key === 'ArrowLeft') go(i - 1, false);
  });

  Kit.setup({ id: 'alphabet-zoo', how: () => [{ tap: card }, { tap: card }] });
  render();
})();
