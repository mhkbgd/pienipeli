/* ============ Pienipeli: the alphabet ============
   One word and one picture for every letter, shared by Alphabet Zoo, Trace the Letter
   and Letter Pop. Pictures come from assets/animals/ (animals) or assets/things/
   (letters that have no animal in the library). "call" is the animal sound to play.  */

(() => {
  'use strict';
  const A = (id, word) => ({ pic: 'animals/' + id, word, call: id });
  const T = (id, word) => ({ pic: 'things/' + id, word, call: null });
  const LETTERS = {
    A: T('apple', 'Apple'),       B: A('bear', 'Bear'),         C: A('cat', 'Cat'),
    D: A('dog', 'Dog'),           E: A('elephant', 'Elephant'), F: A('frog', 'Frog'),
    G: A('giraffe', 'Giraffe'),   H: A('horse', 'Horse'),       I: T('icecream', 'Ice cream'),
    J: T('jellyfish', 'Jellyfish'), K: A('kangaroo', 'Kangaroo'), L: A('lion', 'Lion'),
    M: A('monkey', 'Monkey'),     N: T('nest', 'Nest'),         O: A('owl', 'Owl'),
    P: A('pig', 'Pig'),           Q: T('crown', 'Queen'),       R: A('rabbit', 'Rabbit'),
    S: A('sheep', 'Sheep'),       T: A('tiger', 'Tiger'),       U: T('umbrella', 'Umbrella'),
    V: T('van', 'Van'),           W: A('whale', 'Whale'),       X: T('xylophone', 'Xylophone'),
    Y: T('yoyo', 'Yo-yo'),        Z: A('zebra', 'Zebra')
  };
  // A bright colour per letter (cycles through the rainbow)
  const COLORS = ['#ff5e4d', '#ff9f43', '#ffc93c', '#3dd68c', '#4fc3f7', '#b07cff', '#ff7eb6'];
  const ORDER = Object.keys(LETTERS);
  ORDER.forEach((l, i) => { LETTERS[l].color = COLORS[i % COLORS.length]; LETTERS[l].index = i; });

  // Each letter's own little tune: its note climbs the scale through the alphabet
  const SCALE = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
  ORDER.forEach((l, i) => { LETTERS[l].note = SCALE[i % SCALE.length]; });

  window.ABC = { LETTERS, ORDER };
})();
