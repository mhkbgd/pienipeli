/* ============ Pienipeli: shared game chrome ============
   The same grown-up buttons and the same "how to play" help in every game.

   Left corner (in each game's HTML): 🏠 All games · 🔊 Sound · ⛶ Full screen
   Right corner (added here):         ? How to play · ↻ Start again

   How to play: a friendly cartoon hand acts out the move on the real game pieces
   (tap, drag, rub or trace), with no words, because little ones can't read yet.
   It plays by itself the first time a game is opened on this device, and again
   whenever the ? button is tapped. Any tap on the game stops it.

   Usage in a game:
     PPChrome.init({
       id: 'peekaboo',
       how: () => [ { tap: element }, { drag: [fromEl, toEl] }, { rub: element },
                    { path: [{x, y}, ...] } ],   // elements or {x, y} screen points
       restart: () => {...},                     // optional; default reloads the game
       adopt: [existingRestartButton]            // optional: reuse a game's own button
     });                                                                             */

(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = (k, f) => (window.PP_I18N ? PP_I18N.t(k, f) : f);
  const store = {
    get(k) { try { return localStorage.getItem('pienipeli-' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('pienipeli-' + k, v); } catch (e) { /* private mode */ } }
  };

  const HAND = `<svg viewBox="0 0 64 80" width="64" height="80" aria-hidden="true" focusable="false">
    <g stroke="#2b1d5c" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M14 6c4-3 9-1 9 4v26l3-1V24c0-4 7-5 8 0v11l3 0V28c0-4 7-4 8 0v8l2 0c0-4 7-4 7 1v14c0 14-8 24-21 24h-4C19 75 12 68 8 58L2 45c-2-4 3-8 7-5l5 6V10c0-2 0-3 0-4z" fill="#ffe0c2"/>
      <path d="M23 36v-6M34 36v-6M45 37v-4" fill="none" stroke-width="2.5" opacity=".5"/>
    </g>
    <ellipse cx="18" cy="8" rx="4" ry="2.4" fill="#fff" opacity=".7"/></svg>`;

  let layer = null, hand = null, ring = null, running = null;

  function ensureLayer() {
    if (layer) return;
    layer = document.createElement('div');
    layer.className = 'how-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `<div class="how-ring"></div><div class="how-hand">${HAND}</div>`;
    document.body.appendChild(layer);
    hand = layer.querySelector('.how-hand');
    ring = layer.querySelector('.how-ring');
  }

  // Resolve an element or a point to screen coordinates (centre of the element)
  function pt(target) {
    if (!target) return null;
    const el = typeof target === 'function' ? target() : target;
    if (!el) return null;
    if (typeof el.x === 'number' && typeof el.y === 'number' && !el.getBoundingClientRect) return { x: el.x, y: el.y };
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  const sleep = (ms, token) => new Promise((res, rej) => setTimeout(() => (token.stop ? rej('stop') : res()), ms));
  function moveTo(p, ms, pressed) {
    // the fingertip is at the top-left of the hand drawing (about 16px, 6px)
    const tf = `translate(${p.x - 16}px, ${p.y - 6}px) scale(${pressed ? 0.88 : 1})`;
    const a = hand.animate([{ transform: hand.style.transform || tf }, { transform: tf }], { duration: reduced ? 0 : ms, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
    hand.style.transform = tf;
    return a.finished.catch(() => {});
  }
  function tapRing(p) {
    ring.style.left = p.x + 'px'; ring.style.top = p.y + 'px';
    ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go');
  }

  async function play(steps) {
    stop();
    ensureLayer();
    const token = { stop: false };
    running = token;
    layer.classList.add('show');
    const start = { x: innerWidth * 0.82, y: innerHeight * 0.92 };
    hand.style.transform = `translate(${start.x}px, ${start.y}px)`;
    try {
      for (let round = 0; round < 2; round++) {
        for (const s of steps) {
          if (token.stop) return;
          if (s.tap) {
            const p = pt(s.tap); if (!p) continue;
            await moveTo(p, 650); await sleep(120, token);
            await moveTo(p, 140, true); tapRing(p); await sleep(260, token);
            await moveTo(p, 140, false); await sleep(380, token);
          } else if (s.drag) {
            const a = pt(s.drag[0]), b = pt(s.drag[1]); if (!a || !b) continue;
            await moveTo(a, 650); await sleep(120, token);
            await moveTo(a, 160, true); tapRing(a); await sleep(200, token);
            await moveTo(b, 1100, true); await sleep(160, token);
            await moveTo(b, 160, false); tapRing(b); await sleep(420, token);
          } else if (s.rub) {
            const c = pt(s.rub); if (!c) continue;
            const el = typeof s.rub === 'function' ? s.rub() : s.rub;
            const w = el && el.getBoundingClientRect ? el.getBoundingClientRect().width * 0.25 : 60;
            await moveTo({ x: c.x - w, y: c.y }, 650); await moveTo({ x: c.x - w, y: c.y }, 140, true);
            for (let k = 0; k < 3; k++) {
              await moveTo({ x: c.x + w, y: c.y - 14 }, 330, true);
              await moveTo({ x: c.x - w, y: c.y + 14 }, 330, true);
            }
            await moveTo({ x: c.x - w, y: c.y }, 140, false); await sleep(400, token);
          } else if (s.path) {
            const pts = (typeof s.path === 'function' ? s.path() : s.path) || [];
            if (pts.length < 2) continue;
            await moveTo(pts[0], 650); await moveTo(pts[0], 140, true); tapRing(pts[0]);
            const step = Math.max(1, Math.floor(pts.length / 18));
            for (let k = step; k < pts.length; k += step) await moveTo(pts[k], 70, true);
            await moveTo(pts[pts.length - 1], 140, false); await sleep(420, token);
          }
        }
        await sleep(500, token);
      }
    } catch (e) { /* stopped */ }
    if (running === token) stop();
  }

  function stop() {
    if (running) running.stop = true;
    running = null;
    if (layer) layer.classList.remove('show');
  }

  function btn(cls, icon, labelKey, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'corner-btn ' + cls;
    b.innerHTML = `<span aria-hidden="true">${icon}</span>`;
    b.setAttribute('aria-label', t(labelKey, label));
    b.dataset.i18nAttr = 'aria-label:' + labelKey + '; title:' + labelKey;
    b.title = t(labelKey, label);
    return b;
  }

  function init(opts = {}) {
    const id = opts.id || location.pathname.split('/').filter(Boolean).slice(-1)[0] || 'game';
    let right = document.querySelector('.chrome-right');
    if (!right) {
      right = document.createElement('div');
      right.className = 'chrome-right';
      document.body.appendChild(right);
    }
    if (opts.how) {
      const help = btn('help', '?', 'chrome.help', 'How to play');
      help.addEventListener('click', () => play(opts.how() || []));
      right.appendChild(help);
    }
    (opts.adopt || []).forEach(el => el && right.appendChild(el));
    if (opts.restart !== false && !(opts.adopt || []).length) {
      const again = btn('restart', '↻', 'chrome.restart', 'Start again');
      again.addEventListener('click', () => {
        stop();
        if (typeof opts.restart === 'function') { opts.restart(); return; }
        document.body.classList.add('pp-restarting');
        setTimeout(() => location.reload(), reduced ? 0 : 220);
      });
      right.appendChild(again);
    }
    // Any real tap on the game stops the demo
    addEventListener('pointerdown', (e) => { if (running && !e.target.closest('.chrome-right .help')) stop(); }, true);
    addEventListener('keydown', () => stop(), true);

    // First visit on this device: show how to play once
    if (opts.how && !store.get('how-' + id)) {
      setTimeout(() => {
        store.set('how-' + id, '1');
        if (!document.hidden) play(opts.how() || []);
      }, opts.howDelay || 1400);
    }
    if (window.PP_I18N) PP_I18N.ready.then(() => PP_I18N.apply(right));
  }

  window.PPChrome = { init, play, stop };
})();
