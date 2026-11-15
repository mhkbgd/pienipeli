// Pienipeli website builder: writes the website pages as plain static HTML.
//   node tools/build-site.mjs
// No dependencies. The site itself has no build step: this only regenerates the pages
// (index.html, games/index.html, parents.html, about.html, privacy.html, 404.html) and the
// English dictionary assets/i18n/en.js from one place, so header, footer, game cards and
// translations can never drift apart. Every visible string has a key (T('key', 'English'))
// and gets a data-i18n attribute; other languages translate those keys in assets/i18n/<lang>.js.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://pienipeli.fi/';

/* =====================================================================
   Strings: T(key, english) records the English text and returns it.
   ===================================================================== */
const esc = (s) => s.replace(/&(?!amp;|quot;|lt;|gt;|#)/g, '&amp;');
const EN = {};
function T(key, text) {
  if (key in EN && EN[key] !== text) throw new Error(`Key "${key}" used with two different texts`);
  EN[key] = text;
  return text;
}
// Element content helpers: `<h2 ${X('k', 'Text')}</h2>`  ->  <h2 data-i18n="k">Text</h2>
const X = (key, text) => `data-i18n="${key}">${esc(T(key, text))}`;
const XH = (key, html) => `data-i18n-html="${key}">${T(key, html)}`;
// A translatable attribute: `<a ${A('aria-label', 'k', 'Text')}>`
const A = (attr, key, text) => `${attr}="${T(key, text).replace(/"/g, '&quot;')}" data-i18n-attr="${attr}:${key}"`;

/* =====================================================================
   Icons (simple hand-drawn style, stroke = currentColor)
   ===================================================================== */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  home: I('<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.6V20h12.4V9.6"/><path d="M10 20v-5.2h4V20"/>'),
  games: I('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M15.5 14.5l4 2.5-4 2.5z"/>'),
  parents: I('<path d="M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>'),
  about: I('<circle cx="12" cy="12" r="8.5"/><path d="M8.6 14.2c1.8 2 5 2 6.8 0"/><path d="M9.2 9.6h.01M14.8 9.6h.01" stroke-width="3"/>'),
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  dice: I('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 8.5h.01M15.5 15.5h.01M15.5 8.5h.01M8.5 15.5h.01M12 12h.01" stroke-width="3.2"/>'),
  noads: I('<path d="M4 10v4h3l6 4V6L7 10H4z"/><path d="M4 4l16 16"/>'),
  shield: I('<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
  user: I('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/><path d="M4 4l16 16"/>'),
  heart: I('<path d="M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>'),
  offline: I('<path d="M7 18h10.5a3.5 3.5 0 0 0 .4-7A5.5 5.5 0 0 0 7.3 9.6 4.2 4.2 0 0 0 7 18z"/><path d="M10 13.5l1.8 1.8 3.2-3.3"/>'),
  phone: I('<rect x="7" y="2.8" width="10" height="18.4" rx="2.6"/><path d="M11 17.6h2"/>'),
  baby: I('<circle cx="12" cy="12" r="8.5"/><path d="M9.3 14.6c1.5 1.3 3.9 1.3 5.4 0"/><path d="M9.5 10.5h.01M14.5 10.5h.01" stroke-width="3"/><path d="M12 3.5c-1.2 1.4-.4 3 1 2.6"/>'),
  sparkle: I('<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.6 2.6M15.4 15.4 18 18M18 6l-2.6 2.6M8.6 15.4 6 18"/>'),
  check: I('<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 4.9-5.2"/>'),
  chat: I('<path d="M5 17.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9.2z"/><path d="M9 10.5h6"/>'),
  lock: I('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  arrowNote: `<svg viewBox="0 0 60 44" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 38c10-2 22-8 30-18 4-5 8-10 18-14"/><path d="M42 4l10 2-5 9"/></svg>`
};

/* =====================================================================
   Games (newest first). tags: age-1 / age-2 / abc / music / build / calm
   ===================================================================== */
const GAMES = [
  { id: 'alphabet-zoo', pikku: true, name: 'Alphabet Zoo!', short: 'Alphabet Zoo', age: '2–4', isNew: true, tags: ['age-2', 'abc'],
    sub: 'Tap a big letter and an animal pops out of it. A is for Apple, B is for Bear, all the way to Zebra.',
    skills: ['abc', 'letters', 'words'], practise: 'Letter shapes and the sound each word starts with (say “B, bear!” together). Keyboard letters jump straight to that letter.',
    ld: 'A free, ad-free ABC game for toddlers. Tap a big colourful letter and a friendly animal or picture pops out of it, from A for Apple to Z for Zebra.' },
  { id: 'build-house', name: 'Build a House!', short: 'Build a House', age: '2–4', isNew: true, tags: ['age-2', 'build'],
    sub: 'Drag the walls, roof, door and windows into place. Then the lights go on and a family moves in.',
    skills: ['drag', 'shapes', 'building'], practise: 'Dragging and matching shapes to outlines. Builds a house, a barn and a rocket that blasts off.',
    ld: 'A free, ad-free drag-and-drop building game for toddlers. Drag walls, roof, door and windows into place to build a house, a barn and a rocket.' },
  { id: 'count-ducks', name: 'Count the Ducks!', short: 'Count the Ducks', age: '2–4', isNew: true, tags: ['age-2', 'abc'],
    sub: 'Tap the pond and ducks swim in one by one: 1, 2, 3! Every number climbs a musical step.',
    skills: ['counting', 'num10'], practise: 'Counting one by one up to 10, seeing how many (the dots) and hearing numbers go up like stairs.',
    ld: 'A free, ad-free counting game for toddlers. Every tap brings one more duck onto the pond with its number and a rising note, until all the spots are full.' },
  { id: 'tap-race', name: 'Tap Tap Race!', short: 'Tap Tap Race', age: '2–4', isNew: true, tags: ['age-2', 'build'],
    sub: 'Pick an animal racer and tap tap tap to the finish flag. Vroom! Everyone gets a gold medal.',
    skills: ['tapping', 'causeEffect'], practise: 'Fast tapping, cause and effect, and a race where everybody wins.',
    ld: 'A free, ad-free racing game for toddlers. Pick an animal racer and tap to zoom to the finish; every racer gets a medal.' },
  { id: 'decorate-cake', name: 'Decorate the Cake!', short: 'Decorate the Cake', age: '2–4', isNew: true, tags: ['age-2', 'build', 'calm'],
    sub: 'Drag strawberries, candles, stars and sprinkles onto a big cake. Then light the candles!',
    skills: ['creating', 'drag'], practise: 'Free creative play with drag and drop. There’s no right way, and a birthday song at the end.',
    ld: 'A free, ad-free creative game for toddlers. Drag decorations onto a cake anywhere they like, then light the candles for a birthday song.' },
  { id: 'letter-pop', name: 'Letter Pop!', short: 'Letter Pop', age: '1–4', isNew: true, tags: ['age-1', 'abc'],
    sub: 'Letter balloons float up. Pop one to see its letter and picture big. Every keyboard letter works too.',
    skills: ['abc', 'tapping'], practise: 'A first look at letters: pop a balloon, see the letter and its picture. Great for keyboard bashing.',
    ld: 'A free, ad-free alphabet balloon game. Tap a letter balloon to pop it and see the letter with its picture; pressing a letter on the keyboard pops that letter.' },
  { id: 'feed-numbers', name: 'Feed the Numbers!', short: 'Feed the Numbers', age: '2–4', isNew: true, tags: ['age-2', 'abc'],
    sub: 'A friendly monster wants 3 apples. Drag them into its mouth and count along. Munch munch!',
    skills: ['counting', 'num6', 'drag'], practise: 'Counting out a number of things (1 to 6), matching a number to an amount, and dragging.',
    ld: 'A free, ad-free counting game for toddlers. A friendly monster shows a number; drag or tap that many apples into its mouth and watch it dance.' },
  { id: 'number-train', name: 'Number Train!', short: 'Number Train', age: '2–4', isNew: true, tags: ['age-2', 'abc'],
    sub: 'Help the animals find the carriage with their number, then the train goes choo-choo!',
    skills: ['num5', 'matching'], practise: 'Recognising numbers 1 to 5, matching them, and seeing them in order along the train.',
    ld: 'A free, ad-free number matching game for toddlers. Drag each animal to the carriage with its number; when the train is full it toots and drives away.' },
  { id: 'trace-letter', name: 'Trace the Letter!', short: 'Trace the Letter', age: '3–4', isNew: true, tags: ['abc'],
    sub: 'Follow the big dotted letter with a finger, leave a rainbow trail and watch it come alive.',
    skills: ['letters', 'prewriting', 'fingers'], practise: 'Pre-writing: following the strokes of each capital letter with a finger. Any order or direction counts.',
    ld: 'A free, ad-free letter tracing game for toddlers and preschoolers. Follow a big dotted letter with a finger to fill it with colour, then a matching picture pops out.' },
  { id: 'tilt-track', name: 'Tilt Track!', short: 'Tilt Track', age: '3–4', isNew: true, tags: ['build'],
    sub: 'Tilt the phone (or tap left and right) to drive down a winding road and collect musical stars.',
    skills: ['steering', 'handEye'], practise: 'Steering and hand-eye coordination. No crashing: the grass just slows the car down.',
    ld: 'A free, ad-free driving game for small kids. Tilt the phone or tap left and right to steer down a winding road and collect stars that play notes; there is no crashing.' },
  { id: 'peekaboo', pikku: true, name: 'Peekaboo!', short: 'Peekaboo', age: '1–3', tags: ['age-1'],
    sub: 'Animals hide behind bushes, curtains and gift boxes. One tap, and peekaboo!',
    skills: ['causeEffect', 'permanence'], practise: 'Cause and effect, and the idea that things are still there when hidden (object permanence). A perfect first game.',
    ld: 'A free, ad-free hide and seek game for babies and toddlers. Tap a bush, curtain or gift box and a friendly animal pops out with a peekaboo tune.' },
  { id: 'animal-band', name: 'Animal Band!', short: 'Animal Band', age: '1–4', tags: ['age-1', 'music'],
    sub: 'Six singing animals make a little piano that always sounds nice. Add a beat, or tap along to a nursery song.',
    skills: ['rhythm', 'highLow', 'music'], practise: 'Rhythm, high and low sounds, and playing along with a song. In song mode any tap plays the next note.',
    ld: 'A free, ad-free music game for babies and toddlers. Six singing animals play a piano scale that always sounds nice, with a soft backing beat and nursery songs played one tap at a time.' },
  { id: 'bubble-bath', name: 'Bubble Bath!', short: 'Bubble Bath', age: '1–4', tags: ['age-1', 'calm'],
    sub: 'A muddy friend sits in the tub. Rub the mud away in a cloud of bubbles, then watch it shake dry.',
    skills: ['fingers', 'calmPlay'], practise: 'Finger and hand control by rubbing and swiping. A slow, calming game with a happy finish.',
    ld: 'A free, ad-free bath time game for toddlers. Rub the mud off an animal in the tub with one finger or many, then watch it shake dry and sparkle.' },
  { id: 'color-splash', name: 'Color Splash!', short: 'Color Splash', age: '2–4', tags: ['age-2', 'music', 'calm'],
    sub: 'Pick a paint pot, tap the picture and splat! Every colour sings its own note.',
    skills: ['colours', 'choosing', 'music'], practise: 'Colour names (say them together!), making choices, and finishing a picture.',
    ld: 'A free, ad-free musical colouring game for toddlers. Pick a paint pot and tap the picture to fill it with colour. Every colour plays its own note.' },
  { id: 'bedtime', name: 'Bedtime!', short: 'Bedtime', age: '2–4', tags: ['age-2', 'calm', 'music'],
    sub: 'Tuck the small, middle and big animals into the bed that fits. Then lights out, and a lullaby.',
    skills: ['bigSmall', 'drag', 'windDown'], practise: 'Comparing sizes (small, middle, big) and dragging. Ends calm, nice before a nap.',
    ld: 'A free, ad-free size-sorting game for toddlers. Drag the small, middle and big animals into the beds that fit them, then the lights dim and a music-box lullaby plays.' },
  { id: 'baby-pop', pikku: true, name: 'Baby Pop!', short: 'Baby Pop', age: '1–4', tags: ['age-1'],
    sub: 'Smiley balloons float up a pastel sky. Tap, swipe or bash any key to pop them.',
    skills: ['tapping', 'causeEffect'], practise: 'Tapping and swiping, cause and effect. Keyboard bashing counts too.',
    ld: 'A free, ad-free balloon popping game for babies and toddlers. Tap, swipe or press any key to pop smiley balloons into sparkles and happy sounds.' },
  { id: 'find-the-animal', name: 'Find the Animal!', short: 'Find the Animal', age: '2–4', tags: ['age-2'],
    sub: '“Where is the cat?” The game asks out loud and your little one taps the right animal.',
    skills: ['words', 'listening', 'animals40'], practise: 'Listening and first words: the game says an animal’s name and your child finds it among three.',
    ld: 'A free, ad-free talking animal game for toddlers. The game asks for an animal out loud and the child taps the right one of three. 40 friendly animals with animal sounds.' },
  { id: 'feed-the-animals', pikku: true, name: 'Feed the Animals!', short: 'Feed the Animals', age: '2–3', tags: ['age-2'],
    sub: 'A hungry animal opens wide. Tap the right snack and watch it munch and dance.',
    skills: ['matching', 'foodWords'], practise: 'Matching (monkey and banana, rabbit and carrot) and food words.',
    ld: 'A free, ad-free feeding game for toddlers. One of 21 hungry animals waits with its mouth open and the child taps the right food of three. No reading, no timer, no losing.' }
];
const SKILLS = {
  abc: 'ABC', letters: 'Letter shapes', words: 'First words', drag: 'Drag & drop', shapes: 'Shapes', building: 'Building',
  counting: 'Counting', num10: 'Numbers 1–10', num6: 'Numbers 1–6', num5: 'Numbers 1–5', tapping: 'Tapping',
  causeEffect: 'Cause & effect', creating: 'Creating', matching: 'Matching', prewriting: 'Pre-writing', fingers: 'Finger control',
  steering: 'Steering', handEye: 'Hand-eye', permanence: 'Object permanence', rhythm: 'Rhythm', highLow: 'High & low',
  music: 'Music', calmPlay: 'Calm play', colours: 'Colours', choosing: 'Choosing', bigSmall: 'Big & small', windDown: 'Wind-down',
  listening: 'Listening', animals40: '40 animals', foodWords: 'Food words'
};
const byId = Object.fromEntries(GAMES.map(g => [g.id, g]));
const count = (tag) => GAMES.filter(g => g.tags.includes(tag)).length;

// Kinds of games (home tiles + chips on the games page)
const CATS = [
  { tag: 'age-1', key: 'first', name: 'First taps', ages: '1+', pics: ['dog', 'rabbit'], color: 'sky', text: 'One tap, something happens. Perfect for the very youngest.' },
  { tag: 'abc', key: 'abc', name: 'ABC & 123', ages: '2+', pics: ['bear', 'duck'], color: 'sun', text: 'Letters with animals, tracing, counting ducks and a number train.' },
  { tag: 'music', key: 'music', name: 'Music', ages: '1+', pics: ['cow', 'chicken'], color: 'pink', text: 'A singing animal band, colours that play notes and a lullaby.' },
  { tag: 'build', key: 'build', name: 'Build & race', ages: '2+', pics: ['monkey', 'lion'], color: 'mint', text: 'Build a house, decorate a cake, race to the flag, drive the track.' },
  { tag: 'calm', key: 'calm', name: 'Calm & creative', ages: '1+', pics: ['panda', 'owl'], color: 'lilac', text: 'Slow, gentle games for winding down: bath time, painting, bedtime.' }
];

// Record every game's strings once
GAMES.forEach(g => {
  T(`g.${g.id}.name`, g.name); T(`g.${g.id}.short`, g.short); T(`g.${g.id}.sub`, g.sub); T(`g.${g.id}.practise`, g.practise);
});
Object.entries(SKILLS).forEach(([k, v]) => T('skill.' + k, v));
T('ui.gamesArrow', 'games →'); T('filter.all', 'All'); T('filter.age1', 'Ages 1+'); T('filter.age2', 'Ages 2+');
CATS.forEach(c => { T('cat.' + c.key, c.name); T('cat.' + c.key + '.text', c.text); });

/* =====================================================================
   Shared pieces
   ===================================================================== */
const NAV = [
  ['index.html', 'nav.home', 'Home', 'home'],
  ['games/index.html', 'nav.games', 'Games', 'games'],
  ['parents.html', 'nav.parents', 'For parents', 'parents'],
  ['about.html', 'nav.about', 'About', 'about']
];

function head({ p, titleKey, title, descKey, desc, canonical, ld, theme = '#fff8ef' }) {
  T(titleKey, title); T(descKey, desc);
  return `<!DOCTYPE html>
<html lang="en" class="no-js" data-i18n-title="${titleKey}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" data-i18n-attr="content:${descKey}">
  <link rel="canonical" href="${SITE}${canonical}">
  <meta name="theme-color" content="${theme}">
  <link rel="icon" href="${p}assets/img/logo.svg" type="image/svg+xml">
  <link rel="icon" href="${p}assets/img/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="${p}assets/img/apple-touch-icon.png">
  <link rel="manifest" href="${p}site.webmanifest">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Pienipeli">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Pienipeli">
  <meta property="og:title" content="${esc(title.replace(/ [|·] Pienipeli$/, ''))}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${SITE}${canonical}">
  <meta property="og:image" content="${SITE}assets/img/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Pienipeli: little games for little hands">
  <meta property="og:locale" content="en_GB">
  <meta property="og:locale:alternate" content="fi_FI">
  <meta property="og:locale:alternate" content="bn_BD">
  <meta property="og:locale:alternate" content="tr_TR">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preload" href="${p}assets/fonts/fredoka-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${p}assets/css/site.css">
  <link rel="stylesheet" href="${p}assets/css/pikku.css">
  <script src="${p}assets/js/i18n.js"></script>
${ld ? `  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2).replace(/^/gm, '  ')}\n  </script>\n` : ''}</head>`;
}

function header(p, current) {
  const items = NAV.map(([href, key, label, icon]) =>
    `          <li><a href="${p}${href}"${icon === current ? ' aria-current="page"' : ''}>${ICON[icon]}<span ${X(key, label)}</span></a></li>`).join('\n');
  return `<body>
  <a class="skip" href="#main" ${X('ui.skip', 'Skip to content')}</a>

  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${p}index.html" ${A('aria-label', 'ui.homeLink', 'Pienipeli home')}>
        <img src="${p}assets/img/logo.svg" alt="" width="42" height="42">
        <span>Pienipeli</span>
      </a>
      <nav class="site-nav" ${A('aria-label', 'nav.label', 'Main')}>
        <ul class="nav">
${items}
        </ul>
      </nav>
      <div class="lang-picker" data-lang-picker></div>
    </div>
  </header>
`;
}

function footer(p, scripts = '') {
  return `
  <footer class="site-footer">
    <svg class="footer-wave" viewBox="0 0 1440 34" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 34V18C120 4 240 4 360 14s240 22 360 12S960 0 1080 4s240 20 360 14v16z"/></svg>
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-about">
          <a class="brand brand-small" href="${p}index.html">
            <img src="${p}assets/img/logo.svg" alt="" width="32" height="32">
            <span>Pienipeli</span>
          </a>
          <p ${X('footer.tagline', 'Little games for little hands. Free, gentle and made to be played together.')}</p>
          <span class="stamp" ${X('footer.stamp', 'No ads · No sign-up · No tracking')}</span>
        </div>
        <div>
          <h2 ${X('footer.games', 'Games')}</h2>
          <ul class="two-col">
            ${GAMES.map(g => `<li><a href="${p}games/${g.id}/index.html" data-i18n="g.${g.id}.short">${g.short}</a></li>`).join('\n            ')}
          </ul>
        </div>
        <div>
          <h2>Pienipeli</h2>
          <ul>
            <li><a href="${p}games/index.html" ${X('footer.allGames', 'All games')}</a></li>
            <li><a href="${p}parents.html" ${X('nav.parents', 'For parents')}</a></li>
            <li><a href="${p}parents.html#faq" ${X('footer.faq', 'Questions & answers')}</a></li>
            <li><a href="${p}about.html" ${X('nav.about', 'About')}</a></li>
            <li><a href="${p}privacy.html" ${X('footer.privacy', 'Privacy')}</a></li>
            <li><a href="mailto:hello@pienipeli.fi">hello@pienipeli.fi</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span id="year">2026</span> Pienipeli · pienipeli.fi</span>
        <span ${X('footer.free', 'Free to play, in any browser')}</span>
      </div>
    </div>
  </footer>
${scripts}  <script src="${p}assets/js/app.js" defer></script>
  <script src="${p}assets/js/site.js" defer></script>
</body>
</html>
`;
}

const pic = (p, id, cls = '') => `<img class="${cls}" src="${p}assets/animals/${id}.svg" alt="" width="200" height="200" loading="lazy" draggable="false">`;
/* Pikku, the mascot (styles: assets/css/pikku.css, character sheet: assets/mascot/README.md).
   pikku(): full body with a blink. sizes = the CSS width it is shown at, so the browser
   downloads the smallest picture that is sharp enough. */
function pikku(p, { cls = '', sizes = '200px', alt = '', eager = false } = {}) {
  const m = `${p}assets/mascot/pikku`;
  return `<span class="pikku ${cls}"><span class="pikku-body"><img src="${m}-480.webp" srcset="${m}-240.webp 240w, ${m}-480.webp 480w, ${m}-800.webp 800w" sizes="${sizes}" width="480" height="542" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async" draggable="false"><span class="pikku-lids" aria-hidden="true"><i></i><i></i></span></span></span>`;
}
const pikkuFace = (p, cls = '', big = false) =>
  `<span class="pikku-face ${cls}" aria-hidden="true"><img src="${p}assets/mascot/pikku-face-${big ? 192 : 96}.webp"${big ? '' : ` srcset="${p}assets/mascot/pikku-face-96.webp 1x, ${p}assets/mascot/pikku-face-192.webp 2x"`} alt="" width="96" height="96" loading="lazy" decoding="async" draggable="false"></span>`;
const peek = (id, side = 'r', p = '') => `<span class="peek peek-${side}" aria-hidden="true">${pic(p, id)}</span>`;
const peekPikku = (side = 'r', p = '') => `<span class="peek peek-${side} peek-pikku" aria-hidden="true">${pikkuFace(p, '', true)}</span>`;
const DECO_COLORS = ['#ff8a7a', '#ffd166', '#7fd3f7', '#7fe0b0', '#c3a6ff', '#ffa6cf', '#ffbd7a'];
const DECO_KINDS = ['star', 'dot', 'ring', 'plus', 'squig', 'tri'];
function deco(seed, n = 7) {
  let x = seed * 9301 + 49297;
  const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  let out = '';
  for (let i = 0; i < n; i++) {
    const k = DECO_KINDS[Math.floor(r() * DECO_KINDS.length)];
    const side = i % 2 ? 78 + r() * 18 : 2 + r() * 16;
    out += `<i class="d d-${k}" style="--x:${side.toFixed(1)}%;--y:${(8 + r() * 80).toFixed(1)}%;--s:${Math.round(16 + r() * 22)}px;--c:${DECO_COLORS[Math.floor(r() * DECO_COLORS.length)]};--r:${Math.round(r() * 360)}deg;--t:${(5 + r() * 5).toFixed(1)}s;--dl:${(-r() * 6).toFixed(1)}s"></i>`;
  }
  return `<div class="decos" aria-hidden="true">${out}</div>`;
}
const sky = (hills = true) => `<div class="sky" aria-hidden="true"><span class="sun"><i></i></span><span class="cloud c1"></span><span class="cloud c2"></span><span class="cloud c3"></span>${hills ? '<span class="hill h1"></span><span class="hill h2"></span>' : ''}</div>`;
const randomList = (p) => GAMES.map(g => `${p}games/${g.id}/index.html`).join(' ');

function card(g, p, { showNew = true } = {}) {
  return `<article class="game-card reveal" data-game="${g.id}" data-tags="${g.tags.join(' ')}">
            ${showNew && g.isNew ? `<span class="new" ${X('ui.new', 'NEW')}</span>` : ''}
            <div class="art" aria-hidden="true">
              <img src="${p}games/${g.id}/card-art.svg" alt="" width="640" height="400" loading="lazy" decoding="async">
              <span class="play-dot">${ICON.play}</span>
              ${g.pikku ? `<span class="pikku-pick">${pikkuFace(p)}<span data-i18n="pikku.pick">${T('pikku.pick', 'Pikku’s pick')}</span></span>` : ''}
            </div>
            <div class="body">
              <div class="top">
                <h3><a href="${p}games/${g.id}/index.html" data-i18n="g.${g.id}.name">${g.name}</a></h3>
                <span class="age"><span ${X('ui.ages', 'Ages')}</span> ${g.age}</span>
              </div>
              <p class="sub" data-i18n="g.${g.id}.sub">${esc(g.sub)}</p>
              <ul class="skills" ${A('aria-label', 'ui.practise', 'What they practise')}>${g.skills.map(s => `<li data-i18n="skill.${s}">${esc(SKILLS[s])}</li>`).join('')}</ul>
            </div>
          </article>`;
}

const promiseRibbon = () => `
    <div class="ribbon">
      <ul ${A('aria-label', 'promise.label', 'Our promise')}>
        <li>${ICON.noads} <span ${X('promise.noAds', 'No ads, ever')}</span></li>
        <li>${ICON.user} <span ${X('promise.noSignup', 'No sign-up')}</span></li>
        <li>${ICON.shield} <span ${X('promise.noTracking', 'No tracking')}</span></li>
        <li>${ICON.heart} <span ${X('promise.noLosing', 'No losing')}</span></li>
        <li>${ICON.offline} <span ${X('promise.offline', 'Works offline')}</span></li>
      </ul>
    </div>`;

/* =====================================================================
   Home
   ===================================================================== */
const ORG = { '@type': 'Organization', '@id': SITE + '#org', name: 'Pienipeli', url: SITE, logo: SITE + 'assets/img/icon-512.png', email: 'hello@pienipeli.fi' };
const home = head({
  p: '', canonical: '', titleKey: 'home.title', title: 'Free Games for Toddlers (1–4), No Ads, No Sign-up | Pienipeli',
  descKey: 'home.desc', desc: `${GAMES.length} gentle, free games for babies and toddlers aged 1–4: ABC and counting, music, building, racing, peekaboo and more. No ads, no sign-up, no tracking, no losing. Plays in any browser.`,
  ld: { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebSite', '@id': SITE + '#website', name: 'Pienipeli', alternateName: 'Pienipeli: free toddler games', url: SITE, inLanguage: ['en', 'fi', 'bn', 'tr'], publisher: { '@id': SITE + '#org' } }] }
}) + header('', 'home') + `
  <main id="main">
    <!-- ============ Hero ============ -->
    <section class="hero" id="hero" aria-labelledby="hero-title">
      ${sky()}
      <div class="hero-balloons" id="heroBalloons" aria-hidden="true"></div>
      <div class="hero-tools">
        <button class="sound-toggle" id="soundToggle" type="button" aria-pressed="true" ${A('aria-label', 'ui.sound', 'Sound on or off')} hidden>
          <span class="on" aria-hidden="true">🔊</span><span class="off" aria-hidden="true">🔇</span>
        </button>
        <div class="pop-count" id="popCount" aria-live="polite" hidden><b>0</b> <span class="pop-label" ${X('home.popped', 'popped!')}</span></div>
      </div>

      <div class="wrap hero-grid">
        <div>
          <span class="sticker-label"><i></i> <span ${X('home.sticker', '100% free · for ages 1–4')}</span></span>
          <h1 id="hero-title" ${XH('home.h1', 'Little games <span class="line2">for <span class="rainbow">little hands.</span></span>')}</h1>
          <p class="lead" ${X('home.lead', 'Gentle, happy games that play right in the browser. Safe to hand over: nothing to buy, nothing to win or lose, just giggles.')}</p>
          <div class="cta-row">
            <a class="btn btn-primary btn-big" href="games/index.html">${ICON.play} <span ${X('home.play', 'Play games')}</span></a>
            <a class="btn btn-sun" href="games/peekaboo/index.html" data-random="${randomList('')}">${ICON.dice} <span ${X('ui.surprise', 'Surprise me')}</span></a>
          </div>
          <ul class="trust" ${A('aria-label', 'promise.label', 'Our promise')}>
            <li>${ICON.noads}<span ${X('trust.noAds', 'No ads')}</span></li>
            <li>${ICON.user}<span ${X('trust.noSignup', 'No sign-up')}</span></li>
            <li>${ICON.shield}<span ${X('trust.noTracking', 'No tracking')}</span></li>
          </ul>
          <p class="note hint" aria-hidden="true"><span ${X('home.hint', 'psst… try popping a balloon')}</span> ${ICON.arrowNote}</p>
        </div>

        <div class="hero-stage">
          <div class="shelf" aria-hidden="true">
            ${['peekaboo', 'animal-band'].map(id => `<a class="shelf-card" href="games/${id}/index.html" tabindex="-1"><span class="tape"></span><img src="games/${id}/card-art.svg" alt="" width="640" height="400"><b data-i18n="g.${id}.name">${byId[id].name}</b></a>`).join('\n            ')}
          </div>
          <div class="hero-pikku">
            <p class="pikku-say tail-left" id="pikkuSay" aria-live="polite"><span class="say-greet" ${XH('pikku.greet', 'Hei! I’m Pikku. <b>Let’s play!</b>')}</span><span class="say-line" hidden></span></p>
            <button class="pikku-btn" id="pikkuBtn" type="button" ${A('aria-label', 'pikku.hi', 'Say hi to Pikku the lion cub')}>${pikku('', { sizes: '(max-width: 760px) 120px, (max-width: 980px) 210px, 250px', eager: true })}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Kinds of games ============ -->
    <section class="band band-grass" aria-labelledby="cats-title">
      ${deco(3)}
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <span class="eyebrow" ${X('home.cats.eyebrow', 'Where to start')}</span>
            <h2 id="cats-title" ${XH('home.cats.h', 'Choose a <span class="marker">kind of game</span>')}</h2>
          </div>
          <a class="btn btn-small" href="games/index.html"><span ${X('home.allGames', 'See all games')}</span> <span class="n">${GAMES.length}</span></a>
        </div>
        <div class="cats">
          ${CATS.map(c => `<a class="cat-tile cat-${c.color} reveal" href="games/index.html#${c.tag}">
            <span class="faces" aria-hidden="true">${c.pics.map(id => pic('', id)).join('')}</span>
            <h3 data-i18n="cat.${c.key}">${esc(c.name)}</h3>
            <p data-i18n="cat.${c.key}.text">${esc(c.text)}</p>
            <span class="cat-foot"><span class="age"><span data-i18n="ui.ages">Ages</span> ${c.ages}</span><span class="go"><span class="n">${count(c.tag)}</span> <span data-i18n="ui.gamesArrow">games →</span></span></span>
          </a>`).join('\n          ')}
        </div>
      </div>
    </section>

    <!-- ============ New games ============ -->
    <section class="band band-sun wave" aria-labelledby="new-title">
      ${deco(7)}${peek('chicken', 'l')}
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <span class="eyebrow" ${X('home.new.eyebrow', 'Fresh on the shelf')}</span>
            <h2 id="new-title" ${X('home.new.h', 'New this month')}</h2>
            <p ${X('home.new.p', 'Letters, numbers, building, racing and cake decorating. No reading needed, just music and lots to tap.')}</p>
          </div>
          <a class="link-arrow" href="games/index.html"><span ${X('home.allGames', 'See all games')}</span> <span>→</span></a>
        </div>
        <div class="game-grid scroll-row">
          ${GAMES.filter(g => g.isNew).slice(0, 5).map(g => card(g, '')).join('\n          ')}
          <a class="game-card more-card reveal" href="games/index.html" data-game="baby-pop">
            <div class="body more-body">
              <span class="more-top"><span class="age-num" aria-hidden="true">+${GAMES.length - 5}</span>${pikkuFace('', 'more-pikku')}</span>
              <h3 ${X('home.more.h', 'More games for you to discover')}</h3>
              <span class="link-arrow"><span ${X('home.allGames', 'See all games')}</span> <span>→</span></span>
            </div>
          </a>
        </div>
      </div>
    </section>
${promiseRibbon()}

    <!-- ============ Animal playground (built by site.js; hidden without JavaScript) ============ -->
    <section id="play" class="band band-sky wave" hidden aria-labelledby="play-title">
      ${deco(11)}${peek('dog')}
      <div class="wrap">
        <div class="playground reveal">
          <div class="section-head">
            <div>
              <span class="eyebrow" ${X('home.play.eyebrow', 'Try it right here')}</span>
              <h2 id="play-title" ${X('home.play.h', 'Say hi to the animals')}</h2>
              <p ${X('home.play.p', 'Tap a friend to hear them.')}</p>
            </div>
            <button class="btn btn-small btn-mint" id="zooShuffle" type="button">${ICON.dice} <span ${X('home.play.shuffle', 'New friends')}</span></button>
          </div>
          <div class="zoo" id="zoo" role="group" ${A('aria-label', 'home.play.group', 'Animals')}></div>
        </div>
      </div>
    </section>

    <!-- ============ For grown-ups ============ -->
    <section class="band band-pink wave" aria-labelledby="grownups-title">
      ${deco(5)}${peek('panda', 'l')}
      <div class="wrap">
        <div class="callout reveal">
          <div>
            <span class="eyebrow" ${X('home.parents.eyebrow', 'For grown-ups')}</span>
            <h2 id="grownups-title" ${X('home.parents.h', 'Made to be safe, from the first tap')}</h2>
            <p ${X('home.parents.p', 'No accounts, no ads and nothing tracked. Put a game on your home screen so it opens full screen like an app, and see what each game practises.')}</p>
            <a class="btn" href="parents.html"><span ${X('home.parents.btn', 'Read the parents’ guide')}</span></a>
          </div>
          <ul>
            <li>${ICON.lock} <a href="privacy.html"><span ${X('home.parents.privacy', 'Our privacy promise')}</span></a></li>
            <li>${ICON.phone} <a href="parents.html#setup"><span ${X('home.parents.setup', 'Add a game to the home screen')}</span></a></li>
            <li>${ICON.sparkle} <a href="parents.html#skills"><span ${X('home.parents.skills', 'What each game practises')}</span></a></li>
          </ul>
        </div>
      </div>
    </section>
  </main>
` + footer('', `  <script src="games/find-the-animal/sounds.js" defer></script>\n`);

/* =====================================================================
   All games
   ===================================================================== */
const FILTERS = [
  ['all', 'filter.all', 'All', GAMES.length],
  ['age-1', 'filter.age1', 'Ages 1+', count('age-1')],
  ['age-2', 'filter.age2', 'Ages 2+', count('age-2')],
  ['abc', 'cat.abc', 'ABC & 123', count('abc')],
  ['music', 'cat.music', 'Music', count('music')],
  ['build', 'cat.build', 'Build & race', count('build')],
  ['calm', 'cat.calm', 'Calm & creative', count('calm')]
];
const gamesLd = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'CollectionPage', name: 'All games · Pienipeli', url: SITE + 'games/', isPartOf: { '@id': SITE + '#website' } },
  { '@type': 'ItemList', itemListElement: GAMES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}games/${g.id}/`, name: g.name })) },
  ...GAMES.map(g => ({ '@type': 'VideoGame', '@id': `${SITE}games/${g.id}/#game`, name: g.name, url: `${SITE}games/${g.id}/`, description: g.ld,
    image: `${SITE}assets/img/og-image.png`, genre: ['Educational', 'Casual', 'Kids'], gamePlatform: ['Web browser', 'Mobile', 'Tablet', 'Desktop'],
    applicationCategory: 'Game', operatingSystem: 'Any', inLanguage: 'en', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    audience: { '@type': 'PeopleAudience', suggestedMinAge: Number(g.age[0]), suggestedMaxAge: Number(g.age.slice(-1)) },
    publisher: { '@type': 'Organization', name: 'Pienipeli', url: SITE } })),
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Pienipeli', item: SITE },
    { '@type': 'ListItem', position: 2, name: 'Games', item: SITE + 'games/' }] }
] };
const gamesPage = head({
  p: '../', canonical: 'games/', titleKey: 'games.title', title: 'All Games for Toddlers · Free, No Ads | Pienipeli',
  descKey: 'games.desc', desc: `All ${GAMES.length} free Pienipeli games for ages 1–4: letters and numbers, music, building, racing and calm play. No ads, no downloads, no losing.`,
  ld: gamesLd
}) + header('../', 'games') + `
  <main id="main">
    <header class="page-hero hero-sky">
      ${sky(false)}${deco(21, 6)}
      <div class="wrap">
        <div class="page-head">
          <p class="crumbs"><a href="../index.html" ${X('nav.home', 'Home')}</a> / <span ${X('nav.games', 'Games')}</span></p>
          <h1 ${XH('games.h1', 'All <span class="squiggle">games</span>')}</h1>
          <p class="lead" ${X('games.lead', 'Every game is free and safe to hand over. Tap one to play: it opens full screen on any phone, tablet or computer.')}</p>
        </div>
      </div>
    </header>
    <div class="wrap">
      <ul class="filters" id="filters" ${A('aria-label', 'filter.label', 'Show games')} hidden>
        ${FILTERS.map(([f, key, label, n], i) => `<li><button class="chip" type="button" data-filter="${f}" aria-pressed="${i === 0}"><span data-i18n="${key}">${esc(label)}</span> <span class="n">${n}</span></button></li>`).join('\n        ')}
      </ul>
      <h2 class="sr-only" ${X('games.listH', 'Game list')}</h2>
      <div class="game-grid" id="gameGrid">
          ${GAMES.map(g => card(g, '../')).join('\n          ')}
      </div>
      <div class="empty" id="empty">
        ${pikku('../', { cls: 'empty-pikku', sizes: '140px' })}
        <p class="pikku-say"><span ${X('games.empty', 'No games here yet.')}</span> <span ${X('pikku.empty', 'Let’s try another button!')}</span></p>
      </div>
    </div>
${promiseRibbon()}
    <section class="band band-sky wave" style="padding-bottom:70px">
      ${deco(23)}${peekPikku('r', '../')}
      <div class="wrap wrap-narrow center">
        <h2 class="h-md" ${X('games.choose.h', 'Can’t choose?')}</h2>
        <p ${X('games.choose.p', 'Let the dice pick. Every game is safe to hand straight to a little one.')}</p>
        <a class="btn btn-sun" href="peekaboo/index.html" data-random="${randomList('')}">${ICON.dice} <span ${X('ui.surprise', 'Surprise me')}</span></a>
      </div>
    </section>
  </main>
` + footer('../');

