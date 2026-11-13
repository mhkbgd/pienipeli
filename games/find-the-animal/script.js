/* ============ Find the Animal! ============
   The game says "Where is the cat?" and shows three animals. Tap the right one!
   No losing, no lives, no timers: a wrong tap just gets a gentle "try again".
   Three languages: English, Finnish and Bengali (text + spoken instructions).   */

(() => {
  'use strict';

  const ANIMALS = window.FTA_ANIMALS;
  const toSVG = window.FTA_toSVG;
  const Sound = window.FTA_Sound;

  const ROUND = window.FTA_STRINGS.ROUND; // stars in one round; after that a big celebration
  const NO_REPEAT = 12;      // an animal won't be the answer again within this many questions

  const { T, LANGS } = window.FTA_STRINGS;

  // Flags drawn as SVG (emoji flags don't show on Windows)
  const FLAGS = {
    en: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#012169"/>' +
        '<path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/>' +
        '<path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" stroke-width="3"/>' +
        '<path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="12"/>' +
        '<path d="M30 0V40M0 20H60" stroke="#C8102E" stroke-width="7"/></svg>',
    fi: '<svg viewBox="0 0 18 11" aria-hidden="true"><rect width="18" height="11" fill="#fff"/>' +
        '<path d="M0 5.5H18M6.5 0V11" stroke="#002F6C" stroke-width="3"/></svg>',
    bn: '<svg viewBox="0 0 10 6" aria-hidden="true"><rect width="10" height="6" fill="#006A4E"/>' +
        '<circle cx="4.5" cy="3" r="2" fill="#F42A41"/></svg>',
  };

  // ---------- Helpers ----------
  const $ = id => document.getElementById(id);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('findanimal-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('findanimal-' + k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } },
  };

  // ---------- State ----------
  const browserLang = (navigator.language || 'en').slice(0, 2);
  let lang = store.get('lang', LANGS.includes(browserLang) ? browserLang : 'en');
  if (!LANGS.includes(lang)) lang = 'en';
  let muted = store.get('muted', false);
  let musicOn = store.get('music', false); // background music is off by default
  let found = 0, stars = 0;
  let current = null;        // { target, options }
  let history = [];          // recent answers, so they don't repeat too often
  let roundFinds = [];       // animals found this round (shown at the celebration)
  let locked = false;        // true while celebrating a correct answer
  let misses = 0;            // wrong taps on this question (used for a gentle hint)
  let nextTimer = null, toastTimer = null, hintTimer = null;

  const t = () => T[lang];
  const nameOf = a => a.names[lang];

  // ---------- Narrator (see narrator.js) ----------
  const Narrator = window.FTA_Narrator;
  Narrator.onVoices(updateVoiceNote);

  function updateVoiceNote() {
    const note = $('voiceNote');
    // Voices load late in some browsers; only warn once we know the list
    const missing = Narrator.canSpeak(lang) === false;
    note.hidden = !missing;
    note.textContent = missing ? '🔇 ' + t().noVoice : '';
  }

  // Each spoken line has a key (for recorded clips), its text, and a mood
  const L = {
    title: () => ({ key: 'title', text: t().title, mood: 'cheer' }),
    ask: a => ({ key: 'ask-' + a.id, text: t().ask(nameOf(a)), mood: 'ask' }),
    itIs: a => ({ key: 'itis-' + a.id, text: t().itIs(nameOf(a)), mood: 'cheer' }),
    thatIs: a => ({ key: 'thatis-' + a.id, text: t().thatIs(nameOf(a)), mood: 'info' }),
    praise: i => ({ key: 'praise-' + i, text: t().praise[i], mood: 'cheer' }),
    tryAgain: i => ({ key: 'try-' + i, text: t().tryAgain[i], mood: 'soft' }),
    round: () => ({ key: 'round', text: t().roundDone(ROUND), mood: 'cheer' }),
  };
  const randIdx = arr => Math.floor(Math.random() * arr.length);

  // Speak lines in the current language. onDone runs when finished (or soon, if muted).
  let speakToken = 0;
  function speak(lines, onDone) {
    const token = ++speakToken;
    const done = () => { if (token === speakToken) { Sound.duck(false); onDone && onDone(); } };
    if (muted) { Narrator.stop(); setTimeout(done, 300); return; }
    Sound.duck(true);
    Narrator.say(lang, lines, done);
  }
  function stopSpeaking() { speakToken++; Narrator.stop(); Sound.duck(false); }

  // ---------- Language ----------
  function buildLangPickers() {
    ['langPicker', 'langPickerSmall'].forEach(id => {
      const box = $(id);
      box.innerHTML = '';
      box.hidden = LANGS.length < 2;
      LANGS.forEach(l => {
        const b = document.createElement('button');
        b.className = 'lang-btn';
        b.dataset.lang = l;
        b.lang = l;
        b.innerHTML = `<span class="flag">${FLAGS[l]}</span><span class="lang-name">${T[l].langName}</span>`;
        b.setAttribute('aria-label', T[l].langName);
        b.addEventListener('click', () => { Sound.unlock(); Sound.tap(); setLang(l, true); });
        box.appendChild(b);
      });
    });
  }

  function setLang(l, fromTap) {
    lang = l;
    store.set('lang', l);
    document.documentElement.lang = l;
    document.body.dataset.lang = l;
    document.title = t().title.replace('!', '') + ' · Pienipeli';
    document.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t()[el.dataset.t]; });
    refreshButtons();
    updateVoiceNote();
    if (current) {
      renderQuestionText();
      current.options.forEach((a, i) => {
        const card = $('cards').children[i];
        if (card) { card.setAttribute('aria-label', nameOf(a)); card.querySelector('.label').textContent = nameOf(a); }
      });
      updateProgress();
      if (fromTap && !$('game').hidden && !locked) askQuestion();
    }
    if (fromTap && !$('welcome').hidden) speak([L.title()]);
  }

  // ---------- Sound / music buttons ----------
  function refreshButtons() {
    document.querySelectorAll('[data-act="sound"]').forEach(b => {
      b.querySelector('.i-sound').textContent = muted ? '🔇' : '🔊';
      b.setAttribute('aria-label', muted ? t().soundOn : t().soundOff);
      b.setAttribute('aria-pressed', String(!muted));
      b.classList.toggle('off', muted);
    });
    document.querySelectorAll('[data-act="music"]').forEach(b => {
      b.setAttribute('aria-label', musicOn ? t().musicOff : t().musicOn);
      b.setAttribute('aria-pressed', String(musicOn));
      b.classList.toggle('off', !musicOn);
    });
    document.querySelectorAll('[data-aria]').forEach(el => {
      const key = el.dataset.aria;
      if (key !== 'soundOff' && key !== 'musicOn') el.setAttribute('aria-label', t()[key]);
    });
  }

  function toggleSound() {
    muted = !muted;
    store.set('muted', muted);
    Sound.setMuted(muted);
    if (muted) stopSpeaking();
    else Sound.tap();
    refreshButtons();
  }

  function toggleMusic() {
    musicOn = !musicOn;
    store.set('music', musicOn);
    Sound.unlock();
    Sound.music(musicOn);
    refreshButtons();
  }

  // ---------- Questions ----------
  function newQuestion() {
    clearTimeout(nextTimer); clearTimeout(hintTimer);
    locked = false;
    misses = 0;

    // Pick an answer that wasn't used recently
    const recent = new Set(history.slice(-NO_REPEAT));
    const fresh = ANIMALS.filter(a => !recent.has(a.id));
    const target = pick(fresh.length ? fresh : ANIMALS);
    history.push(target.id);
    if (history.length > 30) history = history.slice(-30);

    // Two different wrong answers, then shuffle positions
    const others = shuffle(ANIMALS.filter(a => a.id !== target.id)).slice(0, 2);
    const options = shuffle([target, ...others]);
    current = { target, options };

    const box = $('cards');
    box.innerHTML = '';
    const tints = shuffle(['#ffe4ef', '#e2f3ff', '#fff6cc', '#e9e2ff', '#dcf8e9', '#ffe9d9']);
    options.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'card';
      b.style.setProperty('--tint', tints[i]);
      b.style.setProperty('--delay', (i * 0.1) + 's');
      b.setAttribute('aria-label', nameOf(a));
      b.innerHTML = `<span class="art">${toSVG(a)}</span><span class="label" aria-hidden="true">${nameOf(a)}</span>`;
      b.addEventListener('click', () => choose(a, b));
      box.appendChild(b);
    });
    renderQuestionText();
    hideToast();
    askQuestion();
  }

  function renderQuestionText() {
    const q = $('qText');
    q.textContent = t().ask(nameOf(current.target));
    q.classList.remove('pop'); void q.offsetWidth; q.classList.add('pop');
  }

  function askQuestion() {
    if (!current) return;
    $('question').classList.add('talking');
    speak([L.ask(current.target)], () => $('question').classList.remove('talking'));
  }

  // ---------- Answers ----------
  function choose(animal, card) {
    if (locked || !current) return;
    Sound.unlock();
    clearTimeout(hintTimer);
    document.querySelectorAll('.card.hint').forEach(c => c.classList.remove('hint'));
    if (animal.id === current.target.id) correct(card);
    else wrong(animal, card);
  }

  function correct(card) {
    locked = true;
    const a = current.target;
    stopSpeaking();
    $('question').classList.remove('talking');
    document.querySelectorAll('.card').forEach(c => {
      c.classList.remove('wiggle', 'reveal');
      if (c !== card) c.classList.add('dim');
    });
    card.classList.add('correct', 'reveal');

    Sound.success();
    setTimeout(() => Sound.animal(a.sound), 380);
    const pi = randIdx(t().praise);
    showToast(t().praise[pi], 'happy');
    burstFrom(card);

    found++; stars++;
    roundFinds.push(a);
    updateProgress(true);

    // Speak after the animal has made its sound, then move on
    const startedAt = Date.now();
    setTimeout(() => {
      if (!locked) return;
      speak([L.praise(pi), L.itIs(a)], () => {
        const wait = Math.max(500, 2600 - (Date.now() - startedAt));
        nextTimer = setTimeout(() => (stars >= ROUND ? celebrate() : newQuestion()), wait);
      });
    }, 1300);
  }

  function wrong(animal, card) {
    misses++;
    card.classList.remove('wiggle'); void card.offsetWidth;
    card.classList.add('wiggle', 'reveal');
    Sound.gentle();
    const ti = randIdx(t().tryAgain);
    showToast(t().tryAgain[ti], 'soft');
    speak([L.thatIs(animal), L.tryAgain(ti), L.ask(current.target)]);
    // After a couple of misses, make the right animal glow softly
    if (misses >= 2) {
      hintTimer = setTimeout(() => {
        const i = current.options.indexOf(current.target);
        const c = $('cards').children[i];
        if (c && !locked) c.classList.add('hint');
      }, 900);
    }
  }

  // ---------- Progress ----------
  function updateProgress(bump) {
    const box = $('stars');
    if (box.children.length !== ROUND) {
      box.innerHTML = '';
      for (let i = 0; i < ROUND; i++) box.appendChild(document.createElement('i'));
    }
    [...box.children].forEach((s, i) => {
      const on = i < stars;
      s.classList.toggle('on', on);
      s.classList.toggle('new', bump && i === stars - 1);
    });
    $('foundCount').textContent = t().num(found);
    $('progress').setAttribute('aria-label', t().found(found, stars));
  }

  // ---------- Round celebration ----------
  function celebrate() {
    locked = true;
    $('cTitle').textContent = t().roundDone(roundFinds.length);
    $('cAnimals').innerHTML = roundFinds.map((a, i) =>
      `<span class="mini" style="--i:${i}">${toSVG(a)}</span>`).join('');
    $('celebrate').hidden = false;
    Sound.fanfare();
    confettiRain();
    setTimeout(() => speak([L.round()]), 900);
    const btn = $('celebrate').querySelector('[data-act="again"]');
    if (btn) btn.focus({ preventScroll: true });
  }

  function nextRound() {
    $('celebrate').hidden = true;
    stars = 0; roundFinds = [];
    updateProgress();
    newQuestion();
  }

  // ---------- Screens ----------
  function startGame() {
    Sound.unlock();
    if (musicOn) Sound.music(true);
    $('welcome').hidden = true;
    $('game').hidden = false;
    $('celebrate').hidden = true;
    updateProgress();
    newQuestion(); // speaks right away, inside the tap (needed on iPhone/iPad)
  }

  function goHome() {
    clearTimeout(nextTimer); clearTimeout(hintTimer);
    stopSpeaking();
    locked = false;
    $('celebrate').hidden = true;
    $('game').hidden = true;
    $('welcome').hidden = false;
    buildParade();
  }

  function restart() {
    found = 0; stars = 0; roundFinds = []; history = [];
    updateProgress();
    newQuestion();
  }

  // ---------- Toast message ----------
  function showToast(text, kind) {
    const el = $('toast');
    clearTimeout(toastTimer);
    el.textContent = text;
    el.className = 'toast show ' + kind;
    toastTimer = setTimeout(hideToast, kind === 'happy' ? 2400 : 1800);
  }
  function hideToast() { $('toast').className = 'toast'; }

  // ---------- Sparkles + confetti ----------
  const SPARKS = ['⭐', '✨', '🌟', '💖', '💛'];
  function burstFrom(card) {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (!reducedMotion()) {
      for (let i = 0; i < 10; i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        s.textContent = pick(SPARKS);
        const ang = (i / 10) * Math.PI * 2, dist = r.width * (0.55 + Math.random() * 0.3);
        s.style.left = cx + 'px'; s.style.top = cy + 'px';
        s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
        s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1100);
      }
    }
    confettiBurst(cx, cy, 70);
  }

  const canvas = $('confetti');
  const cx2d = canvas.getContext ? canvas.getContext('2d') : null;
  const COLORS = ['#ff8fb3', '#ffd23d', '#7fd3ff', '#9fe8c3', '#c6a8ff', '#ffa65c'];
  let parts = [], raf = 0;

  function sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    if (cx2d) cx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function addPart(x, y, vx, vy) {
    parts.push({ x, y, vx, vy, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3, col: pick(COLORS), life: 0 });
  }
  function confettiBurst(x, y, n) {
    if (!cx2d || reducedMotion()) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 8;
      addPart(x, y, Math.cos(a) * s, Math.sin(a) * s - 6);
    }
    run();
  }
  function confettiRain() {
    if (!cx2d || reducedMotion()) return;
    for (let i = 0; i < 160; i++) addPart(Math.random() * innerWidth, -20 - Math.random() * innerHeight * 0.6, (Math.random() - 0.5) * 3, 2 + Math.random() * 3);
    run();
  }
  function run() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    cx2d.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach(p => {
      p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      cx2d.save(); cx2d.translate(p.x, p.y); cx2d.rotate(p.rot);
      cx2d.fillStyle = p.col; cx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.1)) + 1);
      cx2d.restore();
    });
    parts = parts.filter(p => p.y < innerHeight + 30 && p.life < 400);
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) cx2d.clearRect(0, 0, innerWidth, innerHeight);
  }

  // ---------- Welcome parade ----------
  function buildParade() {
    $('parade').innerHTML = shuffle(ANIMALS.slice()).slice(0, 3)
      .map((a, i) => `<span class="p-animal" style="--i:${i}">${toSVG(a)}</span>`).join('');
  }

  // ---------- Wire up ----------
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    Sound.unlock();
    switch (btn.dataset.act) {
      case 'sound': toggleSound(); break;
      case 'music': toggleMusic(); break;
      case 'repeat': Sound.tap(); if (!locked) askQuestion(); break;
      case 'home': Sound.tap(); goHome(); break;
      case 'restart': Sound.tap(); restart(); break;
      case 'again': Sound.tap(); nextRound(); break;
    }
  });
  $('playBtn').addEventListener('click', startGame);

  // No pinch-zoom or long-press menus from little fingers
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('resize', sizeCanvas);
  // Stop talking if the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopSpeaking(); Sound.music(false); }
    else if (musicOn) Sound.music(true);
  });

  sizeCanvas();
  Sound.setMuted(muted);
  buildLangPickers();
  buildParade();
  setLang(lang, false);
  updateProgress();
})();
