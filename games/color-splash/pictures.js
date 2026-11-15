/* ============ Color Splash: the pictures ============
   Each picture is an SVG in a 400 x 400 box. Shapes with class "region" are the parts
   a child colours in (they start white). Everything else (outlines, faces, stems) is
   fixed decoration. Faces use pointer-events: none so taps land on the region below.

   To add a picture: add an entry with an id and the SVG body. Keep regions big
   (little fingers!) and give it 3 to 6 regions.                                       */

(function () {
  'use strict';

  const INK = '#4a3434';
  const S = `stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;
  const R = (d) => `<path class="region" d="${d}" fill="#fff" ${S}/>`;
  const C = (cx, cy, r) => `<circle class="region" cx="${cx}" cy="${cy}" r="${r}" fill="#fff" ${S}/>`;
  const E = (cx, cy, rx, ry, rot) => `<ellipse class="region" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''} fill="#fff" ${S}/>`;

  // A small happy face (eyes + smile + cheeks), never catches taps
  function face(x, y, s = 1) {
    return `<g class="face" transform="translate(${x} ${y}) scale(${s})">
      <circle cx="-16" cy="0" r="6" fill="${INK}"/><circle cx="16" cy="0" r="6" fill="${INK}"/>
      <circle cx="-14" cy="-2" r="2" fill="#fff"/><circle cx="18" cy="-2" r="2" fill="#fff"/>
      <ellipse cx="-27" cy="14" rx="8" ry="5" fill="#ff9fb8" opacity=".6"/>
      <ellipse cx="27" cy="14" rx="8" ry="5" fill="#ff9fb8" opacity=".6"/>
      <path d="M-11,13 Q0,24 11,13" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }

  const PICTURES = [
    {
      id: 'balloons',
      svg: `
        <path d="M110,232 Q100,290 130,330 Q150,360 200,372" fill="none" ${S} stroke-width="4"/>
        <path d="M200,212 Q210,290 200,372" fill="none" ${S} stroke-width="4"/>
        <path d="M290,232 Q300,290 270,330 Q250,360 200,372" fill="none" ${S} stroke-width="4"/>
        ${E(110, 150, 70, 84)}
        ${R('M100,232 L120,232 L110,246 Z')}
        ${E(290, 150, 70, 84)}
        ${R('M280,232 L300,232 L290,246 Z')}
        ${E(200, 124, 76, 90)}
        ${R('M190,212 L210,212 L200,228 Z')}
        <g class="face">
          <ellipse cx="82" cy="112" rx="10" ry="18" fill="#fff" opacity=".7" transform="rotate(20 82 112)"/>
          <ellipse cx="172" cy="84" rx="10" ry="20" fill="#fff" opacity=".7" transform="rotate(20 172 84)"/>
          <ellipse cx="262" cy="112" rx="10" ry="18" fill="#fff" opacity=".7" transform="rotate(20 262 112)"/>
        </g>
        ${face(200, 130, 1.1)}`
    },
    {
      id: 'fish',
      svg: `
        ${R('M300,200 L372,138 Q384,200 372,262 Z')}
        ${R('M150,118 Q200,52 262,112 Z')}
        ${R('M170,284 Q210,336 250,286 Z')}
        ${E(200, 200, 128, 92)}
        ${R('M152,140 Q186,200 152,260 Q120,200 152,140 Z')}
        <g class="face" fill="none" ${S} stroke-width="5">
          <circle cx="60" cy="96" r="12"/><circle cx="36" cy="58" r="8"/><circle cx="52" cy="26" r="5"/>
        </g>
        ${face(104, 188, 1.05)}`
    },
    {
      id: 'flower',
      svg: `
        <path d="M200,250 Q192,320 200,390" fill="none" stroke="#5cb85c" stroke-width="12" stroke-linecap="round"/>
        <path d="M200,330 Q246,290 286,310 Q250,350 200,340 Z" fill="#7fd27f" ${S} stroke-width="5"/>
        <path d="M198,350 Q150,312 112,330 Q150,372 198,362 Z" fill="#7fd27f" ${S} stroke-width="5"/>
        ${C(200, 92, 52)}
        ${C(282, 150, 52)}
        ${C(252, 246, 52)}
        ${C(148, 246, 52)}
        ${C(118, 150, 52)}
        ${C(200, 174, 58)}
        ${face(200, 172, 1)}`
    },
    {
      id: 'butterfly',
      svg: `
        ${R('M196,190 Q150,60 70,70 Q24,90 44,150 Q70,206 196,206 Z')}
        ${R('M204,190 Q250,60 330,70 Q376,90 356,150 Q330,206 204,206 Z')}
        ${R('M196,214 Q90,214 76,280 Q80,330 130,326 Q180,316 196,232 Z')}
        ${R('M204,214 Q310,214 324,280 Q320,330 270,326 Q220,316 204,232 Z')}
        ${E(200, 214, 22, 92)}
        <path class="face" d="M190,128 Q170,80 150,70 M210,128 Q230,80 250,70" fill="none" ${S} stroke-width="5"/>
        <g class="face"><circle cx="150" cy="70" r="8" fill="${INK}"/><circle cx="250" cy="70" r="8" fill="${INK}"/></g>
        ${face(200, 160, .55)}`
    },
    {
      id: 'house',
      svg: `
        ${R('M84,196 H316 V360 H84 Z')}
        ${R('M60,206 L200,72 L340,206 Z')}
        ${R('M174,262 H226 V360 H174 Z')}
        ${R('M106,232 H156 V282 H106 Z')}
        ${R('M244,232 H294 V282 H244 Z')}
        <g class="face" fill="none" ${S} stroke-width="5">
          <path d="M131,232 V282 M106,257 H156 M269,232 V282 M244,257 H294"/>
        </g>
        <circle class="face" cx="214" cy="314" r="5" fill="${INK}"/>
        <path class="face" d="M30,370 H370" ${S} stroke-width="6"/>`
    },
    {
      id: 'icecream',
      svg: `
        ${R('M136,236 L264,236 L200,384 Z')}
        ${C(160, 200, 58)}
        ${C(240, 200, 58)}
        ${C(200, 130, 64)}
        ${C(214, 50, 22)}
        <g class="face" fill="none" ${S} stroke-width="4" opacity=".6">
          <path d="M160,262 L222,320 M196,250 L240,290 M240,262 L178,320 M206,250 L162,290"/>
        </g>
        <path class="face" d="M214,28 Q220,12 236,8" fill="none" ${S} stroke-width="4"/>
        ${face(200, 136, 1)}`
    },
    {
      id: 'car',
      svg: `
        ${R('M50,250 Q50,200 100,196 L300,196 Q350,200 350,250 L350,290 L50,290 Z')}
        ${R('M110,196 L150,128 L262,128 L298,196 Z')}
        ${R('M138,190 L162,144 L200,144 L200,190 Z')}
        ${R('M214,190 L214,144 L252,144 L278,190 Z')}
        ${C(120, 294, 38)}
        ${C(280, 294, 38)}
        <g class="face"><circle cx="120" cy="294" r="12" fill="#fff" ${S} stroke-width="5"/><circle cx="280" cy="294" r="12" fill="#fff" ${S} stroke-width="5"/></g>
        <circle class="face" cx="338" cy="236" r="9" fill="#ffe066" ${S} stroke-width="4"/>
        <path class="face" d="M24,340 H376" ${S} stroke-width="6"/>`
    },
    {
      id: 'sun',
      svg: `
        ${R('M200,20 L222,72 L178,72 Z')}
        ${R('M200,380 L222,328 L178,328 Z')}
        ${R('M20,200 L72,178 L72,222 Z')}
        ${R('M380,200 L328,178 L328,222 Z')}
        ${R('M73,73 L120,100 L100,120 Z')}
        ${R('M327,73 L300,120 L280,100 Z')}
        ${R('M73,327 L100,280 L120,300 Z')}
        ${R('M327,327 L280,300 L300,280 Z')}
        ${C(200, 200, 112)}
        ${face(200, 196, 1.6)}`
    }
  ];

  window.COLOR_PICTURES = PICTURES;
})();
