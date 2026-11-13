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
    grass:      { emoji: "🌿", plate: "#e3f7da", crumbs: ["#4fbf5a", "#9be38f"] }
  };

  /* ---------- Shared parts ---------- */
  function eye(x, y, side) {
    // side: -1 left eye, 1 right eye (the squint ">" / "<" points inward)
    const sq = side < 0 ? "M-9,-7 L7,0 L-9,7" : "M9,-7 L-7,0 L9,7";
    return `<g class="eye" transform="translate(${x} ${y})">
      <g class="eye-open"><circle r="11" fill="${INK}"/><circle cx="3.6" cy="-4.2" r="4" fill="#fff"/><circle cx="-3.4" cy="3.6" r="1.7" fill="#fff"/></g>
      <path class="eye-happy" d="M-11,4 Q0,-10 11,4" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>
      <path class="eye-squint" d="${sq}" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
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
        ${eye(a.eyes[0], a.eyes[2], -1)}
        ${eye(a.eyes[1], a.eyes[2], 1)}
        ${cheeks(a.cheeks[0], a.cheeks[1], a.cheeks[2])}
        ${mouth(a.mouth[0], a.mouth[1])}
        ${a.nose || ""}
      </g>
    </svg>`;
  }

  const api = { FOODS, ANIMALS, drawAnimal };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FEED = api;
})(typeof window !== "undefined" ? window : globalThis);
