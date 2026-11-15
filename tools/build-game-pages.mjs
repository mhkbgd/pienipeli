// Writes index.html + manifest.webmanifest for ten kit games (Alphabet Zoo ... Decorate the Cake):
// the shared page boilerplate (head, SEO, structured data, toolbar, scripts) from one list.
//   node tools/build-game-pages.mjs
// Game logic and styles live in each game's script.js / style.css and are never touched.
import fs from 'node:fs';
const G = new URL('../games', import.meta.url).pathname;

const SKY = `  <div class="sky" aria-hidden="true">
    <div class="sun"></div>
    <div class="cloud c1"></div>
    <div class="cloud c2"></div>
    <div class="hill h1"></div>
    <div class="hill h2"></div>
  </div>
`;

export const GAMES = [
  { id: 'alphabet-zoo', name: 'Alphabet Zoo!', short: 'Alphabet Zoo', min: 2, max: 4, theme: '#c9ecff',
    title: 'Alphabet Zoo! Free ABC Game for Toddlers', desc: 'Play Alphabet Zoo free online: tap a big letter and a friendly animal or picture pops out of it. A is for Apple, B is for Bear, all the way to Z is for Zebra. No ads, no losing.',
    og: 'Tap a big letter and watch an animal pop out of it, from A to Z.', ld: 'A free, ad-free ABC game for toddlers. Tap a big colourful letter and a friendly animal or picture pops out of it, from A for Apple to Z for Zebra.',
    sky: true, scripts: ['../../assets/js/alphabet.js'],
    body: `  <main class="stage" id="stage">
    <button class="nav-arrow prev" id="prev" type="button" aria-label="Previous letter"><span aria-hidden="true">‹</span></button>
    <div class="card-zone">
      <button class="letter-card" id="card" type="button" aria-label="Letter"></button>
    </div>
    <button class="nav-arrow next" id="next" type="button" aria-label="Next letter"><span aria-hidden="true">›</span></button>
  </main>
  <nav class="abc-strip" id="strip" aria-label="All letters"></nav>` },

  { id: 'trace-letter', name: 'Trace the Letter!', short: 'Trace the Letter', min: 3, max: 4, theme: '#fff4e0',
    title: 'Trace the Letter! Free Letter Tracing Game for Toddlers', desc: 'Play Trace the Letter free online: follow a big dotted letter with your finger, leave a trail of colour, and watch the letter come alive. Uppercase A to Z. No ads, no losing.',
    og: 'Follow the dotted letter with a finger and watch it come alive.', ld: 'A free, ad-free letter tracing game for toddlers and preschoolers. Follow a big dotted letter with a finger to fill it with colour, then a matching picture pops out.',
    sky: false, scripts: ['../../assets/js/alphabet.js'],
    body: `  <main class="stage">
    <div class="board" id="board">
      <svg class="trace" id="trace" viewBox="0 0 100 100" aria-label="Letter to trace" role="img"></svg>
      <div class="reward" id="reward" aria-hidden="true"></div>
    </div>
    <div class="trace-nav">
      <button class="nav-arrow" id="prev" type="button" aria-label="Previous letter"><span aria-hidden="true">‹</span></button>
      <button class="nav-arrow" id="next" type="button" aria-label="Next letter"><span aria-hidden="true">›</span></button>
    </div>
  </main>` },

  { id: 'letter-pop', name: 'Letter Pop!', short: 'Letter Pop', min: 1, max: 4, theme: '#c9ecff',
    title: 'Letter Pop! Free Alphabet Balloon Game for Babies & Toddlers', desc: 'Play Letter Pop free online: letter balloons float up, tap one to pop it and see its letter and picture big. On a keyboard, every letter key pops its own balloon. No ads, no losing.',
    og: 'Pop letter balloons and see each letter with its picture. Every keyboard letter works too.', ld: 'A free, ad-free alphabet balloon game. Tap a letter balloon to pop it and see the letter with its picture; pressing a letter on the keyboard pops that letter.',
    sky: true, scripts: ['../../assets/js/alphabet.js'],
    body: `  <main class="stage" id="stage" aria-label="Letter balloons"></main>
  <div class="flash" id="flash" aria-live="polite"></div>` },

  { id: 'count-ducks', name: 'Count the Ducks!', short: 'Count the Ducks', min: 2, max: 4, theme: '#bfeaff',
    title: 'Count the Ducks! Free Counting Game for Toddlers', desc: 'Play Count the Ducks free online: tap the pond and ducks swim in one by one, each with its number and a rising musical note. Counting 1 to 10 for toddlers. No ads, no losing.',
    og: 'Tap the pond, ducks swim in one by one: 1, 2, 3!', ld: 'A free, ad-free counting game for toddlers. Every tap brings one more duck onto the pond with its number and a rising note, until all the spots are full.',
    sky: false, scripts: [],
    body: `  <main class="stage" id="stage">
    <div class="goal" id="goal" aria-live="polite"></div>
    <div class="pond" id="pond" role="button" tabindex="0" aria-label="Pond: tap to add a duck">
      <div class="spots" id="spots"></div>
    </div>
  </main>` },

  { id: 'feed-numbers', name: 'Feed the Numbers!', short: 'Feed the Numbers', min: 2, max: 4, theme: '#e6dcff',
    title: 'Feed the Numbers! Free Counting Game for Toddlers', desc: 'Play Feed the Numbers free online: a friendly monster wants a number of apples. Drag or tap apples into its mouth and count along until its tummy is full. No ads, no losing.',
    og: 'A hungry monster wants 3 apples. Count them in, munch munch munch!', ld: 'A free, ad-free counting game for toddlers. A friendly monster shows a number; drag or tap that many apples into its mouth and watch it dance.',
    sky: false, scripts: [],
    body: `  <main class="stage" id="stage">
    <div class="monster-zone"><div class="monster" id="monster" role="img" aria-label="A hungry monster"></div></div>
    <div class="basket" id="basket" role="group" aria-label="Apples"></div>
  </main>` },

  { id: 'number-train', name: 'Number Train!', short: 'Number Train', min: 2, max: 4, theme: '#c9ecff',
    title: 'Number Train! Free Number Matching Game for Toddlers', desc: 'Play Number Train free online: animals with numbers hop into the train carriage with the same number. Drag or tap, then the train goes choo-choo. No ads, no losing.',
    og: 'Help the animals find their numbered seats, then choo-choo!', ld: 'A free, ad-free number matching game for toddlers. Drag each animal to the carriage with its number; when the train is full it toots and drives away.',
    sky: true, scripts: [],
    body: `  <main class="stage" id="stage">
    <div class="riders" id="riders" role="group" aria-label="Animals waiting"></div>
    <div class="track-zone"><div class="train" id="train"></div><div class="rails" aria-hidden="true"></div></div>
  </main>` },

  { id: 'tap-race', name: 'Tap Tap Race!', short: 'Tap Tap Race', min: 2, max: 4, theme: '#c9ecff',
    title: 'Tap Tap Race! Free Racing Game for Toddlers', desc: 'Play Tap Tap Race free online: pick an animal racer and tap to zoom to the finish flag. Vroom! Everyone gets a medal. No ads, no losing.',
    og: 'Pick a racer and tap tap tap to the finish flag!', ld: 'A free, ad-free racing game for toddlers. Pick an animal racer and tap to zoom to the finish; every racer gets a medal.',
    sky: false, scripts: [],
    body: `  <main class="stage" id="stage">
    <div class="track" id="track"></div>
    <p class="pick-hint" id="pickHint" aria-live="polite"><span class="emoji" aria-hidden="true">👆</span></p>
  </main>` },

  { id: 'tilt-track', name: 'Tilt Track!', short: 'Tilt Track', min: 3, max: 4, theme: '#9be38f',
    title: 'Tilt Track! Free Tilt Driving Game for Kids', desc: 'Play Tilt Track free online: tilt your phone or tablet (or tap left and right) to drive a little car down a winding road and collect musical stars. No crashing, no losing, no ads.',
    og: 'Tilt to steer a little car and collect musical stars. No crashing, no losing.', ld: 'A free, ad-free driving game for small kids. Tilt the phone or tap left and right to steer down a winding road and collect stars that play notes; there is no crashing.',
    sky: false, scripts: [],
    body: `  <main class="stage" id="stage">
    <canvas id="road" aria-label="A winding road with a little car" role="img"></canvas>
    <div class="stars-count" id="starsCount" aria-live="polite"><span class="emoji" aria-hidden="true">⭐</span> <b>0</b></div>
    <button class="start" id="startBtn" type="button"><span class="emoji" aria-hidden="true">🚗</span><span class="go">GO!</span></button>
  </main>` },

  { id: 'build-house', name: 'Build a House!', short: 'Build a House', min: 2, max: 4, theme: '#c9ecff',
    title: 'Build a House! Free Drag and Drop Building Game for Toddlers', desc: 'Play Build a House free online: drag the walls, roof, door and windows into place and watch the lights come on and an animal family move in. Then build a barn and a rocket. No ads, no losing.',
    og: 'Drag the pieces into place and an animal family moves in!', ld: 'A free, ad-free drag-and-drop building game for toddlers. Drag walls, roof, door and windows into place to build a house, a barn and a rocket.',
    sky: true, scripts: [],
    body: `  <main class="stage" id="stage">
    <svg class="build" id="build" role="img" aria-label="Building site"></svg>
  </main>` },

  { id: 'decorate-cake', name: 'Decorate the Cake!', short: 'Decorate the Cake', min: 2, max: 4, theme: '#ffe1ef',
    title: 'Decorate the Cake! Free Creative Game for Toddlers', desc: 'Play Decorate the Cake free online: drag strawberries, candles, sprinkles and stars onto a big cake, then light the candles for a birthday song. No wrong way, no ads.',
    og: 'Drag strawberries, candles and sprinkles onto the cake, then light the candles!', ld: 'A free, ad-free creative game for toddlers. Drag decorations onto a cake anywhere they like, then light the candles for a birthday song.',
    sky: false, scripts: [],
    body: `  <main class="stage" id="stage">
    <div class="table-zone">
      <svg class="cake" id="cake" viewBox="0 0 400 340" role="img" aria-label="A cake to decorate"></svg>
    </div>
    <div class="tray" id="tray" role="group" aria-label="Decorations"></div>
    <div class="cake-btns">
      <button class="big-btn party" id="partyBtn" type="button" aria-label="Light the candles"><span class="emoji" aria-hidden="true">🎉</span></button>
    </div>
  </main>` }
];

