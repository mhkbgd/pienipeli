/* ============ Pienipeli service worker ============
   Lets every game open from its home-screen icon even without internet.
   - On install, it saves every game file (the whole site is small).
   - Network first: online you always get the newest version (and the saved copy
     is refreshed); offline the saved copy is used.
   When you add a game or a file, add it to FILES below and bump VERSION.        */

const VERSION = 'v1';
const CACHE = 'pienipeli-' + VERSION;

const FILES = [
  '/',
  '/assets/css/site.css',
  '/assets/js/site.js',
  '/assets/js/app.js',
  '/assets/fonts/fredoka-latin.woff2',
  '/assets/fonts/noto-sans-bengali.woff2',
  '/assets/img/logo.svg',
  '/assets/img/favicon-32.png',
  '/assets/img/apple-touch-icon.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png',
  '/site.webmanifest',

  '/games/baby-pop/',
  '/games/baby-pop/style.css',
  '/games/baby-pop/script.js',
  '/games/baby-pop/manifest.webmanifest',
  '/games/baby-pop/icons/icon-192.png',
  '/games/baby-pop/icons/icon-512.png',
  '/games/baby-pop/icons/apple-touch-icon.png',

  '/games/find-the-animal/',
  '/games/find-the-animal/style.css',
  '/games/find-the-animal/strings.js',
  '/games/find-the-animal/animals.js',
  '/games/find-the-animal/sounds.js',
  '/games/find-the-animal/narration/manifest.js',
  '/games/find-the-animal/narrator.js',
  '/games/find-the-animal/script.js',
  '/games/find-the-animal/card-art.svg',
  '/games/find-the-animal/manifest.webmanifest',
  '/games/find-the-animal/icons/icon-192.png',
  '/games/find-the-animal/icons/icon-512.png',
  '/games/find-the-animal/icons/apple-touch-icon.png',

  '/games/feed-the-animals/',
  '/games/feed-the-animals/style.css',
  '/games/feed-the-animals/sounds.js',
  '/games/feed-the-animals/animals.js',
  '/games/feed-the-animals/script.js',
  '/games/feed-the-animals/card-art.svg',
  '/games/feed-the-animals/manifest.webmanifest',
  '/games/feed-the-animals/icons/icon-192.png',
  '/games/feed-the-animals/icons/icon-512.png',
  '/games/feed-the-animals/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One missing file must not stop the rest from being saved.
    await Promise.allSettled(FILES.map(async (url) => {
      const res = await fetch(url, { cache: 'reload' });
      if (res.ok) await cache.put(url, await clean(res));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('pienipeli-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// Safari refuses to show a page that a service worker answers with a
// "redirected" response, so store a plain copy instead.
async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

// The same page can be asked for as /games/x/, /games/x/index.html or /games/x/index
function variants(url) {
  const u = new URL(url);
  const p = u.pathname;
  const list = [p];
  if (p.endsWith('/')) list.push(p + 'index.html');
  else if (p.endsWith('/index.html')) list.push(p.slice(0, -'index.html'.length));
  else if (p.endsWith('/index')) list.push(p.slice(0, -'index'.length));
  else if (p.endsWith('.html')) list.push(p.slice(0, -5));
  return list;
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  for (const path of variants(request.url)) {
    const hit = await cache.match(path, { ignoreSearch: true });
    if (hit) return hit;
  }
  if (request.mode === 'navigate') return cache.match('/');
  return undefined;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const copy = await clean(res.clone());
        caches.open(CACHE).then(c => c.put(url.pathname, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await fromCache(req);
      if (hit) return hit;
      throw err;
    }
  })());
});