/* =====================================================================
   For parents
   ===================================================================== */
const FAQ = [
  ['free', 'Are Pienipeli games really free?', 'Yes. Every game is completely free to play. There are no in-app purchases, subscriptions or hidden costs, and there never will be.'],
  ['ads', 'Do the games have ads?', 'No. Pienipeli has no ads at all, so there is nothing for little fingers to tap by accident.'],
  ['age', 'What age are the games for?', 'Babies and toddlers, roughly ages 1 to 4. Each game shows a suggested age. They need no reading, and every tap does something fun.'],
  ['install', 'Do I need to download anything or sign up?', 'No. The games run in your web browser on phones, tablets (including iPad) and computers. There is no app to download and no account to create.'],
  ['data', 'Do you collect any data about my child?', 'No. There are no accounts, analytics, cookies or trackers. A few small settings (like sound on or off and your language) are saved only on your own device.'],
  ['leave', 'How can I stop my toddler from leaving the game?', 'Tap the full-screen button in the game. On iPhone and iPad you can also use Guided Access (Settings → Accessibility → Guided Access) to keep the screen on one game.'],
  ['homescreen', 'Can I put a game on my home screen like an app?', 'Yes. On iPhone or iPad tap Share, then Add to Home Screen. On Android open the browser menu and choose Install app or Add to Home screen. Each game gets its own icon, opens full screen, and works without internet once it has been opened.'],
  ['words', 'Do the games talk or use words?', 'Only Find the Animal speaks (it asks “Where is the cat?”). The other games use no speech at all: just music, chimes and playful animal sounds. The letter games show short words for grown-ups to read aloud.'],
  ['howlong', 'How long should my toddler play?', 'Short and sweet is best: a few minutes together, then off to something else. The games never push to keep playing: no streaks, rewards or “one more level”.']
];
const plain = (s) => s.replace(/[“”]/g, '"').replace(/’/g, "'");
const parents = head({
  p: '', canonical: 'parents', titleKey: 'parents.title', title: 'For Parents: Safety, Setup, Tips & FAQ | Pienipeli',
  descKey: 'parents.desc', desc: 'Pienipeli is free, ad-free and tracker-free. How to put a game on your home screen, lock the screen for little hands, what each game practises, and answers to common questions.',
  ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'FAQPage', '@id': SITE + 'parents#faq',
    mainEntity: FAQ.map(([, q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) }] }
}) + header('', 'parents') + `
  <main id="main">
    <header class="page-hero hero-mint">
      ${deco(31, 8)}
      <div class="wrap">
        <div class="page-head">
          <p class="crumbs"><a href="index.html" ${X('nav.home', 'Home')}</a> / <span ${X('nav.parents', 'For parents')}</span></p>
          <h1 ${XH('parents.h1', 'For <span class="squiggle">grown-ups</span>')}</h1>
          <p class="lead" ${X('parents.lead', 'Everything you need to hand over the phone with a calm mind: what we promise, how to set things up, and what each game is good for.')}</p>
          <div class="toc">
            <a class="btn btn-small" href="#promise" ${X('parents.toc.promise', 'Our promise')}</a>
            <a class="btn btn-small" href="#setup" ${X('parents.toc.setup', 'Set up like an app')}</a>
            <a class="btn btn-small" href="#skills" ${X('parents.toc.skills', 'What they practise')}</a>
            <a class="btn btn-small" href="#tips" ${X('parents.toc.tips', 'Playing together')}</a>
            <a class="btn btn-small" href="#faq" ${X('parents.toc.faq', 'Questions')}</a>
          </div>
        </div>
      </div>
    </header>

    <section class="section" id="promise" aria-labelledby="promise-title">
      <div class="wrap">
        <div class="section-head reveal"><div><span class="eyebrow" ${X('parents.promise.eyebrow', 'Our promise')}</span><h2 id="promise-title" ${X('parents.promise.h', 'Six things that are true in every game')}</h2></div></div>
        <ul class="promises">
          <li class="reveal" style="--c:var(--pink)"><span class="ic">${ICON.noads}</span><h3 ${X('parents.p1.h', 'No ads, no purchases')}</h3><p ${X('parents.p1.p', 'Nothing to buy and nothing to tap by accident. Every game is free.')}</p></li>
          <li class="reveal" style="--c:var(--sky)"><span class="ic">${ICON.user}</span><h3 ${X('parents.p2.h', 'No sign-up')}</h3><p ${X('parents.p2.p', 'No accounts, no emails, no passwords. Just open a game and play.')}</p></li>
          <li class="reveal" style="--c:var(--mint)"><span class="ic">${ICON.shield}</span><h3 ${X('parents.p3.h', 'No tracking')}</h3><p ${X('parents.p3.p', 'No analytics, cookies or third-party scripts. We know nothing about your child.')}</p></li>
          <li class="reveal" style="--c:var(--sun)"><span class="ic">${ICON.heart}</span><h3 ${X('parents.p4.h', 'No losing')}</h3><p ${X('parents.p4.p', 'No timers, scores or game-over screens. A “wrong” tap just gets a silly wiggle.')}</p></li>
          <li class="reveal" style="--c:var(--lilac)"><span class="ic">${ICON.baby}</span><h3 ${X('parents.p5.h', 'Made for ages 1–4')}</h3><p ${X('parents.p5.p', 'Simple ideas, big buttons, no reading needed, and a hand that shows how to play.')}</p></li>
          <li class="reveal" style="--c:var(--peach)"><span class="ic">${ICON.lock}</span><h3 ${X('parents.p6.h', 'Hard to leave by accident')}</h3><p ${X('parents.p6.p', 'Full screen, no zooming during play, and the grown-up buttons tucked into the corners.')}</p></li>
        </ul>
        <p class="center" style="margin-top:28px"><a class="link-arrow" href="privacy.html"><span ${X('parents.privacyLink', 'Read exactly what is (and isn’t) stored')}</span> <span>→</span></a></p>
      </div>
    </section>

    <section class="band band-lilac wave" id="setup" aria-labelledby="setup-title">
      ${deco(33)}${peek('owl')}
      <div class="wrap"><div class="narrow">
        <div class="section-head reveal"><div><span class="eyebrow" ${X('parents.setup.eyebrow', 'Five-minute setup')}</span><h2 id="setup-title" ${X('parents.setup.h', 'Make a game feel like an app')}</h2><p ${X('parents.setup.p', 'Each game can live on your home screen with its own icon. It opens full screen and keeps working without internet.')}</p></div></div>
        <div class="tabs reveal" id="setupTabs">
          <div class="tab-list" role="tablist" ${A('aria-label', 'parents.setup.device', 'Device')}>
            <button type="button" role="tab" id="tab-ios" aria-controls="panel-ios" aria-selected="true" ${X('parents.tab.ios', 'iPhone & iPad')}</button>
            <button type="button" role="tab" id="tab-android" aria-controls="panel-android" aria-selected="false" tabindex="-1" ${X('parents.tab.android', 'Android')}</button>
            <button type="button" role="tab" id="tab-desktop" aria-controls="panel-desktop" aria-selected="false" tabindex="-1" ${X('parents.tab.desktop', 'Computer')}</button>
          </div>
          <div class="tab-panel" role="tabpanel" id="panel-ios" aria-labelledby="tab-ios">
            <h3 ${X('parents.ios.h', 'iPhone & iPad (Safari)')}</h3>
            <ol>
              <li ${X('parents.ios.1', 'Open the game you want.')}</li>
              <li ${XH('parents.ios.2', 'Tap the <b>Share</b> button, then <b>Add to Home Screen</b>.')}</li>
              <li ${X('parents.ios.3', 'Open the game from its new icon: no Safari bars, the whole screen is the game.')}</li>
            </ol>
            <p ${XH('parents.ios.safe', '<b>Extra safe:</b> turn on <b>Guided Access</b> (Settings → Accessibility → Guided Access). Triple-click the side button in a game and little fingers can’t leave it.')}</p>
          </div>
          <div class="tab-panel" role="tabpanel" id="panel-android" aria-labelledby="tab-android">
            <h3 ${X('parents.android.h', 'Android (Chrome)')}</h3>
            <ol>
              <li ${X('parents.ios.1', 'Open the game you want.')}</li>
              <li ${XH('parents.android.2', 'Tap the menu <b>⋮</b>, then <b>Install app</b> or <b>Add to Home screen</b>.')}</li>
              <li ${X('parents.android.3', 'Open it from the icon. It runs full screen, with no browser bars.')}</li>
            </ol>
            <p ${XH('parents.android.safe', '<b>Extra safe:</b> use <b>App pinning</b> (Settings → Security → App pinning) to keep the screen on the game.')}</p>
          </div>
          <div class="tab-panel" role="tabpanel" id="panel-desktop" aria-labelledby="tab-desktop">
            <h3 ${X('parents.desktop.h', 'Laptop or computer')}</h3>
            <ol>
              <li ${XH('parents.desktop.1', 'Open a game and press the <b>⛶</b> button in its corner for full screen.')}</li>
              <li ${X('parents.desktop.2', 'Every key does something fun, so keyboard bashing is welcome.')}</li>
              <li ${XH('parents.desktop.3', 'Press <b>Esc</b> to leave full screen.')}</li>
            </ol>
            <p ${X('parents.desktop.p', 'In Chrome or Edge you can also install a game from the install icon in the address bar.')}</p>
          </div>
        </div>
      </div></div>
    </section>

    <section class="band band-sun wave" id="skills" aria-labelledby="skills-title">
      ${deco(35)}
      <div class="wrap">
        <div class="section-head reveal"><div><span class="eyebrow" ${X('parents.skills.eyebrow', 'Little lessons')}</span><h2 id="skills-title" ${X('parents.skills.h', 'What each game practises')}</h2><p ${X('parents.skills.p', 'Nothing here is a test. But a lot is going on while they play.')}</p></div></div>
        <div class="table-scroll reveal">
          <table class="skill-table">
            <thead><tr><th scope="col" ${X('parents.table.game', 'Game')}</th><th scope="col" ${X('ui.ages', 'Ages')}</th><th scope="col" ${X('ui.practise', 'What they practise')}</th></tr></thead>
            <tbody>
              ${GAMES.map(g => `<tr><th scope="row"><a href="games/${g.id}/index.html" data-i18n="g.${g.id}.short">${g.short}</a></th><td>${g.age}</td><td data-i18n="g.${g.id}.practise">${esc(g.practise)}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="band band-base wave" id="tips" aria-labelledby="tips-title">
      ${peek('bear', 'l')}
      <div class="wrap">
        <div class="section-head reveal"><div><span class="eyebrow" ${X('parents.tips.eyebrow', 'Playing together')}</span><h2 id="tips-title" ${X('parents.tips.h', 'Six small tips')}</h2></div></div>
        <ol class="tips">
          ${[['t1', 'Sit with them', 'Games for this age work best as a shared moment. Your voice is the best part.'],
             ['t2', 'Name what you see', '“A red balloon!” “The big bear!” Most games have no words on purpose, so you can add yours.'],
             ['t3', 'Keep it short', 'A few minutes is plenty. Stop while it’s still fun.'],
             ['t4', 'Let them lead', 'Mashing the screen is playing too. There’s no wrong way, and no way to lose.'],
             ['t5', 'Copy the sounds', 'Moo with the cow, hum the lullaby. Little ones love it when you join in.'],
             ['t6', 'End calm', 'Bedtime and Bubble Bath slow things down. Nice ones to finish with.']]
            .map(([k, h, p]) => `<li class="reveal"><h3 ${X('parents.' + k + '.h', h)}</h3><p ${X('parents.' + k + '.p', p)}</p></li>`).join('\n          ')}
        </ol>
      </div>
    </section>

    <section class="band band-pink wave" id="faq" aria-labelledby="faq-title">
      ${deco(37)}${peek('lion')}
      <div class="wrap"><div class="narrow">
        <div class="section-head reveal"><div><span class="eyebrow" ${X('parents.faq.eyebrow', 'FAQ')}</span><h2 id="faq-title" ${X('parents.faq.h', 'Questions parents ask')}</h2></div></div>
        <div class="faq reveal">
          ${FAQ.map(([k, q, a]) => `<details>
            <summary ${X('faq.' + k + '.q', q)}</summary>
            <p ${X('faq.' + k + '.a', a)}</p>
          </details>`).join('\n          ')}
        </div>
        <p class="muted" style="margin-top:26px"><span ${X('parents.more', 'Something else? Email')}</span> <a href="mailto:hello@pienipeli.fi">hello@pienipeli.fi</a></p>
      </div></div>
    </section>
  </main>
