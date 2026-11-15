# Pienipeli

**Little games for little hands.** 🎈 [pienipeli.fi](https://pienipeli.fi)

Pienipeli (Finnish *pieni peli*, "little game") makes gentle, joyful browser games for babies
and toddlers. There are no ads, no purchases, no tracking, no scores and no losing.

This repository holds the whole website: a few small pages plus each game. It's plain
HTML, CSS and JavaScript with **no build step and no dependencies**.

## Games

| Game | Path | Description |
| --- | --- | --- |
| **Baby Pop!** | [`games/baby-pop/`](games/baby-pop/) | Pop smiley balloons by tapping, swiping or pressing any key. Includes gentle generated sounds, speed control, full screen and rare rainbow balloons. |
| **Find the Animal!** | [`games/find-the-animal/`](games/find-the-animal/) | The game asks "Where is the cat?" out loud and the child taps the right one of three animals. 40 animals, English / Finnish / Bengali, spoken questions, animal sounds, confetti, no losing. |
| **Feed the Animals!** | [`games/feed-the-animals/`](games/feed-the-animals/) | One of 21 hungry animals (monkey, panda, lion, penguin, giraffe and more) opens its mouth and the child taps the right one of three foods. The food flies in, the animal chews and dances, hearts and stars float up. Any other food just gets a silly head shake. Generated munching, animal and celebration sounds, no text, no losing. |
| **Peekaboo!** | [`games/peekaboo/`](games/peekaboo/) | Three hiding places (bush, curtain, gift box) each hide an animal. One tap opens it with a "pee-ka-BOO" tune, the animal waves, calls and giggles. All found: fanfare, then new animals hide. Ages 1–3. |
| **Bubble Bath!** | [`games/bubble-bath/`](games/bubble-bath/) | A muddy animal sits in the tub. Rub (one finger or many) to wipe the mud away with soap bubbles and squeaks. Clean: it shakes dry, sparkles, and the next one splashes in. Tap the rubber duck to squeak it. |
| **Color Splash!** | [`games/color-splash/`](games/color-splash/) | Pick one of six paint pots and tap a part of the picture to fill it. Every colour plays its own note (pentatonic), so colouring makes music. Eight pictures. Babies who only tap the picture get a new colour each tap. |
| **Animal Band!** | [`games/animal-band/`](games/animal-band/) | Six singing animals on a C major pentatonic scale, so any mash sounds nice. 🥁 adds a soft backing beat; 🎵 is song time, where every tap plays the next note of a nursery tune. Number and letter keys play too. |
| **Bedtime!** | [`games/bedtime/`](games/bedtime/) | Drag small, middle and big animals into the bed that fits (or tap the animal, then the bed). Each tuck-in plays a phrase of Brahms' Lullaby; when all three sleep, the lights dim and the whole lullaby plays, then morning comes. |
| **Alphabet Zoo!** | [`games/alphabet-zoo/`](games/alphabet-zoo/) | A big letter card (Bb). Tap it and its picture pops out (B is for Bear) with the letter's note and the animal's call. Arrows, swipes and an A–Z strip; keyboard letters jump to that letter. |
| **Trace the Letter!** | [`games/trace-letter/`](games/trace-letter/) | Follow a big dotted capital letter with a finger: a rainbow trail follows, each stroke fills with colour and plays notes; done, the picture pops out. Any order or direction counts. |
| **Letter Pop!** | [`games/letter-pop/`](games/letter-pop/) | Letter balloons float up; pop one to see its letter and picture big. Every keyboard letter pops its own balloon. |
| **Count the Ducks!** | [`games/count-ducks/`](games/count-ducks/) | Faint duck shapes show how many; each tap brings a duck with its number and a note that climbs the scale. Counts up to 10. |
| **Feed the Numbers!** | [`games/feed-numbers/`](games/feed-numbers/) | A monster shows a number (1–6) and that many dots. Drag or tap apples into its mouth; extra apples just roll back. |
| **Number Train!** | [`games/number-train/`](games/number-train/) | Drag animals holding numbers into the carriage with the same number (or tap animal, then carriage). All aboard: choo-choo. |
| **Tap Tap Race!** | [`games/tap-race/`](games/tap-race/) | Pick an animal racer, 3-2-1, then every tap zooms it forward. Your racer always wins first, then everybody gets a gold medal. |
| **Tilt Track!** | [`games/tilt-track/`](games/tilt-track/) | Tilt the device (or hold left/right, or arrow keys) to steer a car down a winding road collecting musical stars. Grass only slows you; a gentle auto-steer helps. |
| **Build a House!** | [`games/build-house/`](games/build-house/) | Drag pieces onto dashed outlines (or tap to place). Builds a house (lights on, family moves in), a barn (animals come out) and a rocket (blast off). |
| **Decorate the Cake!** | [`games/decorate-cake/`](games/decorate-cake/) | Drag strawberries, candles, sprinkles and more onto a cake anywhere. 🎉 lights the candles and plays Happy Birthday; tap to blow them out. 🔄 new flavour. |

The fifteen newer games use **no speech at all**. The ABC games show letters and a short word for grown-ups to read aloud. Everything you
hear is music, chimes and playful synthesized animal calls.

## Project structure

```
.
├── index.html            Home: hero with poppable balloons, pick by age, new games, animal playground
├── games/index.html      All games (/games/): every game card, filter chips (age, music, calm)
├── parents.html          For parents: promises, home-screen setup tabs, skills table, tips, FAQ
├── about.html            About: why and how the games are made, contact
├── privacy.html          Privacy statement
├── 404.html              "Page not found" page (uses absolute paths)
├── assets/
│   ├── css/site.css      Styles for all website pages (the games have their own)
│   ├── js/site.js        Website behaviour: balloons, playground, filters, setup tabs, "Surprise me", reveals
│   ├── js/app.js         Shared by all games: offline (service worker) + full screen / home-screen tip
│   ├── js/kit.js         Shared by the five newer games: sounds + music, effects, corner buttons
│   ├── css/kit.css       Base styles for those games (reset, sky, corner buttons, effects)
│   ├── js/alphabet.js    A–Z: word, picture, colour and note for every letter
│   ├── animals/          Shared animal pictures (one SVG per animal)
│   ├── things/           Pictures for letters without an animal
│   ├── fonts/            Self-hosted Fredoka + Noto Sans Bengali fonts and their licences (OFL)
│   └── img/              Logo (SVG), favicons, app icons, social share image
├── games/
│   ├── index.html        The "All games" page (see above)
│   ├── baby-pop/         Baby Pop! (index.html, script.js, style.css, card-art.svg)
│   ├── find-the-animal/  Find the Animal! (see below)
│   ├── feed-the-animals/ Feed the Animals! (see below)
│   ├── peekaboo/         Peekaboo!      ┐
│   ├── bubble-bath/      Bubble Bath!   │ index.html, style.css, script.js,
│   ├── color-splash/     Color Splash!  │ manifest.webmanifest, icons/, card-art.svg
│   ├── animal-band/      Animal Band!   │ (Color Splash also has pictures.js)
│   └── bedtime/          Bedtime!       ┘
├── site.webmanifest      Web app manifest (name, icons, colours)
├── robots.txt            Search engine rules + sitemap location
├── sitemap.xml           List of public pages for search engines
├── sw.js                 Service worker: saves the games for offline use
└── _headers              Security & caching headers (read by Cloudflare Pages)
```

## Languages (English, Suomi, বাংলা, Türkçe)

- **`assets/js/i18n.js`** is the one language system for every page and game. Elements carry
  `data-i18n="key"` (text), `data-i18n-html="key"` (our own HTML) or
  `data-i18n-attr="aria-label:key"`; scripts use `PP_I18N.t('key', 'English fallback')`.
- Dictionaries: **`assets/i18n/en.js`** (generated from the page texts, never edit by hand),
  `fi.js`, `bn.js`, `tr.js`. Only the chosen language file is downloaded.
- The **language picker** in the header is a native `<select>` (works with touch, keyboard and
  screen readers). The choice is saved on the device (`pienipeli-lang`) and shared by all pages
  and games; first visit uses the browser language if we have it, else English.
- Bengali uses the self-hosted Noto Sans Bengali (downloaded only when Bengali text shows).
  Numbers in counts switch to Bengali digits.
- **Adding a language:** copy `en.js` to `<code>.js`, translate every value, add it to
  `LANGS` in `i18n.js` with `ready: true`, add the file to `sw.js`, then run
  `node tools/build-site.mjs`: it lists any missing keys per language.
- Pages are written in English (that's what search engines see); other languages are applied
  in the browser.

## Building the pages (optional tools, no dependencies)

- **`node tools/build-site.mjs`** writes `index.html`, `games/index.html`, `parents.html`,
  `about.html`, `privacy.html`, `404.html` and `assets/i18n/en.js` from one file (the game list,
  categories, every text). **Edit texts and game cards there, not in the HTML** (the HTML is
  overwritten), then run it. It also reports untranslated keys.
- **`node tools/build-game-pages.mjs`** writes the page boilerplate (head, SEO, toolbar,
  scripts) for the ten newest games.
- **`node tools/build-animal-pictures.mjs`** rebuilds `assets/animals/` from the drawings.

## Shared game toolbar (every game)

`assets/js/chrome.js` + `assets/css/chrome.css`, loaded by all 18 games:

- The same round buttons everywhere: 🏠 all games, 🔊 sound, ⛶ full screen (left corner) and
  **?** how to play, **↻** start again (right corner). Big (54 px; 48 px on very small phones),
  dark outline, chunky shadow, press-down feedback.
- **How to play:** a cartoon hand acts out the move on the real pieces (tap, drag, rub or trace),
  with no words. It plays once on a game's first visit on the device (`pienipeli-how-<game>`),
  and again whenever **?** is tapped; any tap on the game stops it. Each game describes its move:
  `Kit.setup({ id, how: () => [{ tap: el }, { drag: [from, to] }, { rub: el }, { path: [...] }] })`.
- **Start again** reloads the game with a quick fade (Baby Pop keeps its own instant restart;
  Find the Animal keeps its own home/restart bar).
- Games with their own buttons (Animal Band 🥁🎵, the cake's 🎉, Tilt Track's stars) place them
  just below the toolbar so nothing overlaps.

## The website pages

Four pages share one header, footer and stylesheet (`assets/css/site.css`):
**Home**, **All games** (`games/index.html`), **For parents** and **About**, plus Privacy and 404.

- **Look:** bright and playful, made for kids. The home page opens in a sky with a smiling sun,
  drifting clouds and green hills (like the games). Every section below is its own colour band
  (`band band-grass`, `band-sun`, `band-sky`, `band-pink`, `band-lilac`, `band-base`) with a
  wavy top (`wave`). Floating confetti shapes (`.decos`) drift near the edges, and animals peek
  over the waves (`.peek`). Inner pages start with a coloured header (`page-hero hero-sky`,
  `hero-mint`, `hero-pink`, `hero-lilac`). Cards and buttons have dark outlines and chunky
  shadows, and wiggle on hover. The footer is a starry night sky. Colours are CSS variables at
  the top of `site.css`; the "Fun layer" block at the end holds the bands, sky and decorations.
- **Navigation:** pill links in the header. On phones (under 760 px) the same links turn into a
  tab bar at the bottom of the screen, with icons.
- **All games filters:** each card has `data-tags` (`age-1`, `age-2`, `music`, `calm`). The chips
  filter the grid and update the address (`games/#music`), so the home page "Pick by age" tiles
  link straight into a filter. Without JavaScript every game simply shows.
- **"Surprise me"** buttons (`data-random="url url ..."`) open a random game.
- **Parents setup tabs** open on the visitor's own device (iPhone, Android or computer).
- Links from the old single page (`/#games`, `/#faq`, ...) are sent to the new pages.
- Inside every game, the 🏠 button goes to **All games**.

## Find the Animal!

```
games/find-the-animal/
├── index.html     Page markup: welcome screen, game screen, celebration
├── style.css      Layout, animations, responsive card sizes
├── strings.js     All text in every language
├── animals.js     The 40 animals: names in en/fi/bn, sound recipe, SVG drawing
├── sounds.js      All sounds, generated live with the Web Audio API (no audio files)
├── narrator.js    The narrator: recorded clips if present, else the warmest TTS voice
├── narration/     Optional recorded narration clips + manifest.js + README (voice brief)
├── tools/         narration-lines.mjs: lists every spoken line for recording
├── script.js      Game logic, speech timing, confetti
└── card-art.svg   Picture for the game card on the website
```

- **Adding an animal:** add one entry to the `ANIMALS` list in `animals.js` with its
  names, a sound recipe from `sounds.js` (or none for a gentle chime) and its drawing
  (shapes in a 200 × 200 box, using the helpers at the top of the file).
- **Adding a language:** add a block to `T` in `strings.js`, a flag to `FLAGS`, the
  language code to `LANGS`, and the name to every animal's `names`.
- **Narrator:** a warm, gentle kindergarten-teacher voice. For the most natural sound,
  record or generate clips as described in [`narration/README.md`](games/find-the-animal/narration/README.md).
  Without clips, the game uses the browser's built-in voices (`speechSynthesis`). It prefers
  warm, high-quality female voices in `en-US`, `fi-FI` or `bn-BD`, falls back to any voice
  of the same language, and speaks a little slower and brighter, with a different tone for
  questions, praise and "try again". If a device has
  no voice for the chosen language, the welcome screen says so and the game still works
  with text, animations and sounds. Bengali voices are often missing on desktop computers.
  Android and iOS/macOS usually have one (on Apple devices it may need downloading in
  Settings → Accessibility → Spoken Content → Voices).
- **Animal sounds** are playful synthesized imitations made in `sounds.js`, so the game
  needs no audio files and no network.

## Feed the Animals!

```
games/feed-the-animals/
├── index.html     Page markup: animal stage, food plates, effects layer
├── style.css      Layout (portrait, landscape phone, desktop) and every animation/mood
├── animals.js     Foods (emoji + plate colour) and the 21 animal drawings (inline SVG)
├── sounds.js      All sounds, generated live with the Web Audio API (no audio files)
├── script.js      Rounds, tap handling, flying food, hearts/stars/confetti, hints
└── card-art.svg   Picture for the game card on the website (made from animals.js)
```

- **Moods:** each animal is one SVG with a mouth and eyes for every mood. `script.js` only
  sets `data-mood` on `#animal` (`idle`, `hungry`, `ready`, `chew`, `happy`, `yuck`) and
  `style.css` shows the right mouth and eyes and runs the animation.
- **Adding an animal:** add an entry to `ANIMALS` in `animals.js`: what it `eats` (the first
  one is its favourite and comes up most often), which clearly wrong foods to offer
  (`avoid`), its colours and its drawing (head centred near 120, 112 in a 240 × 290 box). Birds use
  `beak` instead of `mouth`. Give it a call in `CALLS` in `sounds.js` (same `id`).
- **Sounds:** animal calls, hops, whoosh, gulp, munching, a silly "blblbl" for unwanted food
  and a happy chime, all made in `sounds.js`. Tapping the animal plays its call. The 🔊 button
  mutes everything and the choice is remembered on the device. Browsers allow sound only after
  the first tap, so the first animal's call is replayed on that tap.
- **Adding a food:** add it to `FOODS` with an emoji, a plate colour and two crumb colours.
- **Taps:** food plates react on touch-down. While food is flying or the animal is
  reacting, taps are ignored, so double taps can't skip anything. After 6 seconds without
  a tap, the right food gives a little wiggle as a hint.

## Animal pictures (shared by every game)

Every animal is one picture file in **`assets/animals/<id>.svg`** (cat, dog, cow, … 40 in all),
drawn in one soft cartoon style. The same file is used everywhere an animal appears: Peekaboo,
Bubble Bath, Animal Band, Bedtime, the website and the game card pictures. So an animal looks
the same on every phone (no emoji that change from device to device), and it works offline.

- The pictures are generated from the drawings in `games/find-the-animal/animals.js`.
  After changing or adding a drawing there, run `node tools/build-animal-pictures.mjs`.
- In the kit games: `Kit.animalImg('dog', 'class')` gives an `<img>`, `Kit.animalSrc('dog')` the
  file's address, and `Kit.loadAnimal('dog')` a loaded image (Bubble Bath draws it on a canvas,
  and its mud follows the animal's outline).
- `Kit.Sound.call(id)` plays the animal's call. Animals without their own call borrow a close
  cousin's (zebra uses the horse, goat the sheep, chicken the chick, …): see `CALL_ALIAS` in `kit.js`.
- New picture files must also be added to `FILES` in `sw.js` (and bump `VERSION`) so they work offline.
- Letters without an animal (A apple, I ice cream, J jellyfish, N nest, Q queen, U umbrella,
  V van, X xylophone, Y yo-yo) have hand-drawn pictures in **`assets/things/`**, in the same style.
- **`assets/js/alphabet.js`** (`window.ABC`) lists every letter's word, picture, colour, note and
  animal call. Alphabet Zoo, Trace the Letter and Letter Pop all read it; `Kit.picImg('things/apple')`
  shows any library picture.

## The toddler kit (the fifteen newer games)

These games share `assets/js/kit.js` and `assets/css/kit.css`, so each game's own
`script.js` is only its game logic. Load order in each page: `app.js`, `kit.js`, then the game.

- **`Kit.Sound`**: every sound and tune is generated live with the Web Audio API (no audio
  files, no speech). It has the animal calls (same recipes as Feed the Animals, plus frog, owl,
  fox and hamster), common sounds (`tap`, `boing`, `yay`, `fanfare`, `twinkle`, `slideUp`/`slideDown`,
  `hmm`), and music helpers: `hz('C5')`, `musicBox`, `marimba` and `melody(notes, { bpm, voice })`.
  A game makes its own sounds with `Sound.run(() => Sound.tone({...}))`, which stays silent when
  muted. A soft compressor on the output keeps many fingers at once from getting loud.
- **Mute** is shared by all five games (`localStorage` key `pienipeli-muted`).
- **`Kit.fx`**: `floaties` (hearts and stars), `confetti`, `burst` (paint or water drops), `rise` (♪, 💤).
- **`Kit.setup({ onFirstTap })`**: wires 🔊 and ⛶, unlocks audio on the first tap, and blocks
  pinch zoom, double-tap and the context menu.
- **Every game**: reacts on touch-down, ignores taps while something is animating, gives a
  gentle hint after a few idle seconds (a wiggle, glow or twinkle), plays from the keyboard
  (any key does something), and respects `prefers-reduced-motion`.

Per game:

- **Peekaboo** (`script.js`): `ANIMALS` (emoji + call id), three cover kinds drawn as inline SVG
  (`bushHalf`, `curtainParts`, `boxParts`). CSS opens them by `data-state="open"` per `data-kind`.
- **Bubble Bath** (`script.js`): two canvases. The mud is drawn only where the animal's own
  shape is (`destination-in` with the emoji) and above the water line, then rubbing erases it
  (`destination-out`). A pixel count says when less than 18% is left. Multi-touch works.
- **Color Splash** (`pictures.js`): each picture is an SVG in a 400 × 400 box. Shapes with
  `class="region"` get coloured; `class="face"` decorations never catch taps. Add a picture by
  adding an entry. The colours and notes are in `PAINTS` in `script.js`.
- **Animal Band** (`script.js`): `BAND` (emoji, note, colour, voice), `SONGS` (only C D E G A
  notes), and a look-ahead drum/bass scheduler on the audio clock. The beat stops when the tab is hidden.
- **Bedtime** (`script.js`): `TRIOS` (small, middle, big), `LULLABY` in phrases. Drag with
  pointer capture, or tap an animal and then a bed; the wrong bed bounces the animal back
  and makes the right bed glow.

## Home screen, full screen & offline

Every game can be added to a phone or tablet home screen and then works like an app.

- **Each game has its own app:** `games/<game>/manifest.webmanifest` (name, `start_url`
  pointing at the game, `display: fullscreen`) and its own icons in `games/<game>/icons/`
  (192, 512 + maskable, and a 180 px `apple-touch-icon.png` for iOS). The game pages also
  carry the iOS tags (`apple-mobile-web-app-capable`, `black-translucent` status bar,
  `apple-mobile-web-app-title`).
- **Android (Chrome):** menu ⋮ → *Install app* / *Add to Home screen*. The icon opens
  straight into the game, full screen (status and navigation bars hidden). In a normal
  browser tab, the game's ⛶ button uses the Fullscreen API.
- **iPhone / iPad (Safari):** Share → *Add to Home Screen*. The icon opens straight into the
  game with no Safari bars, drawn edge to edge under the status bar. iPhone Safari has no
  Fullscreen API for web pages, so on iPhone the ⛶ button shows grown-ups a short
  "Add to Home Screen" tip instead. iPad Safari uses the Fullscreen API.
- When a game is opened from its home-screen icon, the ⛶ button hides itself.
- **Offline:** `sw.js` (registered by `assets/js/app.js`) saves every game file on the first
  visit, so home-screen icons open without internet. It always tries the network first,
  so updates show up straight away. **When you add a game or a file, add it to `FILES` in
  `sw.js` and bump `VERSION`.** `_headers` keeps `sw.js` from being cached.
- `assets/js/app.js` is the shared helper every game loads: service worker registration and
  `Pienipeli.fullscreenButton(button, { onChange })`.
- Home-screen installs and offline only work from a real web address (https, or
  `http://localhost` for testing), not from a file opened from disk.

## Running locally

No server or install needed. **Double-click `index.html`** to open it in your browser.
Every link points directly at an `.html` file (for example `games/baby-pop/index.html`,
not `games/baby-pop/`), so the whole site works when opened from disk.

Opened from disk, Chrome blocks the self-hosted fonts, so text falls back to system fonts
(Bengali still displays correctly with the system's Bengali font). To see the real fonts,
serve the folder instead, for example `python3 -m http.server 8000` and open
<http://localhost:8000>.

Only `404.html` uses absolute paths (it can be shown at any URL), so it looks unstyled
when opened from disk. That's expected; on Cloudflare it works.

## Adding a new game

For a toddler game with no words, the quickest start is copying one of the five kit games
(for example `games/peekaboo/`) and replacing its `script.js` and `style.css`.


1. Create a folder `games/<game-name>/` with its own `index.html` (plus any CSS/JS).
   Each game is self-contained, so it can have its own styles and scripts.
2. In the game's `<head>`, reuse the shared icon and font (see `games/baby-pop/index.html`):
   - `../../assets/img/logo.svg` for the favicon
   - `@font-face` pointing to `../../assets/fonts/fredoka-latin.woff2`
3. Make a `card-art.svg` (640 × 400) and add a card to `games/index.html`: copy any
   `<article class="game-card">`, change `data-game`, `data-tags`, the texts and links (paths there
   start with `../`), and give it a colour in the "Per-game card colours" block of `site.css`.
   Add `<span class="new">NEW</span>` if you like, and put it in the "New this month" row on the home page.
   Always link to `games/<game-name>/index.html`, never just the folder, so links work from disk.
4. Add a row to the skills table in `parents.html`, a link in the footer of each page, the
   game to every "Surprise me" `data-random` list, its URL to `sitemap.xml`, and its files to `sw.js`.

### Principles for every game

- No ads, purchases, accounts, analytics or third-party requests. Keep the privacy page true.
- No failure states, timers or scores.
- Big touch targets, no accidental zoom or scroll, and no button that a random key press can "click".
- Respect `prefers-reduced-motion`.
- Sound only starts after a user gesture and can always be muted.

## Deployment (Cloudflare Pages, free plan)

The site is fully static. Cloudflare hosts it with no server, build step or cost.

### First-time setup

1. Push this repository to GitHub.
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to
   **Workers & Pages → Create → Pages → Connect to Git** and pick this repository.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**. The site goes live at `<project>.pages.dev`.

From then on, every push to `main` deploys automatically. Pushes to other branches get
their own preview URLs.

### Custom domain: pienipeli.fi

1. In the Pages project, open **Custom domains → Set up a custom domain** and enter `pienipeli.fi`.
2. A root domain (no `www`) on Pages must use Cloudflare DNS. Add `pienipeli.fi` to your
   Cloudflare account (free plan), then at your `.fi` registrar change the domain's
   **nameservers** to the two Cloudflare gives you.
3. Optionally add `www.pienipeli.fi` as a second custom domain, and add a redirect rule
   (**Rules → Redirect Rules**) from `www.pienipeli.fi/*` to `https://pienipeli.fi/${1}`.
4. HTTPS certificates are issued automatically.

### What Cloudflare does with these files

- `404.html` is shown automatically for any missing page.
- `_headers` adds security headers (including a strict Content-Security-Policy) and caching.
  If you ever load something from another domain, update the CSP there or it will be blocked.
- Cloudflare serves "pretty URLs": `/games/baby-pop/index.html` redirects to `/games/baby-pop/`.

## Privacy

The site loads no third-party resources. Even the fonts are self-hosted. The only stored
data is small game settings (Baby Pop's sound and speed; Find the Animal's language,
sound and music), kept in the browser's `localStorage`.
See [`privacy.html`](privacy.html).

## Credits & licences

- **Fredoka** font by The Fredoka Project Authors, under the
  [SIL Open Font License 1.1](assets/fonts/OFL.txt).
- **Noto Sans Bengali** font by The Noto Project Authors, under the
  [SIL Open Font License 1.1](assets/fonts/OFL-NotoSansBengali.txt).
- All other code, art and text © Pienipeli. All rights reserved.
