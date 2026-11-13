/* ============ Feed the Animals! game logic ============
   Round:  animal hops in -> opens its mouth (hungry) -> 3 food plates pop in
   Right food: food flies into the mouth -> chew -> happy dance + hearts/stars/confetti -> next animal
   Other food: silly "no thank you" head shake, plate fades a little, try again.
   No scores, no timer, no losing. */

(function () {
  "use strict";

  const { FOODS, ANIMALS, drawAnimal } = window.FEED;
  const Sound = window.FEED_Sound;

  // Remember the grown-up's sound choice on this device only
  const store = {
    get(k, d) { try { const v = localStorage.getItem('feedanimals-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('feedanimals-' + k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } }
  };
  Sound.setMuted(store.get('muted', false));

  const $ = (id) => document.getElementById(id);
  const zone = $("animalZone");
  const animalEl = $("animal");
  const foodsEl = $("foods");
  const fx = $("fx");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Timings (ms)
  const T = {
    plates: 450,       // foods appear while the animal is still hopping in
    fly: reduceMotion ? 450 : 780,
    chew: 1400,
    party: 2600,
    yuck: 1150,
    hint: 6000,        // gently wiggle the right food after this long without a tap
    leave: 600
  };

  let animal = null;      // current animal
  let busy = true;        // true while something is animating: taps are ignored
  let bag = [];           // shuffled queue so every animal gets a turn
  let lastId = null;
  let hintTimer = 0;

  /* ---------- Helpers ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const later = (fn, ms) => setTimeout(fn, ms);
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }
  function setMood(m) { animalEl.dataset.mood = m; }
  const nameOf = (key) => key.charAt(0).toUpperCase() + key.slice(1);

  function nextAnimal() {
    if (!bag.length) {
      bag = shuffle(ANIMALS);
      if (bag[0].id === lastId) bag.push(bag.shift()); // never the same animal twice in a row
    }
    const a = bag.shift();
    lastId = a.id;
    return a;
  }

  function chooseFoods(a) {
    // The favourite food comes up most often, so little ones learn "monkey -> banana".
    const good = Math.random() < 0.6 ? a.eats[0] : pick(a.eats);
    const wrong = shuffle(a.avoid).slice(0, 2);
    return shuffle([good, ...wrong]);
  }

  /* ---------- Rounds ---------- */
  function newRound() {
    busy = true;
    clearHint();
    animal = nextAnimal();

    zone.style.setProperty("--bg", animal.bg);
    animalEl.innerHTML = drawAnimal(animal);
    animalEl.dataset.id = animal.id;
    animalEl.setAttribute("aria-label", "A hungry " + animal.label.toLowerCase());
    setMood("idle");
    foodsEl.innerHTML = "";

    animalEl.classList.remove("leave");
    void animalEl.offsetWidth; // restart the hop-in animation
    animalEl.classList.add("enter");
    Sound.hops(3);

    later(showFoods, T.plates);
    later(() => {
      animalEl.classList.remove("enter");
      setMood("hungry");
      Sound.call(animal.id);
      busy = false;
      scheduleHint();
    }, reduceMotion ? 300 : 900);
  }

  function showFoods() {
    const frag = document.createDocumentFragment();
    chooseFoods(animal).forEach((key) => {
      const f = FOODS[key];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "plate";
      b.dataset.food = key;
      b.style.setProperty("--plate-bg", f.plate);
      b.setAttribute("aria-label", nameOf(key));
      b.innerHTML = `<span class="food" aria-hidden="true">${f.emoji}</span>`;
      frag.appendChild(b);
    });
    foodsEl.appendChild(frag);
  }

  function endRound() {
    animalEl.classList.add("leave");
    foodsEl.querySelectorAll(".plate").forEach((p) => p.classList.add("away"));
    later(newRound, T.leave);
  }

  /* ---------- Taps ---------- */
  function onPick(plate) {
    if (busy || !plate || plate.classList.contains("away")) return;
    clearHint();
    Sound.tap();
    if (animal.eats.includes(plate.dataset.food)) feed(plate);
    else noThanks(plate);
  }

  // Fingers and mouse: react on touch-down (feels instant for toddlers).
  foodsEl.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    onPick(e.target.closest(".plate"));
  });
  // Keyboard (Enter / Space) fires a click with detail 0; real taps were handled above.
  foodsEl.addEventListener("click", (e) => {
    if (e.detail === 0) onPick(e.target.closest(".plate"));
  });

  /* ---------- Right food: fly, chew, party ---------- */
  function feed(plate) {
    busy = true;
    const key = plate.dataset.food;
    const food = FOODS[key];
    const foodEl = plate.querySelector(".food");
    const from = centerOf(foodEl);
    const size = parseFloat(getComputedStyle(foodEl).fontSize);

    setMood("ready");
    plate.classList.add("picked");
    foodsEl.querySelectorAll(".plate").forEach((p) => { if (p !== plate) p.classList.add("away"); });

    const flyer = document.createElement("span");
    flyer.className = "flyer";
    flyer.textContent = food.emoji;
    flyer.style.fontSize = size + "px";
    fx.appendChild(flyer);

    const to = centerOf(animalEl.querySelector(".m-target"));
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - Math.max(60, window.innerHeight * 0.12);
    const at = (x, y, s, r) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s}) rotate(${r}deg)`;

    const anim = flyer.animate([
      { transform: at(from.x, from.y, 1, 0) },
      { transform: at(from.x + (midX - from.x) * 0.3, from.y - 30, 1.2, -10), offset: 0.2 },
      { transform: at(midX, midY, 1.1, -25), offset: 0.55 },
      { transform: at(to.x, to.y, 0.25, 15) }
    ], { duration: T.fly, easing: "cubic-bezier(.4, 0, .6, 1)", fill: "forwards" });
    Sound.whoosh(T.fly / 1000);

    anim.onfinish = () => {
      flyer.remove();
      plate.classList.add("away");
      setMood("chew");
      Sound.gulp();
      later(() => Sound.chew(5, 0.18), 150);
      crumbs(to, food.crumbs);
      later(() => crumbs(centerOf(animalEl.querySelector(".m-target")), food.crumbs), 500);
      later(party, T.chew);
    };
  }

  function party() {
    setMood("happy");
    Sound.yay();
    later(() => Sound.call(animal.id), 650);
    const box = animalEl.getBoundingClientRect();
    floaties(box);
    confetti(box);
    later(() => floaties(box, 8), 900);
    later(endRound, T.party);
  }

  /* ---------- Other food: "no thank you!" ---------- */
  function noThanks(plate) {
    busy = true;
    const foodEl = plate.querySelector(".food");
    const from = centerOf(foodEl);
    const to = centerOf(animalEl.querySelector(".m-target"));
    const dx = (to.x - from.x) * 0.3;
    const dy = (to.y - from.y) * 0.3;

    // The food hops towards the animal...
    foodEl.animate([
      { transform: "none" },
      { transform: `translate(${dx}px, ${dy}px) scale(1.15) rotate(-10deg)`, offset: 0.35 },
      { transform: `translate(${dx * 0.9}px, ${dy * 0.9}px) scale(1.1) rotate(10deg)`, offset: 0.55 },
      { transform: "none" }
    ], { duration: 900, easing: "ease-in-out" });

    // ...and the animal shakes its head with its tongue out. Silly, never sad.
    later(() => { setMood("yuck"); Sound.nope(); }, 260);
    later(() => {
      setMood("hungry");
      plate.classList.add("tried");
      busy = false;
      later(nudgeGood, 350);
      scheduleHint();
    }, T.yuck);
  }

  /* ---------- Gentle hints ---------- */
  function nudgeGood() {
    const good = [...foodsEl.querySelectorAll(".plate")].find((p) => animal.eats.includes(p.dataset.food));
    if (!good || busy) return;
    good.classList.remove("nudge");
    void good.offsetWidth;
    good.classList.add("nudge");
    Sound.hint();
    good.addEventListener("animationend", () => good.classList.remove("nudge"), { once: true });
  }
  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => { nudgeGood(); scheduleHint(); }, T.hint);
  }
  function clearHint() { clearTimeout(hintTimer); }

  /* ---------- Effects ---------- */
  const FLOATIES = ["💖", "⭐", "🌟", "💛", "💕", "✨", "💗", "⭐"];
  const CONFETTI = ["#ff8fb3", "#ffd23d", "#7cd6ff", "#9be38f", "#b995ff", "#ffa94d"];

  function floaties(box, count) {
    const n = count || (reduceMotion ? 6 : 14);
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "float";
      s.textContent = pick(FLOATIES);
      s.style.left = box.left + box.width * rand(0.15, 0.85) + "px";
      s.style.top = box.top + box.height * rand(0.2, 0.7) + "px";
      s.style.fontSize = rand(28, 58) + "px";
      s.style.setProperty("--dx", rand(-130, 130) + "px");
      s.style.setProperty("--rise", rand(160, Math.max(220, box.height * 0.9)) + "px");
      s.style.setProperty("--rot", rand(-40, 40) + "deg");
      s.style.setProperty("--dur", rand(1.7, 2.8) + "s");
      s.style.animationDelay = rand(0, 0.6) + "s";
      s.addEventListener("animationend", () => s.remove(), { once: true });
      fx.appendChild(s);
    }
  }

  function confetti(box) {
    if (reduceMotion) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height * 0.4;
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.background = pick(CONFETTI);
      if (i % 3 === 0) c.style.borderRadius = "50%";
      fx.appendChild(c);
      const ang = rand(-Math.PI, 0);              // burst upwards and outwards
      const dist = rand(120, Math.min(420, window.innerWidth * 0.6));
      const ex = cx + Math.cos(ang) * dist;
      const ey = cy + Math.sin(ang) * dist;
      const fall = window.innerHeight + 40;
      const spin = rand(-720, 720);
      c.animate([
        { transform: `translate(${cx}px, ${cy}px) rotate(0deg) scale(.4)`, opacity: 1 },
        { transform: `translate(${ex}px, ${ey}px) rotate(${spin / 3}deg) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${ex + rand(-60, 60)}px, ${fall}px) rotate(${spin}deg) scale(1)`, opacity: 0.9 }
      ], { duration: rand(1800, 2600), easing: "cubic-bezier(.2, .7, .4, 1)", fill: "forwards" })
        .onfinish = () => c.remove();
    }
  }

  function crumbs(at, colors) {
    for (let i = 0; i < 9; i++) {
      const c = document.createElement("span");
      c.className = "crumb";
      c.style.background = pick(colors);
      const s = rand(6, 13);
      c.style.width = c.style.height = s + "px";
      fx.appendChild(c);
      const dx = rand(-70, 70);
      const up = rand(20, 60);
      c.animate([
        { transform: `translate(${at.x}px, ${at.y}px)`, opacity: 1 },
        { transform: `translate(${at.x + dx * 0.6}px, ${at.y - up}px)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${at.x + dx}px, ${at.y + rand(40, 90)}px)`, opacity: 0 }
      ], { duration: rand(550, 800), easing: "ease-out", fill: "forwards" })
        .onfinish = () => c.remove();
    }
  }

  /* ---------- Tap the animal: it says hello ---------- */
  animalEl.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (busy || animalEl.dataset.mood !== "hungry" || animalEl.classList.contains("boop")) return;
    animalEl.classList.add("boop");
    animalEl.addEventListener("animationend", () => animalEl.classList.remove("boop"), { once: true });
    Sound.call(animal.id);
  });

  /* ---------- Sound ---------- */
  // Browsers only allow audio after a tap. On the very first tap, also replay
  // the animal's call that was silent because sound wasn't allowed yet.
  let unlocked = false;
  document.addEventListener("pointerdown", (e) => {
    if (unlocked) return;
    unlocked = true;
    Sound.unlock();
    const onAnimalOrPlate = e.target.closest("#animal, .plate, .corner-btn");
    if (!onAnimalOrPlate && !busy && animalEl.dataset.mood === "hungry") Sound.call(animal.id);
  }, { capture: true });

  const soundBtn = $("soundBtn");
  function showSound() {
    const on = !Sound.isMuted();
    soundBtn.firstElementChild.textContent = on ? "🔊" : "🔇";
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "Sound off" : "Sound on");
  }
  soundBtn.addEventListener("click", () => {
    Sound.setMuted(!Sound.isMuted());
    store.set("muted", Sound.isMuted());
    showSound();
    Sound.tap();
  });
  showSound();

  /* ---------- Full screen (grown-up button) ---------- */
  // Fullscreen API on Android/desktop/iPad, an "Add to Home Screen" tip on iPhone,
  // hidden when the game was opened full screen from its home-screen icon.
  const fullBtn = $("fullBtn");
  if (window.Pienipeli) {
    Pienipeli.fullscreenButton(fullBtn, {
      onChange(full) {
        fullBtn.firstElementChild.textContent = full ? "🗗" : "⛶";
        fullBtn.setAttribute("aria-label", full ? "Exit full screen" : "Full screen");
      }
    });
  }

  /* ---------- Toddler-proofing ---------- */
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("gesturestart", (e) => e.preventDefault());   // iOS pinch
  document.addEventListener("dblclick", (e) => e.preventDefault());

  // Coming back to the tab: restart hints cleanly
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearHint();
    else if (!busy) scheduleHint();
  });

  newRound();
})();