` + footer('');

/* =====================================================================
   About
   ===================================================================== */
const about = head({
  p: '', canonical: 'about', titleKey: 'about.title', title: 'About Pienipeli: Little Games for Little Hands',
  descKey: 'about.desc', desc: 'Pienipeli means "little game" in Finnish. Why we make gentle, free, ad-free games for babies and toddlers, and how they are built.'
}) + header('', 'about') + `
  <main id="main">
    <header class="page-hero hero-pink">
      ${deco(41, 8)}
      <div class="wrap">
        <div class="page-head">
          <p class="crumbs"><a href="index.html" ${X('nav.home', 'Home')}</a> / <span ${X('nav.about', 'About')}</span></p>
          <h1 ${XH('about.h1', 'Small games, <span class="squiggle">on purpose</span>')}</h1>
          <p class="lead" ${X('about.lead', 'Pienipeli is a small collection of browser games for the youngest players, first made for our own children and now shared with families everywhere.')}</p>
        </div>
      </div>
    </header>
    <div class="wrap">
      <div class="about-grid">
        <div class="prose reveal">
          <h2 ${X('about.why.h', 'Why we make them')}</h2>
          <p ${XH('about.why.p1', 'Most apps for little kids are built to keep them tapping: rewards, streaks, ads, “just one more”. We wanted the opposite: <strong>games you can hand over without worrying</strong>, that are happy to end after five minutes.')}</p>
          <p ${X('about.why.p2', 'So every Pienipeli game is about cause and effect, sound, colour and first discoveries: letters, numbers, sizes and shapes. You tap, something lovely happens. Nobody fails, and nothing nags.')}</p>

          <h2 ${X('about.how.h', 'How they’re made')}</h2>
          <p ${XH('about.how.p1', 'Each game is a small web page. There are <strong>no audio files</strong>: every sound, animal call and lullaby is made live in the browser. That keeps the games tiny, quick to load, and able to work offline once opened.')}</p>
          <p ${XH('about.how.p2', 'Most games use <strong>no speech at all</strong>, so they work in any home and any language. The website itself can be read in English, Finnish, Bengali and Turkish.')}</p>

          <h2 ${X('about.never.h', 'What we’ll never do')}</h2>
          <ul class="principles">
            <li>${ICON.check}<span ${X('about.never.1', 'Show ads, sell anything, or ask for an account.')}</span></li>
            <li>${ICON.check}<span ${X('about.never.2', 'Track your child, or anyone. No analytics, no cookies.')}</span></li>
            <li>${ICON.check}<span ${X('about.never.3', 'Add timers, scores, streaks or “game over”.')}</span></li>
            <li>${ICON.check}<span ${X('about.never.4', 'Make a game harder to put down than it is to pick up.')}</span></li>
          </ul>
        </div>

        <aside class="reveal">
          <div class="word-card">
            <span class="tape" aria-hidden="true"></span>
            <p class="word" lang="fi">pieni peli</p>
            <p class="ipa"><span ${X('about.word.lang', 'Finnish')}</span> · /ˈpie̯ni ˈpeli/</p>
            <ol>
              <li><b lang="fi">pieni</b>: <span ${X('about.word.pieni', 'small, little')}</span></li>
              <li><b lang="fi">peli</b>: <span ${X('about.word.peli', 'game')}</span></li>
            </ol>
          </div>
          <div class="pikku-card">
            ${pikku('', { cls: 'about-pikku', sizes: '150px' })}
            <div>
              <h2 ${X('about.pikku.h', 'Meet Pikku')}</h2>
              <p ${X('about.pikku.p', 'Pikku is a friendly little lion cub and the face of Pienipeli. He waves hello, cheers when a game is done, and never, ever says “wrong”.')}</p>
            </div>
          </div>
          <div class="contact-card">
            <h2 ${X('about.hello.h', 'Say hello')}</h2>
            <p ${X('about.hello.p', 'Ideas, bugs, or a funny story about your toddler and our games? We’d love to hear it.')}</p>
            <p class="email"><a href="mailto:hello@pienipeli.fi">hello@pienipeli.fi</a></p>
          </div>
        </aside>
      </div>
    </div>
  </main>
