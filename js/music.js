/* Teoría musical: nombres de notas, escalas, intervalos y acordes. */
const Music = (() => {
  const LETTERS = {
    latin: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'],
    anglo: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  };
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const SHARP_LETTER = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const FLAT_LETTER = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
  const MIXED = { 1: 'sharp', 3: 'flat', 6: 'sharp', 8: 'sharp', 10: 'flat' };
  let notation = 'latin';

  const pc = m => ((m % 12) + 12) % 12;

  function spell(letter, p) {
    const diff = ((pc(p) - LETTER_PC[letter] + 18) % 12) - 6;
    return LETTERS[notation][letter] + (diff > 0 ? '#'.repeat(diff) : '♭'.repeat(-diff));
  }
  function letterOf(p, pref) {
    p = pc(p);
    if (pref === 'mixed') pref = MIXED[p] || 'sharp';
    return (pref === 'flat' ? FLAT_LETTER : SHARP_LETTER)[p];
  }
  const name = (m, pref = 'mixed') => spell(letterOf(m, pref), m);
  const octave = m => Math.floor(m / 12) - 1;

  // Cómo escribir la tónica de cada tonalidad (Si♭ mayor, Do# menor, etc.)
  function rootPref(p, mode) {
    const table = mode === 'min'
      ? { 1: 'sharp', 3: 'flat', 6: 'sharp', 8: 'sharp', 10: 'flat' }
      : { 1: 'flat', 3: 'flat', 6: 'sharp', 8: 'flat', 10: 'flat' };
    return table[pc(p)] || 'sharp';
  }
  // Posición en el pentagrama: step = octava·7 + letra (Do4 = 28); acc = sostenidos (+) o bemoles (−).
  function staffPos(m, letter) {
    if (letter == null) letter = letterOf(m, 'mixed');
    const acc = ((pc(m) - LETTER_PC[letter] + 18) % 12) - 6;
    return { step: (Math.round((m - acc - LETTER_PC[letter]) / 12) - 1) * 7 + letter, acc };
  }
  const keyName = (p, mode) => spell(letterOf(p, rootPref(p, mode)), p) + (mode === 'min' ? ' menor' : ' mayor');

  const SCALES = {
    mayor:     { name: 'Mayor',          mode: 'maj', steps: [0, 2, 4, 5, 7, 9, 11] },
    mixolidia: { name: 'Mixolidia (mayor con 7ª menor)', mode: 'maj', steps: [0, 2, 4, 5, 7, 9, 10] },
    pentaMay:  { name: 'Pentatónica mayor', mode: 'maj', steps: [0, 2, 4, 7, 9], letters: [0, 1, 2, 4, 5] },
    pentaMen:  { name: 'Pentatónica menor', mode: 'min', steps: [0, 3, 5, 7, 10], letters: [0, 2, 3, 4, 6] },
    menor:     { name: 'Menor natural',  mode: 'min', steps: [0, 2, 3, 5, 7, 8, 10] },
    armonica:  { name: 'Menor armónica', mode: 'min', steps: [0, 2, 3, 5, 7, 8, 11] },
    melodica:  { name: 'Menor melódica', mode: 'min', steps: [0, 2, 3, 5, 7, 9, 11], desc: [0, 2, 3, 5, 7, 8, 10] },
    cromatica: { name: 'Cromática',      mode: 'maj', chromatic: true },
  };

  // stack = grados de escala que se suman a cada nota (7 = octava, 9 = décima, en escalas de 7 notas);
  // semis = semitonos (para la cromática). arp = notas tocadas una por una en vez de juntas.
  const INTERVALS = {
    simple:   { name: 'Notas simples', stack: [],     semis: [] },
    terceras: { name: 'Terceras',      stack: [2],    semis: [4] },
    sextas:   { name: 'Sextas',        stack: [5],    semis: [9] },
    octavas:  { name: 'Octavas',       stack: [7],    semis: [12] },
    decimas:  { name: 'Décimas',       stack: [9],    semis: [16] },
    triadas:  { name: 'Tríadas',       stack: [2, 4], semis: [4, 7] },
    arpegios: { name: 'Arpegios (1-3-5-8)', stack: [2, 4, 7], semis: [4, 7, 12], arp: true },
  };

  // iv = intervalos, lt = saltos de letra, optional = índices que se pueden omitir
  const CHORDS = {
    maj:  { iv: [0, 4, 7],     lt: [0, 2, 4],    suffix: '',  optional: [] },
    min:  { iv: [0, 3, 7],     lt: [0, 2, 4],    suffix: 'm', optional: [] },
    dom7: { iv: [0, 4, 7, 10], lt: [0, 2, 4, 6], suffix: '7', optional: [2] },
  };

  const DEGREES = {
    maj: {
      I: { deg: 0, q: 'maj' }, ii: { deg: 1, q: 'min' }, iii: { deg: 2, q: 'min' },
      IV: { deg: 3, q: 'maj' }, V: { deg: 4, q: 'maj' }, V7: { deg: 4, q: 'dom7' },
      vi: { deg: 5, q: 'min' }, I7: { deg: 0, q: 'dom7' },
    },
    min: {
      i: { deg: 0, q: 'min' }, III: { deg: 2, q: 'maj' }, iv: { deg: 3, q: 'min' },
      V7: { deg: 4, q: 'dom7' }, VI: { deg: 5, q: 'maj' }, VII: { deg: 6, q: 'maj' },
    },
  };

  const CIRCLES = {
    maj: [
      { name: 'Básico (I – IV – V7)', degrees: ['I', 'IV', 'V7'] },
      { name: 'Con relativa (I – vi – IV – V7)', degrees: ['I', 'vi', 'IV', 'V7'] },
      { name: 'Completo (I – vi – ii – V7)', degrees: ['I', 'vi', 'ii', 'V7'] },
      { name: 'Con séptima (I – I7 – IV – V7)', degrees: ['I', 'I7', 'IV', 'V7'] },
    ],
    min: [
      { name: 'Básico menor (i – iv – V7)', degrees: ['i', 'iv', 'V7'] },
      { name: 'Con relativo (i – III – iv – V7)', degrees: ['i', 'III', 'iv', 'V7'] },
      { name: 'Andaluz (i – VII – VI – V7)', degrees: ['i', 'VII', 'VI', 'V7'] },
    ],
  };

  return {
    pc, spell, letterOf, name, octave, rootPref, keyName, staffPos,
    SCALES, INTERVALS, CHORDS, DEGREES, CIRCLES,
    setNotation: n => { notation = n; },
  };
})();
