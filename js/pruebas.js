/* Pruebas automáticas: teclado, bajos, acordes, círculos y escalas contra la referencia y la teoría. */
(() => {
  const frame = document.getElementById('app');
  const out = document.getElementById('out');
  let total = 0, fails = 0;

  function section(title) {
    const el = document.createElement('section');
    el.innerHTML = `<h2>${title}</h2><div class="res"></div><ul></ul>`;
    out.appendChild(el);
    let n = 0, bad = 0;
    const list = el.querySelector('ul');
    return {
      check(ok, msg) {
        n++; total++;
        if (!ok) { bad++; fails++; if (bad <= 15) list.insertAdjacentHTML('beforeend', `<li class="bad">✘ ${msg}</li>`); }
      },
      note(msg) { list.insertAdjacentHTML('beforeend', `<li class="muted">${msg}</li>`); },
      done() {
        el.querySelector('.res').innerHTML = bad
          ? `<b class="bad">✘ ${bad} de ${n} comprobaciones fallaron</b>`
          : `<b class="ok">✔ ${n} comprobaciones correctas</b>`;
      },
    };
  }

  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));

  frame.addEventListener('load', () => setTimeout(run, 300));

  function run() {
    const W = frame.contentWindow, D = frame.contentDocument;
    const g = name => W.eval(name);  // las constantes de la app no están en window
    const Music = g('Music'), App = g('App'), REF = g('REFERENCIA'), BASE = g('BASE_LAYOUT'), TUNINGS = g('TUNINGS');
    const change = (id, v) => { const el = D.getElementById(id); el.value = String(v); el.dispatchEvent(new W.Event('change')); };
    const pc = Music.pc;

    /* 1. Teclado de pitos = Sr. Maestro (Sol-Do-Fa) */
    let t = section('1 · Teclado de pitos contra el Sr. Maestro (Sol-Do-Fa)');
    BASE.treble.forEach((row, r) => ['push', 'pull'].forEach(d => {
      const ref = REF.treble[r][d];
      t.check(row[d].length === ref.length, `Hilera ${r + 1} ${d}: ${row[d].length} botones, la referencia tiene ${ref.length}`);
      ref.forEach((m, i) => t.check(row[d][i] === m, `Hilera ${r + 1}, pito ${i + 1} ${d === 'push' ? 'cerrando' : 'abriendo'}: app ${row[d][i]}, referencia ${m}`));
    }));
    t.done();

    /* 2. Pitos y bajos = diagramas oficiales de Hohner de 31 botones, tono por tono */
    t = section('2 · Pitos y bajos contra los diagramas oficiales de Hohner (6 tonos)');
    // Transcripción de hohner.de «Fingeringcharts Keyboard …-31». Pitos: cerrando/abriendo, del botón 1 (arriba)
    // al último; sin número = octava 3, 1 = octava 4 (c1 = Do central)… Bajos: de la barbilla a la rodilla;
    // minúscula = acorde (m = menor), mayúscula = bajo.
    const CHARTS = {
      GCF: { r: ['c#1/eb1 g/a b/c1 d1/e1 g1/f#1 b1/a1 d2/c2 g2/e2 b2/f#2 d3/a2',
        'f#1/g#1 g/b c1/d1 e1/f1 g1/a1 c2/b1 e2/d2 g2/f2 c3/a2 e3/b2 g3/d3',
        'eb2/c#2 c1/e1 f1/g1 a1/bb1 c2/d2 f2/e2 a2/g2 c3/bb2 f3/d3 a3/e3'],
        b: ['e/am E/A a/dm A/D bb/bb Bb/Bb', 'g/d G/D c/g C/G f/c F/C'] },
      FBbEb: { r: ['b/c#1 f/g a/bb c1/d1 f1/e1 a1/g1 c2/bb1 f2/d2 a2/e2 c3/g2',
        'e1/f#1 f/a bb/c1 d1/eb1 f1/g1 bb1/a1 d2/c2 f2/eb2 bb2/g2 d3/a2 f3/c3',
        'c#2/b1 bb/d1 eb1/f1 g1/ab1 bb1/c2 eb2/d2 g2/f2 bb2/ab2 eb3/c3 g3/d3'],
        b: ['d/gm D/G g/cm G/C ab/ab Ab/Ab', 'f/c F/C bb/f Bb/F eb/bb Eb/Bb'] },
      ADG: { r: ['eb1/f1 a/b c#1/d1 e1/f#1 a1/g#1 c#2/b1 e2/d2 a2/f#2 c#3/g#2 e3/b2',
        'g#1/bb1 a/c#1 d1/e1 f#1/g1 a1/b1 d2/c#2 f#2/e2 a2/g2 d3/b2 f#3/c#3 a3/e3',
        'f2/eb2 d1/f#1 g1/a1 b1/c2 d2/e2 g2/f#2 b2/a2 d3/c3 g3/e3 b3/f#3'],
        b: ['f#/bm F#/B b/em B/E c/c C/C', 'a/e A/E d/a D/A g/d G/D'] },
      BEA: { r: ['f1/g1 b/c#1 eb1/e1 f#1/g#1 b1/bb1 eb2/c#2 f#2/e2 b2/g#2 eb3/bb2 f#3/c#3',
        'bb1/c2 b/eb1 e1/f#1 g#1/a1 b1/c#2 e2/eb2 g#2/f#2 b2/a2 e2/c#3 g#3/eb3 b3/f#3',
        'g2/f2 e1/g#1 a1/b1 c#2/d2 e2/f#2 a2/g#2 c#3/b2 e3/d3 a3/f#3 c#4/g#3'],
        b: ['g#/c#m G#/C# c#/f#m C#/F# d/d D/D', 'b/f# B/F# e/b E/B a/e A/E'] },
      BbEbAb: { r: ['e1/f#1 bb/c1 d1/eb1 f1/g1 bb1/a1 d2/c2 f2/eb2 bb2/g2 d3/a2 f3/c3',
        'a1/b1 bb/d1 eb1/f1 g1/ab1 bb1/c2 eb2/d2 g2/f2 bb2/ab2 eb3/c3 g3/d3 bb3/f3',
        'f#2/e2 eb1/g1 ab1/bb1 c2/db2 eb2/f2 ab2/g2 c3/bb2 eb3/db3 ab3/f3 c4/g3'],
        b: ['g/cm G/C c/fm C/F db/db Db/Db', 'bb/f Bb/F eb/bb Eb/Bb ab/eb Ab/Eb'] },
      EAD: { r: ['a#/c1 e/f# g#/a b/c#1 e1/d#1 g#1/f#1 b1/a1 e2/c#2 g#2/d#2 b2/f#2',
        'd#1/f1 e/g# a/b c#1/d1 e1/f#1 a1/g#1 c#2/b1 e2/d2 a2/f#2 c#3/g#2 e3/b2',
        'c2/bb1 a/c#1 d1/e1 f#1/g1 a1/b1 d2/c#2 f#2/e2 a2/g2 d3/b2 f#3/c#3'],
        b: ['c#/f#m C#/F# f#/bm F#/Bm g/g G/G', 'e/b E/B a/e A/E d/a D/A'] },
    };
    // Erratas de los propios diagramas de Hohner (la teoría y los otros 5 diagramas dicen otra cosa)
    const ERRATAS = {
      'BEA 2ª hilera pito 9 cerrando': 'el diagrama dice e² (Mi5); la serie e¹ g#¹ b¹ e² g#² b² e³ g#³ b³ pide e³ (Mi6)',
      'EAD bajo F#/Bm': 'un bajo de una nota no puede ser menor: es Si (B)',
    };
    const PCS = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
    const notePc = (l, acc) => pc(PCS[l.toLowerCase()] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0));
    const midiOf = s => { const [, l, acc, o] = s.match(/^([a-g])(#|b)?(\d)?$/); return 12 * (3 + (+o || 0) + 1) + notePc(l, acc); };
    const nameOf = m => ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'][pc(m)] + Music.octave(m);
    Object.entries(CHARTS).forEach(([id, ch]) => {
      change('tuning', id);
      const L = App.L;
      ch.r.forEach((row, r) => row.split(' ').forEach((pair, i) => {
        const [push, pull] = pair.split('/').map(midiOf);
        const b = L.treble.find(x => x.row === r && x.idx === i);
        [['push', push, 'cerrando'], ['pull', pull, 'abriendo']].forEach(([d, m, word]) => {
          const where = `${id} ${r + 1}ª hilera pito ${i + 1} ${word}`;
          if (b[d] !== m && ERRATAS[where]) t.note(`Errata de Hohner en ${where}: ${ERRATAS[where]}. La app da ${nameOf(b[d])}.`);
          else t.check(b[d] === m, `${where}: app ${nameOf(b[d])}, Hohner ${nameOf(m)}`);
        });
      }));
      ch.b.forEach((row, r) => row.split(' ').forEach((pair, i) => {
        const b = L.bass.find(x => x.row === r && x.idx === i);
        const [push, pull] = pair.split('/').map(s => s.match(/^([a-gA-G])(#|b)?(m)?$/));
        const chord = push[1] === push[1].toLowerCase();
        const q = s => (s[3] ? 'min' : 'maj');
        if (pull[3] && !chord) t.note(`Errata de Hohner en ${id} bajo ${pair}: ${ERRATAS[`${id} bajo ${pair}`] || 'bajo con «m»'}.`);
        const ok = b.type === (chord ? 'chord' : 'bass') && b.push === notePc(push[1], push[2]) && b.pull === notePc(pull[1], pull[2])
          && (!chord || (b.pushQ === q(push) && b.pullQ === q(pull)));
        t.check(ok, `${id} bajos fila «${BASE.bass[r].name}» botón ${i + 1}: Hohner ${pair}, app ${b.type} ${b.push}/${b.pull} ${b.pushQ || ''}/${b.pullQ || ''}`);
      }));
    });
    t.note('Do-Fa-Si♭, Fa#-Si-Mi, Mi♭-La♭-Re♭ y Re-Sol-Do no tienen diagrama de 31 botones en hohner.de: se calculan con la misma transposición que confirman los 6 diagramas.');
    t.done();

    /* 3. Teoría: escalas, acordes y grados */
    t = section('3 · Fórmulas de escalas, acordes y grados (teoría)');
    const SC = { mayor: [0, 2, 4, 5, 7, 9, 11], mixolidia: [0, 2, 4, 5, 7, 9, 10], pentaMay: [0, 2, 4, 7, 9],
      pentaMen: [0, 3, 5, 7, 10], menor: [0, 2, 3, 5, 7, 8, 10], armonica: [0, 2, 3, 5, 7, 8, 11], melodica: [0, 2, 3, 5, 7, 9, 11],
      tonosEnteros: [0, 2, 4, 6, 8, 10] };
    Object.entries(SC).forEach(([k, v]) => t.check(sameSet(Music.SCALES[k].steps, v), `Escala ${k}: ${Music.SCALES[k].steps}`));
    t.check(sameSet(Music.SCALES.melodica.desc, SC.menor), 'Menor melódica bajando = menor natural');
    const CH = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], dom7: [0, 4, 7, 10], maj7: [0, 4, 7, 11],
      m7: [0, 3, 7, 10], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], dom7s5: [0, 4, 8, 10], dom7b5: [0, 4, 6, 10] };
    t.check(Object.keys(Music.CHORDS).length === 11, 'La app tiene los 11 tipos de acorde del Sr. Maestro');
    Object.entries(CH).forEach(([k, v]) => t.check(sameSet(Music.CHORDS[k].iv, v), `Acorde ${k}`));
    const DG = { maj: { I: [0, 'maj'], ii: [1, 'min'], iii: [2, 'min'], IV: [3, 'maj'], V: [4, 'maj'], V7: [4, 'dom7'], vi: [5, 'min'], I7: [0, 'dom7'] },
      min: { i: [0, 'min'], III: [2, 'maj'], iv: [3, 'min'], V7: [4, 'dom7'], VI: [5, 'maj'], VII: [6, 'maj'] } };
    Object.entries(DG).forEach(([m, o]) => Object.entries(o).forEach(([deg, [n, q]]) =>
      t.check(Music.DEGREES[m][deg].deg === n && Music.DEGREES[m][deg].q === q, `Grado ${deg} en ${m}`)));
    const ORDER = { triadas: ['I', 'IV', 'V'], armonico: ['I', 'vi', 'ii', 'V7'], melodico: ['I', 'vi', 'IV', 'V7'] };
    Object.entries(ORDER).forEach(([ref, degs]) => {
      const c = Music.CIRCLES.maj.find(x => x.ref === ref);
      t.check(c && c.degrees.join() === degs.join(), `Círculo «${ref}» con grados ${degs.join('-')}`);
    });
    t.done();

    /* 4. Datos del Sr. Maestro que usa la app: cada acorde de sus círculos cumple la teoría */
    t = section('4 · Acordes de la referencia del Sr. Maestro (teoría)');
    const L0 = BASE.treble;
    const refMidi = ([f, b, d]) => L0[f - 1][d][b - 1];
    Object.entries(REF.progresiones).forEach(([name, table]) => Object.entries(table).forEach(([key, steps]) => {
      steps.forEach(([deg, notes]) => {
        const d = Music.DEGREES.maj[deg], root = pc(+key + Music.SCALES.mayor.steps[d.deg]);
        const ivs = [...new Set(notes.map(n => pc(refMidi(n) - root)))].sort((a, b) => a - b);
        const want = Music.CHORDS[d.q].iv, opt = Music.CHORDS[d.q].optional.map(i => want[i]);
        const ok = want.filter(x => !opt.includes(x)).every(x => ivs.includes(x)) && ivs.every(x => want.includes(x));
        t.check(ok, `${name} en ${Music.keyName(+key, 'maj')}, ${deg}: intervalos ${ivs}`);
      });
    }));
    ['mayor', 'menor'].forEach(modo => Object.entries(REF.escalas[modo]).forEach(([key, dirs]) =>
      Object.entries(dirs).forEach(([dir, fmts]) => Object.entries(fmts).forEach(([fmt, pasos]) => {
        const steps = Music.SCALES[modo].steps;
        const fuera = pasos.flat().filter(n => !steps.includes(pc(n[0] - key)));
        t.check(!fuera.length, `Escala ${modo} ${key} ${dir} ${fmt}: notas fuera de la escala ${fuera.map(n => n[0])}`);
        const real = pasos.flat().filter(n => L0[n[1] - 1][n[3]][n[2] - 1] !== n[0]);
        t.check(!real.length, `Escala ${modo} ${key} ${dir} ${fmt}: botón que no da la nota indicada`);
      }))));
    // Cromática (de semitono en semitono) y tonos enteros (de tono en tono, sin notas en otra octava)
    [['Cromática', REF.escalas.cromatica, 1], ['Tonos enteros WT0', REF.escalas.tonosEnteros.WT0, 2],
      ['Tonos enteros WT1', REF.escalas.tonosEnteros.WT1, 2]].forEach(([name, pasos, salto]) => {
      const ms = pasos.map(p => p[0][0]);
      t.check(ms.every((m, i) => (m - ms[0]) % salto === 0 && (i === 0 || m > ms[i - 1])), `${name}: notas fuera de la serie ${ms}`);
      t.check(pasos.every(p => L0[p[0][1] - 1][p[0][3]][p[0][2] - 1] === p[0][0]), `${name}: botón que no da la nota indicada`);
    });
    // Los 11 tipos de acorde: cada uno suena exactamente con sus intervalos
    Object.values(Music.CHORDS).forEach(q => Object.entries(REF.acordes[q.ref]).forEach(([root, notes]) => {
      const ivs = [...new Set(notes.map(n => pc(refMidi(n) - root)))];
      t.check(sameSet(ivs, q.iv), `Acorde ${q.name} en ${root}: intervalos ${ivs}`);
    }));
    const nAcordes = Object.values(REF.acordes).reduce((s, x) => s + Object.keys(x).length, 0);
    t.note(`${nAcordes} acordes del Sr. Maestro revisados (el Sol maj7, que trae mal, no se usa).`);
    t.done();

    /* 5. Círculos de la app en los 10 tonos y las 24 tonalidades */
    t = section('5 · Círculos de la app: cada acorde suena correcto (10 tonos × 24 tonalidades)');
    let sinPos = 0, conRef = 0, refEsperados = 0;
    TUNINGS.forEach(tu => {
      change('tuning', tu.id);
      const L = App.L;
      ['maj', 'min'].forEach(mode => Music.CIRCLES[mode].forEach(c => {
        for (let key = 0; key < 12; key++) {
          const chords = App.circleChords(key, mode, c.degrees, c.ref);
          chords.forEach(ch => {
            const q = Music.CHORDS[ch.quality];
            const root = pc(key + Music.SCALES[mode === 'maj' ? 'mayor' : 'menor'].steps[Music.DEGREES[mode][ch.deg].deg]);
            t.check(ch.rootPc === root, `${tu.name} · ${c.name} en ${Music.keyName(key, mode)}: raíz de ${ch.deg}`);
            if (c.ref) { refEsperados++; if (ch.voicings[0] && ch.voicings[0].ref) conRef++; }
            ch.voicings.forEach(v => {
              const ivs = [...new Set(v.buttons.map(b => pc(b[v.dir] - root)))];
              const opt = q.optional.map(i => q.iv[i]);
              const ok = q.iv.filter(x => !opt.includes(x)).every(x => ivs.includes(x)) && ivs.every(x => q.iv.includes(x))
                && v.buttons.every(b => L.treble.includes(b));
              t.check(ok, `${tu.name} · ${c.name} en ${Music.keyName(key, mode)}: ${ch.name} suena ${ivs}`);
            });
            if (!ch.voicings.length) sinPos++;
          });
        }
      }));
    });
    t.check(conRef === refEsperados, `Círculos del Sr. Maestro: ${conRef} de ${refEsperados} acordes usan su posición`);
    t.note(`${conRef} de ${refEsperados} acordes de las triadas y los círculos armónico y melódico usan los botones del Sr. Maestro.`);
    t.note(`${sinPos} acordes de tonalidades lejanas no tienen posición en los pitos (se marcan «incompleto» en la app).`);
    t.done();

    /* 6. Escalas de la app: cada botón da la nota pedida; las del Sr. Maestro usan su digitación */
    t = section('6 · Escalas de la app (10 tonos): botones, fuelle y digitación del Sr. Maestro');
    change('sHand', 'pitos');
    change('sOct', 4);
    let refSteps = 0, otherDir = 0, outOfRange = 0;
    // En Sol-Do-Fa se prueban las 4 digitaciones; en los demás tonos, la del Sr. Maestro y la calculada
    TUNINGS.forEach(tu => { change('tuning', tu.id); (tu.id === 'GCF' ? ['ambos', 'pull', 'push', 'calc'] : ['ambos', 'calc']).forEach(fing => {
      change('sFing', fing);
      Object.keys(Music.SCALES).forEach(type => {
        change('sType', type);
        ['simple', 'terceras', 'sextas', 'triadas'].forEach(iv => {
          if (fing !== 'ambos' && fing !== 'calc' && iv === 'triadas') return;
          change('sInt', iv);
          for (let root = 0; root < 12; root++) {
            change('sRoot', root);
            const sc = App.S.scale;
            sc.steps.forEach((s, k) => {
              if (!s.opt) return;
              const ok = s.opt.btns.every((b, j) => b[s.opt.dir] === s.notes[j].midi);
              t.check(ok, `${tu.name} · ${type} ${root} ${iv} ${fing}, paso ${k + 1}: los botones no dan las notas`);
              // El Sr. Maestro toca en la otra dirección las notas que no existen en la elegida; la app no
              if ((fing === 'push' || fing === 'pull') && s.opt.dir !== fing) {
                if (s.opt.ref) otherDir++;
                else t.check(false, `${tu.name} · ${type} ${root} ${iv}: paso ${k + 1} calculado en la dirección contraria`);
              }
              if (s.opt.ref) refSteps++;
            });
            let refPasos = null;
            if (type === 'cromatica' || type === 'tonosEnteros') {
              if (fing === 'ambos' && iv === 'simple')
                refPasos = type === 'cromatica' ? REF.escalas.cromatica : REF.escalas.tonosEnteros[pc(root - tu.offset) % 2 ? 'WT1' : 'WT0'];
            } else if (type === 'mayor' || type === 'menor') {
              const rk = REF.escalas[type][pc(root - tu.offset)];
              refPasos = fing !== 'calc' && iv !== 'triadas' && rk && rk[fing] && rk[fing][iv];
            }
            const hasRef = !!refPasos;
            // Solo cuenta si la octava elegida comparte notas con la del Sr. Maestro (sus sextas abarcan 1 octava)
            const key = ms => [...ms].sort((a, b) => a - b).join(',');
            const refSet = hasRef ? new Set(refPasos.map(p => key(p.map(n => n[0] + tu.offset)))) : null;
            const overlap = hasRef && sc.steps.some(s => refSet.has(key(s.notes.map(n => n.midi))));
            if (overlap) t.check(sc.steps.some(s => s.opt && s.opt.ref), `${tu.name} · ${type} ${root} ${iv} ${fing}: no usa la digitación del Sr. Maestro`);
            else if (hasRef) outOfRange++;
          }
        });
      });
    }); });
    t.note(`${refSteps} pasos de escala usan la digitación del Sr. Maestro.`);
    t.note(`${otherDir} pasos de «solo abriendo / solo cerrando» van en la otra dirección porque así los trae el Sr. Maestro (esa nota no existe en la dirección elegida).`);
    t.note(`${outOfRange} escalas de otros tonos caen, en la octava 4, fuera de las octavas que trae el Sr. Maestro: ahí la digitación es calculada.`);
    t.done();

    /* 7. Pestaña Acordes: 11 tipos × 12 fundamentales × 10 tonos */
    t = section('7 · Acordes: 11 tipos × 12 fundamentales en los 10 tonos');
    let refChords = 0, calcChords = 0;
    TUNINGS.forEach(tu => {
      change('tuning', tu.id);
      Object.entries(Music.CHORDS).forEach(([type, q]) => {
        for (let root = 0; root < 12; root++) {
          const ch = App.chordFor(root, type);
          const name = `${tu.name} · ${ch.name} (${q.name})`;
          const tienePos = ch.voicings.length > 0;
          t.check(tienePos, `${name}: sin posición en los pitos`);
          ch.voicings.forEach(v => {
            const ivs = [...new Set(v.buttons.map(b => pc(b[v.dir] - root)))];
            const opt = q.optional.map(i => q.iv[i]);
            const ok = q.iv.filter(x => !opt.includes(x)).every(x => ivs.includes(x)) && ivs.every(x => q.iv.includes(x));
            t.check(ok, `${name}: suena ${ivs}, debería ser ${q.iv}`);
          });
          // La teoría manda: todos usan al Sr. Maestro menos el que él trae mal (Sol maj7 en Sol-Do-Fa)
          const malo = type === 'maj7' && pc(root - tu.offset) === 7;
          if (tienePos) {
            if (ch.voicings[0].ref) refChords++; else calcChords++;
            t.check(ch.voicings[0].ref === !malo, `${name}: ${malo ? 'no debe' : 'debe'} usar la posición del Sr. Maestro`);
          }
        }
      });
    });
    t.note(`${refChords} acordes usan los botones del Sr. Maestro y ${calcChords} son calculados (el Sol maj7 que él trae mal, transpuesto a cada tono).`);
    t.done();

    const tot = document.getElementById('total');
    tot.className = 'total ' + (fails ? 'bad' : 'ok');
    tot.textContent = fails ? `✘ ${fails} de ${total} comprobaciones fallaron` : `✔ Las ${total} comprobaciones están correctas`;
    window.RESULTADO = { total, fails };
  }
})();
