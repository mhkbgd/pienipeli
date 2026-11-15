# Pikku, the Pienipeli mascot

Pikku is a friendly golden-orange lion cub and the face of Pienipeli. Whatever platform he
shows up on (website, iOS app, Android app), he should look and act the same.

## Character

| | |
| --- | --- |
| **Name** | Pikku (fi: Pikku · tr: Pikku · bn: পিক্কু). Same name in every language. |
| **Who** | A little lion cub, about the age of the children who play. Curious, kind, playful. |
| **Look** | Golden-yellow face and body, fluffy orange mane, big brown eyes, pink tongue, blue T-shirt with the Pienipeli name and a small yellow star. |
| **Personality** | Says hello, cheers, encourages. Never says “wrong”, never hurries, never sad or scary. |
| **Voice** | Short, warm lines a grown-up can read aloud: “Hei! I’m Pikku. Let’s play!”, “Yay!”, “Let’s try another button!” |
| **Motion** | Calm: slow breathing, a blink every few seconds, a wave or a hop only when something happens. No flashing, no constant bouncing. All motion stops with reduced-motion settings. |

### Colours

| Token | Hex | Used for |
| --- | --- | --- |
| `--pikku-fur` | `#fdc23a` | Face and body |
| `--pikku-fur-deep` | `#fcb52a` | Fur shading |
| `--pikku-mane` | `#f2832a` | Mane, tail tip |
| `--pikku-shirt` | `#1f7ae0` | T-shirt |
| `--pikku-star` | `#ffd23d` | Star on the shirt |
| `--pikku-ink` | `#2b1d5c` | Outlines of badges and bubbles (Pienipeli ink) |

## Files

| File | Size | Use |
| --- | --- | --- |
| `source/pikku-master.png` | 1312 × 1199, transparent | Master artwork. **Never loaded by the website.** Use it to make app icons, store art and new sizes. |
| `pikku-240.webp` / `-480` / `-800` | full body, transparent, ~18 / 46 / 94 KB | Website and games (`srcset`, the browser picks the smallest sharp one). |
| `pikku-face-96.webp` / `-192` | head only, square, ~4 / 9 KB | Round face badge: game cards, navigation, loader. |

The web pictures are cropped from the master to the artwork's edges (crop 96, 17, 1020 × 1150;
face 372, 22, 668 × 668). To remake them:

```sh
cd assets/mascot
for w in 240 480 800; do cwebp -crop 96 17 1020 1150 -resize $w 0 -q 82 -alpha_q 90 -m 6 source/pikku-master.png -o pikku-$w.webp; done
for w in 96 192; do cwebp -crop 372 22 668 668 -resize $w 0 -q 85 -alpha_q 90 -m 6 source/pikku-master.png -o pikku-face-$w.webp; done
```

If the artwork changes, check the blink lids in `assets/css/pikku.css` (`.pikku-lids i`): they are
placed in percent over the eyes of the cropped picture.

## Web component

Styles: `assets/css/pikku.css` (website pages link it; games get it through `chrome.css`).

- **Full body:** `.pikku > .pikku-body > img + .pikku-lids` (built by `pikku()` in `tools/build-site.mjs`).
  Add `.is-waving` or `.is-hopping` for a one-off move. Size with `--pikku-size` or a width.
- **Face badge:** `.pikku-face > img` (built by `pikkuFace()`).
- **Speech bubble:** `.pikku-say` (tail down-left; `.tail-left`, `.tail-right`).
- **Games:** `PPChrome.cheer(text?)` in `assets/js/chrome.js` pops Pikku up in the bottom-left corner
  for a moment. Every kit game calls it automatically when it plays its finishing fanfare
  (`Kit.Sound.fanfare`). If a game loads slowly, a Pikku loading screen appears after 0.4 s.

## Where he appears

| Place | What |
| --- | --- |
| Home hero | Sits in front of the toy shelf with “Hei! I’m Pikku. Let’s play!”. Tap: he waves and says a new line. Balloon milestones make him hop and cheer. |
| Game cards | “Pikku’s pick” sticker on a few games (`pikku: true` in the `GAMES` list). |
| Home “more games” card, All games “Can’t choose?” | Small face badge. |
| All games, empty filter | Pikku with “Let’s try another button!”. |
| About | “Meet Pikku” card. |
| 404 | Pikku, with his balloon floating away. |
| Games | Cheers when a round is finished; slow-loading screen. Find the Animal shows him in its own celebration card. |

## Words

Every Pikku text has an i18n key (`pikku.*`, `about.pikku.*`) in `assets/i18n/` (en, fi, bn, tr).
In apps, reuse the same keys and texts so he says the same things everywhere.

## Rules

- Use the artwork as it is: don’t recolour, stretch, flip or redraw him.
- One Pikku per screen, and never on top of something a child needs to tap.
- Not during play: he appears before, after, or beside a game, not in the middle of it.
- Keep him friendly: no angry, sad, scared or hurt Pikku.
