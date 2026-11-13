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

## Project structure

```
.
├── index.html            Landing page (pienipeli.fi)
├── privacy.html          Privacy statement
├── 404.html              "Page not found" page (uses absolute paths)
├── assets/
│   ├── css/site.css      Styles for the landing, privacy and 404 pages
│   ├── js/site.js        Poppable hero balloons + footer year
│   ├── fonts/            Self-hosted Fredoka font + its licence (OFL)
│   └── img/              Logo (SVG), favicons, app icons, social share image
├── games/
│   └── baby-pop/         Baby Pop! (index.html, script.js, style.css)
├── site.webmanifest      Web app manifest (name, icons, colours)
├── robots.txt            Search engine rules + sitemap location
├── sitemap.xml           List of public pages for search engines
└── _headers              Security & caching headers (read by Cloudflare Pages)
```

## Running locally

No server or install needed. **Double-click `index.html`** to open it in your browser.
Every link points directly at an `.html` file (for example `games/baby-pop/index.html`,
not `games/baby-pop/`), so the whole site works when opened from disk.

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

The site loads no third-party resources. Even the font is self-hosted. The only stored
data is Baby Pop's sound and speed settings, kept in the browser's `localStorage`.
See [`privacy.html`](privacy.html).

## Credits & licences

- **Fredoka** font by The Fredoka Project Authors, under the
  [SIL Open Font License 1.1](assets/fonts/OFL.txt).
- All other code, art and text © Pienipeli. All rights reserved.
