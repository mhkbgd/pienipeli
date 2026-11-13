/* ============ Pienipeli: shared "app" helper for every game ============
   - Registers the service worker (sw.js) so games open offline from a home-screen icon.
   - Full screen that works everywhere it can:
       Android / desktop / iPad: the browser's Fullscreen API.
       iPhone: Safari has no Fullscreen API for web pages, so the full-screen button
       shows a short tip for grown-ups: "Share → Add to Home Screen". Opened from
       that icon, the game fills the whole screen.
     When a game is already running from its home-screen icon, the button hides.
   Usage in a game:  Pienipeli.fullscreenButton(buttonElement, { onChange })      */

(() => {
  'use strict';

  const here = document.currentScript && document.currentScript.src;
  const siteRoot = here ? new URL('../../', here) : null;

  // ---------- Offline support ----------
  if ('serviceWorker' in navigator && siteRoot && /^https?:$/.test(location.protocol)) {
    addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', siteRoot), { scope: siteRoot.pathname })
        .catch(() => { /* offline support is a bonus; the game works without it */ });
    });
  }

  // ---------- Full screen ----------
  const root = document.documentElement;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => navigator.standalone === true ||
    matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen) &&
    (document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false);
  const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        const p = req.call(root, { navigationUI: 'hide' });
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* not allowed here: ignore */ }
  }

  // A small card for grown-ups explaining how to get full screen on iPhone.
  function showHomeScreenTip() {
    if (document.getElementById('pp-tip')) return;
    const tip = document.createElement('div');
    tip.id = 'pp-tip';
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-modal', 'true');
    tip.setAttribute('aria-label', 'Full screen on iPhone');
    tip.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;' +
      'background:rgba(40,30,60,.45);font-family:system-ui,-apple-system,sans-serif;color:#3a2a3a';
    tip.innerHTML =
      '<div style="max-width:340px;background:#fff;border-radius:24px;padding:22px 22px 18px;box-shadow:0 18px 40px rgba(0,0,0,.25);text-align:center">' +
        '<div style="font-size:42px;line-height:1;margin-bottom:8px" aria-hidden="true">📲</div>' +
        '<p style="margin:0 0 10px;font-size:19px;font-weight:700">Full screen on iPhone</p>' +
        '<p style="margin:0 0 6px;font-size:16px;line-height:1.45">1. Tap the <b>Share</b> button ' +
          '<svg width="16" height="20" viewBox="0 0 16 20" aria-label="Share icon" style="vertical-align:-3px"><path d="M8 1v12M3.5 5.5 8 1l4.5 4.5M2 9v9h12V9" fill="none" stroke="#2f7cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> in Safari.</p>' +
        '<p style="margin:0 0 6px;font-size:16px;line-height:1.45">2. Choose <b>Add to Home Screen</b>.</p>' +
        '<p style="margin:0 0 16px;font-size:16px;line-height:1.45">3. Open the game from its new icon: it fills the whole screen.</p>' +
        '<button type="button" style="font:inherit;font-size:17px;font-weight:700;border:0;border-radius:999px;padding:10px 26px;background:#ff8fb3;color:#fff;cursor:pointer">OK</button>' +
      '</div>';
    const close = (e) => { if (e.target === tip || e.target.tagName === 'BUTTON') tip.remove(); };
    tip.addEventListener('click', close);
    // keep game handlers from reacting to taps on the tip
    ['pointerdown', 'touchstart', 'keydown'].forEach(t => tip.addEventListener(t, e => e.stopPropagation()));
    document.body.appendChild(tip);
    tip.querySelector('button').focus();
  }

  // Wire up a game's full-screen button. opts.onChange(isFull) lets the game update its icon.
  function fullscreenButton(btn, opts) {
    if (!btn) return;
    const onChange = (opts && opts.onChange) || (() => {});
    if (standalone()) { btn.hidden = true; return; }       // already full screen from the home screen
    if (canFullscreen) {
      btn.hidden = false;
      btn.addEventListener('click', (e) => { e.preventDefault(); toggleFullscreen(); });
      const update = () => onChange(isFullscreen());
      document.addEventListener('fullscreenchange', update);
      document.addEventListener('webkitfullscreenchange', update);
      update();
    } else if (isIOS) {
      btn.hidden = false;                                   // iPhone: explain the home-screen way
      btn.addEventListener('click', (e) => { e.preventDefault(); showHomeScreenTip(); });
    } else {
      btn.hidden = true;
    }
  }

  window.Pienipeli = { fullscreenButton, toggleFullscreen, isFullscreen, standalone, isIOS, canFullscreen, showHomeScreenTip };
})();