for (const g of GAMES) {
  const url = `https://pienipeli.fi/games/${g.id}/`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'VideoGame', '@id': url + '#game', name: g.name, url, description: g.ld, image: 'https://pienipeli.fi/assets/img/og-image.png',
      genre: ['Educational', 'Casual', 'Kids'], gamePlatform: ['Web browser', 'Mobile', 'Tablet', 'Desktop'], applicationCategory: 'Game', operatingSystem: 'Any',
      inLanguage: 'en', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      audience: { '@type': 'PeopleAudience', suggestedMinAge: g.min, suggestedMaxAge: g.max },
      publisher: { '@type': 'Organization', name: 'Pienipeli', url: 'https://pienipeli.fi/' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Pienipeli', item: 'https://pienipeli.fi/' },
      { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://pienipeli.fi/games/' },
      { '@type': 'ListItem', position: 3, name: g.name, item: url } ] }
  ] };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- viewport-fit + no zoom keeps toddler taps from zooming the page -->
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>${g.title} | Pienipeli</title>
  <meta name="description" content="${g.desc}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="${g.theme}">
  <link rel="icon" href="../../assets/img/logo.svg" type="image/svg+xml">
  <link rel="icon" href="../../assets/img/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
  <!-- Add to Home Screen: opens straight into this game, full screen (see manifest.webmanifest) -->
  <link rel="manifest" href="manifest.webmanifest">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${g.short}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Pienipeli">
  <meta property="og:title" content="${g.name} Free game for toddlers">
  <meta property="og:description" content="${g.og} No ads, no losing.">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://pienipeli.fi/assets/img/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preload" href="../../assets/fonts/fredoka-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../../assets/css/kit.css">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="../../assets/css/chrome.css">
  <script src="../../assets/js/i18n.js"></script>

  <script type="application/ld+json">
