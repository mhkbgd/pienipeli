# Pienipeli

**Little games for little hands.** 🎈 [pienipeli.fi](https://pienipeli.fi)

Pienipeli (Finnish *pieni peli*, "little game") makes gentle, joyful browser games for babies
and toddlers. There are no ads, no purchases, no tracking, no scores and no losing.

This repository holds the whole website: the landing page plus each game. It's plain
HTML, CSS and JavaScript with **no build step and no dependencies**.

## Games

| Game | Path | Description |
| --- | --- | --- |
| **Baby Pop!** | [`games/baby-pop/`](games/baby-pop/) | Pop smiley balloons by tapping, swiping or pressing any key. Includes gentle generated sounds, speed control, full screen and rare rainbow balloons. |
| **Find the Animal!** | [`games/find-the-animal/`](games/find-the-animal/) | The game asks "Where is the cat?" out loud and the child taps the right one of three animals. 40 animals, English / Finnish / Bengali, spoken questions, animal sounds, confetti, no losing. |

## Project structure

```
.
├── index.html            Landing page (pienipeli.fi)
├── privacy.html          Privacy statement
├── 404.html              "Page not found" page (uses absolute paths)
├── assets/
│   ├── css/site.css      Styles for the landing, privacy and 404 pages
│   ├── js/site.js        Poppable hero balloons + footer year
│   ├── fonts/            Self-hosted Fredoka + Noto Sans Bengali fonts and their licences (OFL)
│   └── img/              Logo (SVG), favicons, app icons, social share image
├── games/
│   ├── baby-pop/         Baby Pop! (index.html, script.js, style.css)
│   └── find-the-animal/  Find the Animal! (see below)
├── site.webmanifest      Web app manifest (name, icons, colours)
├── robots.txt            Search engine rules + sitemap location
├── sitemap.xml           List of public pages for search engines
└── _headers              Security & caching headers (read by Cloudflare Pages)
```

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
└── card-art.svg   Picture for the game card on the landing page
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

1. Create a folder `games/<game-name>/` with its own `index.html` (plus any CSS/JS).
   Each game is self-contained, so it can have its own styles and scripts.
2. In the game's `<head>`, reuse the shared icon and font (see `games/baby-pop/index.html`):
   - `../../assets/img/logo.svg` for the favicon
   - `@font-face` pointing to `../../assets/fonts/fredoka-latin.woff2`
3. Add a game card in the **Our games** section of `index.html`. Always link to
   `games/<game-name>/index.html`, never just the folder, so the link works from disk. Copy the Baby Pop
   `<article class="game-card">` and replace the "Coming soon" card when it's ready.
4. Add the game's URL to `sitemap.xml`.

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