` + footer('');

/* =====================================================================
   Privacy (kept in step with what the code really does)
   ===================================================================== */
const privacy = head({
  p: '', canonical: 'privacy', titleKey: 'privacy.title', title: 'Privacy · Pienipeli',
  descKey: 'privacy.desc', desc: 'Pienipeli collects no personal data: no accounts, no analytics, no cookies, no trackers. Here is exactly what stays on your own device.'
}) + header('', '') + `
  <main id="main">
    <header class="page-hero hero-lilac">
      ${deco(51, 6)}
      <div class="wrap wrap-narrow">
        <div class="page-head">
          <p class="crumbs"><a href="index.html" ${X('nav.home', 'Home')}</a> / <span ${X('footer.privacy', 'Privacy')}</span></p>
          <h1 ${X('privacy.h1', 'Privacy')}</h1>
          <p class="lead" ${X('privacy.lead', 'Short and simple, like our games.')}</p>
        </div>
      </div>
    </header>
    <div class="page-body">
      <div class="wrap">
        <div class="summary-card"><p ${XH('privacy.short', '<strong>In short:</strong> we don’t collect any personal information about you or your child.')}</p></div>

        <h2 ${X('privacy.dont.h', 'What we don’t do')}</h2>
        <ul>
          <li ${X('privacy.dont.1', 'No accounts, sign-ups or logins.')}</li>
          <li ${X('privacy.dont.2', 'No analytics, tracking pixels or advertising.')}</li>
          <li ${X('privacy.dont.3', 'No cookies.')}</li>
          <li ${X('privacy.dont.4', 'No third-party services or scripts. Fonts and all game files come from pienipeli.fi itself.')}</li>
        </ul>

        <h2 ${X('privacy.device.h', 'What stays on your device')}</h2>
        <p ${X('privacy.device.p', 'A few small settings are saved in your browser’s local storage, only so the games remember them next time. They never leave your device and are never sent to us:')}</p>
        <ul>
          <li ${X('privacy.device.1', 'your language choice,')}</li>
          <li ${X('privacy.device.2', 'sound and music on or off (and Baby Pop’s speed),')}</li>
          <li ${X('privacy.device.3', 'which games have already shown their “how to play” hand.')}</li>
        </ul>
        <p ${X('privacy.device.p2', 'To work offline, the site also keeps a copy of its own game files in your browser. You can remove all of this at any time by clearing the site data in your browser settings.')}</p>

        <h2 ${X('privacy.speech.h', 'Spoken words')}</h2>
        <p ${X('privacy.speech.p', 'Only Find the Animal speaks, using the voices built into your device or browser. We don’t send anything anywhere, but some browsers use an online voice service of their own. If you’d rather avoid that, turn the sound off in that game. Our other games don’t speak at all.')}</p>

        <h2 ${X('privacy.logs.h', 'Server logs')}</h2>
        <p ${X('privacy.logs.p', 'Like any website, the server that hosts pienipeli.fi may keep short-lived technical logs (such as IP addresses) to keep the site running and secure. We don’t use them to identify anyone.')}</p>

        <h2 ${X('privacy.contact.h', 'Contact')}</h2>
        <p><span ${X('privacy.contact.p', 'Questions? Email us at')}</span> <a href="mailto:hello@pienipeli.fi">hello@pienipeli.fi</a></p>

        <p class="muted"><em ${X('privacy.updated', 'Last updated: November 2026')}</em></p>
      </div>
    </div>
  </main>
