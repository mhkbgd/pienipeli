/* ============ Pienipeli service worker ============
   Lets every game open from its home-screen icon even without internet.
   - On install, it saves every game file (the whole site is small).
   - Network first: online you always get the newest version (and the saved copy
     is refreshed); offline the saved copy is used.
   When you add a game or a file, add it to FILES below and bump VERSION.        */

const VERSION = 'v4';
const CACHE = 'pienipeli-' + VERSION;

const FILES = [
  '/',
  '/games/',
  '/parents',
  '/about',
  '/privacy',
  '/assets/css/site.css',
  '/assets/js/site.js',
  '/assets/js/app.js',
  '/assets/js/kit.js',
  '/assets/css/kit.css',
  // Shared animal pictures (made by tools/build-animal-pictures.mjs)
  '/assets/animals/bear.svg',
  '/assets/animals/bee.svg',
  '/assets/animals/butterfly.svg',
  '/assets/animals/camel.svg',
  '/assets/animals/cat.svg',
  '/assets/animals/chicken.svg',
  '/assets/animals/cow.svg',
  '/assets/animals/crocodile.svg',
  '/assets/animals/deer.svg',
  '/assets/animals/dog.svg',
  '/assets/animals/dolphin.svg',
  '/assets/animals/duck.svg',
  '/assets/animals/eagle.svg',
  '/assets/animals/elephant.svg',
  '/assets/animals/fox.svg',
  '/assets/animals/frog.svg',
  '/assets/animals/giraffe.svg',
  '/assets/animals/goat.svg',
  '/assets/animals/horse.svg',
  '/assets/animals/kangaroo.svg',
  '/assets/animals/lion.svg',
  '/assets/animals/monkey.svg',
  '/assets/animals/mouse.svg',
  '/assets/animals/octopus.svg',
  '/assets/animals/owl.svg',
  '/assets/animals/panda.svg',
  '/assets/animals/parrot.svg',
  '/assets/animals/peacock.svg',
  '/assets/animals/penguin.svg',
  '/assets/animals/pig.svg',
  '/assets/animals/rabbit.svg',
  '/assets/animals/rooster.svg',
  '/assets/animals/shark.svg',
  '/assets/animals/sheep.svg',
  '/assets/animals/snake.svg',
  '/assets/animals/tiger.svg',
  '/assets/animals/turtle.svg',
  '/assets/animals/whale.svg',
  '/assets/animals/wolf.svg',
  '/assets/animals/zebra.svg',
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
  '/games/baby-pop/card-art.svg',
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
  '/games/feed-the-animals/icons/apple-touch-icon.png',

  '/games/peekaboo/',
  '/games/peekaboo/style.css',
  '/games/peekaboo/script.js',
  '/games/peekaboo/card-art.svg',
  '/games/peekaboo/manifest.webmanifest',
  '/games/peekaboo/icons/icon-192.png',
  '/games/peekaboo/icons/icon-512.png',
  '/games/peekaboo/icons/apple-touch-icon.png',

  '/games/bubble-bath/',
  '/games/bubble-bath/style.css',
  '/games/bubble-bath/script.js',
  '/games/bubble-bath/card-art.svg',
  '/games/bubble-bath/manifest.webmanifest',
  '/games/bubble-bath/icons/icon-192.png',
  '/games/bubble-bath/icons/icon-512.png',
  '/games/bubble-bath/icons/apple-touch-icon.png',

  '/games/color-splash/',
  '/games/color-splash/style.css',
  '/games/color-splash/pictures.js',
  '/games/color-splash/script.js',
  '/games/color-splash/card-art.svg',
  '/games/color-splash/manifest.webmanifest',
  '/games/color-splash/icons/icon-192.png',
  '/games/color-splash/icons/icon-512.png',
  '/games/color-splash/icons/apple-touch-icon.png',

  '/games/animal-band/',
  '/games/animal-band/style.css',
  '/games/animal-band/script.js',
  '/games/animal-band/card-art.svg',
  '/games/animal-band/manifest.webmanifest',
  '/games/animal-band/icons/icon-192.png',
  '/games/animal-band/icons/icon-512.png',
  '/games/animal-band/icons/apple-touch-icon.png',

  '/games/bedtime/',
  '/games/bedtime/style.css',
  '/games/bedtime/script.js',
  '/games/bedtime/card-art.svg',
  '/games/bedtime/manifest.webmanifest',
  '/games/bedtime/icons/icon-192.png',
  '/games/bedtime/icons/icon-512.png',
  '/games/bedtime/icons/apple-touch-icon.png'
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