${JSON.stringify(ld, null, 2).replace(/^/gm, '  ')}
  </script>
</head>
<body>
${g.sky ? SKY : ''}
  <h1 class="sr-only">${g.name}</h1>

  <!-- Grown-up corner buttons (kept small and out of the way) -->
  <a class="corner-btn home" href="../index.html" aria-label="All games"><span aria-hidden="true">🏠</span></a>
  <button class="corner-btn sound" id="soundBtn" type="button" aria-label="Sound off" aria-pressed="true"><span aria-hidden="true">🔊</span></button>
  <button class="corner-btn full" id="fullBtn" type="button" aria-label="Full screen" hidden><span aria-hidden="true">⛶</span></button>

${g.body}

  <div class="fx" id="fx" aria-hidden="true"></div>

  <noscript><p class="noscript">This game needs JavaScript turned on.</p></noscript>

  <script src="../../assets/js/app.js"></script>
  <script src="../../assets/js/chrome.js"></script>
  <script src="../../assets/js/kit.js"></script>
${g.scripts.map(s => `  <script src="${s}"></script>\n`).join('')}  <script src="script.js"></script>
</body>
</html>
`;
  fs.mkdirSync(`${G}/${g.id}/icons`, { recursive: true });
  fs.writeFileSync(`${G}/${g.id}/index.html`, html);
  const m = { id: `/games/${g.id}/`, name: g.name, short_name: g.short, description: g.og, lang: 'en', start_url: './', scope: './',
    display: 'fullscreen', display_override: ['fullscreen', 'standalone'], orientation: 'any', background_color: g.theme, theme_color: g.theme,
    categories: ['games', 'kids', 'education'], icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] };
  fs.writeFileSync(`${G}/${g.id}/manifest.webmanifest`, JSON.stringify(m, null, 2) + '\n');
}
if (process.argv[1].endsWith('build-game-pages.mjs')) console.log('game pages written:', GAMES.map(g => g.id).join(' '));