` + footer('');

/* =====================================================================
   404 (absolute paths: it can be served at any URL)
   ===================================================================== */
const abs = (html) => html
  .replace(/(href|src)="\/index\.html"/g, '$1="/"').replace(/href="\/games\/index\.html"/g, 'href="/games/"')
  .replace(/href="\/games\/([a-z-]+)\/index\.html"/g, 'href="/games/$1/"').replace(/href="\/(parents|about|privacy)\.html/g, 'href="/$1');
const notFound = abs(head({ p: '/', canonical: '404', titleKey: 'nf.title', title: 'Page not found · Pienipeli', descKey: 'nf.desc', desc: 'This page floated away.' })
  .replace('<meta name="description"', '<meta name="robots" content="noindex">\n  <meta name="description"')
  + header('/', '') + `
  <main id="main" class="page-404 hero-sky">
    ${sky()}
    <div class="wrap">
      <div class="nf-pikku" aria-hidden="true">${pikku('/', { sizes: '170px', eager: true })}<span class="nf-balloon">🎈</span></div>
      <h1 ${X('nf.h1', 'Oops, this page floated away!')}</h1>
      <p class="lead" ${X('nf.p', 'We couldn’t find it. Let’s go somewhere fun instead.')}</p>
      <div class="cta-row">
        <a class="btn btn-primary btn-big" href="/games/">${ICON.play} <span ${X('home.play', 'Play games')}</span></a>
        <a class="btn" href="/" ${X('nf.home', 'Go home')}</a>
      </div>
    </div>
  </main>
