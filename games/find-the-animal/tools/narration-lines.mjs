// Lists every line the narrator says, for recording or generating voice clips.
//   node tools/narration-lines.mjs            -> narration/lines.csv
// Columns: lang, file (where the clip goes), mood (how to say it), text
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = {};
for (const f of ['strings.js', 'animals.js']) new Function(readFileSync(join(root, f), 'utf8'))();
const { T, LANGS, ROUND } = window.FTA_STRINGS;
const ANIMALS = window.FTA_ANIMALS;

const MOODS = {
  ask: 'curious and inviting, a little wonder',
  cheer: 'bright, happy, a small burst of excitement',
  soft: 'warm and reassuring, smiling',
  info: 'calm and clear',
};
const rows = [['lang', 'file', 'mood', 'text']];
for (const lang of LANGS) {
  const t = T[lang];
  const add = (key, mood, text) => rows.push([lang, `narration/${lang}/${key}.mp3`, MOODS[mood], text]);
  add('title', 'cheer', t.title);
  add('round', 'cheer', t.roundDone(ROUND));
  t.praise.forEach((p, i) => add('praise-' + i, 'cheer', p));
  t.tryAgain.forEach((p, i) => add('try-' + i, 'soft', p));
  for (const a of ANIMALS) {
    const n = a.names[lang];
    add('ask-' + a.id, 'ask', t.ask(n));
    add('itis-' + a.id, 'cheer', t.itIs(n));
    add('thatis-' + a.id, 'info', t.thatIs(n));
  }
}
const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
writeFileSync(join(root, 'narration', 'lines.csv'), '﻿' + csv); // BOM so Excel shows Bengali correctly
console.log(`Wrote narration/lines.csv: ${rows.length - 1} lines (${(rows.length - 1) / LANGS.length} per language)`);
