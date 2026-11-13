# Narration

The game's narrator speaks every question, praise and "try again". Out of the box she
uses the device's text-to-speech. `narrator.js` picks the warmest female voice it can
find for each language and shapes each line by mood. For the most natural voice,
record clips (or generate them with an AI voice tool) and drop them in here.

## Voice brief

> A sweet, warm, gentle and playful female narrator for a toddler educational game
> (ages 2–4). She sounds like a loving kindergarten teacher talking to a small child.
> Soft, cheerful, expressive and full of warmth. Natural human-like pronunciation,
> slightly playful intonation, gentle excitement and clear articulation. Speak slowly
> enough for toddlers to understand, but never sound robotic, exaggerated or overly
> childish. Use a friendly, smiling tone with little moments of excitement and wonder.
> Maintain natural pronunciation and native accents in each language.

Use a native speaker (or a native-accent voice) for each language: English, Finnish
and Bengali (Bangladesh).

## Adding recorded clips

1. Run `node tools/narration-lines.mjs`. This writes `narration/lines.csv` with every
   line (132 per language): the text, the file name to save it as, and the mood.
   - **ask**: curious and inviting ("Where is the cat?")
   - **cheer**: bright, a small burst of excitement ("Great job!", "It's the cat!")
   - **soft**: warm and reassuring ("Try again!")
   - **info**: calm and clear ("That's the dog.")
2. Record or generate each line as an MP3 and save it at the path in the `file` column,
   for example `narration/fi/ask-cat.mp3`. Trim the silence at the start and end. Keep
   the files small (mono, 64–96 kbps is plenty).
3. In `narration/manifest.js`, switch the language on: `fi: 'mp3'`.

You can do one language at a time. If a single clip is missing, the game uses
text-to-speech for that line only. If you add animals or change any text, run the
tool again to see the new lines.
