/* ============ Find the Animal: animal data + illustrations ============
   Every animal is drawn here as a small inline SVG in one shared style:
   soft pastel fills, a round dark outline, big shiny eyes and pink cheeks.

   To add an animal, add one entry to ANIMALS below:
     id     unique key
     names  the name in every language (en, fi, bn)
     sound  a sound recipe from sounds.js (or leave it out for a gentle chime)
     art    SVG shapes inside a 200 × 200 box (use the helpers below)
     move   optional SVG transform to nudge the drawing into place              */

(() => {
  'use strict';

  // ---------- Drawing helpers ----------
  const INK = '#4a3434';
  const NS = 'stroke="none"';
  const c = (x, y, r, f, x2 = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${x2}/>`;
  const e = (x, y, rx, ry, f, x2 = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${x2}/>`;
  const p = (d, f = 'none', x2 = '') => `<path d="${d}" fill="${f}" ${x2}/>`;
  const rot = (a, x, y) => `transform="rotate(${a} ${x} ${y})"`;
  const line = (d, col = INK, w = 4) => p(d, 'none', `stroke="${col}" stroke-width="${w}"`);

  // Shiny cartoon eye
  const eye = (x, y, r = 7) =>
    c(x, y, r, '#2d2323', NS) + c(x + r * 0.32, y - r * 0.38, r * 0.38, '#fff', NS);
  const eyes = (x1, x2, y, r) => eye(x1, y, r) + eye(x2, y, r);
  // Eye with a white ring, for dark faces
  const eyeW = (x, y, r = 6) => c(x, y, r + 3.5, '#fff', NS) + eye(x, y, r);
  // Rosy cheeks
  const cheek = (x, y, r = 8) => e(x, y, r, r * 0.6, '#ff8fab', NS + ' opacity=".5"');
  const cheeks = (x1, x2, y, r) => cheek(x1, y, r) + cheek(x2, y, r);
  const smile = (x, y, w = 9) => p(`M${x - w} ${y} Q${x} ${y + w} ${x + w} ${y}`);
  const whiskers = (y) => line(
    `M64 ${y} L30 ${y - 6} M64 ${y + 9} L32 ${y + 14} M136 ${y} L170 ${y - 6} M136 ${y + 9} L168 ${y + 14}`, INK, 3);
  // A "tube": a thick stroked line with an outline (tails, tentacles, snakes)
  const tubes = (ds, col, w) =>
    ds.map(d => p(d, 'none', `stroke="${INK}" stroke-width="${w + 8}"`)).join('') +
    ds.map(d => p(d, 'none', `stroke="${col}" stroke-width="${w}"`)).join('');

  // ---------- The 40 animals ----------
  const ANIMALS = [
    { id: 'cat', names: { en: 'Cat', fi: 'Kissa', bn: 'বিড়াল' }, sound: 'meow',
      art: p('M44 98 L50 28 L96 62 Z', '#ffb15c') + p('M156 98 L150 28 L104 62 Z', '#ffb15c') +
        p('M58 78 L60 46 L82 64 Z', '#ffb3c7', NS) + p('M142 78 L140 46 L118 64 Z', '#ffb3c7', NS) +
        e(100, 118, 64, 54, '#ffb15c') +
        line('M100 66 L100 80 M86 68 L88 78 M114 68 L112 78', '#e0883a', 5) +
        eyes(76, 124, 112, 8) + cheeks(62, 138, 134) +
        p('M93 127 L107 127 L100 135 Z', '#ff8fab') +
        p('M100 135 Q100 145 90 145 M100 135 Q100 145 110 145') + whiskers(132) },

    { id: 'dog', names: { en: 'Dog', fi: 'Koira', bn: 'কুকুর' }, sound: 'woof',
      art: e(100, 112, 58, 54, '#f0c48a') +
        e(46, 116, 20, 42, '#a0683f', rot(18, 46, 116)) + e(154, 116, 20, 42, '#a0683f', rot(-18, 154, 116)) +
        e(124, 96, 18, 16, '#c98d5a', NS) +
        eyes(78, 124, 98, 8) + cheeks(66, 136, 126) +
        e(100, 138, 32, 24, '#fff4e6') +
        p('M94 148 Q100 168 106 148 Z', '#ff7f9a') +
        e(100, 126, 13, 9, '#3a2a2a') +
        p('M100 135 L100 142 M100 142 Q91 150 84 144 M100 142 Q109 150 116 144') },

    { id: 'cow', names: { en: 'Cow', fi: 'Lehmä', bn: 'গরু' }, sound: 'moo',
      art: p('M64 62 Q50 40 58 24 Q68 44 82 54 Z', '#fff1c9') + p('M136 62 Q150 40 142 24 Q132 44 118 54 Z', '#fff1c9') +
        e(40, 84, 24, 12, '#f2eeee', rot(-20, 40, 84)) + e(160, 84, 24, 12, '#f2eeee', rot(20, 160, 84)) +
        e(100, 100, 56, 60, '#ffffff') +
        p('M58 72 Q66 50 90 60 Q94 80 74 86 Q58 86 58 72 Z', '#5a4646', NS) +
        p('M128 108 Q146 98 152 116 Q150 136 132 130 Z', '#5a4646', NS) +
        eyes(80, 122, 96, 8) +
        e(100, 140, 46, 28, '#ffb6c8') +
        e(84, 136, 6, 9, '#c96f86', NS) + e(116, 136, 6, 9, '#c96f86', NS) +
        smile(100, 152, 10) },

    { id: 'horse', names: { en: 'Horse', fi: 'Hevonen', bn: 'ঘোড়া' }, sound: 'neigh',
      art: p('M48 92 Q22 100 26 146 Q40 126 54 108 Z', '#7a4a2a') +
        p('M56 112 h14 v54 h-14 Z M78 116 h14 v50 h-14 Z M112 116 h14 v50 h-14 Z M134 112 h14 v54 h-14 Z', '#b9784a') +
        p('M56 158 h14 v12 h-14 Z M78 158 h14 v12 h-14 Z M112 158 h14 v12 h-14 Z M134 158 h14 v12 h-14 Z', '#5a3a2a') +
        e(98, 104, 54, 30, '#c98a5a') +
        p('M114 100 L134 48 L162 54 L150 110 Z', '#c98a5a') +
        p('M140 44 L144 20 L156 42 Z', '#c98a5a') +
        e(158, 64, 30, 18, '#c98a5a', rot(38, 158, 64)) +
        e(174, 82, 12, 11, '#b07447', NS) + c(178, 80, 2.6, INK, NS) +
        p('M146 38 Q124 50 112 98 L122 100 Q132 64 152 46 Z', '#7a4a2a') +
        eye(152, 56, 6) + cheek(160, 72, 6) },

    { id: 'sheep', names: { en: 'Sheep', fi: 'Lammas', bn: 'ভেড়া' }, sound: 'baa',
      art: [[60, 70], [86, 52], [114, 52], [140, 70], [152, 100], [140, 132], [114, 150], [86, 150], [60, 132], [48, 100]]
          .map(([x, y]) => c(x, y, 26, '#fff')).join('') + c(100, 101, 54, '#fff', NS) +
        e(56, 104, 20, 10, '#e8b9a0', rot(20, 56, 104)) + e(144, 104, 20, 10, '#e8b9a0', rot(-20, 144, 104)) +
        e(100, 112, 32, 40, '#f6dcc8') +
        c(86, 76, 13, '#fff') + c(114, 76, 13, '#fff') + c(100, 70, 14, '#fff') +
        eyes(88, 112, 106, 6) + cheeks(80, 120, 124, 6) +
        e(100, 128, 6, 4, '#c98a7a', NS) + smile(100, 135, 7) },

    { id: 'goat', names: { en: 'Goat', fi: 'Vuohi', bn: 'ছাগল' }, sound: 'bleat',
      art: p('M80 62 Q66 28 38 32 Q60 42 66 70 Z', '#d6cbb8') + p('M120 62 Q134 28 162 32 Q140 42 134 70 Z', '#d6cbb8') +
        e(44, 92, 24, 10, '#c99a6a', rot(25, 44, 92)) + e(156, 92, 24, 10, '#c99a6a', rot(-25, 156, 92)) +
        p('M86 146 Q100 192 114 146 Z', '#fff8ec') +
        p('M60 82 Q60 52 100 52 Q140 52 140 82 L132 138 Q100 164 68 138 Z', '#e3bf92') +
        e(100, 136, 24, 15, '#f3dcc0') + e(92, 134, 3, 4, INK, NS) + e(108, 134, 3, 4, INK, NS) +
        eyes(82, 118, 96, 7) + cheeks(72, 128, 116, 7) },

    { id: 'pig', names: { en: 'Pig', fi: 'Sika', bn: 'শূকর' }, sound: 'oink',
      art: p('M54 74 L48 34 L88 56 Z', '#ff9fbd') + p('M146 74 L152 34 L112 56 Z', '#ff9fbd') +
        e(100, 110, 64, 56, '#ffbcd0') +
        eyes(74, 126, 96, 7) + cheeks(58, 142, 124) +
        e(100, 126, 26, 18, '#ff94b6') + e(91, 126, 4, 7, '#c45a7f', NS) + e(109, 126, 4, 7, '#c45a7f', NS) +
        smile(100, 152, 10) },

    { id: 'rabbit', names: { en: 'Rabbit', fi: 'Kani', bn: 'খরগোশ' }, sound: 'sniff',
      art: e(76, 52, 15, 44, '#eeeaf4', rot(-10, 76, 52)) + e(124, 52, 15, 44, '#eeeaf4', rot(10, 124, 52)) +
        e(76, 56, 7, 32, '#ffb3c7', NS + ' ' + rot(-10, 76, 56)) + e(124, 56, 7, 32, '#ffb3c7', NS + ' ' + rot(10, 124, 56)) +
        e(100, 122, 56, 48, '#eeeaf4') +
        eyes(80, 120, 112, 7) + cheeks(66, 134, 132) +
        p('M94 146 h12 v11 h-12 Z', '#fff') + line('M100 146 v11', INK, 2.5) +
        p('M94 130 L106 130 L100 137 Z', '#ff8fab') +
        p('M100 137 Q100 145 92 145 M100 137 Q100 145 108 145') + whiskers(134) },

    { id: 'mouse', names: { en: 'Mouse', fi: 'Hiiri', bn: 'ইঁদুর' }, sound: 'squeak',
      art: line('M140 152 Q188 156 182 120 Q178 100 190 90', INK, 5) +
        c(52, 66, 34, '#c9c3d6') + c(148, 66, 34, '#c9c3d6') +
        c(52, 66, 22, '#ffb8cc', NS) + c(148, 66, 22, '#ffb8cc', NS) +
        e(100, 118, 54, 46, '#c9c3d6') +
        eyes(80, 120, 110, 7) + cheeks(66, 134, 130) +
        c(100, 130, 8, '#ff8fab') + smile(100, 142, 7) + whiskers(130) },

    { id: 'elephant', names: { en: 'Elephant', fi: 'Norsu', bn: 'হাতি' }, sound: 'trumpet',
      art: e(42, 100, 36, 48, '#b9cbe8') + e(158, 100, 36, 48, '#b9cbe8') +
        e(44, 102, 22, 33, '#ffc7d6', NS) + e(156, 102, 22, 33, '#ffc7d6', NS) +
        e(100, 96, 52, 52, '#a7bde0') +
        p('M80 136 Q74 152 82 160 Q86 150 88 140 Z', '#fffbea') + p('M120 136 Q126 152 118 160 Q114 150 112 140 Z', '#fffbea') +
        p('M86 112 Q82 160 104 176 Q120 184 130 170 Q116 166 112 158 Q106 146 114 112 Z', '#a7bde0', NS) +
        p('M86 112 Q82 160 104 176 Q120 184 130 170 Q116 166 112 158 Q106 146 114 112') +
        line('M94 146 L106 144 M98 160 L110 156', INK, 3) +
        eyes(78, 122, 92, 8) + cheeks(66, 134, 112) },

    { id: 'lion', names: { en: 'Lion', fi: 'Leijona', bn: 'সিংহ' }, sound: 'roar',
      art: Array.from({ length: 12 }, (_, i) => {
          const a = i * Math.PI / 6;
          return c((100 + 62 * Math.cos(a)).toFixed(1), (104 + 62 * Math.sin(a)).toFixed(1), 26, '#e8903f');
        }).join('') + c(100, 104, 66, '#e8903f', NS) +
        c(64, 66, 14, '#ffd27a') + c(136, 66, 14, '#ffd27a') + c(64, 66, 7, '#ffb08a', NS) + c(136, 66, 7, '#ffb08a', NS) +
        c(100, 108, 50, '#ffd27a') +
        eyes(82, 118, 100, 7) + cheeks(70, 130, 122) +
        e(100, 128, 26, 18, '#fff1c9', NS) +
        p('M92 118 L108 118 L100 127 Z', '#8a5a3a') +
        p('M100 127 Q100 136 91 137 M100 127 Q100 136 109 137') },

    { id: 'tiger', names: { en: 'Tiger', fi: 'Tiikeri', bn: 'বাঘ' }, sound: 'growl',
      art: c(56, 58, 18, '#ff9f43') + c(144, 58, 18, '#ff9f43') + c(56, 58, 9, '#fff3e0', NS) + c(144, 58, 9, '#fff3e0', NS) +
        e(100, 108, 64, 56, '#ff9f43') +
        e(80, 136, 26, 18, '#fff', NS) + e(120, 136, 26, 18, '#fff', NS) +
        line('M100 54 L100 72 M86 56 L88 68 M114 56 L112 68', '#3a2a2a', 6) +
        line('M38 98 L58 102 M38 116 L56 116 M162 98 L142 102 M162 116 L144 116', '#3a2a2a', 6) +
        eyes(78, 122, 100, 8) + cheeks(62, 138, 120, 7) +
        p('M92 124 L108 124 L100 132 Z', '#ff8fab') +
        p('M100 132 Q100 141 91 142 M100 132 Q100 141 109 142') + whiskers(134) },

    { id: 'monkey', names: { en: 'Monkey', fi: 'Apina', bn: 'বানর' }, sound: 'monkey',
      art: c(42, 104, 20, '#a8714a') + c(158, 104, 20, '#a8714a') + c(42, 104, 11, '#f3d2a8', NS) + c(158, 104, 11, '#f3d2a8', NS) +
        c(100, 100, 58, '#a8714a') +
        c(82, 94, 22, '#f3d2a8', NS) + c(118, 94, 22, '#f3d2a8', NS) + e(100, 126, 38, 26, '#f3d2a8', NS) +
        p('M90 44 Q98 28 102 44 Q110 32 114 46') +
        eyes(84, 116, 94, 7) + cheeks(70, 130, 118, 7) +
        c(95, 114, 2.6, INK, NS) + c(105, 114, 2.6, INK, NS) +
        p('M80 126 Q100 148 120 126') },

    { id: 'giraffe', names: { en: 'Giraffe', fi: 'Kirahvi', bn: 'জিরাফ' }, sound: 'hum',
      art: p('M82 204 L88 96 L116 96 L122 204 Z', '#ffd46b') +
        e(100, 140, 9, 12, '#d9893a', NS) + e(110, 176, 8, 11, '#d9893a', NS) + e(91, 118, 6, 7, '#d9893a', NS) +
        e(92, 188, 6, 8, '#d9893a', NS) + e(110, 120, 5, 6, '#d9893a', NS) +
        line('M84 54 L80 26 M116 54 L120 26', INK, 12) + line('M84 54 L80 26 M116 54 L120 26', '#ffd46b', 5) +
        c(80, 22, 7, '#c06a2f') + c(120, 22, 7, '#c06a2f') +
        e(54, 66, 18, 9, '#ffd46b', rot(-25, 54, 66)) + e(146, 66, 18, 9, '#ffd46b', rot(25, 146, 66)) +
        e(100, 72, 40, 32, '#ffd46b') +
        c(80, 54, 6, '#d9893a', NS) + c(122, 58, 5, '#d9893a', NS) +
        e(100, 98, 28, 18, '#ffe7ae') + c(92, 94, 2.6, INK, NS) + c(108, 94, 2.6, INK, NS) +
        eyes(84, 116, 70, 7) + smile(100, 104, 8) },

    { id: 'zebra', names: { en: 'Zebra', fi: 'Seepra', bn: 'জেব্রা' }, sound: 'neigh',
      art: p('M66 64 L58 22 L88 50 Z', '#fff') + p('M134 64 L142 22 L112 50 Z', '#fff') +
        p('M66 54 L62 34 L78 50 Z', '#ffc7d6', NS) + p('M134 54 L138 34 L122 50 Z', '#ffc7d6', NS) +
        p('M84 48 L90 22 L100 38 L110 22 L116 48 Z', '#3a3a3a') +
        p('M58 82 Q58 42 100 42 Q142 42 142 82 L136 136 Q100 152 64 136 Z', '#ffffff') +
        line('M60 70 Q74 74 82 62 M60 96 Q74 98 84 86 M140 70 Q126 74 118 62 M140 96 Q126 98 116 86 M88 52 Q100 62 112 52 M66 120 Q76 116 80 108 M134 120 Q124 116 120 108', '#3a3a3a', 7) +
        e(100, 148, 36, 26, '#6a6470') + e(88, 144, 5, 7, '#2d2323', NS) + e(112, 144, 5, 7, '#2d2323', NS) +
        line('M90 160 Q100 166 110 160', '#fff', 3) +
        eyes(80, 120, 100, 8) },

    { id: 'bear', names: { en: 'Bear', fi: 'Karhu', bn: 'ভালুক' }, sound: 'growl',
      art: c(52, 58, 22, '#b07a4f') + c(148, 58, 22, '#b07a4f') + c(52, 58, 11, '#e8b98f', NS) + c(148, 58, 11, '#e8b98f', NS) +
        c(100, 108, 62, '#b07a4f') +
        e(100, 132, 30, 24, '#ecd0ad') +
        eyes(76, 124, 100, 8) + cheeks(62, 138, 124) +
        e(100, 121, 13, 9, '#3a2a2a') +
        p('M100 130 L100 137 M100 137 Q92 145 86 139 M100 137 Q108 145 114 139') },

    { id: 'panda', names: { en: 'Panda', fi: 'Panda', bn: 'পান্ডা' }, sound: 'chime',
      art: c(50, 56, 22, '#2d2a2e') + c(150, 56, 22, '#2d2a2e') +
        e(100, 108, 64, 58, '#fff') +
        e(74, 104, 16, 22, '#2d2a2e', NS + ' ' + rot(35, 74, 104)) + e(126, 104, 16, 22, '#2d2a2e', NS + ' ' + rot(-35, 126, 104)) +
        c(76, 100, 7, '#fff', NS) + c(77, 100, 4, '#2d2323', NS) + c(124, 100, 7, '#fff', NS) + c(123, 100, 4, '#2d2323', NS) +
        e(100, 128, 10, 7, '#2d2a2e') +
        p('M100 135 Q100 143 92 143 M100 135 Q100 143 108 143') +
        cheeks(60, 140, 134) },

    { id: 'fox', names: { en: 'Fox', fi: 'Kettu', bn: 'শিয়াল' }, sound: 'yip',
      art: p('M50 92 L44 24 L92 62 Z', '#ff8a3d') + p('M150 92 L156 24 L108 62 Z', '#ff8a3d') +
        p('M56 74 L52 44 L76 62 Z', '#fff1e0', NS) + p('M144 74 L148 44 L124 62 Z', '#fff1e0', NS) +
        p('M46 44 L44 24 L60 36 Z', '#3a2a2a', NS) + p('M154 44 L156 24 L140 36 Z', '#3a2a2a', NS) +
        p('M34 84 Q40 56 100 56 Q160 56 166 84 Q150 132 100 164 Q50 132 34 84 Z', '#ff8a3d') +
        p('M38 96 Q66 102 82 126 Q100 118 118 126 Q134 102 162 96 Q148 132 100 162 Q52 132 38 96 Z', '#fff8ee', NS) +
        eyes(76, 124, 96, 7) + cheeks(62, 138, 114, 7) +
        e(100, 146, 10, 7.5, '#3a2a2a') + smile(100, 128, 6) },

    { id: 'wolf', names: { en: 'Wolf', fi: 'Susi', bn: 'নেকড়ে' }, sound: 'howl',
      art: p('M50 86 L52 24 L90 58 Z', '#8e9ab0') + p('M150 86 L148 24 L110 58 Z', '#8e9ab0') +
        p('M60 70 L60 42 L80 58 Z', '#dfe4ee', NS) + p('M140 70 L140 42 L120 58 Z', '#dfe4ee', NS) +
        p('M40 90 Q44 54 100 54 Q156 54 160 90 L174 120 L152 122 Q132 152 100 158 Q68 152 48 122 L26 120 Z', '#8e9ab0') +
        p('M86 56 L100 74 L114 56 Z', '#7a869c', NS) +
        e(100, 132, 28, 22, '#e6eaf2') +
        eyes(78, 122, 96, 7) + cheeks(62, 138, 116, 7) +
        e(100, 120, 12, 8, '#2d2a2e') +
        p('M100 128 L100 135 M100 135 Q92 143 86 137 M100 135 Q108 143 114 137') },

    { id: 'deer', names: { en: 'Deer', fi: 'Peura', bn: 'হরিণ' }, sound: 'chime',
      art: line('M76 62 L66 20 M68 36 L50 26 M70 46 L84 28 M124 62 L134 20 M132 36 L150 26 M130 46 L116 28', '#8a5a3a', 7) +
        e(46, 84, 24, 11, '#c98d5a', rot(-25, 46, 84)) + e(154, 84, 24, 11, '#c98d5a', rot(25, 154, 84)) +
        e(46, 84, 14, 5, '#f6d3b0', NS + ' ' + rot(-25, 46, 84)) + e(154, 84, 14, 5, '#f6d3b0', NS + ' ' + rot(25, 154, 84)) +
        p('M62 78 Q62 54 100 54 Q138 54 138 78 L130 136 Q100 162 70 136 Z', '#c98d5a') +
        c(84, 70, 3.5, '#fff', NS) + c(100, 64, 3.5, '#fff', NS) + c(116, 70, 3.5, '#fff', NS) +
        e(100, 138, 24, 18, '#f3dcc0') + e(100, 130, 10, 7, '#2d2323') +
        eyes(82, 118, 98, 7) + cheeks(72, 128, 116, 7) },

    { id: 'camel', names: { en: 'Camel', fi: 'Kameli', bn: 'উট' }, sound: 'grumble',
      art: p('M44 104 Q32 116 36 132', 'none') +
        p('M56 110 h12 v56 h-12 Z M74 112 h12 v54 h-12 Z M114 112 h12 v54 h-12 Z M132 110 h12 v56 h-12 Z', '#d9a866') +
        e(62, 168, 9, 5, '#b98848') + e(80, 168, 9, 5, '#b98848') + e(120, 168, 9, 5, '#b98848') + e(138, 168, 9, 5, '#b98848') +
        p('M40 112 Q36 82 60 80 Q72 44 90 76 Q102 46 120 78 Q142 80 148 100 L148 114 Q100 126 40 112 Z', '#e3b77a') +
        p('M136 106 Q156 98 154 68 L172 62 Q178 100 152 120 Z', '#e3b77a') +
        p('M152 42 L150 32 L160 40 Z', '#e3b77a') +
        e(168, 58, 22, 13, '#e3b77a', rot(12, 168, 58)) +
        eye(166, 52, 5) + c(186, 60, 2.4, INK, NS) + p('M178 68 Q184 70 188 66') + cheek(172, 64, 5) },

    { id: 'kangaroo', names: { en: 'Kangaroo', fi: 'Kenguru', bn: 'ক্যাঙ্গারু' }, sound: 'boing',
      art: p('M72 150 Q34 162 14 188 Q44 180 86 168 Z', '#c98a52') +
        e(100, 182, 32, 9, '#c98a52') +
        e(100, 128, 36, 48, '#d9a066') +
        e(106, 144, 22, 24, '#f3d2a8', NS) +
        c(106, 134, 10, '#d9a066') + e(100, 122, 3, 6, '#d9a066') + eye(110, 132, 3) +
        p('M84 140 Q106 152 128 140', '#f3d2a8') +
        line('M124 104 Q140 112 134 126', INK, 10) + line('M124 104 Q140 112 134 126', '#d9a066', 4) +
        e(100, 30, 7, 18, '#d9a066', rot(-15, 100, 30)) + e(114, 28, 7, 18, '#d9a066', rot(10, 114, 28)) +
        p('M94 62 Q96 40 116 40 Q136 42 150 64 Q152 78 136 80 Q110 84 96 76 Z', '#d9a066') +
        eye(118, 56, 6) + c(148, 66, 4, INK, NS) + p('M134 74 Q140 76 144 72') + cheek(124, 70, 6) },

    { id: 'penguin', names: { en: 'Penguin', fi: 'Pingviini', bn: 'পেঙ্গুইন' }, sound: 'squawk',
      art: e(80, 182, 16, 8, '#ffa53d') + e(120, 182, 16, 8, '#ffa53d') +
        e(46, 122, 12, 34, '#2f3443', rot(20, 46, 122)) + e(154, 122, 12, 34, '#2f3443', rot(-20, 154, 122)) +
        e(100, 108, 56, 76, '#2f3443') +
        e(100, 128, 40, 54, '#fff', NS) + c(84, 76, 19, '#fff', NS) + c(116, 76, 19, '#fff', NS) +
        eyes(86, 114, 74, 7) + cheeks(72, 128, 94, 7) +
        p('M90 88 L110 88 L100 101 Z', '#ffa53d') },

    { id: 'duck', names: { en: 'Duck', fi: 'Ankka', bn: 'হাঁস' }, sound: 'quack',
      art: p('M40 126 L22 102 L54 112 Z', '#ffe066') +
        e(96, 136, 66, 40, '#ffe066') +
        c(132, 80, 34, '#ffe066') +
        p('M160 78 Q188 76 188 88 Q178 100 158 94 Z', '#ff9a3d') + line('M160 87 L184 87', INK, 2.5) +
        p('M68 126 Q96 110 122 130 Q102 158 70 146 Z', '#ffd23d') +
        eye(140, 72, 6) + cheek(150, 92, 7) },

    { id: 'chicken', names: { en: 'Chicken', fi: 'Kana', bn: 'মুরগি' }, sound: 'cluck',
      art: line('M86 160 L84 186 M112 160 L114 186 M76 186 L92 186 M106 186 L122 186', '#f0a030', 5) +
        p('M44 112 Q30 82 46 70 Q52 90 64 102 Z', '#f5dcb0') +
        e(96, 128, 56, 42, '#f5dcb0') +
        c(132, 78, 27, '#f5dcb0') +
        p('M118 58 Q118 40 128 46 Q132 32 140 44 Q150 38 148 56 Z', '#ff5a5a') +
        p('M157 74 L174 80 L157 87 Z', '#ffb03d') +
        e(154, 96, 5, 8, '#ff5a5a') +
        p('M74 120 Q100 108 120 128 Q100 152 74 138 Z', '#e8c690') +
        eye(140, 72, 5.5) + cheek(146, 86, 6) },

    { id: 'rooster', names: { en: 'Rooster', fi: 'Kukko', bn: 'মোরগ' }, sound: 'crow',
      art: line('M88 160 L86 186 M114 160 L116 186 M78 186 L94 186 M108 186 L124 186', '#f0a030', 5) +
        p('M62 114 Q32 62 54 38 Q58 74 76 100 Z', '#2fae7a') +
        p('M58 118 Q16 96 20 60 Q40 90 72 106 Z', '#3d7fd9') +
        p('M60 124 Q26 126 12 102 Q42 112 74 114 Z', '#ffb03d') +
        e(100, 130, 50, 40, '#e8643c') +
        p('M112 112 Q116 76 132 70 Q148 76 150 100 Q140 116 112 112 Z', '#ffb03d') +
        c(134, 74, 24, '#ffb03d') +
        p('M110 60 Q104 34 120 40 Q122 20 136 34 Q144 18 152 38 Q164 36 156 58 Z', '#ff3d3d') +
        p('M156 72 L174 78 L156 85 Z', '#ffd23d') +
        e(152, 96, 7, 12, '#ff3d3d') +
        p('M78 124 Q102 110 124 132 Q104 156 78 142 Z', '#c94a2a') +
        eye(142, 68, 5.5) },

    { id: 'owl', names: { en: 'Owl', fi: 'Pöllö', bn: 'পেঁচা' }, sound: 'hoot',
      art: p('M52 60 L46 22 L80 46 Z', '#9c6b45') + p('M148 60 L154 22 L120 46 Z', '#9c6b45') +
        e(100, 110, 58, 72, '#9c6b45') +
        e(100, 144, 36, 34, '#ecd0ad', NS) +
        line('M86 136 l5 5 l5 -5 M104 136 l5 5 l5 -5 M95 152 l5 5 l5 -5', '#b98a5f', 3) +
        e(44, 124, 14, 36, '#7f5435', rot(12, 44, 124)) + e(156, 124, 14, 36, '#7f5435', rot(-12, 156, 124)) +
        c(76, 86, 24, '#fff') + c(124, 86, 24, '#fff') +
        eye(76, 88, 12) + eye(124, 88, 12) +
        p('M92 104 L108 104 L100 120 Z', '#ffb03d') +
        line('M86 180 v8 M94 180 v8 M106 180 v8 M114 180 v8', '#f0a030', 4) },

    { id: 'parrot', names: { en: 'Parrot', fi: 'Papukaija', bn: 'টিয়া পাখি' }, sound: 'whistle',
      art: line('M14 164 L186 164', '#8a5a3a', 9) +
        p('M84 148 L64 198 L82 198 L100 150 Z', '#3fae5a') +
        e(106, 118, 36, 48, '#5fd068', rot(-15, 106, 118)) +
        e(94, 124, 20, 36, '#3fae5a', rot(-15, 94, 124)) +
        line('M98 162 L94 172 M112 162 L114 172', '#f0a030', 5) +
        c(120, 64, 30, '#5fd068') +
        line('M94 82 Q118 100 144 80', '#2d2323', 4) +
        p('M140 54 Q168 54 162 86 Q154 76 142 76 Z', '#e8443c') +
        c(124, 58, 9, '#fff', NS) + eye(124, 58, 6) },

    { id: 'eagle', names: { en: 'Eagle', fi: 'Kotka', bn: 'ঈগল' }, sound: 'screech',
      art: p('M86 96 Q44 62 8 80 Q28 90 22 104 Q42 100 44 116 Q64 108 86 124 Z', '#7a4a2a') +
        p('M114 96 Q156 62 192 80 Q172 90 178 104 Q158 100 156 116 Q136 108 114 124 Z', '#7a4a2a') +
        p('M86 160 L80 186 L120 186 L114 160 Z', '#fff') +
        line('M90 168 l-6 14 M110 168 l6 14', '#ffc13d', 5) +
        e(100, 126, 30, 44, '#8a5a3a') +
        c(100, 66, 30, '#fff') +
        eyes(88, 112, 60, 6) + cheeks(80, 120, 74, 6) +
        p('M90 72 L110 72 Q116 92 102 98 Q104 86 90 82 Z', '#ffc13d') },

    { id: 'peacock', names: { en: 'Peacock', fi: 'Riikinkukko', bn: 'ময়ূর' }, sound: 'peacock',
      art: p('M14 134 A86 86 0 0 1 186 134 Z', '#62c98e') +
        Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (i + 0.5) * Math.PI / 9, x = (100 + 66 * Math.cos(a)).toFixed(1), y = (134 + 66 * Math.sin(a)).toFixed(1);
          return c(x, y, 11, '#2f8a9c', NS) + c(x, y, 6, '#3d5fd9', NS) + c(x, y, 2.5, '#ffd23d', NS);
        }).join('') +
        Array.from({ length: 5 }, (_, i) => {
          const a = Math.PI + (i + 0.5) * Math.PI / 5, x = (100 + 36 * Math.cos(a)).toFixed(1), y = (134 + 36 * Math.sin(a)).toFixed(1);
          return c(x, y, 8, '#2f8a9c', NS) + c(x, y, 4, '#3d5fd9', NS);
        }).join('') +
        line('M92 170 l-4 18 M108 170 l4 18', '#f0a030', 5) +
        e(100, 146, 24, 32, '#3d6fd9') +
        p('M90 124 Q88 88 100 76 Q112 88 110 124 Z', '#3d6fd9') +
        line('M100 50 L100 34 M93 52 L86 38 M107 52 L114 38', INK, 3) +
        c(100, 32, 4, '#3d6fd9') + c(85, 36, 4, '#3d6fd9') + c(115, 36, 4, '#3d6fd9') +
        c(100, 66, 17, '#3d6fd9') +
        c(93, 63, 6, '#fff', NS) + c(107, 63, 6, '#fff', NS) + eyes(93, 107, 63, 4) +
        p('M96 72 L104 72 L100 80 Z', '#ffc13d') },

    { id: 'dolphin', names: { en: 'Dolphin', fi: 'Delfiini', bn: 'ডলফিন' }, sound: 'dolphin',
      art: p('M30 152 L8 154 L24 166 L18 186 L42 162 Z', '#6a9fd0') +
        p('M96 78 Q104 46 126 58 Q118 66 118 76 Z', '#6a9fd0') +
        p('M28 156 Q50 76 130 72 Q166 72 178 88 L196 92 Q196 104 176 104 Q160 114 132 114 Q80 118 46 166 Z', '#7fb2e0') +
        p('M46 166 Q80 118 132 114 Q160 114 176 104 Q164 126 132 128 Q92 130 58 168 Z', '#e0f0ff', NS) +
        p('M112 114 Q104 136 90 144 Q118 138 128 116 Z', '#6a9fd0') +
        eye(152, 88, 6) + cheek(160, 100, 6) + p('M180 102 Q170 108 160 104') +
        c(30, 120, 5, '#9fd8ff', NS) + c(44, 104, 4, '#9fd8ff', NS) + c(20, 106, 3.5, '#9fd8ff', NS) },

    { id: 'whale', names: { en: 'Whale', fi: 'Valas', bn: 'তিমি' }, sound: 'whale',
      art: line('M80 62 Q76 40 60 32 M80 62 Q84 40 100 32 M80 62 L80 28', '#7fc8ff', 6) +
        c(56, 30, 5, '#9fd8ff', NS) + c(104, 28, 5, '#9fd8ff', NS) + c(80, 22, 5, '#9fd8ff', NS) +
        p('M150 104 Q174 94 176 64 Q186 80 198 72 Q196 104 162 124 Z', '#5b8fd9') +
        e(92, 118, 76, 50, '#5b8fd9') +
        e(84, 144, 58, 20, '#cfe4ff', NS) + line('M54 140 h10 M74 146 h10 M94 148 h10 M114 146 h10', '#a8c8f0', 3) +
        eye(48, 106, 7) + cheek(42, 124, 7) + p('M24 122 Q36 132 54 128') },

    { id: 'shark', names: { en: 'Shark', fi: 'Hai', bn: 'হাঙর' }, sound: 'bubbles',
      art: p('M32 104 L6 70 L16 104 L6 138 Z', '#8aa0b8') +
        p('M90 74 Q100 30 126 34 Q114 52 116 74 Z', '#8aa0b8') +
        p('M20 104 Q60 64 130 70 Q180 76 194 104 Q180 134 130 138 Q60 144 20 104 Z', '#8aa0b8') +
        p('M56 116 Q120 150 188 112 Q178 134 130 138 Q80 144 56 116 Z', '#eef3f8', NS) +
        p('M100 124 Q96 148 82 158 Q114 150 122 128 Z', '#7890aa') +
        line('M126 92 Q122 104 126 116 M136 90 Q132 104 136 118', INK, 3) +
        eye(160, 92, 7) + cheek(164, 108, 6) + p('M172 114 Q180 118 188 112') },

    { id: 'turtle', names: { en: 'Turtle', fi: 'Kilpikonna', bn: 'কচ্ছপ' }, sound: 'bubbles',
      art: e(64, 152, 14, 18, '#8ad97a') + e(132, 152, 14, 18, '#8ad97a') +
        p('M40 136 L20 146 L42 148 Z', '#8ad97a') +
        e(166, 112, 24, 20, '#8ad97a') +
        e(100, 138, 66, 14, '#5fae4a') +
        p('M34 138 Q34 64 100 64 Q166 64 166 138 Z', '#3fa15a') +
        p('M100 80 L118 92 L114 114 L86 114 L82 92 Z', '#7bc96a') +
        line('M82 92 L56 84 M118 92 L144 84 M86 114 L66 136 M114 114 L134 136 M100 80 L100 66', INK, 3) +
        eye(172, 104, 6) + cheek(176, 118, 6) + p('M178 120 Q184 122 188 118') },

    { id: 'frog', names: { en: 'Frog', fi: 'Sammakko', bn: 'ব্যাঙ' }, sound: 'ribbit',
      art: e(62, 172, 22, 11, '#6cc94a') + e(138, 172, 22, 11, '#6cc94a') +
        c(64, 64, 28, '#7ed957') + c(136, 64, 28, '#7ed957') +
        e(100, 120, 74, 54, '#7ed957') + c(64, 64, 26, '#7ed957', NS) + c(136, 64, 26, '#7ed957', NS) +
        c(64, 62, 17, '#fff') + c(136, 62, 17, '#fff') + eye(64, 64, 9) + eye(136, 64, 9) +
        e(100, 146, 40, 22, '#c8f2a8', NS) +
        c(92, 104, 2.6, INK, NS) + c(108, 104, 2.6, INK, NS) +
        p('M56 120 Q100 158 144 120') + cheeks(46, 154, 120, 9) },

    { id: 'snake', names: { en: 'Snake', fi: 'Käärme', bn: 'সাপ' }, sound: 'hiss',
      art: tubes(['M28 162 Q60 186 104 176 Q156 166 154 140 Q152 114 100 120 Q58 126 70 96 Q80 74 104 68'], '#8fd96a', 28) +
        p('M28 162 Q60 186 104 176 Q156 166 154 140 Q152 114 100 120 Q58 126 70 96 Q80 74 104 68', 'none',
          'stroke="#f2e85a" stroke-width="10" stroke-dasharray="4 22"') +
        line('M150 68 L168 68 L174 62 M168 68 L174 74', '#ff5a6e', 3) +
        e(124, 64, 30, 24, '#8fd96a') +
        eyes(114, 136, 56, 6) + cheeks(106, 144, 72, 6) + smile(126, 74, 8) },

    { id: 'crocodile', names: { en: 'Crocodile', fi: 'Krokotiili', bn: 'কুমির' }, sound: 'snap', move: 'translate(0 -26)',
      art: e(68, 150, 12, 18, '#4fa34a') + e(122, 150, 12, 18, '#4fa34a') +
        p('M52 118 Q22 118 4 142 Q32 142 56 140 Z', '#5fb85a') +
        p('M50 112 l7 -11 l7 11 l7 -11 l7 11 l7 -11 l7 11 l7 -11 l7 11 l7 -11 l7 11 Z', '#3f9a44') +
        e(92, 128, 50, 24, '#5fb85a') +
        p('M50 136 Q92 156 136 136 Q118 152 92 152 Q64 152 50 136 Z', '#bfe8a8', NS) +
        p('M124 110 Q138 96 160 104 L194 116 Q200 126 192 132 L130 142 Z', '#5fb85a') +
        p('M150 126 L154 133 L158 125 M166 124 L170 131 L174 123 M180 122 L184 129 L188 121', '#fff', 'stroke-width="2.5"') +
        line('M134 128 L192 121', INK, 3.5) +
        c(148, 98, 13, '#5fb85a') + c(148, 98, 12, '#5fb85a', NS) + eye(149, 96, 6) +
        c(188, 114, 2.4, INK, NS) + cheek(150, 116, 6) },

    { id: 'butterfly', names: { en: 'Butterfly', fi: 'Perhonen', bn: 'প্রজাপতি' }, sound: 'twinkle',
      art: e(62, 78, 46, 40, '#c58cff', rot(-20, 62, 78)) + e(138, 78, 46, 40, '#c58cff', rot(20, 138, 78)) +
        e(70, 140, 32, 30, '#ff9fd0', rot(20, 70, 140)) + e(130, 140, 32, 30, '#ff9fd0', rot(-20, 130, 140)) +
        c(52, 72, 13, '#fff3a0', NS) + c(148, 72, 13, '#fff3a0', NS) + c(70, 144, 9, '#fff', NS) + c(130, 144, 9, '#fff', NS) +
        c(80, 98, 6, '#9fd8ff', NS) + c(120, 98, 6, '#9fd8ff', NS) +
        p('M96 46 Q86 22 72 18 M104 46 Q114 22 128 18') + c(72, 18, 5, '#5a4a6a') + c(128, 18, 5, '#5a4a6a') +
        e(100, 114, 11, 52, '#5a4a6a') +
        c(100, 58, 16, '#5a4a6a') +
        c(94, 56, 4.5, '#fff', NS) + c(95, 56, 2.6, '#2d2323', NS) + c(106, 56, 4.5, '#fff', NS) + c(107, 56, 2.6, '#2d2323', NS) +
        line('M95 64 Q100 69 105 64', '#fff', 2.5) },

    { id: 'bee', names: { en: 'Bee', fi: 'Mehiläinen', bn: 'মৌমাছি' }, sound: 'buzz',
      art: p('M166 116 L192 122 L166 130 Z', '#4a3434') +
        e(112, 122, 58, 42, '#ffd23d') +
        line('M102 84 Q94 122 102 160 M132 86 Q124 122 132 158', '#3a2f2a', 14) +
        e(112, 122, 58, 42, 'none') +
        e(96, 70, 22, 32, '#e6f6ff', 'opacity=".92" ' + rot(-30, 96, 70)) + e(136, 70, 22, 32, '#e6f6ff', 'opacity=".92" ' + rot(30, 136, 70)) +
        p('M46 92 Q38 66 28 64 M64 88 Q68 64 80 58') + c(28, 64, 5, INK) + c(80, 58, 5, INK) +
        c(56, 118, 32, '#ffd23d') +
        eyes(46, 68, 112, 6) + cheeks(38, 74, 126, 6) + smile(57, 126, 8) },

    { id: 'octopus', names: { en: 'Octopus', fi: 'Mustekala', bn: 'অক্টোপাস' }, sound: 'bubbles',
      art: tubes([
          'M58 118 Q30 140 40 168 Q48 184 28 188',
          'M78 128 Q64 160 80 176 Q92 188 74 196',
          'M100 132 Q92 160 104 176 Q114 190 100 196',
          'M122 128 Q136 160 120 176 Q108 188 126 196',
          'M142 118 Q170 140 160 168 Q152 184 172 188'], '#c58cff', 16) +
        e(100, 88, 62, 58, '#c58cff') +
        c(74, 54, 7, '#e2c4ff', NS) + c(124, 48, 9, '#e2c4ff', NS) + c(140, 70, 5, '#e2c4ff', NS) +
        eyes(80, 120, 92, 8) + cheeks(66, 134, 112) + smile(100, 112, 10) },
  ];

  // Wrap an animal's shapes in a complete <svg>
  const toSVG = (a) =>
    `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" ` +
    `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${a.move ? `<g transform="${a.move}">${a.art}</g>` : a.art}</svg>`;

  window.FTA_ANIMALS = ANIMALS;
  window.FTA_toSVG = toSVG;
})();
