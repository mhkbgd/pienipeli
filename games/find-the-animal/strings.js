/* ============ Find the Animal: all text, in every language ============
   Used by the game (script.js) and by tools/narration-lines.mjs, which lists
   every spoken line for recording a narrator.                                   */

(() => {
  'use strict';

  const ROUND = 10; // stars in one round; after that a big celebration

  // ---------- Translations ----------
  const bnDigits = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

  const T = {
    en: {
      langName: 'English', speech: ['en-US', 'en-GB', 'en'],
      title: 'Find the Animal!',
      subtitle: 'Listen, look and tap the right animal!',
      play: 'Play!', playAgain: 'Play again', moreGames: 'More games',
      ask: a => `Where is the ${a.toLowerCase()}?`,
      itIs: a => `It's the ${a.toLowerCase()}!`,
      thatIs: a => `That's the ${a.toLowerCase()}.`,
      praise: ['Great job!', 'Well done!', 'Yay!', 'You found it!', 'Super!', 'Amazing!', 'Hooray!'],
      tryAgain: ['Try again!', 'Almost! Try again!', 'Keep looking!'],
      roundDone: n => `Hooray! You found ${n} animals!`,
      found: (n, s) => `Animals found: ${n}. Stars: ${s} of ${ROUND}.`,
      soundOn: 'Turn sound on', soundOff: 'Turn sound off',
      musicOn: 'Turn music on', musicOff: 'Turn music off',
      fullscreen: 'Full screen',
      repeat: 'Hear the question again', home: 'Home', restart: 'Start over', language: 'Language',
      noVoice: 'This device has no English voice, so the game can’t speak. Text and sounds still work.',
      num: n => String(n),
    },
    fi: {
      langName: 'Suomi', speech: ['fi-FI', 'fi'],
      title: 'Etsi eläin!',
      subtitle: 'Kuuntele, katso ja napauta oikeaa eläintä!',
      play: 'Pelaa!', playAgain: 'Pelaa uudelleen', moreGames: 'Lisää pelejä',
      ask: a => `Missä on ${a.toLowerCase()}?`,
      itIs: a => `Se on ${a.toLowerCase()}!`,
      thatIs: a => `Tuo on ${a.toLowerCase()}.`,
      praise: ['Hienoa!', 'Hyvin tehty!', 'Jee!', 'Löysit sen!', 'Mahtavaa!', 'Upeaa!', 'Hurraa!'],
      tryAgain: ['Yritä uudelleen!', 'Melkein! Yritä uudelleen!', 'Etsi vielä!'],
      roundDone: n => `Hurraa! Löysit ${n} eläintä!`,
      found: (n, s) => `Löydetyt eläimet: ${n}. Tähdet: ${s}/${ROUND}.`,
      soundOn: 'Ääni päälle', soundOff: 'Ääni pois',
      musicOn: 'Musiikki päälle', musicOff: 'Musiikki pois',
      fullscreen: 'Koko näyttö',
      repeat: 'Kuuntele kysymys uudelleen', home: 'Alkuun', restart: 'Aloita alusta', language: 'Kieli',
      noVoice: 'Tällä laitteella ei ole suomenkielistä puheääntä, joten peli ei puhu. Teksti ja äänet toimivat silti.',
      num: n => String(n),
    },
    bn: {
      langName: 'বাংলা', speech: ['bn-BD', 'bn-IN', 'bn'],
      title: 'প্রাণী খুঁজি!',
      subtitle: 'শোনো, দেখো আর ঠিক প্রাণীটিকে ছোঁও!',
      play: 'খেলো!', playAgain: 'আবার খেলো', moreGames: 'আরও খেলা',
      ask: a => `${a} কোথায়?`,
      itIs: a => `এটা ${a}!`,
      thatIs: a => `এটা ${a}।`,
      praise: ['দারুণ!', 'খুব ভালো!', 'বাহ্!', 'তুমি খুঁজে পেয়েছ!', 'চমৎকার!', 'অসাধারণ!', 'হুররে!'],
      tryAgain: ['আবার চেষ্টা করো!', 'প্রায় হয়েছে! আবার চেষ্টা করো!', 'আরেকবার খোঁজো!'],
      roundDone: n => `হুররে! তুমি ${bnDigits(n)}টি প্রাণী খুঁজে পেয়েছ!`,
      found: (n, s) => `খুঁজে পাওয়া প্রাণী: ${bnDigits(n)}। তারা: ${bnDigits(s)}/${bnDigits(ROUND)}।`,
      soundOn: 'শব্দ চালু করো', soundOff: 'শব্দ বন্ধ করো',
      musicOn: 'গান চালু করো', musicOff: 'গান বন্ধ করো',
      fullscreen: 'পূর্ণ পর্দা',
      repeat: 'প্রশ্নটি আবার শোনো', home: 'শুরুর পাতা', restart: 'আবার শুরু করো', language: 'ভাষা',
      noVoice: 'এই ডিভাইসে বাংলা কণ্ঠ নেই, তাই খেলাটি কথা বলতে পারবে না। লেখা আর শব্দ ঠিকই চলবে।',
      num: bnDigits,
    },
  };
  // Finnish ('fi') and Bengali ('bn') are disabled for now; add them back here to re-enable.
  const LANGS = ['en'];

  window.FTA_STRINGS = { T, LANGS, ROUND, bnDigits };
})();
