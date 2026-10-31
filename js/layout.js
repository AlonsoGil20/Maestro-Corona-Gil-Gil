/*
 * Distribución de notas del acordeón diatónico Hohner Tres Coronas (31 pitos / 12 bajos).
 * Afinación de referencia: Sol - Do - Fa (GCF). Las notas son números MIDI (60 = Do4).
 * Las demás afinaciones se obtienen transponiendo esta distribución.
 *
 * Si tu acordeón tiene alguna nota distinta (p. ej. pitos alterados), ajusta estos valores:
 * cada posición del arreglo es un pito, del 1 (arriba, cerca de la barbilla) al último.
 */
const BASE_LAYOUT = {
  treble: [
    { name: '1ª hilera', place: 'afuera', keyPc: 7,
      push: [55, 59, 62, 67, 71, 74, 79, 83, 86, 91],
      pull: [57, 62, 66, 69, 72, 76, 78, 81, 84, 88] },
    { name: '2ª hilera', place: 'medio', keyPc: 0,
      push: [55, 60, 64, 67, 72, 76, 79, 84, 88, 91, 96],
      pull: [59, 62, 67, 71, 74, 77, 81, 83, 86, 89, 93] },
    { name: '3ª hilera', place: 'adentro', keyPc: 5,
      push: [53, 57, 60, 65, 69, 72, 77, 81, 84, 89],
      pull: [55, 60, 64, 67, 70, 74, 76, 79, 82, 86] },
  ],
  // Bajos: 2 filas de 6. 'bass' = nota fundamental, 'chord' = acorde mayor.
  // push/pull = clase de nota (0 = Do ... 11 = Si) cerrando / abriendo.
  bass: [
    { name: 'Interna', buttons: [
      { type: 'bass', push: 7, pull: 2 }, { type: 'chord', push: 7, pull: 2 },
      { type: 'bass', push: 0, pull: 7 }, { type: 'chord', push: 0, pull: 7 },
      { type: 'bass', push: 5, pull: 0 }, { type: 'chord', push: 5, pull: 0 },
    ] },
    { name: 'Externa', buttons: [
      { type: 'bass', push: 4, pull: 9 }, { type: 'chord', push: 4, pull: 9 },
      { type: 'bass', push: 9, pull: 2 }, { type: 'chord', push: 9, pull: 2 },
      { type: 'bass', push: 10, pull: 5 }, { type: 'chord', push: 10, pull: 5 },
    ] },
  ],
};

// offset = semitonos respecto a Sol-Do-Fa. pref = cómo nombrar las alteraciones de los pitos.
const TUNINGS = [
  { id: 'GCF',   name: 'Sol - Do - Fa',        offset: 0,  pref: 'mixed' },
  { id: 'ADG',   name: 'La - Re - Sol',        offset: 2,  pref: 'sharp' },
  { id: 'BbEbAb', name: 'Si♭ - Mi♭ - La♭',     offset: 3,  pref: 'flat' },
  { id: 'BEA',   name: 'Si - Mi - La',         offset: 4,  pref: 'sharp' },
  { id: 'CFBb',  name: 'Do - Fa - Si♭',        offset: 5,  pref: 'flat' },
  { id: 'FsBE',  name: 'Fa# - Si - Mi',        offset: -1, pref: 'sharp' },
  { id: 'FBbEb', name: 'Fa - Si♭ - Mi♭',       offset: -2, pref: 'flat' },
  { id: 'EAD',   name: 'Mi - La - Re',         offset: -3, pref: 'sharp' },
  { id: 'EbAbDb', name: 'Mi♭ - La♭ - Re♭',     offset: -4, pref: 'flat' },
  { id: 'DGC',   name: 'Re - Sol - Do',        offset: -5, pref: 'sharp' },
];
