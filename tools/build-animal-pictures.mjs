// Builds the shared animal picture library: assets/animals/<id>.svg
// from the drawings in games/find-the-animal/animals.js (one file per animal).
// Run after changing or adding a drawing:   node tools/build-animal-pictures.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'games/find-the-animal/animals.js'), 'utf8'), ctx);
const { FTA_ANIMALS: animals, FTA_toSVG: toSVG } = ctx.window;

const out = path.join(root, 'assets/animals');
fs.mkdirSync(out, { recursive: true });
for (const a of animals) {
  const svg = toSVG(a)
    .replace(' aria-hidden="true" focusable="false"', ` width="200" height="200"`)
    .replace('<svg ', '<svg ') + '\n';
  fs.writeFileSync(path.join(out, a.id + '.svg'), `<!-- ${a.names.en}: generated from games/find-the-animal/animals.js -->\n` + svg);
}
console.log(`${animals.length} pictures written to assets/animals/`);
