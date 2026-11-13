/* ============ Find the Animal: the narrator ============
   Our narrator is a warm, gentle, smiling kindergarten-teacher voice.

   Two ways she can talk, best first:
   1. Recorded clips (narration/<lang>/<key>.mp3), if they have been recorded and
      switched on in narration/manifest.js. This sounds the most natural.
   2. The device's built-in text-to-speech. We pick the warmest female voice we
      can find for the language and shape each line by mood: curious for
      questions, bright for praise, soft for "try again".
   A line with a missing clip falls back to text-to-speech, so nothing ever breaks. */

(() => {
  'use strict';

  const { T } = window.FTA_STRINGS;
  const CLIPS = window.FTA_NARRATION || {};   // { en: 'mp3' } = English clips are recorded
  const synth = window.speechSynthesis || null;

  // ---------- Choosing the voice ----------
  // Known warm female voices on Apple, Microsoft, Google and Android devices
  const FEMALE = /samantha|ava|allison|susan|zoe|karen|moira|tessa|serena|fiona|victoria|kate|aria|jenny|michelle|emma|libby|sonia|maisie|natasha|clara|zira|hazel|female|woman|google us english|google uk english female|satu|noora|selma|nabanita|tanishaa|piya|google বাংলা|google suomi/i;
  const MALE = /daniel|alex\b|fred|\btom\b|aaron|arthur|gordon|rishi|\bguy\b|david|mark|george|ryan|christopher|eric|harri|onni|pradeep|bashkar|\bmale\b|\bman\b/i;
  // Fun macOS novelty voices and child voices: never for the narrator
  const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|princess|deranged|hysterical|pipe organ|\bana\b/i;
  const ROBOTIC = /eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|compact/i;
  const QUALITY = [[/natural/i, 30], [/premium/i, 30], [/enhanced/i, 25], [/neural/i, 25], [/online/i, 10], [/google/i, 8]];

  const norm = s => (s || '').replace('_', '-').toLowerCase();
  let voices = [];
  const best = {};   // lang -> chosen voice (cached)

  function score(v, lang) {
    const codes = T[lang].speech.map(c => c.toLowerCase());
    const vl = norm(v.lang);
    let s;
    const i = codes.indexOf(vl);
    if (i >= 0) s = 100 - i * 5;                 // exact match, preferred region first
    else if (vl.startsWith(codes[0].slice(0, 2))) s = 60; // same language, other region
    else return -1;
    const name = v.name || '';
    if (NOVELTY.test(name)) return -1;
    if (FEMALE.test(name)) s += 30;
    if (MALE.test(name)) s -= 40;
    if (ROBOTIC.test(name)) s -= 15;
    QUALITY.forEach(([re, pts]) => { if (re.test(name)) s += pts; });
    return s;
  }

  function voiceFor(lang) {
    if (lang in best) return best[lang];
    let top = null, topScore = -1;
    voices.forEach(v => { const s = score(v, lang); if (s > topScore) { top = v; topScore = s; } });
    if (voices.length) best[lang] = top;  // don't cache until the list has loaded
    return top;
  }

  const listeners = [];
  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices() || [];
    for (const k in best) delete best[k];
    listeners.forEach(fn => fn());
  }
  if (synth) {
    loadVoices();
    if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', loadVoices);
  }

  // ---------- Tone of voice ----------
  // Gentle and unhurried, with a smile: a little slower than normal, a little brighter.
  const BASE = { en: { rate: 0.86, pitch: 1.08 }, fi: { rate: 0.84, pitch: 1.06 }, bn: { rate: 0.82, pitch: 1.06 } };
  const MOOD = {
    ask:   { rate: 0.96, pitch: 0.07 },  // curious, inviting
    cheer: { rate: 1.06, pitch: 0.16 },  // bright little burst of excitement
    soft:  { rate: 0.95, pitch: 0.04 },  // warm and reassuring
    info:  { rate: 0.94, pitch: 0.02 },  // calm, clear naming
  };

  // ---------- Recorded clips ----------
  const player = typeof Audio !== 'undefined' ? new Audio() : null;
  if (player) player.preload = 'auto';
  const missingClips = new Set();
  const clipUrl = (lang, key) => `narration/${lang}/${key}.${CLIPS[lang]}`;
  const hasClips = lang => !!CLIPS[lang] && !!player;

  function playClip(lang, key, onEnd, onFail) {
    let settled = false;
    const end = fn => () => { if (!settled) { settled = true; player.onended = player.onerror = null; fn(); } };
    const ok = end(onEnd), fail = end(() => { missingClips.add(lang + '/' + key); onFail(); });
    player.onended = ok;
    player.onerror = fail;
    player.src = clipUrl(lang, key);
    const p = player.play();
    if (p && p.catch) p.catch(fail);
  }

  function speakTTS(lang, text, mood, onEnd) {
    if (!synth) { setTimeout(onEnd, 250); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = voiceFor(lang);
      if (v) u.voice = v;
      u.lang = v ? v.lang : T[lang].speech[0];
      const b = BASE[lang] || BASE.en, m = MOOD[mood] || MOOD.info;
      u.rate = b.rate * m.rate;
      u.pitch = Math.min(1.35, b.pitch + m.pitch);
      let finished = false;
      const fin = () => { if (!finished) { finished = true; onEnd(); } };
      u.onend = fin;
      u.onerror = fin;
      setTimeout(fin, 1500 + text.length * 120); // some browsers never fire onend
      synth.speak(u);
    } catch (err) { setTimeout(onEnd, 250); }
  }

  // ---------- Public API ----------
  let token = 0;
  const Narrator = {
    // lines: [{ key, text, mood }], spoken one after another with a tiny breath between
    say(lang, lines, onDone) {
      const my = ++token;
      Narrator.stopAudio();
      let i = 0;
      const next = () => {
        if (my !== token) return;
        if (i >= lines.length) { onDone && onDone(); return; }
        const line = lines[i++];
        const after = () => setTimeout(next, i < lines.length ? 140 : 0);
        if (hasClips(lang) && !missingClips.has(lang + '/' + line.key)) {
          playClip(lang, line.key, after, () => { if (my === token) speakTTS(lang, line.text, line.mood, after); });
        } else {
          speakTTS(lang, line.text, line.mood, after);
        }
      };
      next();
    },
    stop() { token++; Narrator.stopAudio(); },
    stopAudio() {
      if (synth) try { synth.cancel(); } catch (e) { /* ignore */ }
      if (player) try { player.pause(); } catch (e) { /* ignore */ }
    },
    // Can she talk in this language? (null = don't know yet, voices still loading)
    canSpeak(lang) {
      if (hasClips(lang)) return true;
      if (!synth) return false;
      if (!voices.length) return null;
      return !!voiceFor(lang);
    },
    onVoices(fn) { listeners.push(fn); },
    voiceName(lang) { const v = voiceFor(lang); return v ? v.name : ''; },
  };

  window.FTA_Narrator = Narrator;
})();
