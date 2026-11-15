/* ============ Bedtime! game logic ============
   Night has come. Three sleepy animals (small, medium, big) wait at the top and three
   beds (small, medium, big) wait below. Drag an animal into the bed that fits it:
   it snuggles in, the blanket goes on, 💤 float up and a phrase of a lullaby plays.
   The wrong bed: the animal pops back out with a funny "boing" and the right bed glows.
   (Can't drag yet? Tap an animal, then tap a bed.)
   All three asleep: the lights dim, stars twinkle and the whole lullaby plays on a
   music box. Then the sun comes up, everyone wakes and new sleepy friends arrive.
   No words, no scores, no timer, no losing.                                         */

(function () {
  'use strict';

  const { Sound, fx, rand, pick, shuffle, bag, later, centerOf, reduceMotion, hz } = window.Kit;

  // Trios: small, medium, big. Some are one family in three sizes, some are friends.
  // Pictures from the shared library (assets/animals/<id>.svg); each id is also its call
  const TRIOS = [
    ['bear', 'bear', 'bear'],
    ['mouse', 'cat', 'elephant'],
    ['rabbit', 'rabbit', 'rabbit'],
    ['chicken', 'dog', 'cow'],
    ['panda', 'panda', 'panda'],
    ['duck', 'pig', 'lion'],
    ['frog', 'frog', 'frog'],
    ['penguin', 'fox', 'horse'],
    ['monkey', 'zebra', 'giraffe']
  ];
  const nextTrio = bag(TRIOS);
  const SIZES = ['s', 'm', 'l'];
  const QUILTS = ['#ff9fc0', '#9fd8ff', '#b8f0a8', '#ffd37a', '#c9a8ff', '#ffb38a'];

  // Brahms' Lullaby (public domain), in phrases. One phrase per animal tucked in,
  // the whole tune when everyone is asleep. [note, beats]
  const LULLABY = [
    [['E4', .5], ['E4', .5], ['G4', 2], ['E4', .5], ['E4', .5], ['G4', 2]],
    [['E4', .5], ['G4', .5], ['C5', 1], ['B4', 1.5], ['A4', .5], ['A4', 1], ['G4', 1]],
    [['D4', .5], ['E4', .5], ['F4', 1], ['D4', 1], ['D4', .5], ['E4', .5], ['F4', 2]],
    [['D4', .5], ['F4', .5], ['B4', .5], ['A4', .5], ['G4', 1], ['B4', 1], ['C5', 2.5]]
  ];

  const $ = (id) => document.getElementById(id);
  const scene = $('scene');
  const waitEl = $('wait');
  const bedsEl = $('beds');
  const night = $('night');

  let busy = true;
  let asleep = 0;
  let phrase = 0;
  let selected = null;     // tap-to-pick: the animal waiting for a bed
  let drag = null;         // { el, id, dx, dy, startX, startY, moved }
  let hintTimer = 0;

  /* ---------- Drawing a bed (SVG, 200 x 140 box) ---------- */
  function bedSVG(quilt) {
    return `<svg class="bed-art" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      <rect x="8" y="34" width="20" height="100" rx="8" fill="#c98b5b"/>
      <rect x="172" y="64" width="20" height="70" rx="8" fill="#c98b5b"/>
      <circle cx="18" cy="34" r="12" fill="#e0a774"/>
      <circle cx="182" cy="64" r="12" fill="#e0a774"/>
      <rect x="20" y="86" width="160" height="30" rx="10" fill="#fff6ea"/>
      <rect x="20" y="108" width="160" height="16" rx="6" fill="#b5784a"/>
      <ellipse class="pillow" cx="56" cy="84" rx="30" ry="15" fill="#ffffff" stroke="#efe3d3" stroke-width="3"/>
    </svg>
    <svg class="quilt" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      <path d="M62,80 Q120,66 178,80 L180,112 Q120,122 60,112 Z" fill="${quilt}"/>
      <path d="M62,80 Q120,66 178,80 L178,90 Q120,78 62,90 Z" fill="#fff" opacity=".5"/>
      <g fill="#fff" opacity=".55"><circle cx="96" cy="100" r="5"/><circle cx="126" cy="96" r="4"/><circle cx="154" cy="102" r="5"/></g>
    </svg>`;
  }

  /* ---------- Sounds made for this game ---------- */
  const lullabyVoice = (f, at, vol, len) => Sound.musicBox(f, at, 0.2, Math.min(2.2, len));
  function playPhrase(i) {
    Sound.run(() => Sound.melody(LULLABY[i % LULLABY.length], { bpm: 132, voice: lullabyVoice }));
  }
  // Returns the tune's length in seconds (the same when muted, so the scene keeps its pace)
  function playLullaby() {
    const BPM = 138;
    const len = LULLABY.flat().reduce((s, [, beats]) => s + beats, 0) * 60 / BPM;
    Sound.run(() => {
      let t = 0;
      LULLABY.forEach((p) => { t += Sound.melody(p, { bpm: BPM, voice: lullabyVoice, at: t }); });
      // soft chord pad underneath
      [['C3', 0], ['G3', 0], ['G2', len * 0.5], ['D3', len * 0.5]].forEach(([n, at]) =>
        Sound.tone({ type: 'sine', f: [[0, hz(n)]], at, dur: len * 0.5, vol: 0.06, attack: 0.6, release: 0.8 }));
    });
    return len;
  }
  function yawn() {
    Sound.run(() => Sound.tone({ type: 'sine', f: [[0, 420], [0.3, 620], [0.9, 300]], dur: 1, vol: 0.14, attack: 0.1, release: 0.4, vib: { rate: 5, depth: 8 } }));
  }
  function snore(at = 0) {
    Sound.run(() => {
      Sound.noise({ at, dur: 0.9, vol: 0.05, attack: 0.4, filter: { type: 'lowpass', f: 500 } });
      Sound.tone({ type: 'sine', f: [[0, 600], [0.8, 900]], at: at + 1.0, dur: 0.6, vol: 0.04, attack: 0.2, release: 0.3 });
    });
  }
  function boingBack() {
    Sound.run(() => {
      Sound.tone({ type: 'sine', f: [[0, 200], [0.15, 700], [0.3, 300]], dur: 0.32, vol: 0.18, vib: { rate: 20, depth: 30 } });
      Sound.tone({ type: 'sine', f: [[0, 520], [0.12, 470]], at: 0.4, dur: 0.16, vol: 0.12 });
      Sound.tone({ type: 'sine', f: [[0, 470], [0.16, 620]], at: 0.58, dur: 0.2, vol: 0.12 });
    });
  }
  function morning() {
    Sound.run(() => {
      Sound.melody([['C5', .5], ['E5', .5], ['G5', .5], ['C6', 1]], { bpm: 180, voice: Sound.marimba });
      Sound.rep(3, 0.18, (at) => Sound.tone({ type: 'sine', f: [[0, 2400], [0.08, 3200], [0.12, 2700]], at: 0.9 + at, dur: 0.13, vol: 0.12 }));
    });
  }

  /* ---------- Rounds ---------- */
  function newRound() {
    busy = true;
    asleep = 0;
    phrase = 0;
    selected = null;
    clearHint();
    scene.classList.remove('sleep', 'morning');
    const trio = nextTrio();
    const quilts = shuffle(QUILTS);

    // Beds in size order (left to right), animals in a shuffled order
    bedsEl.innerHTML = '';
    SIZES.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bed size-' + s;
      b.dataset.size = s;
      b.setAttribute('aria-label', ['Small bed', 'Middle bed', 'Big bed'][i]);
      b.innerHTML = bedSVG(quilts[i]) + '<span class="sleeper emoji" aria-hidden="true"></span><span class="zzz" aria-hidden="true">💤</span>';
      bedsEl.appendChild(b);
    });

    waitEl.innerHTML = '';
    shuffle([0, 1, 2]).forEach((i, k) => {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'critter emoji size-' + SIZES[i];
      a.dataset.size = SIZES[i];
      a.style.setProperty('--k', k);
      a.setAttribute('aria-label', ['Small animal', 'Middle animal', 'Big animal'][i]);
      a.innerHTML = Kit.animalImg(trio[i]);
      a._call = trio[i];
      waitEl.appendChild(a);
      if (!reduceMotion) {
        a.animate([{ translate: '0 -60vh', scale: '.6' }, { translate: '0 0', scale: '1' }],
          { duration: 700, delay: k * 150, easing: 'cubic-bezier(.3, 1.6, .5, 1)', fill: 'backwards' });
      }
    });
    Sound.boing(3);
    later(() => {
      bedsEl.querySelectorAll('.bed').forEach((b) => b.classList.add('in'));
      busy = false;
      scheduleHint();
    }, reduceMotion ? 200 : 900);
  }

  function bedFor(size) { return bedsEl.querySelector(`.bed[data-size="${size}"]`); }

  function tuckIn(critter, bed) {
    busy = true;
    clearHint();
    deselect();
    const from = centerOf(critter);
    const sleeper = bed.querySelector('.sleeper');
    sleeper.innerHTML = critter.innerHTML;
    const to = centerOf(sleeper);
    critter.style.visibility = 'hidden';
    critter.classList.add('done');
    bed.classList.add('taken', 'tuck');
    sleeper.animate([
      { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.h / to.h})` },
      { transform: `translate(${(from.x - to.x) * 0.4}px, ${(from.y - to.y) * 0.4 - 60}px) scale(${(from.h / to.h + 1) / 2}) rotate(-10deg)`, offset: 0.5 },
      { transform: 'none' }
    ], { duration: reduceMotion ? 200 : 650, easing: 'cubic-bezier(.3, .9, .4, 1)' });
    Sound.slideDown(0.5);
    later(() => {
      bed.classList.add('asleep');
      bed.setAttribute('aria-label', bed.getAttribute('aria-label') + ', asleep');
      yawn();
      later(() => playPhrase(phrase++), 700);
      const c = centerOf(bed);
      fx.floaties({ left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h }, reduceMotion ? 3 : 6, ['⭐', '✨', '💛', '🌙']);
      asleep++;
      if (asleep === 3) later(allAsleep, 2600);
      else later(() => { busy = false; scheduleHint(); }, 900);
    }, reduceMotion ? 200 : 650);
  }

  function popBack(critter, bed) {
    busy = true;
    deselect();
    boingBack();
    if (bed) {
      bed.classList.remove('nope');
      void bed.offsetWidth;
      bed.classList.add('nope');
      bed.addEventListener('animationend', () => bed.classList.remove('nope'), { once: true });
    }
    critter.style.transition = 'transform .45s cubic-bezier(.3, 1.5, .5, 1)';
    critter.style.transform = '';
    later(() => {
      critter.style.transition = '';
      busy = false;
      glow(bedFor(critter.dataset.size));
      scheduleHint();
    }, 450);
  }

  function allAsleep() {
    scene.classList.add('sleep');
    snore(0.2);
    const len = playLullaby();
    later(() => { if (scene.classList.contains('sleep')) snore(); }, len * 500);
    const r = night.getBoundingClientRect();
    later(() => fx.floaties({ left: r.left, top: r.top + r.height * 0.1, width: r.width, height: r.height * 0.4 }, reduceMotion ? 4 : 10, ['⭐', '✨', '🌟']), 1200);
    later(() => {
      scene.classList.remove('sleep');
      scene.classList.add('morning');
      morning();
      bedsEl.querySelectorAll('.bed').forEach((b) => b.classList.add('wake'));
    }, len * 1000 + 800);
    later(() => {
      bedsEl.querySelectorAll('.bed').forEach((b) => b.classList.add('away'));
      Sound.boing(2);
    }, len * 1000 + 2600);
    later(newRound, len * 1000 + 3200);
  }

  /* ---------- Dragging ---------- */
  function bedAt(x, y) {
    let best = null, bestD = Infinity;
    bedsEl.querySelectorAll('.bed:not(.taken)').forEach((b) => {
      const r = b.getBoundingClientRect();
      const pad = r.width * 0.15;
      if (x > r.left - pad && x < r.right + pad && y > r.top - pad * 2 && y < r.bottom + pad) {
        const c = centerOf(b);
        const d = Math.hypot(c.x - x, c.y - y);
        if (d < bestD) { bestD = d; best = b; }
      }
    });
    return best;
  }

  waitEl.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.critter');
    if (!c || c.classList.contains('done') || busy || drag) return;
    e.preventDefault();
    clearHint();
    try { c.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    drag = { el: c, id: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false };
    c.classList.add('held');
    c.style.transition = '';
    Sound.tap();
  });

  waitEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 12) drag.moved = true;
    if (!drag.moved) return;
    drag.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
    const over = bedAt(e.clientX, e.clientY);
    bedsEl.querySelectorAll('.bed').forEach((b) => b.classList.toggle('over', b === over));
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, moved } = drag;
    drag = null;
    el.classList.remove('held');
    bedsEl.querySelectorAll('.bed').forEach((b) => b.classList.remove('over'));
    if (!moved) {
      // A tap: pick this animal, then tap a bed
      el.style.transform = '';
      if (selected === el) { deselect(); return; }
      select(el);
      return;
    }
    const bed = e.type === 'pointerup' ? bedAt(e.clientX, e.clientY) : null;
    if (!bed) {
      el.style.transition = 'transform .4s cubic-bezier(.3, 1.5, .5, 1)';
      el.style.transform = '';
      later(() => { el.style.transition = ''; }, 400);
      scheduleHint();
    } else if (bed.dataset.size === el.dataset.size) tuckIn(el, bed);
    else popBack(el, bed);
  }
  waitEl.addEventListener('pointerup', endDrag);
  waitEl.addEventListener('pointercancel', endDrag);

  /* ---------- Tap an animal, then tap a bed ---------- */
  function select(el) {
    deselect();
    selected = el;
    el.classList.add('picked');
    Sound.call(el._call);
    glow(bedFor(el.dataset.size), true);
    scheduleHint();
  }
  function deselect() {
    if (selected) selected.classList.remove('picked');
    selected = null;
  }
  function onBed(bed) {
    if (!bed || busy) return;
    if (bed.classList.contains('taken')) {
      // Tap a sleeping animal: a gentle snore and some z's
      snore();
      const c = centerOf(bed);
      fx.rise(c.x, c.y - c.h * 0.3, '💤', { size: 38 });
      return;
    }
    if (!selected) {
      bed.classList.remove('nope'); void bed.offsetWidth; bed.classList.add('nope');
      bed.addEventListener('animationend', () => bed.classList.remove('nope'), { once: true });
      Sound.hmm();
      return;
    }
    const c = selected;
    if (bed.dataset.size === c.dataset.size) {
      // hop over to the bed, then tuck in
      tuckIn(c, bed);
    } else {
      const from = centerOf(c), to = centerOf(bed);
      c.style.transition = 'transform .3s ease-out';
      c.style.transform = `translate(${(to.x - from.x) * 0.5}px, ${(to.y - from.y) * 0.5}px)`;
      busy = true;
      later(() => { busy = false; popBack(c, bed); }, 300);
    }
  }
  bedsEl.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const b = e.target.closest('.bed');
    if (!b) return;
    e.preventDefault();
    onBed(b);
  });
  waitEl.addEventListener('click', (e) => {
    // Keyboard: Enter/Space on an animal picks it
    const c = e.target.closest('.critter');
    if (c && e.detail === 0 && !busy && !c.classList.contains('done')) select(c);
  });
  bedsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.bed');
    if (b && e.detail === 0) onBed(b);
  });

  /* ---------- Hints ---------- */
  function glow(bed, quiet) {
    if (!bed) return;
    bed.classList.remove('glow');
    void bed.offsetWidth;
    bed.classList.add('glow');
    if (!quiet) Sound.twinkle();
    bed.addEventListener('animationend', (ev) => { if (ev.animationName === 'bedGlow') bed.classList.remove('glow'); });
  }
  function hint() {
    if (busy || drag) return;
    const awake = [...waitEl.querySelectorAll('.critter:not(.done)')];
    if (!awake.length) return;
    const c = selected || pick(awake);
    c.classList.remove('yawn');
    void c.offsetWidth;
    c.classList.add('yawn');
    c.addEventListener('animationend', () => c.classList.remove('yawn'), { once: true });
    yawn();
    later(() => glow(bedFor(c.dataset.size), true), 600);
  }
  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => { hint(); scheduleHint(); }, rand(7000, 9000));
  }
  function clearHint() { clearTimeout(hintTimer); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearHint();
    else if (!busy) scheduleHint();
  });

  Kit.setup();
  newRound();
})();