` + footer('/'));

/* =====================================================================
   Strings used only by scripts (site.js, chrome.js, kit games)
   ===================================================================== */
const SCRIPT_STRINGS = {
  'lang.label': 'Language',
  'home.milestone.5': 'Yay!', 'home.milestone.10': 'Wow!', 'home.milestone.25': 'Super!', 'home.milestone.50': 'Pop star!', 'home.milestone.100': 'Amazing!',
  'home.rainbow': 'Rainbow!',
  'chrome.home': 'All games', 'chrome.soundOff': 'Sound off', 'chrome.soundOn': 'Sound on',
  'chrome.full': 'Full screen', 'chrome.exitFull': 'Exit full screen', 'chrome.restart': 'Start again', 'chrome.help': 'How to play',
  'chrome.iosTitle': 'Full screen on iPhone', 'chrome.ios1': 'Tap the Share button in Safari.', 'chrome.ios2': 'Choose Add to Home Screen.',
  'chrome.ios3': 'Open the game from its new icon: it fills the whole screen.', 'chrome.ok': 'OK',
  'chrome.noscript': 'This game needs JavaScript turned on.',
  // Pikku (home hero taps, game cheers, slow-loading screen)
  'pikku.tap.1': 'Roar! A tiny one.', 'pikku.tap.2': 'Pop a balloon with me!', 'pikku.tap.3': 'Hee hee, that tickles!',
  'pikku.tap.4': 'High five!', 'pikku.tap.5': 'You’re my best friend!',
  'pikku.yay': 'Yay!', 'pikku.loading': 'Loading…'
};
Object.entries(SCRIPT_STRINGS).forEach(([k, v]) => T(k, v));

/* =====================================================================
   Write
   ===================================================================== */
const out = {
  'index.html': home, 'games/index.html': gamesPage, 'parents.html': parents,
  'about.html': about, 'privacy.html': privacy, '404.html': notFound
};
for (const [f, html] of Object.entries(out)) fs.writeFileSync(path.join(ROOT, f), html);

const keys = Object.keys(EN).sort();
fs.mkdirSync(path.join(ROOT, 'assets/i18n'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets/i18n/en.js'),
  `/* English: the source language. Generated by tools/build-site.mjs from the page texts.\n   Other languages copy these keys (assets/i18n/<code>.js). */\nPP_I18N.add('en', ${JSON.stringify(Object.fromEntries(keys.map(k => [k, EN[k]])), null, 2)});\n`);

// Check other languages for missing keys
for (const f of fs.readdirSync(path.join(ROOT, 'assets/i18n'))) {
  if (!f.endsWith('.js') || f === 'en.js') continue;
  const dict = {};
  new Function('PP_I18N', fs.readFileSync(path.join(ROOT, 'assets/i18n', f), 'utf8'))({ add: (c, d) => Object.assign(dict, d) });
  const missing = keys.filter(k => !(k in dict));
  const extra = Object.keys(dict).filter(k => !(k in EN));
  console.log(`${f}: ${missing.length ? missing.length + ' missing: ' + missing.join(', ') : 'complete'}${extra.length ? ' | unused: ' + extra.join(', ') : ''}`);
}
console.log(`pages written, ${keys.length} English strings`);
