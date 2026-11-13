/* ============ Feed the Animals: foods + animal drawings ============
   Every animal is an inline SVG built from the same skeleton, so all of them
   share the same moods (hungry, chewing, happy, "yuck") driven by CSS classes:

     body (arms, feet, tail)  ->  head (ears, face, eyes, cheeks, mouth, nose)

   Coordinates live in a 240 x 290 box (viewBox "0 -20 240 290").
   The head is centred near (120, 112), the body sits underneath.
   Works in the browser (window.FEED) and in Node (module.exports) so the
   landing-page card art can be generated from the same drawings. */

(function (root) {
  "use strict";

  const INK = "#3a2a2a";
  const MOUTH = "#5b2333";
  const TONGUE = "#ff7e9b";

  /* ---------- Foods ---------- */
  const FOODS = {
    banana:     { emoji: "🍌", plate: "#fff6c9", crumbs: ["#ffe066", "#fff3b0"] },
    apple:      { emoji: "🍎", plate: "#ffe1e1", crumbs: ["#ff5a5a", "#fff0d6"] },
    carrot:     { emoji: "🥕", plate: "#ffe8d2", crumbs: ["#ff9a3c", "#7ccf5b"] },
    strawberry: { emoji: "🍓", plate: "#ffe0ea", crumbs: ["#ff4f6d", "#7ccf5b"] },
    watermelon: { emoji: "🍉", plate: "#e2f8df", crumbs: ["#ff5a7a", "#5cc96b"] },
    fish:       { emoji: "🐟", plate: "#dff1ff", crumbs: ["#7cc3ff", "#d3ecff"] },
    milk:       { emoji: "🥛", plate: "#eef3ff", crumbs: ["#ffffff", "#e6eeff"] },
    leaves:     { emoji: "🍃", plate: "#e6f9dc", crumbs: ["#6fd36b", "#b6f0a0"] },
    bone:       { emoji: "🦴", plate: "#f6efe4", crumbs: ["#f3e6cf", "#ffffff"] },
    grass:      { emoji: "🌿", plate: "#e3f7da", crumbs: ["#4fbf5a", "#9be38f"] },
    honey:      { emoji: "🍯", plate: "#fff0c2", crumbs: ["#ffc233", "#ffe08a"] },
    bamboo:     { emoji: "🎋", plate: "#e4f7dc", crumbs: ["#7ccf5b", "#c6f0a8"] },
    cheese:     { emoji: "🧀", plate: "#fff4c8", crumbs: ["#ffd23d", "#fff1a8"] },
    meat:       { emoji: "🍖", plate: "#ffe6dc", crumbs: ["#c8643c", "#f3e6cf"] },
    nut:        { emoji: "🌰", plate: "#f6eadc", crumbs: ["#a0623a", "#d9a877"] },
    corn:       { emoji: "🌽", plate: "#fff6c9", crumbs: ["#ffd23d", "#7ccf5b"] },
    lettuce:    { emoji: "🥬", plate: "#e6f9dc", crumbs: ["#6fd36b", "#c6f0a8"] }
  };

  /* ---------- Shared parts ---------- */
  function eye(x, y, side, opt) {
    // side: -1 left eye, 1 right eye (the squint ">" / "<" points inward)
    // opt.ring: colour of a ring around the open eye; opt.line: colour of the happy/squint lines
    //           (both for animals with dark fur around the eyes, like the panda)
    const o = opt || {};
    const line = o.line || INK;
    const sq = side < 0 ? "M-9,-7 L7,0 L-9,7" : "M9,-7 L-7,0 L9,7";
    return `<g class="eye" transform="translate(${x} ${y})">
      <g class="eye-open">${o.ring ? `<circle r="14" fill="${o.ring}"/>` : ""}<circle r="11" fill="${INK}"/><circle cx="3.6" cy="-4.2" r="4" fill="#fff"/><circle cx="-3.4" cy="3.6" r="1.7" fill="#fff"/></g>
      <path class="eye-happy" d="M-11,4 Q0,-10 11,4" fill="none" stroke="${line}" stroke-width="5.5" stroke-linecap="round"/>
      <path class="eye-squint" d="${sq}" fill="none" stroke="${line}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }

  function cheeks(lx, rx, y, color) {
    return `<g class="cheeks" fill="${color || "#ff9fb8"}" opacity=".55">
      <ellipse class="cheek" cx="${lx}" cy="${y}" rx="13" ry="8"/>
      <ellipse class="cheek" cx="${rx}" cy="${y}" rx="13" ry="8"/>
    </g>`;
  }

  function mouth(x, y) {
    return `<g transform="translate(${x} ${y})">
      <g class="m m-smile"><path d="M-15,-3 Q0,13 15,-3" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>
      <g class="m m-open"><ellipse rx="15" ry="17" fill="${MOUTH}"/><ellipse cy="9" rx="10" ry="6" fill="${TONGUE}"/></g>
      <g class="m m-chew"><ellipse rx="12" ry="7" fill="${MOUTH}"/></g>
      <g class="m m-happy"><path d="M-21,-5 Q0,30 21,-5 Z" fill="${MOUTH}" stroke="${MOUTH}" stroke-width="4" stroke-linejoin="round"/><path d="M-10,13 Q0,5 10,13 Q0,20 -10,13 Z" fill="${TONGUE}"/></g>
      <g class="m m-yuck"><path d="M-16,0 q8,-7 16,0 q8,7 16,0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><ellipse class="blep" cx="8" cy="7" rx="6.5" ry="8.5" fill="${TONGUE}"/></g>
      <circle class="m-target" r="2" fill="none"/>
    </g>`;
  }

  // Birds get a beak instead of lips, with the same five moods.
  function beak(x, y, color, dark) {
    const top = `<path d="M-18,-2 Q0,-18 18,-2 Q0,6 -18,-2 Z" fill="${color}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>`;
    const low = (dy) => `<path d="M-14,${dy} Q0,${dy - 6} 14,${dy} Q0,${dy + 12} -14,${dy} Z" fill="${color}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>`;
    return `<g transform="translate(${x} ${y}) scale(1.4)">
      <g class="m m-smile">${low(1)}${top}</g>
      <g class="m m-open"><ellipse cy="7" rx="12" ry="9" fill="${MOUTH}"/><ellipse cy="11" rx="7" ry="4" fill="${TONGUE}"/>${low(12)}${top}</g>
      <g class="m m-chew"><ellipse cy="4" rx="10" ry="5" fill="${MOUTH}"/>${low(6)}${top}</g>
      <g class="m m-happy"><ellipse cy="9" rx="14" ry="12" fill="${MOUTH}"/><ellipse cy="14" rx="8" ry="5" fill="${TONGUE}"/>${low(17)}${top}</g>
      <g class="m m-yuck"><ellipse class="blep" cx="9" cy="10" rx="6" ry="8" fill="${TONGUE}"/>${low(1)}${top}</g>
      <circle class="m-target" cy="4" r="2" fill="none"/>
    </g>`;
  }

  // A ring of fluffy circles (lion's mane, sheep's wool)
  function fluff(cx, cy, r, n, size, fill, stroke) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      s += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${size}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="3"` : ""}/>`;
    }
    return s;
  }

  function body(c) {
    // c: { main, belly, stroke?, extra?, tail? }
    const st = c.stroke ? ` stroke="${c.stroke}" stroke-width="3"` : "";
    return `<g class="c-body">
      ${c.tail || ""}
      <g class="arm arm-l"><circle cx="66" cy="222" r="16" fill="${c.main}"${st}/></g>
      <g class="arm arm-r"><circle cx="174" cy="222" r="16" fill="${c.main}"${st}/></g>
      <ellipse cx="92" cy="258" rx="20" ry="10" fill="${c.paw || c.main}"${st}/>
      <ellipse cx="148" cy="258" rx="20" ry="10" fill="${c.paw || c.main}"${st}/>
      <ellipse cx="120" cy="228" rx="58" ry="36" fill="${c.main}"${st}/>
      <ellipse cx="120" cy="236" rx="34" ry="22" fill="${c.belly}"/>
      ${c.extra || ""}
    </g>`;
  }

  function whiskers(y, color) {
    const s = `stroke="${color || "#6b5050"}" stroke-width="3" stroke-linecap="round" opacity=".55"`;
    return `<g class="whiskers" ${s}>
      <path d="M78,${y} L40,${y - 8}"/><path d="M78,${y + 8} L40,${y + 12}"/>
      <path d="M162,${y} L200,${y - 8}"/><path d="M162,${y + 8} L200,${y + 12}"/>
    </g>`;
  }

  /* ---------- The animals ----------
     eats:  foods that make the animal happy (eats[0] is the favourite, picked most often)
     avoid: clearly-wrong foods used as the other two choices  */
  const ANIMALS = [
    {
      id: "monkey", label: "Monkey",
      bg: "#fff1d6",
      eats: ["banana", "strawberry", "apple"],
      avoid: ["fish", "bone", "grass", "milk"],
      body: body({
        main: "#a86b42", belly: "#f6d3a8",
        tail: `<path class="tail" d="M168,238 C206,240 214,200 196,188 C184,180 172,192 182,200" fill="none" stroke="#a86b42" stroke-width="10" stroke-linecap="round"/>`
      }),
      earsBack: `<g class="ear ear-l"><circle cx="40" cy="112" r="25" fill="#a86b42"/><circle cx="40" cy="112" r="14" fill="#f6d3a8"/></g>
                 <g class="ear ear-r"><circle cx="200" cy="112" r="25" fill="#a86b42"/><circle cx="200" cy="112" r="14" fill="#f6d3a8"/></g>`,
      head: `<circle cx="120" cy="112" r="78" fill="#a86b42"/>
             <path d="M104,38 C108,22 122,22 120,36 C126,24 140,28 134,40" fill="#a86b42"/>
             <ellipse cx="98" cy="102" rx="30" ry="32" fill="#f6d3a8"/>
             <ellipse cx="142" cy="102" rx="30" ry="32" fill="#f6d3a8"/>
             <ellipse cx="120" cy="142" rx="54" ry="40" fill="#f6d3a8"/>`,
      eyes: [100, 140, 102],
      cheeks: [76, 164, 132],
      mouth: [120, 154],
      nose: `<g fill="#7a4a2c"><ellipse cx="113" cy="128" rx="3.5" ry="4.5"/><ellipse cx="127" cy="128" rx="3.5" ry="4.5"/></g>`
    },
    {
      id: "rabbit", label: "Rabbit",
      bg: "#f1ecff",
      eats: ["carrot", "apple", "leaves"],
      avoid: ["fish", "bone", "milk", "banana"],
      body: body({
        main: "#f4f1fa", belly: "#ffffff", stroke: "#e2dbee",
        tail: `<circle class="tail" cx="176" cy="246" r="16" fill="#ffffff" stroke="#e2dbee" stroke-width="3"/>`
      }),
      earsBack: `<g class="ear ear-l"><ellipse cx="88" cy="30" rx="20" ry="54" transform="rotate(-10 88 30)" fill="#f4f1fa" stroke="#e2dbee" stroke-width="3"/><ellipse cx="88" cy="34" rx="10" ry="40" transform="rotate(-10 88 34)" fill="#ffc2d6"/></g>
                 <g class="ear ear-r"><ellipse cx="152" cy="30" rx="20" ry="54" transform="rotate(10 152 30)" fill="#f4f1fa" stroke="#e2dbee" stroke-width="3"/><ellipse cx="152" cy="34" rx="10" ry="40" transform="rotate(10 152 34)" fill="#ffc2d6"/></g>`,
      head: `<circle cx="120" cy="120" r="74" fill="#f4f1fa" stroke="#e2dbee" stroke-width="3"/>
             <ellipse cx="108" cy="144" rx="17" ry="13" fill="#fff"/><ellipse cx="132" cy="144" rx="17" ry="13" fill="#fff"/>`,
      eyes: [96, 144, 110],
      cheeks: [74, 166, 138],
      mouth: [120, 160],
      nose: `<path d="M113,132 Q120,126 127,132 Q120,141 113,132 Z" fill="#ff8fb0"/>` + whiskers(142, "#b7a6c9")
    },
    {
      id: "cat", label: "Cat",
      bg: "#ffeedd",
      eats: ["fish", "milk"],
      avoid: ["carrot", "banana", "leaves", "grass", "watermelon", "strawberry"],
      body: body({
        main: "#ffb056", belly: "#fff1dd",
        tail: `<path class="tail" d="M166,240 C204,236 208,196 190,172" fill="none" stroke="#ffb056" stroke-width="13" stroke-linecap="round"/>`,
        extra: `<path d="M92,206 q6,8 0,16 M148,206 q-6,8 0,16" stroke="#f08a24" stroke-width="5" fill="none" stroke-linecap="round"/>`
      }),
      earsBack: `<g class="ear ear-l"><path d="M50,84 L60,16 L108,52 Z" fill="#ffb056" stroke="#ffb056" stroke-width="8" stroke-linejoin="round"/><path d="M62,70 L67,34 L92,54 Z" fill="#ffc2d0"/></g>
                 <g class="ear ear-r"><path d="M190,84 L180,16 L132,52 Z" fill="#ffb056" stroke="#ffb056" stroke-width="8" stroke-linejoin="round"/><path d="M178,70 L173,34 L148,54 Z" fill="#ffc2d0"/></g>`,
      head: `<ellipse cx="120" cy="116" rx="84" ry="74" fill="#ffb056"/>
             <g stroke="#f08a24" stroke-width="6" stroke-linecap="round" fill="none"><path d="M120,46 v16"/><path d="M104,50 v11"/><path d="M136,50 v11"/></g>
             <ellipse cx="108" cy="146" rx="18" ry="14" fill="#fff1dd"/><ellipse cx="132" cy="146" rx="18" ry="14" fill="#fff1dd"/>`,
      eyes: [94, 146, 110],
      cheeks: [70, 170, 136],
      mouth: [120, 162],
      nose: `<path d="M112,132 L128,132 L120,141 Z" fill="#ff7f9f" stroke="#ff7f9f" stroke-width="3" stroke-linejoin="round"/>` + whiskers(144)
    },
    {
      id: "dog", label: "Dog",
      bg: "#fff3e0",
      eats: ["bone"],
      avoid: ["banana", "leaves", "grass", "watermelon", "strawberry"],
      body: body({
        main: "#e8b97a", belly: "#fff3e0",
        tail: `<path class="tail" d="M170,226 C190,218 198,200 194,186" fill="none" stroke="#9b6234" stroke-width="13" stroke-linecap="round"/>`
      }),
      head: `<circle cx="120" cy="112" r="76" fill="#e8b97a"/>
             <ellipse cx="146" cy="100" rx="22" ry="24" fill="#c98f52"/>
             <ellipse cx="120" cy="146" rx="42" ry="30" fill="#fff3e0"/>`,
      earsFront: `<g class="ear ear-l"><ellipse cx="50" cy="108" rx="24" ry="46" transform="rotate(18 50 108)" fill="#9b6234"/></g>
                  <g class="ear ear-r"><ellipse cx="190" cy="108" rx="24" ry="46" transform="rotate(-18 190 108)" fill="#9b6234"/></g>`,
      eyes: [96, 146, 102],
      cheeks: [78, 166, 136],
      mouth: [120, 160],
      nose: `<ellipse cx="120" cy="134" rx="14" ry="10" fill="${INK}"/><ellipse cx="116" cy="131" rx="4" ry="2.5" fill="#fff" opacity=".7"/>`
    },
    {
      id: "elephant", label: "Elephant",
      bg: "#e6efff",
      eats: ["banana", "watermelon", "leaves", "apple"],
      avoid: ["fish", "bone", "milk"],
      body: body({
        main: "#9fb4d6", belly: "#b8c9e6",
        tail: `<path class="tail" d="M170,236 C186,236 192,228 194,218" fill="none" stroke="#8aa0c4" stroke-width="7" stroke-linecap="round"/>`
      }),
      earsBack: `<g class="ear ear-l"><ellipse cx="44" cy="110" rx="44" ry="56" fill="#8aa0c4"/><ellipse cx="47" cy="112" rx="28" ry="38" fill="#f6b7c9"/></g>
                 <g class="ear ear-r"><ellipse cx="196" cy="110" rx="44" ry="56" fill="#8aa0c4"/><ellipse cx="193" cy="112" rx="28" ry="38" fill="#f6b7c9"/></g>`,
      head: `<circle cx="120" cy="108" r="72" fill="#9fb4d6"/>`,
      eyes: [94, 146, 94],
      cheeks: [72, 172, 138],
      mouth: [106, 166],
      // Trunk swoops down, then curls up to the side so the mouth peeks out underneath.
      // Darker outline first, then the trunk, then a patch that blends its top into the face.
      nose: `<path d="M120,104 C120,136 132,152 154,150 C172,148 178,132 170,120" fill="none" stroke="#7f95bb" stroke-width="32" stroke-linecap="round"/>
             <path class="trunk" d="M120,104 C120,136 132,152 154,150 C172,148 178,132 170,120" fill="none" stroke="#a9bddd" stroke-width="26" stroke-linecap="round"/>
             <circle cx="120" cy="100" r="16" fill="#9fb4d6"/>
             <ellipse cx="170" cy="119" rx="7" ry="5" fill="#7f95bb"/>
             <g stroke="#8aa0c4" stroke-width="3" stroke-linecap="round" fill="none"><path d="M112,124 h17"/><path d="M116,137 h17"/></g>`
    },
    {
      id: "cow", label: "Cow",
      bg: "#e9f8e3",
      eats: ["grass", "leaves"],
      avoid: ["fish", "bone", "banana", "milk"],
      body: body({
        main: "#ffffff", belly: "#ffe3ea", stroke: "#e3dbd6", paw: "#5a4a48",
        tail: `<path class="tail" d="M168,236 C196,236 204,214 200,196" fill="none" stroke="#e3dbd6" stroke-width="7" stroke-linecap="round"/><circle cx="200" cy="192" r="8" fill="#5a4a48"/>`,
        extra: `<ellipse cx="88" cy="214" rx="14" ry="10" fill="#4a3c3a"/><ellipse cx="160" cy="236" rx="10" ry="12" fill="#4a3c3a"/>`
      }),
      earsBack: `<g class="ear ear-l"><ellipse cx="42" cy="98" rx="32" ry="15" transform="rotate(-20 42 98)" fill="#fff" stroke="#e3dbd6" stroke-width="3"/><ellipse cx="44" cy="99" rx="20" ry="8" transform="rotate(-20 44 99)" fill="#ffc4d0"/></g>
                 <g class="ear ear-r"><ellipse cx="198" cy="98" rx="32" ry="15" transform="rotate(20 198 98)" fill="#fff" stroke="#e3dbd6" stroke-width="3"/><ellipse cx="196" cy="99" rx="20" ry="8" transform="rotate(20 196 99)" fill="#ffc4d0"/></g>
                 <path d="M84,52 C70,44 66,28 74,16 C80,30 88,36 96,40 Z" fill="#f3d9a4"/>
                 <path d="M156,52 C170,44 174,28 166,16 C160,30 152,36 144,40 Z" fill="#f3d9a4"/>`,
      head: `<ellipse cx="120" cy="110" rx="72" ry="78" fill="#fff" stroke="#e3dbd6" stroke-width="3"/>
             <path d="M70,58 C82,44 104,46 104,62 C104,80 82,84 72,78 C64,72 64,64 70,58 Z" fill="#4a3c3a"/>
             <ellipse cx="164" cy="92" rx="15" ry="19" fill="#4a3c3a"/>
             <ellipse cx="120" cy="154" rx="58" ry="38" fill="#ffc4d0"/>
             <ellipse cx="98" cy="146" rx="7" ry="9" fill="#e88aa0"/><ellipse cx="142" cy="146" rx="7" ry="9" fill="#e88aa0"/>`,
      eyes: [92, 148, 104],
      cheeks: [60, 180, 128],
      mouth: [120, 172],
      nose: ""
    },
    {
      id: "pig", label: "Pig",
      bg: "#ffe6ee",
      eats: ["apple", "watermelon", "carrot", "corn"],
      avoid: ["fish", "bone", "meat", "milk"],
      body: body({
        main: "#ffb3c6", belly: "#ffd6e2",
        tail: `<path class="tail" d="M170,226 c14,-8 22,6 12,12 c-9,6 -16,-6 -4,-14" fill="none" stroke="#ff8fab" stroke-width="5" stroke-linecap="round"/>`
      }),
      earsBack: `<g class="ear ear-l"><path d="M60,64 L48,14 L104,42 Z" fill="#ffb3c6" stroke="#ffb3c6" stroke-width="10" stroke-linejoin="round"/><path d="M64,54 L58,28 L88,44 Z" fill="#ff8fab"/></g>
                 <g class="ear ear-r"><path d="M180,64 L192,14 L136,42 Z" fill="#ffb3c6" stroke="#ffb3c6" stroke-width="10" stroke-linejoin="round"/><path d="M176,54 L182,28 L152,44 Z" fill="#ff8fab"/></g>`,
      head: `<circle cx="120" cy="116" r="76" fill="#ffb3c6"/>`,
      eyes: [92, 148, 100],
      cheeks: [68, 172, 132],
      mouth: [120, 174],
      nose: `<ellipse cx="120" cy="140" rx="34" ry="24" fill="#ff94b1"/><ellipse cx="108" cy="140" rx="6" ry="9" fill="#d9668a"/><ellipse cx="132" cy="140" rx="6" ry="9" fill="#d9668a"/>`
    },
    {
      id: "bear", label: "Bear",
      bg: "#fff0dc",
      eats: ["honey", "fish", "strawberry"],
      avoid: ["grass", "bone", "lettuce", "cheese"],
      body: body({ main: "#b07a4f", belly: "#ecc9a0" }),
      earsBack: `<g class="ear ear-l"><circle cx="56" cy="52" r="25" fill="#b07a4f"/><circle cx="56" cy="52" r="13" fill="#ecc9a0"/></g>
                 <g class="ear ear-r"><circle cx="184" cy="52" r="25" fill="#b07a4f"/><circle cx="184" cy="52" r="13" fill="#ecc9a0"/></g>`,
      head: `<circle cx="120" cy="114" r="76" fill="#b07a4f"/><ellipse cx="120" cy="148" rx="40" ry="30" fill="#ecc9a0"/>`,
      eyes: [94, 146, 102],
      cheeks: [70, 170, 134],
      mouth: [120, 162],
      nose: `<ellipse cx="120" cy="134" rx="13" ry="9" fill="${INK}"/><ellipse cx="116" cy="131" rx="4" ry="2.5" fill="#fff" opacity=".7"/>`
    },
    {
      id: "panda", label: "Panda",
      bg: "#e8f7e4",
      eats: ["bamboo", "leaves"],
      avoid: ["fish", "bone", "meat", "cheese", "milk"],
      body: body({ main: "#3a3436", belly: "#ffffff" }),
      earsBack: `<g class="ear ear-l"><circle cx="54" cy="50" r="25" fill="#3a3436"/></g>
                 <g class="ear ear-r"><circle cx="186" cy="50" r="25" fill="#3a3436"/></g>`,
      head: `<circle cx="120" cy="114" r="76" fill="#fff" stroke="#e3e0e6" stroke-width="3"/>
             <ellipse cx="92" cy="106" rx="21" ry="26" transform="rotate(30 92 106)" fill="#3a3436"/>
             <ellipse cx="148" cy="106" rx="21" ry="26" transform="rotate(-30 148 106)" fill="#3a3436"/>`,
      eyes: [92, 148, 104],
      eyeOpt: { ring: "#fff", line: "#fff" },
      cheeks: [70, 170, 140],
      mouth: [120, 160],
      nose: `<ellipse cx="120" cy="136" rx="12" ry="8" fill="#3a3436"/>`
    },
    {
      id: "mouse", label: "Mouse",
      bg: "#f1eefb",
      eats: ["cheese", "corn", "nut"],
      avoid: ["fish", "bone", "meat", "grass"],
      body: body({
        main: "#c9c4d6", belly: "#ece9f3",
        tail: `<path class="tail" d="M168,240 C206,252 222,214 204,200 C194,192 184,204 194,210" fill="none" stroke="#ffb3c6" stroke-width="5" stroke-linecap="round"/>`
      }),
      earsBack: `<g class="ear ear-l"><circle cx="50" cy="58" r="38" fill="#c9c4d6"/><circle cx="52" cy="60" r="24" fill="#ffc2d6"/></g>
                 <g class="ear ear-r"><circle cx="190" cy="58" r="38" fill="#c9c4d6"/><circle cx="188" cy="60" r="24" fill="#ffc2d6"/></g>`,
      head: `<ellipse cx="120" cy="120" rx="72" ry="68" fill="#c9c4d6"/>`,
      eyes: [96, 144, 108],
      cheeks: [74, 166, 136],
      mouth: [120, 160],
      nose: `<circle cx="120" cy="138" r="8" fill="#ff8fb0"/>` + whiskers(142, "#8f88a3")
    },
    {
      id: "horse", label: "Horse",
      bg: "#fdf0e0",
      eats: ["carrot", "apple", "grass"],
      avoid: ["fish", "bone", "meat", "cheese", "milk"],
      body: body({
        main: "#c68b5a", belly: "#e9c3a0", paw: "#6b4226",
        tail: `<path class="tail" d="M168,232 C198,236 210,212 200,192" fill="none" stroke="#6b4226" stroke-width="13" stroke-linecap="round"/>`
      }),
      earsBack: `<g class="ear ear-l"><path d="M76,56 L68,12 L104,40 Z" fill="#c68b5a" stroke="#c68b5a" stroke-width="8" stroke-linejoin="round"/><path d="M80,46 L76,26 L94,40 Z" fill="#e9c3a0"/></g>
                 <g class="ear ear-r"><path d="M164,56 L172,12 L136,40 Z" fill="#c68b5a" stroke="#c68b5a" stroke-width="8" stroke-linejoin="round"/><path d="M160,46 L164,26 L146,40 Z" fill="#e9c3a0"/></g>`,
      head: `<ellipse cx="120" cy="112" rx="64" ry="80" fill="#c68b5a"/>
             <path d="M94,40 C100,20 128,16 144,30 C132,30 126,40 130,54 C118,42 104,46 94,40 Z" fill="#6b4226"/>
             <ellipse cx="120" cy="160" rx="52" ry="33" fill="#e9c3a0"/>
             <ellipse cx="102" cy="152" rx="5" ry="7" fill="#8a5a3a"/><ellipse cx="138" cy="152" rx="5" ry="7" fill="#8a5a3a"/>`,
      eyes: [94, 146, 98],
      cheeks: [68, 172, 126],
      mouth: [120, 176],
      nose: ""
    },
    {
      id: "sheep", label: "Sheep",
      bg: "#eef7ea",
      eats: ["grass", "leaves", "lettuce"],
      avoid: ["fish", "bone", "meat", "cheese", "honey"],
      body: body({
        main: "#ffffff", belly: "#f6f2f8", stroke: "#e6e0ec", paw: "#5a4a48",
        extra: fluff(120, 222, 40, 9, 14, "#fff")
      }),
      earsFront: `<g class="ear ear-l"><ellipse cx="54" cy="122" rx="26" ry="12" transform="rotate(-20 54 122)" fill="#f3d3c2"/></g>
                  <g class="ear ear-r"><ellipse cx="186" cy="122" rx="26" ry="12" transform="rotate(20 186 122)" fill="#f3d3c2"/></g>`,
      head: fluff(120, 104, 62, 12, 26, "#fff", "#e6e0ec") + `<circle cx="120" cy="104" r="64" fill="#fff"/>
             <ellipse cx="120" cy="130" rx="46" ry="52" fill="#ffe3d3"/>
             <circle cx="104" cy="82" r="14" fill="#fff"/><circle cx="120" cy="76" r="16" fill="#fff"/><circle cx="136" cy="82" r="14" fill="#fff"/>`,
      eyes: [100, 140, 120],
      cheeks: [86, 154, 148],
      mouth: [120, 166],
      nose: `<ellipse cx="120" cy="146" rx="8" ry="5" fill="#e8a598"/>`
    },
    {
      id: "lion", label: "Lion",
      bg: "#fff1d6",
      eats: ["meat"],
      avoid: ["banana", "carrot", "grass", "leaves", "watermelon", "lettuce", "bamboo"],
      body: body({
        main: "#ffc861", belly: "#fff3d6",
        tail: `<path class="tail" d="M168,236 C196,240 208,222 200,206" fill="none" stroke="#ffc861" stroke-width="7" stroke-linecap="round"/><circle cx="200" cy="202" r="10" fill="#e8893a"/>`
      }),
      earsBack: `<circle cx="120" cy="112" r="90" fill="#e8893a"/>` + fluff(120, 112, 88, 14, 20, "#e8893a") +
                `<g class="ear ear-l"><circle cx="70" cy="60" r="17" fill="#ffc861"/><circle cx="70" cy="60" r="9" fill="#f0a64a"/></g>
                 <g class="ear ear-r"><circle cx="170" cy="60" r="17" fill="#ffc861"/><circle cx="170" cy="60" r="9" fill="#f0a64a"/></g>`,
      head: `<circle cx="120" cy="116" r="66" fill="#ffc861"/>
             <ellipse cx="106" cy="148" rx="19" ry="14" fill="#fff3d6"/><ellipse cx="134" cy="148" rx="19" ry="14" fill="#fff3d6"/>`,
      eyes: [96, 144, 106],
      cheeks: [76, 164, 134],
      mouth: [120, 166],
      nose: `<path d="M110,132 L130,132 L120,143 Z" fill="#8a4b2a" stroke="#8a4b2a" stroke-width="4" stroke-linejoin="round"/>`
    },
    {
      id: "tiger", label: "Tiger",
      bg: "#fff0e0",
      eats: ["meat"],
      avoid: ["banana", "carrot", "grass", "leaves", "strawberry", "lettuce", "corn"],
      body: body({
        main: "#ff9f43", belly: "#fff4e6",
        tail: `<path class="tail" d="M168,236 C200,236 210,210 200,190" fill="none" stroke="#ff9f43" stroke-width="11" stroke-linecap="round"/>`,
        extra: `<g stroke="#3a3436" stroke-width="5" stroke-linecap="round"><path d="M68,212 l10,4"/><path d="M172,212 l-10,4"/><path d="M80,238 l10,2"/><path d="M160,238 l-10,2"/></g>`
      }),
      earsBack: `<g class="ear ear-l"><circle cx="58" cy="54" r="23" fill="#ff9f43"/><circle cx="58" cy="54" r="12" fill="#fff4e6"/></g>
                 <g class="ear ear-r"><circle cx="182" cy="54" r="23" fill="#ff9f43"/><circle cx="182" cy="54" r="12" fill="#fff4e6"/></g>`,
      head: `<ellipse cx="120" cy="116" rx="82" ry="72" fill="#ff9f43"/>
             <ellipse cx="94" cy="150" rx="34" ry="24" fill="#fff4e6"/><ellipse cx="146" cy="150" rx="34" ry="24" fill="#fff4e6"/>
             <g stroke="#3a3436" stroke-width="6" stroke-linecap="round" fill="none">
               <path d="M120,46 v16"/><path d="M102,50 q5,7 0,14"/><path d="M138,50 q-5,7 0,14"/>
               <path d="M40,102 h18"/><path d="M42,120 h14"/><path d="M200,102 h-18"/><path d="M198,120 h-14"/>
             </g>`,
      eyes: [94, 146, 104],
      cheeks: [66, 174, 132],
      mouth: [120, 168],
      nose: `<path d="M111,134 L129,134 L120,144 Z" fill="#ff8fa3" stroke="#ff8fa3" stroke-width="4" stroke-linejoin="round"/>`
    },
    {
      id: "penguin", label: "Penguin",
      bg: "#e3f2ff",
      eats: ["fish"],
      avoid: ["banana", "carrot", "grass", "bone", "cheese", "honey", "bamboo"],
      body: body({ main: "#36415a", belly: "#ffffff", paw: "#ffa630" }),
      head: `<circle cx="120" cy="112" r="76" fill="#36415a"/>
             <circle cx="98" cy="114" r="40" fill="#fff"/><circle cx="142" cy="114" r="40" fill="#fff"/>
             <ellipse cx="120" cy="140" rx="52" ry="40" fill="#fff"/>`,
      eyes: [100, 140, 108],
      cheeks: [76, 164, 140],
      beak: [120, 140, "#ffa630", "#e68a1a"]
    },
    {
      id: "squirrel", label: "Squirrel",
      bg: "#fff0e2",
      eats: ["nut", "corn", "apple"],
      avoid: ["fish", "bone", "meat", "milk", "cheese"],
      body: body({
        main: "#d9824a", belly: "#fbe0c4",
        tail: `<path class="tail" d="M150,252 C232,252 242,150 204,118 C184,102 162,118 178,140 C198,166 192,222 150,222 Z" fill="#c06c36"/>`
      }),
      earsBack: `<g class="ear ear-l"><path d="M66,62 L60,16 L100,44 Z" fill="#d9824a" stroke="#d9824a" stroke-width="8" stroke-linejoin="round"/><path d="M70,52 L67,30 L88,44 Z" fill="#fbe0c4"/></g>
                 <g class="ear ear-r"><path d="M174,62 L180,16 L140,44 Z" fill="#d9824a" stroke="#d9824a" stroke-width="8" stroke-linejoin="round"/><path d="M170,52 L173,30 L152,44 Z" fill="#fbe0c4"/></g>`,
      head: `<circle cx="120" cy="116" r="72" fill="#d9824a"/>
             <ellipse cx="107" cy="148" rx="19" ry="14" fill="#fbe0c4"/><ellipse cx="133" cy="148" rx="19" ry="14" fill="#fbe0c4"/>`,
      eyes: [96, 144, 106],
      cheeks: [74, 166, 134],
      mouth: [120, 164],
      nose: `<ellipse cx="120" cy="137" rx="8" ry="6" fill="#5a3422"/>`
    },
    {
      id: "chick", label: "Chick",
      bg: "#fff8d6",
      eats: ["corn"],
      avoid: ["fish", "bone", "meat", "cheese", "milk", "honey"],
      body: body({ main: "#ffd93b", belly: "#fff2a8", paw: "#ff9f1c" }),
      head: `<path d="M110,42 C104,20 120,16 122,34 C126,18 144,22 132,42 Z" fill="#ffd93b"/>
             <circle cx="120" cy="112" r="76" fill="#ffd93b"/>`,
      eyes: [98, 142, 104],
      cheeks: [72, 168, 132],
      beak: [120, 134, "#ff9f1c", "#e07c00"]
    },
    {
      id: "giraffe", label: "Giraffe",
      bg: "#fff4d9",
      eats: ["leaves", "lettuce", "apple"],
      avoid: ["fish", "bone", "meat", "cheese", "milk"],
      body: body({
        main: "#f7c65c", belly: "#f2dfb4", paw: "#a8622c",
        tail: `<path class="tail" d="M168,234 C188,232 196,220 196,206" fill="none" stroke="#f7c65c" stroke-width="6" stroke-linecap="round"/><circle cx="196" cy="202" r="7" fill="#a8622c"/>`,
        extra: `<ellipse cx="82" cy="212" rx="10" ry="8" fill="#c97b3a"/><ellipse cx="160" cy="220" rx="9" ry="11" fill="#c97b3a"/><ellipse cx="146" cy="252" rx="7" ry="5" fill="#c97b3a"/>`
      }),
      earsBack: `<path d="M100,52 L94,16 M140,52 L146,16" stroke="#c97b3a" stroke-width="9" stroke-linecap="round"/>
                 <circle cx="94" cy="13" r="10" fill="#a8622c"/><circle cx="146" cy="13" r="10" fill="#a8622c"/>
                 <g class="ear ear-l"><ellipse cx="52" cy="88" rx="28" ry="12" transform="rotate(-25 52 88)" fill="#f7c65c"/><ellipse cx="54" cy="89" rx="16" ry="6" transform="rotate(-25 54 89)" fill="#f2dfb4"/></g>
                 <g class="ear ear-r"><ellipse cx="188" cy="88" rx="28" ry="12" transform="rotate(25 188 88)" fill="#f7c65c"/><ellipse cx="186" cy="89" rx="16" ry="6" transform="rotate(25 186 89)" fill="#f2dfb4"/></g>`,
      head: `<ellipse cx="120" cy="112" rx="66" ry="76" fill="#f7c65c"/>
             <ellipse cx="88" cy="62" rx="12" ry="10" fill="#c97b3a"/><ellipse cx="154" cy="64" rx="10" ry="12" fill="#c97b3a"/>
             <ellipse cx="66" cy="116" rx="7" ry="10" fill="#c97b3a"/><ellipse cx="174" cy="114" rx="8" ry="7" fill="#c97b3a"/>
             <ellipse cx="120" cy="158" rx="50" ry="30" fill="#f2dfb4"/>
             <ellipse cx="104" cy="150" rx="4" ry="6" fill="#a8622c"/><ellipse cx="136" cy="150" rx="4" ry="6" fill="#a8622c"/>`,
      eyes: [94, 146, 104],
      cheeks: [72, 168, 130],
      mouth: [120, 170],
      nose: ""
    },
    {
      id: "koala", label: "Koala",
      bg: "#eaf6e6",
      eats: ["leaves"],
      avoid: ["fish", "bone", "meat", "cheese", "corn"],
      body: body({ main: "#a7adbd", belly: "#eef0f5" }),
      earsBack: `<g class="ear ear-l"><circle cx="46" cy="76" r="37" fill="#a7adbd"/><circle cx="48" cy="78" r="22" fill="#eef0f5"/></g>
                 <g class="ear ear-r"><circle cx="194" cy="76" r="37" fill="#a7adbd"/><circle cx="192" cy="78" r="22" fill="#eef0f5"/></g>`,
      head: `<ellipse cx="120" cy="116" rx="74" ry="70" fill="#a7adbd"/>`,
      eyes: [90, 150, 106],
      cheeks: [70, 170, 140],
      mouth: [120, 170],
      nose: `<ellipse cx="120" cy="134" rx="16" ry="22" fill="#3d3a45"/><ellipse cx="114" cy="124" rx="4" ry="6" fill="#fff" opacity=".5"/>`
    },
    {
      id: "hippo", label: "Hippo",
      bg: "#eeeaff",
      eats: ["grass", "watermelon", "lettuce"],
      avoid: ["fish", "bone", "meat", "cheese", "honey"],
      body: body({ main: "#b6a7e0", belly: "#cfc4f0" }),
      earsBack: `<g class="ear ear-l"><circle cx="64" cy="54" r="14" fill="#b6a7e0"/><circle cx="64" cy="54" r="7" fill="#ffb8c9"/></g>
                 <g class="ear ear-r"><circle cx="176" cy="54" r="14" fill="#b6a7e0"/><circle cx="176" cy="54" r="7" fill="#ffb8c9"/></g>`,
      head: `<ellipse cx="120" cy="98" rx="64" ry="58" fill="#b6a7e0"/>
             <circle cx="96" cy="66" r="20" fill="#b6a7e0"/><circle cx="144" cy="66" r="20" fill="#b6a7e0"/>
             <ellipse cx="120" cy="150" rx="78" ry="46" fill="#c9bdf0"/>
             <ellipse cx="96" cy="132" rx="8" ry="5" fill="#8f7fc0"/><ellipse cx="144" cy="132" rx="8" ry="5" fill="#8f7fc0"/>`,
      eyes: [96, 144, 72],
      cheeks: [60, 180, 150],
      mouth: [120, 170],
      nose: ""
    },
    {
      id: "duck", label: "Duck",
      bg: "#e2f4ff",
      eats: ["corn", "lettuce"],
      avoid: ["bone", "meat", "cheese", "honey", "milk"],
      body: body({ main: "#ffffff", belly: "#f4f6fb", stroke: "#e2e4ee", paw: "#ffa630" }),
      head: `<path d="M114,42 C110,24 124,22 124,36 C130,24 142,30 134,44 Z" fill="#fff" stroke="#e2e4ee" stroke-width="3"/>
             <circle cx="120" cy="112" r="74" fill="#fff" stroke="#e2e4ee" stroke-width="3"/>`,
      eyes: [98, 142, 100],
      cheeks: [72, 168, 128],
      beak: [120, 134, "#ffa630", "#e68a1a"]
    }
  ];

  /* Build one animal's SVG markup. */
  function drawAnimal(a) {
    return `<svg class="critter" viewBox="0 -20 240 290" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${a.body}
      <g class="c-head">
        ${a.earsBack || ""}
        ${a.head}
        ${a.earsFront || ""}
        ${eye(a.eyes[0], a.eyes[2], -1, a.eyeOpt)}
        ${eye(a.eyes[1], a.eyes[2], 1, a.eyeOpt)}
        ${cheeks(a.cheeks[0], a.cheeks[1], a.cheeks[2])}
        ${a.beak ? beak(...a.beak) : mouth(a.mouth[0], a.mouth[1])}
        ${a.nose || ""}
      </g>
    </svg>`;
  }

  const api = { FOODS, ANIMALS, drawAnimal };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FEED = api;
})(typeof window !== "undefined" ? window : globalThis);
