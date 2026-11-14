/*
 * Distribución de notas del acordeón diatónico Hohner Tres Coronas (31 pitos / 12 bajos).
 * Afinación de referencia: Sol - Do - Fa (GCF). Las notas son números MIDI (60 = Do4).
 * Las demás afinaciones se obtienen transponiendo esta distribución.
 *
 * Fuentes: pitos = Sr. Maestro 2.0.1 (SenorMaestro-Referencia), confirmados con el diagrama oficial
 * de Hohner «Diatonic keyboard GCF, 31 buttons» y la tarjeta GCF del usuario. Bajos = diagrama de Hohner
 * y la misma tarjeta. Cada posición del arreglo es un pito, del 1 (arriba, el de las alteraciones) al último.
 */
const BASE_LAYOUT = {
  treble: [
    { name: '1ª hilera', place: 'afuera', keyPc: 7,
      push: [61, 55, 59, 62, 67, 71, 74, 79, 83, 86],
      pull: [63, 57, 60, 64, 66, 69, 72, 76, 78, 81] },
    { name: '2ª hilera', place: 'medio', keyPc: 0,
      push: [66, 55, 60, 64, 67, 72, 76, 79, 84, 88, 91],
      pull: [68, 59, 62, 65, 69, 71, 74, 77, 81, 83, 86] },
    { name: '3ª hilera', place: 'adentro', keyPc: 5,
      push: [75, 60, 65, 69, 72, 77, 81, 84, 89, 93],
      pull: [73, 64, 67, 70, 74, 76, 79, 82, 86, 88] },
  ],
  // Bajos: 2 filas de 6, de arriba (hacia la barbilla) a abajo (hacia la rodilla). En cada pareja el de
  // arriba es el acorde (minúscula en los diagramas de Hohner) y el de abajo el bajo (mayúscula).
  // 'bass' = nota sola, 'chord' = acorde. push/pull = clase de nota (0 = Do … 11 = Si) cerrando / abriendo;
  // pushQ/pullQ = calidad del acorde ('maj' mayor, 'min' menor).
  bass: [
    { name: 'Interna', buttons: [  // junto al fuelle
      { type: 'chord', push: 4, pull: 9, pushQ: 'maj', pullQ: 'min' },   { type: 'bass', push: 4, pull: 9 },
      { type: 'chord', push: 9, pull: 2, pushQ: 'maj', pullQ: 'min' },   { type: 'bass', push: 9, pull: 2 },
      { type: 'chord', push: 10, pull: 10, pushQ: 'maj', pullQ: 'maj' }, { type: 'bass', push: 10, pull: 10 },
    ] },
    { name: 'Externa', buttons: [
      { type: 'chord', push: 7, pull: 2, pushQ: 'maj', pullQ: 'maj' }, { type: 'bass', push: 7, pull: 2 },
      { type: 'chord', push: 0, pull: 7, pushQ: 'maj', pullQ: 'maj' }, { type: 'bass', push: 0, pull: 7 },
      { type: 'chord', push: 5, pull: 0, pushQ: 'maj', pullQ: 'maj' }, { type: 'bass', push: 5, pull: 0 },
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
