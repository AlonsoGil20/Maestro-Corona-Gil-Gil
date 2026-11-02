/* Solfeo: camino guiado, lectura, oído (con dictado), ritmo, micrófono, canto y progreso guardado. */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const S = App.S;
  let mode = 'camino';
  let camino = null;
  // Avisa al camino guiado de un acierto o una puntuación
  const hit = (kind, key, value) => { if (camino) camino.hit(kind, key, value); };

  function say(el, html, cls = '') {
    el.className = 'game-msg ' + cls;
    el.innerHTML = html;
  }

  /* ================= Progreso (se guarda en este computador) ================= */
  const KEY = 'solfeo-progreso';
  let P = null;
  try { P = JSON.parse(App.store.get(KEY)); } catch { /* datos dañados: se empieza de cero */ }
  if (!P || typeof P !== 'object') P = {};
  P.ex = P.ex || {};
  P.days = P.days || [];
  P.path = P.path || [];

  const today = () => new Date().toLocaleDateString('sv');  // AAAA-MM-DD en hora local
  function save() {
    const d = today();
    if (!P.days.includes(d)) P.days = [...P.days, d].slice(-400);
    App.store.set(KEY, JSON.stringify(P));
  }
  // Un intento de pregunta: suma aciertos y rachas
  function record(id, ok) {
    const e = P.ex[id] = P.ex[id] || { n: 0, ok: 0, streak: 0, best: 0 };
    e.n++;
    if (ok) { e.ok++; e.streak++; e.best = Math.max(e.best, e.streak); } else e.streak = 0;
    e.last = today();
    save();
  }
  // Un ejercicio con puntuación (contrarreloj, ritmo): guarda la mejor
  function recordScore(id, score) {
    const e = P.ex[id] = P.ex[id] || { n: 0, best: 0 };
    e.n++;
    e.best = Math.max(e.best || 0, score);
    e.lastScore = score;
    e.last = today();
    save();
    return e.best;
  }

  /* ================= 2 · Lectura ================= */
  const LEVELS = [
    { id: 'escala', name: '1 · Notas de la escala · clave de sol' },
    { id: 'alteradas', name: '2 · Con sostenidos y bemoles' },
    { id: 'fa', name: '3 · Clave de fa · bajos' },
    { id: 'reloj', name: '4 · Contrarreloj de 60 segundos' },
  ];
  $('#lLevel').innerHTML = LEVELS.map(l => `<option value="${l.id}">${l.name}</option>`).join('');

  function notePool(lv) {
    const L = App.L;
    if (lv === 'fa') {
      const pcs = [...new Set(L.bass.filter(b => b.type === 'bass').flatMap(b => [b.push, b.pull]))];
      return pcs.map(p => ({ midi: App.bassMidi(p), letter: Music.letterOf(p, 'mixed'), bass: true }));
    }
    const midis = [...new Set(L.treble.flatMap(b => [b.push, b.pull]))];
    if (lv === 'escala') {
      const key = L.rowKeys[1], rl = Music.letterOf(key, Music.rootPref(key, 'maj'));
      const steps = Music.SCALES.mayor.steps;
      return midis.filter(m => m >= L.lo && m <= L.hi + 3).flatMap(m => {
        const i = steps.indexOf(Music.pc(m - key));
        return i < 0 ? [] : [{ midi: m, letter: (rl + i) % 7 }];
      });
    }
    return midis.filter(m => m >= L.lo - 2 && m <= L.hi + 3)
      .map(m => ({ midi: m, letter: Music.letterOf(m, Math.random() < 0.5 ? 'sharp' : 'flat') }));
  }
  const noteLabel = t => Music.spell(t.letter, t.midi) + (t.bass ? '' : Music.octave(t.midi));
  const trebleRange = () => ({ treble: [App.L.lo - 2, App.L.hi + 3], bass: [App.bassMidi(4), App.bassMidi(3)] });

  const lectura = (() => {
    let on = false, target = null, failed = false, lock = false;
    let ok = 0, bad = 0, streak = 0, ends = 0, clock = null, nextT = null;
    const level = () => $('#lLevel').value;
    const msg = (h, c) => say($('#lMsg'), h, c);
    const label = noteLabel;

    const pool = () => notePool(level());

    // Dónde está la nota buscada: [{ b, dir }]
    function spots(t) {
      const L = App.L, out = [];
      const list = t.bass ? L.bass.filter(b => b.type === 'bass') : L.treble;
      list.forEach(b => ['push', 'pull'].forEach(d => {
        if (t.bass ? b[d] === Music.pc(t.midi) : b[d] === t.midi) out.push({ b, d });
      }));
      return out;
    }

    function draw(reveal) {
      const clef = (target ? target.bass : level() === 'fa') ? 'bass' : 'treble';
      const ev = target
        ? { notes: { [clef]: [target] }, cls: reveal || 'ink', lines: [reveal ? { t: label(target), cls: 'b ' + reveal } : ' '] }
        : { notes: {}, lines: [' '] };
      Staff.render($('#lStaff'), { staves: [clef], events: [ev], colW: 96, zoom: 1.5, range: trebleRange() });
    }

    function score() {
      $('#lOk').textContent = ok;
      $('#lBad').textContent = bad;
      $('#lStreak').textContent = streak;
    }

    function next() {
      clearTimeout(nextT);
      const all = pool();
      const choices = all.filter(t => !target || t.midi !== target.midi);
      target = pick(choices.length ? choices : all);
      failed = false;
      lock = false;
      App.clearHl(); App.setBellows(null); App.renderKeys();
      draw();
      msg(target.bass ? '¿Qué bajo es? Tócalo en los <b>bajos</b> (mano izquierda).'
        : '¿Qué nota es? Tócala en los <b>pitos</b> con la dirección correcta del fuelle.');
    }

    function showSpots() {
      App.clearHl();
      spots(target).forEach(({ b, d }) => App.addHl(target.bass ? S.bhl : S.hl, b.id, d));
      App.renderKeys();
    }

    function fail() {
      if (failed) return;
      failed = true;
      bad++;
      streak = 0;
      if (level() !== 'reloj') record('lectura:' + level(), false);
    }

    function key(b, dir, isBass) {
      if (!on || lock || !target) return;
      const right = target.bass
        ? isBass && b.type === 'bass' && b[dir] === Music.pc(target.midi)
        : !isBass && b[dir] === target.midi;
      if (right) {
        lock = true;
        if (!failed) {
          ok++;
          streak++;
          if (level() !== 'reloj') { record('lectura:' + level(), true); hit('lectura', level()); }
        }
        App.clearHl();
        App.addHl(isBass ? S.bhl : S.hl, b.id, dir);
        App.renderKeys();
        draw(dir);
        msg(`✔ ¡Bien! <b>${label(target)}</b> · ${App.refAny(b)} ${App.DIRS[dir].long.toLowerCase()}`, 'ok');
        nextT = setTimeout(next, level() === 'reloj' ? 450 : 1100);
      } else {
        fail();
        const what = isBass
          ? (b.type === 'bass' ? 'el bajo ' + Music.name(b[dir], S.tuning.pref) : 'un botón de acorde')
          : App.nnOct(b[dir]);
        if (target.bass && !isBass) msg('En este nivel se tocan los <b>bajos</b> (mano izquierda).', 'bad');
        else if (!target.bass && isBass) msg('Esta nota se toca en los <b>pitos</b> (mano derecha).', 'bad');
        else if (level() === 'reloj') {
          lock = true;
          draw('bad');
          showSpots();
          msg(`✘ Era <b>${label(target)}</b>`, 'bad');
          nextT = setTimeout(next, 900);
        } else msg(`✘ Tocaste <b>${what}</b> ${App.DIRS[dir].label.toLowerCase()}. Inténtalo otra vez o pide una 💡 pista.`, 'bad');
      }
      score();
    }

    function tick() {
      const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      $('#lTime').textContent = `· ⏱ ${left} s`;
      if (left > 0) return;
      stop();
      const best = recordScore('lectura:reloj', ok);
      hit('lectura', 'reloj', ok);
      target = null;
      draw();
      App.clearHl(); App.renderKeys();
      msg(`⏱ ¡Tiempo! Leíste <b>${ok}</b> notas bien${bad ? ` y fallaste ${bad}` : ''}. Tu récord: <b>${best}</b>.`, 'ok');
    }

    function start() {
      stop();
      on = true;
      ok = bad = streak = 0;
      target = null;
      score();
      if (level() === 'reloj') {
        ends = Date.now() + 60000;
        clock = setInterval(tick, 250);
        tick();
      } else $('#lTime').textContent = '';
      $('#lStart').textContent = '↺ Reiniciar';
      next();
    }

    function stop() {
      clearInterval(clock);
      clearTimeout(nextT);
      clock = null;
      on = false;
      $('#lStart').textContent = '▶ Empezar';
    }

    $('#lStart').addEventListener('click', start);
    $('#lLevel').addEventListener('change', () => { stop(); target = null; draw(); $('#lTime').textContent = ''; });
    $('#lHint').addEventListener('click', () => {
      if (!on || !target) return;
      fail();
      score();
      showSpots();
      msg(`💡 Es <b>${label(target)}</b>: mira los botones resaltados (arriba = cerrando, abajo = abriendo).`);
    });
    $('#lSkip').addEventListener('click', () => {
      if (!on) return;
      fail();
      score();
      next();
    });
    $('#lHide').addEventListener('change', e => { S.hideNames = e.target.checked; App.renderKeys(); });

    return { key, stop, show: () => draw() };
  })();

  /* ================= 3 · Oído ================= */
  const IVS = [
    { n: '3ª menor', s: 3, l: 2 }, { n: '3ª mayor', s: 4, l: 2 }, { n: '4ª justa', s: 5, l: 3 }, { n: '5ª justa', s: 7, l: 4 },
    { n: '6ª menor', s: 8, l: 5 }, { n: '6ª mayor', s: 9, l: 5 }, { n: 'Octava', s: 12, l: 7 }, { n: '10ª mayor', s: 16, l: 9 },
  ];
  const IVS_HARD = [
    { n: '2ª menor', s: 1, l: 1 }, { n: '2ª mayor', s: 2, l: 1 }, { n: 'Tritono', s: 6, l: 3 },
    { n: '7ª menor', s: 10, l: 6 }, { n: '7ª mayor', s: 11, l: 6 }, { n: '10ª menor', s: 15, l: 9 },
  ];
  const CHS = [
    { n: 'Mayor', iv: [0, 4, 7] }, { n: 'Menor', iv: [0, 3, 7] }, { n: 'Séptima (dominante)', iv: [0, 4, 7, 10] },
  ];
  const CHS_HARD = [
    { n: 'Disminuido', iv: [0, 3, 6] }, { n: 'Aumentado', iv: [0, 4, 8] }, { n: 'Menor con séptima', iv: [0, 3, 7, 10] },
  ];

  const oido = (() => {
    let q = null, answered = false, ok = 0, bad = 0, streak = 0, timers = [];
    let pos = 0, mistakes = 0;  // dictado: nota que toca ahora y errores
    const msg = (h, c) => say($('#oMsg'), h, c);
    const type = () => $('#oType').value;
    const hard = () => $('#oHard').checked;
    const nm = m => App.nnOct(m);
    // Nombre de una nota escrita «l» letras por encima de la raíz (Do# + 10ª mayor = Mi#)
    const above = (root, semis, l) => {
      const rl = Music.letterOf(root, Music.rootPref(root, 'maj'));
      const m = root + semis, letter = (rl + l) % 7;
      const p = Music.staffPos(m, letter);
      return Music.spell(letter, m) + (Math.floor(p.step / 7));
    };

    function silence() {
      timers.forEach(clearTimeout);
      timers = [];
      Sound.cut();
    }

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function question() {
      const L = App.L, t = type();
      if (t === 'notas') {
        const key = L.rowKeys[1];
        let tonic = 60 + key;
        if (tonic > 66) tonic -= 12;
        let opts;
        if (hard()) {
          opts = Array.from({ length: 12 }, (_, i) => ({ n: Music.name(key + i, S.tuning.pref), m: tonic + i }));
        } else {
          const rl = Music.letterOf(key, Music.rootPref(key, 'maj'));
          opts = Music.SCALES.mayor.steps.map((s, i) => ({ n: Music.spell((rl + i) % 7, key + s), m: tonic + s }));
        }
        const ans = rand(0, opts.length - 1);
        const playNote = m => { const t0 = Sound.now() + 0.05; Sound.treble([tonic], 0.6, t0); Sound.treble([m], 0.9, t0 + 0.85); };
        return {
          intro: `Primero suena la tónica <b>${Music.keyName(key, 'maj').replace(' mayor', '')}</b> y después la nota misteriosa.`,
          opts: opts.map(o => o.n), ans,
          play: () => playNote(opts[ans].m),
          playOpt: i => playNote(opts[i].m),
          explain: `Era <b>${opts[ans].n}</b> (${nm(opts[ans].m)}).`,
          show: () => {
            App.clearHl();
            L.treble.forEach(b => ['push', 'pull'].forEach(d => {
              if (Music.pc(b[d]) === Music.pc(opts[ans].m)) App.addHl(S.hl, b.id, d);
            }));
            App.renderKeys();
          },
        };
      }
      if (t === 'dictado') {
        const key = L.rowKeys[1];
        let tonic = 60 + key;
        if (tonic > 66) tonic -= 12;
        const rl = Music.letterOf(key, Music.rootPref(key, 'maj'));
        const steps = Music.SCALES.mayor.steps;
        const wrap = d => ((d % 7) + 7) % 7;
        const deg = d => tonic + 12 * Math.floor(d / 7) + steps[wrap(d)];
        const exists = m => L.treble.some(b => b.push === m || b.pull === m);
        const len = hard() ? 5 : 3, low = hard() ? -3 : 0;
        // Melodía por grados vecinos (pasos y saltos de tercera), empezando en la tónica
        const ds = [0];
        while (ds.length < len) {
          const prev = ds[ds.length - 1];
          const opts = [-2, -1, 1, 2].map(x => prev + x).filter(d => d >= low && d <= 7 && exists(deg(d)));
          ds.push(opts.length ? pick(opts) : prev);
        }
        const notes = ds.map(d => ({ midi: deg(d), name: Music.spell((rl + wrap(d)) % 7, deg(d)) }));
        return {
          dictation: notes,
          intro: `Suena el acorde de <b>${notes[0].name}</b> y luego una melodía de ${len} notas que empieza en <b>${notes[0].name}</b>.
            Repítela tocando los <b>pitos</b> del acordeón de la pantalla (mitad de arriba = cerrando, abajo = abriendo).`,
          play: () => {
            const t0 = Sound.now() + 0.05;
            Sound.treble([tonic, tonic + 4, tonic + 7], 0.7, t0);
            notes.forEach((n, k) => Sound.treble([n.midi], 0.5, t0 + 1.1 + k * 0.6));
          },
        };
      }
      if (t === 'intervalos') {
        const list = (hard() ? [...IVS, ...IVS_HARD] : IVS).sort((a, b) => a.s - b.s);
        const ans = rand(0, list.length - 1), root = rand(55, 67);
        const playIv = s => {
          const t0 = Sound.now() + 0.05;
          Sound.treble([root], 0.6, t0);
          Sound.treble([root + s], 0.6, t0 + 0.75);
          Sound.treble([root, root + s], 1.1, t0 + 1.6);
        };
        return {
          intro: 'Suenan dos notas por separado y luego juntas. ¿Qué intervalo es?',
          opts: list.map(o => o.n), ans,
          play: () => playIv(list[ans].s),
          playOpt: i => playIv(list[i].s),
          explain: `Era una <b>${list[ans].n}</b>: ${above(root, 0, 0)} – ${above(root, list[ans].s, list[ans].l)}.`,
        };
      }
      if (t === 'acordes') {
        const list = hard() ? [...CHS, ...CHS_HARD] : CHS;
        const ans = rand(0, list.length - 1), root = rand(55, 64);
        const playCh = iv => {
          const t0 = Sound.now() + 0.05, ms = iv.map(i => root + i);
          Sound.treble(ms, 1.1, t0);
          ms.forEach((m, k) => Sound.treble([m], 0.3, t0 + 1.4 + k * 0.32));
        };
        return {
          intro: 'Suena un acorde y después sus notas una por una. ¿Qué tipo de acorde es?',
          opts: list.map(o => o.n), ans,
          play: () => playCh(list[ans].iv),
          playOpt: i => playCh(list[i].iv),
          explain: `Era un acorde <b>${list[ans].n.toLowerCase()}</b>: ${list[ans].iv.map((i, k) => above(root, i, 2 * k)).join(' – ')}.`,
        };
      }
      // Círculos armónicos en el tono de la hilera del medio (y su relativa menor en «más difícil»)
      const key = L.rowKeys[1];
      const list = Music.CIRCLES.maj.map((c, i) => ({ c, i, p: key, mode: 'maj' }));
      if (hard()) Music.CIRCLES.min.forEach((c, i) => list.push({ c, i, p: (key + 9) % 12, mode: 'min' }));
      const ans = rand(0, list.length - 1);
      const playCirc = o => {
        const chords = App.circleChords(o.p, o.mode, o.c.degrees);
        [...chords, chords[0]].forEach((ch, k) => later(() => App.playChord(ch, 480), k * 960));
      };
      const label = o => `${o.c.name} · ${Music.keyName(o.p, o.mode)}`;
      return {
        intro: 'Escucha la vuelta completa de acordes (termina en el acorde de inicio). ¿Qué círculo es?',
        opts: list.map(label), ans,
        play: () => playCirc(list[ans]),
        playOpt: i => { silence(); playCirc(list[i]); },
        explain: `Era <b>${label(list[ans])}</b>. <button id="oSee">Verlo en Círculos armónicos</button>`,
        after: () => {
          $('#oSee').onclick = () => {
            const o = list[ans];
            const k = $('#cKey');
            k.value = `${o.p}:${o.mode}`;
            k.dispatchEvent(new Event('change'));
            $('#cType').value = String(o.i);
            $('#cType').dispatchEvent(new Event('change'));
            App.tabOpen('circles');
          };
        },
      };
    }

    function score() {
      $('#oOk').textContent = ok;
      $('#oBad').textContent = bad;
      $('#oStreak').textContent = streak;
    }

    function ask() {
      silence();
      App.clearHl(); App.renderKeys();
      q = question();
      answered = false;
      msg(q.intro);
      pos = mistakes = 0;
      $('#oAnswers').innerHTML = q.dictation
        ? q.dictation.map((n, i) => `<span class="bub${i ? '' : ' now'}">${i + 1}</span>`).join('')
        : q.opts.map((o, i) => `<button class="ans" data-i="${i}">${o}</button>`).join('');
      q.play();
    }

    function answer(i) {
      if (!q || q.dictation) return;
      if (answered) { silence(); q.playOpt(i); return; }  // ya respondida: escuchar para comparar
      answered = true;
      const right = i === q.ans;
      record(`oido:${type()}${hard() ? '+' : ''}`, right);
      if (right) { ok++; streak++; hit('oido', type()); } else { bad++; streak = 0; }
      score();
      $$('#oAnswers .ans').forEach(b => {
        const k = +b.dataset.i;
        b.classList.toggle('right', k === q.ans);
        b.classList.toggle('wrong', k === i && !right);
      });
      msg(`${right ? '✔ ¡Correcto!' : '✘ No era esa.'} ${q.explain}
        <div class="note">Toca cualquier respuesta para escucharla y comparar.</div>`, right ? 'ok' : 'bad');
      if (q.show) q.show();
      if (q.after) q.after();
    }

    // Dictado: cada pito tocado se compara con la nota que sigue de la melodía
    function key(b, dir, isBass) {
      if (!q || !q.dictation || answered) return;
      if (isBass) { msg('El dictado se toca en los <b>pitos</b> (mano derecha).', 'bad'); return; }
      const want = q.dictation[pos], got = b[dir], bubs = $$('#oAnswers .bub');
      if (got !== want.midi) {
        mistakes++;
        bubs[pos].classList.add('err');
        msg(Music.pc(got) === Music.pc(want.midi)
          ? `Casi: es esa nota pero en otra octava (tocaste ${nm(got)}). Busca la que suena más ${got > want.midi ? 'grave' : 'aguda'}.`
          : `✘ Tocaste ${nm(got)}. Pulsa 🔁 Repetir para escuchar otra vez.`, 'bad');
        return;
      }
      bubs[pos].className = 'bub done';
      bubs[pos].textContent = want.name;
      pos++;
      if (pos < q.dictation.length) {
        bubs[pos].classList.add('now');
        msg(`✔ Bien. Ahora la nota ${pos + 1} de ${q.dictation.length}.`, 'ok');
        return;
      }
      answered = true;
      const right = mistakes === 0;
      record(`oido:dictado${hard() ? '+' : ''}`, right);
      if (right) { ok++; streak++; hit('oido', 'dictado'); } else { bad++; streak = 0; }
      score();
      msg(right ? '✔ ¡Perfecto! Repetiste toda la melodía sin errores.'
        : `✔ Completaste la melodía con ${mistakes} error${mistakes > 1 ? 'es' : ''}. Para que cuente, hazla sin errores.`, right ? 'ok' : 'bad');
    }

    $('#oPlay').addEventListener('click', ask);
    $('#oRepeat').addEventListener('click', () => { if (q) { silence(); q.play(); } });
    $('#oAnswers').addEventListener('click', e => {
      const b = e.target.closest('.ans');
      if (b) answer(+b.dataset.i);
    });
    const reset = () => { silence(); q = null; $('#oAnswers').innerHTML = ''; msg('Pulsa «Nueva pregunta» y escucha.'); };
    $('#oType').addEventListener('change', reset);
    $('#oHard').addEventListener('change', reset);

    return { key, stop: () => { timers.forEach(clearTimeout); timers = []; } };
  })();

  /* ================= 4 · Ritmo ================= */
  // Figuras: r redonda, b blanca, bp blanca con puntillo, n negra, np negra con puntillo,
  // c corchea, cp corchea con puntillo, s semicorchea, t corchea de tresillo. «-» = silencio. «B:»/«A:» = bajo/acorde.
  const FIG = { r: 4, bp: 3, b: 2, np: 1.5, n: 1, cp: 0.75, c: 0.5, s: 0.25, t: 1 / 3 };
  const parse = seq => seq.split(/\s+/).filter(x => x && x !== '|').map(tok => {
    let k = null;
    if (/^[BA]:/.test(tok)) { k = tok[0]; tok = tok.slice(2); }
    const rest = tok[0] === '-';
    return { d: FIG[rest ? tok.slice(1) : tok], rest, k };
  });
  const rep = (s, n) => Array(n).fill(s).join(' | ');

  const LESSONS = [
    { id: 'redondas', name: 'Redondas y blancas', meter: [4, 4], tempo: 80, seq: 'r | b b | b b | r' },
    { id: 'negras', name: 'Negras y silencios', meter: [4, 4], tempo: 90, seq: 'n n n n | n -n n -n | n n b | n -n b' },
    { id: 'corcheas', name: 'Corcheas', meter: [4, 4], tempo: 80, seq: 'c c n c c n | c c c c b | n c c n c c | c c c c n -n' },
    { id: 'puntillo', name: 'Puntillo', meter: [4, 4], tempo: 80, seq: 'np c np c | bp n | np c n n | b b' },
    { id: 'semicorcheas', name: 'Semicorcheas', meter: [4, 4], tempo: 66, seq: 's s s s n s s s s n | c s s c s s b | cp s cp s n n | s s s s s s s s b' },
    { id: 'tresillos', name: 'Tresillos', meter: [4, 4], tempo: 70, seq: 't t t n t t t n | t t t t t t b | n t t t n t t t | t t t n b' },
    { id: 'sincopa', name: 'Síncopa', meter: [4, 4], tempo: 85, seq: 'c n c n n | c n c b | c n n c n | c n c b' },
    { id: 'paseo', name: 'Vallenato · Paseo', meter: [2, 4], tempo: 100, vallenato: true,
      seq: rep('B:n A:c A:c', 3) + ' | B:n A:n',
      info: 'Paseo: el bajo marca el primer tiempo y el acorde responde en corcheas. Aire tranquilo, para cantar.' },
    { id: 'merengue', name: 'Vallenato · Merengue', meter: [6, 8], tempo: 66, vallenato: true,
      seq: rep('B:c A:c A:c B:c A:c A:c', 4),
      info: 'Merengue: compás de 6/8, dos grupos de tres corcheas (bajo-acorde-acorde) en cada compás.' },
    { id: 'son', name: 'Vallenato · Son', meter: [2, 4], tempo: 76, vallenato: true,
      seq: rep('B:cp A:s B:c A:c', 4),
      info: 'Son: lento y pesado; el bajo se arrastra con puntillo antes del acorde.' },
    { id: 'puya', name: 'Vallenato · Puya', meter: [2, 4], tempo: 140, vallenato: true,
      seq: rep('B:c A:c B:c A:c', 4),
      info: 'Puya: el aire más rápido; bajo y acorde se alternan sin parar.' },
  ];
  LESSONS.forEach(l => { l.items = parse(l.seq); });
  $('#rLesson').innerHTML = `<optgroup label="Figuras">${LESSONS.filter(l => !l.vallenato).map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</optgroup>
    <optgroup label="Aires vallenatos (bajos, simplificados)">${LESSONS.filter(l => l.vallenato).map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</optgroup>`;

  const ritmo = (() => {
    let run = null, raf = 0;
    const lesson = () => LESSONS.find(l => l.id === $('#rLesson').value);
    const msg = (h, c) => say($('#rMsg'), h, c);

    function draw(marks = [], cur = -1) {
      const l = lesson();
      Staff.rhythm($('#rStaff'), { items: l.items, meter: l.meter, marks, cur });
    }

    function show() {
      const l = lesson();
      $('#rInfo').innerHTML = (l.info ? l.info + ' ' : '')
        + (l.vallenato ? '<b>B</b> = bajo (mano izquierda, fila interna) · <b>A</b> = acorde. ' : '')
        + `Compás de ${l.meter.join('/')}${l.meter[1] === 8 ? ' (el metrónomo marca cada negra con puntillo)' : ''}.`;
      draw();
    }

    function setLesson() {
      stop();
      const t = lesson().tempo;
      $('#rTempo').value = t;
      $('#rTempoOut').textContent = t;
      show();
      msg('Pulsa «Escuchar» para oír el ritmo o «Practicar» para tocarlo tú.');
    }

    function stop() {
      if (!run) return;
      cancelAnimationFrame(raf);
      clearTimeout(run.endT);
      Sound.cut();
      run = null;
      $('#rPractice').textContent = '🥁 Practicar';
      $('#rListen').textContent = '🔊 Escuchar';
      Staff.markRhythm($('#rStaff'), -1);
    }

    function go(practice) {
      if (run) { const was = run.practice; stop(); if (was === practice) return; }
      if (document.activeElement) document.activeElement.blur();  // que la barra espaciadora no pulse botones
      const l = lesson(), [num, den] = l.meter;
      const beatQ = den === 8 ? 1.5 : 1, barQ = num * 4 / den;
      const qSec = 60 / +$('#rTempo').value / beatQ;
      const t0 = Sound.now() + 0.25, lead = barQ * qSec;  // un compás de entrada
      let t = 0;
      const onsets = l.items.map(it => { const o = t; t += it.d; return o; });
      const total = t;
      // Metrónomo: entrada + todo el ejercicio
      for (let q = 0; q <= barQ + total + 1e-6; q += beatQ) {
        const inBar = Math.abs((q / barQ) - Math.round(q / barQ)) < 1e-6;
        Sound.click(inBar, t0 + q * qSec);
      }
      const key = App.L.rowKeys[1];
      let bassN = 0;
      if (!practice || $('#rGuide').checked) {
        l.items.forEach((it, i) => {
          if (it.rest) return;
          const at = t0 + lead + onsets[i] * qSec, dur = Math.min(0.9, it.d * qSec * 0.85);
          if (it.k === 'B') Sound.bass(App.bassMidi(bassN++ % 2 ? key + 7 : key), dur, at);
          else if (it.k === 'A') Sound.bassChord(App.bassChordMidis(key), dur * 0.8, at);
          else Sound.treble([60 + key], dur, at);
        });
      }
      run = { practice, t0, lead, qSec, onsets, taps: [], beatQ, barQ };
      (practice ? $('#rPractice') : $('#rListen')).textContent = '■ Detener';
      draw();
      msg(practice ? 'Escucha el compás de entrada y empieza a tocar en el siguiente «1».' : 'Escuchando…');

      const lat = Sound.latency();
      const frame = () => {
        if (!run) return;
        const now = Sound.now() - lat - t0;
        if (now < lead) {
          const beat = Math.floor(Math.max(0, now) / (beatQ * qSec)) + 1;
          if (practice) msg(`Entrada: <span class="count">${beat}</span> de ${Math.round(barQ / beatQ)}`);
        } else {
          let i = -1;
          onsets.forEach((o, k) => { if (now - lead >= o - 1e-6) i = k; });
          Staff.markRhythm($('#rStaff'), i);
          if (practice && run.taps.length === 0 && now - lead < 0.4) msg('¡Ahora! Toca 🥁');
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      run.endT = setTimeout(() => {
        const r = run;
        stop();
        if (practice) grade(r);
        else msg('Listo. Ahora pulsa «Practicar» y tócalo tú.');
      }, (0.25 + lead + total * qSec + 0.6) * 1000);
    }

    function tap() {
      if (!run || !run.practice) return;
      run.taps.push(Sound.now());
      const pad = $('#rTap');
      pad.classList.remove('hit');
      void pad.offsetWidth;
      pad.classList.add('hit');
    }

    function grade(r) {
      const l = lesson(), lat = Sound.latency();
      const exp = l.items.map((it, i) => ({ i, t: r.t0 + r.lead + r.onsets[i] * r.qSec + lat })).filter(e => !l.items[e.i].rest);
      const used = new Set(), marks = [];
      let ok = 0, meh = 0, off = 0, miss = 0;
      const diffs = [];
      exp.forEach((e, k) => {
        // Ventana: la mitad de la distancia a la nota vecina (máximo 0,25 s)
        const gapPrev = k ? e.t - exp[k - 1].t : 1, gapNext = k < exp.length - 1 ? exp[k + 1].t - e.t : 1;
        const win = Math.min(0.25, gapPrev / 2, gapNext / 2);
        let best = -1;
        r.taps.forEach((tp, j) => {
          if (used.has(j) || Math.abs(tp - e.t) > win) return;
          if (best < 0 || Math.abs(tp - e.t) < Math.abs(r.taps[best] - e.t)) best = j;
        });
        if (best < 0) { marks[e.i] = 'miss'; miss++; return; }
        used.add(best);
        const dt = r.taps[best] - e.t;
        diffs.push(dt);
        if (Math.abs(dt) <= 0.06) { marks[e.i] = 'ok'; ok++; } else if (Math.abs(dt) <= 0.12) { marks[e.i] = 'meh'; meh++; } else { marks[e.i] = 'bad'; off++; }
      });
      const extra = r.taps.length - used.size;
      const pts = Math.max(0, Math.min(100, Math.round(100 * (ok + 0.6 * meh + 0.25 * off) / exp.length - extra * 4)));
      const best = recordScore('ritmo:' + l.id, pts);
      hit('ritmo', l.id, pts);
      draw(marks);
      const avg = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length * 1000 : 0;
      const lean = Math.abs(avg) < 15 ? 'Vas bien centrado con el pulso.'
        : avg < 0 ? `Tiendes a adelantarte (${Math.round(-avg)} ms en promedio).` : `Tiendes a atrasarte (${Math.round(avg)} ms en promedio).`;
      const face = pts >= 90 ? '🏆' : pts >= 70 ? '👏' : pts >= 40 ? '💪' : '🔁';
      msg(`${face} <b>${pts} / 100</b> · récord ${best}<br>
        <span class="mk ok">●</span> ${ok} a tiempo · <span class="mk meh">●</span> ${meh} casi · <span class="mk bad">●</span> ${off} fuera de tiempo ·
        <span class="mk miss">●</span> ${miss} sin tocar${extra ? ` · ${extra} golpes de más` : ''}<br>${diffs.length ? lean : ''}
        ${pts < 70 ? ' Prueba bajando el tempo.' : ''}`, pts >= 70 ? 'ok' : 'bad');
    }

    $('#rLesson').addEventListener('change', setLesson);
    $('#rTempo').addEventListener('input', e => { $('#rTempoOut').textContent = e.target.value; });
    $('#rListen').addEventListener('click', () => go(false));
    $('#rPractice').addEventListener('click', () => go(true));
    $('#rTap').addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
    document.addEventListener('keydown', e => {
      if (S.tab !== 'solfeo' || mode !== 'ritmo' || e.code !== 'Space' || e.repeat) return;
      if (/SELECT|INPUT/.test(e.target.tagName)) return;
      e.preventDefault();
      tap();
    });

    setLesson();
    return { tap, stop, show };
  })();

  /* ================= Oído del micrófono (compartido por Micrófono y Cantar) ================= */
  const ear = (() => {
    let stream = null, actx = null, an = null, buf = null, timer = null;

    // onPitch recibe { m: nota MIDI redondeada, mf: nota exacta, cents } o null si hay silencio
    async function start(onPitch) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        return 'Este navegador no deja usar el micrófono aquí. Abre la app en Chrome desde su dirección https.';
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } catch {
        stream = null;
        return 'No pude usar el micrófono. Revisa que Chrome tenga permiso: toca el ícono a la izquierda de la dirección y permite «Micrófono».';
      }
      actx = new (window.AudioContext || window.webkitAudioContext)();
      an = actx.createAnalyser();
      an.fftSize = 2048;
      actx.createMediaStreamSource(stream).connect(an);
      buf = new Float32Array(an.fftSize);
      timer = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const f = Sound.detectPitch(buf, actx.sampleRate);
        if (f <= 0) { onPitch(null); return; }
        const mf = 69 + 12 * Math.log2(f / 440), m = Math.round(mf);
        onPitch({ m, mf, cents: Math.round((mf - m) * 100) });
      }, 60);
      return null;
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (actx) actx.close();
      stream = actx = an = null;
    }

    return { start, stop, get on() { return !!stream; } };
  })();

  // Afinador en pantalla: p = prefijo de los elementos (mNote, mNeedle, mCents…)
  function meter(p, pitch, label) {
    const note = $(`#${p}Note`), needle = $(`#${p}Needle`), cents = $(`#${p}Cents`);
    if (pitch === undefined) {
      note.textContent = '—';
      note.classList.add('dim');
      cents.textContent = ear.on ? 'Escuchando…' : 'Micrófono apagado';
      needle.style.left = '50%';
      needle.className = '';
      return;
    }
    if (!pitch) { note.classList.add('dim'); return; }
    note.classList.remove('dim');
    note.textContent = label || App.nnOct(pitch.m);
    needle.style.left = `${50 + pitch.cents}%`;
    needle.className = Math.abs(pitch.cents) <= 12 ? 'in' : '';
    cents.textContent = pitch.cents ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents} cents` : 'afinado';
  }

  /* ================= Micrófono: tu acordeón real ================= */
  const mic = (() => {
    let nextT = null, target = null, last = null, stable = 0, lock = false, ok = 0, streak = 0;
    const level = () => $('#mLevel').value;
    const msg = (h, c) => say($('#mMsg'), h, c);

    function draw(reveal) {
      const ev = target
        ? { notes: { treble: [target] }, cls: reveal || 'ink', lines: [reveal ? { t: noteLabel(target), cls: 'b' } : ' '] }
        : { notes: {}, lines: [' '] };
      Staff.render($('#mStaff'), { staves: ['treble'], events: [ev], colW: 96, zoom: 1.5, range: trebleRange() });
    }

    function score() {
      $('#mOk').textContent = ok;
      $('#mStreak').textContent = streak;
    }

    function next() {
      clearTimeout(nextT);
      lock = false;
      if (level() === 'libre') {
        target = null;
        draw();
        msg(ear.on ? 'Modo libre: toca cualquier nota y te muestro cuál es y en qué botones está.'
          : 'Activa el micrófono y toca cualquier nota en tu acordeón.');
        return;
      }
      const all = notePool(level());
      const choices = all.filter(t => !target || t.midi !== target.midi);
      target = pick(choices.length ? choices : all);
      draw();
      msg(ear.on ? 'Toca esta nota en <b>tu acordeón</b> y mantenla sonando.' : 'Pulsa «Activar micrófono» para empezar.');
    }

    async function toggle() {
      if (ear.on) { off(); return; }
      const err = await ear.start(listen);
      if (err) { msg(err, 'bad'); return; }
      $('#mOn').textContent = '■ Apagar micrófono';
      meter('m');
      next();
    }

    function off() {
      clearTimeout(nextT);
      ear.stop();
      $('#mOn').textContent = '🎤 Activar micrófono';
      meter('m');
    }

    function listen(p) {
      meter('m', p);
      if (!p) { stable = 0; last = null; return; }
      const m = p.m;
      stable = m === last ? stable + 1 : 1;
      last = m;
      if (stable !== 4) return;  // la misma nota durante un cuarto de segundo

      // Dónde está la nota que suena, en los pitos de la pantalla
      App.clearHl();
      App.L.treble.forEach(b => ['push', 'pull'].forEach(d => { if (b[d] === m) App.addHl(S.hl, b.id, d); }));
      App.renderKeys();
      if (!target || lock) return;
      if (Music.pc(m) === Music.pc(target.midi)) {
        lock = true;
        ok++;
        streak++;
        record('mic:' + level(), true);
        hit('mic', level());
        score();
        draw('ok');
        msg(m === target.midi ? `✔ ¡Bien! <b>${noteLabel(target)}</b>`
          : `✔ ¡Bien! Es ${Music.spell(target.letter, target.midi)} (el micrófono la oyó en otra octava: ${App.nnOct(m)}).`, 'ok');
        nextT = setTimeout(next, 1300);
      } else msg(`Suena <b>${App.nnOct(m)}</b>. Buscamos <b>${noteLabel(target)}</b>.`, 'bad');
    }

    $('#mOn').addEventListener('click', toggle);
    $('#mLevel').addEventListener('change', next);
    $('#mSkip').addEventListener('click', () => {
      if (target && !lock) { record('mic:' + level(), false); streak = 0; score(); }
      next();
    });

    return { stop: off, show: () => { meter('m'); next(); } };
  })();

  /* ================= Cantar: solfeo entonado con la voz ================= */
  const canto = (() => {
    let seq = [], pos = 0, stable = 0, lock = true, quietUntil = 0, ok = 0, done = 0, nextT = null;
    const ex = () => $('#vEx').value;
    const low = () => $('#vVoice').value === 'grave';
    const help = () => $('#vHelp').checked;
    const msg = (h, c) => say($('#vMsg'), h, c);

    // Tónica en la tesitura elegida: voz grave alrededor de Do3, voz aguda alrededor de Do4
    function tonic() {
      const key = App.L.rowKeys[1];
      return (low() ? 48 : 60) + key - (key >= 8 ? 12 : 0);
    }
    function scaleNote(d) {
      const key = App.L.rowKeys[1], rl = Music.letterOf(key, Music.rootPref(key, 'maj'));
      const steps = Music.SCALES.mayor.steps, w = ((d % 7) + 7) % 7;
      const midi = tonic() + 12 * Math.floor(d / 7) + steps[w];
      return { midi, letter: (rl + w) % 7, name: Music.spell((rl + w) % 7, midi) };
    }

    function build() {
      const e = ex();
      if (e === 'escala') return [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0].map(scaleNote);
      if (e === 'nota') return [scaleNote(rand(1, 7))];
      // Melodía corta por grados vecinos, empezando en la tónica
      const ds = [0];
      while (ds.length < 5) {
        const prev = ds[ds.length - 1];
        ds.push(pick([-2, -1, 1, 2].map(x => prev + x).filter(d => d >= 0 && d <= 7)));
      }
      return ds.map(scaleNote);
    }

    function draw() {
      const clef = low() ? 'bass' : 'treble';
      const events = seq.map((n, i) => ({
        notes: { [clef]: [n] },
        cls: i < pos ? 'ok' : 'ink',
        lines: [{ t: n.name, cls: i < pos ? 'b push' : 'b' }],
      }));
      Staff.render($('#vStaff'), { staves: [clef], events, colW: seq.length > 8 ? 44 : 64, zoom: 1.25, cur: pos < seq.length ? pos : -1 });
      $('#vNow').innerHTML = pos < seq.length ? `Canta: <b>${seq[pos].name}</b>` : '🎉';
    }

    // Toca notas como guía y no escucha el micrófono mientras suenan (para no oírse a sí misma)
    function play(midis, gap = 0.75, chordFirst = false) {
      let t0 = Sound.now() + 0.05, total = 0;
      const tn = tonic();
      if (chordFirst) { Sound.treble([tn, tn + 4, tn + 7], 0.8, t0); t0 += 1.1; total += 1.1; }
      midis.forEach((m, k) => Sound.treble([m], gap * 0.85, t0 + k * gap));
      total += midis.length * gap;
      quietUntil = performance.now() + (total + 0.35) * 1000;
    }

    function cue() {
      if (pos >= seq.length) return;
      if (help()) play([seq[pos].midi]);
    }

    function start() {
      clearTimeout(nextT);
      seq = build();
      pos = 0;
      stable = 0;
      lock = false;
      draw();
      const what = ex() === 'escala' ? 'la escala subiendo y bajando' : ex() === 'nota' ? 'la nota' : 'la melodía';
      msg(`Escucha el tono y canta ${what} diciendo el nombre de cada nota. ${ear.on ? '' : '<b>Activa el micrófono.</b>'}`);
      // Primero el acorde de la tonalidad para orientar el oído
      play(help() ? [seq[0].midi] : [], 0.75, true);
    }

    async function toggle() {
      if (ear.on) { off(); return; }
      const err = await ear.start(listen);
      if (err) { msg(err, 'bad'); return; }
      $('#vOn').textContent = '■ Apagar micrófono';
      meter('v');
      if (!seq.length || pos >= seq.length) start();
    }

    function off() {
      clearTimeout(nextT);
      ear.stop();
      $('#vOn').textContent = '🎤 Activar micrófono';
      meter('v');
    }

    function listen(p) {
      if (performance.now() < quietUntil) return;
      if (!p) { meter('v', null); stable = 0; return; }
      meter('v', p, App.nn(p.m));
      if (lock || pos >= seq.length) return;
      // Distancia en semitonos a la nota buscada, en la octava más cercana (cada voz canta en su altura)
      let d = (seq[pos].midi - p.mf) % 12;
      if (d > 6) d -= 12;
      if (d < -6) d += 12;
      if (Math.abs(d) <= 0.4) {
        if (++stable < 5) return;  // sostenida un tercio de segundo
        stable = 0;
        ok++;
        pos++;
        $('#vOk').textContent = ok;
        draw();
        if (pos < seq.length) {
          msg(`✔ ¡Bien! Ahora <b>${seq[pos].name}</b>.`, 'ok');
          nextT = setTimeout(cue, 250);
          return;
        }
        lock = true;
        done++;
        $('#vDone').textContent = done;
        record('canto:' + ex(), true);
        hit('canto', ex());
        msg(`🎉 ¡Muy bien! Cantaste ${seq.length > 1 ? 'todas las notas' : 'la nota'} afinado. Pulsa «Nuevo» para otro.`, 'ok');
        return;
      }
      stable = 0;
      const far = Math.abs(d) >= 1.5;
      msg(`Cantas <b>${App.nn(p.m)}</b>, buscamos <b>${seq[pos].name}</b>: ${d > 0 ? '⬆ sube' : '⬇ baja'} ${far ? 'la voz' : 'un poquito'}.`, 'bad');
    }

    $('#vOn').addEventListener('click', toggle);
    $('#vNew').addEventListener('click', start);
    $('#vHear').addEventListener('click', () => {
      if (!seq.length) start();
      else play(seq.slice(pos).map(n => n.midi), 0.6);
    });
    $('#vTone').addEventListener('click', () => play([], 0, true));
    ['#vEx', '#vVoice'].forEach(id => $(id).addEventListener('change', start));

    return { stop: off, show: () => { meter('v'); if (!seq.length) start(); else draw(); } };
  })();

  /* ================= Camino guiado: pasos que se desbloquean ================= */
  // kind/key = qué ejercicio cuenta; need = aciertos necesarios; score = puntuación mínima
  const STEPS = [
    { t: 'Leer las notas de la escala', d: '10 aciertos en Lectura, nivel 1', mode: 'lectura', set: { lLevel: 'escala' }, kind: 'lectura', key: 'escala', need: 10 },
    { t: 'Alegre o triste', d: '5 aciertos en Oído · Acordes', mode: 'oido', set: { oType: 'acordes', oHard: false }, kind: 'oido', key: 'acordes', need: 5 },
    { t: 'Canta una nota', d: '5 notas afinadas en Cantar', mode: 'canto', set: { vEx: 'nota' }, kind: 'canto', key: 'nota', need: 5 },
    { t: 'Redondas y blancas', d: '80 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'redondas' }, kind: 'ritmo', key: 'redondas', score: 80 },
    { t: 'Canta la escala', d: 'La escala completa afinada en Cantar', mode: 'canto', set: { vEx: 'escala' }, kind: 'canto', key: 'escala', need: 1 },
    { t: 'Negras y silencios', d: '80 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'negras' }, kind: 'ritmo', key: 'negras', score: 80 },
    { t: 'Las notas de oído', d: '7 aciertos en Oído · Notas', mode: 'oido', set: { oType: 'notas', oHard: false }, kind: 'oido', key: 'notas', need: 7 },
    { t: 'Primer dictado', d: '3 melodías sin errores en Oído · Dictado', mode: 'oido', set: { oType: 'dictado', oHard: false }, kind: 'oido', key: 'dictado', need: 3 },
    { t: 'Tu acordeón de verdad', d: '8 notas con el Micrófono', mode: 'mic', set: { mLevel: 'escala' }, kind: 'mic', key: 'escala', need: 8 },
    { t: 'Lee y canta', d: '3 melodías cantadas en Cantar', mode: 'canto', set: { vEx: 'melodia' }, kind: 'canto', key: 'melodia', need: 3 },
    { t: 'Sostenidos y bemoles', d: '10 aciertos en Lectura, nivel 2', mode: 'lectura', set: { lLevel: 'alteradas' }, kind: 'lectura', key: 'alteradas', need: 10 },
    { t: 'Corcheas', d: '80 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'corcheas' }, kind: 'ritmo', key: 'corcheas', score: 80 },
    { t: 'Terceras, sextas y décimas', d: '6 aciertos en Oído · Intervalos', mode: 'oido', set: { oType: 'intervalos', oHard: false }, kind: 'oido', key: 'intervalos', need: 6 },
    { t: 'Clave de fa', d: '8 aciertos en Lectura, nivel 3 (bajos)', mode: 'lectura', set: { lLevel: 'fa' }, kind: 'lectura', key: 'fa', need: 8 },
    { t: 'Aire de paseo', d: '75 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'paseo' }, kind: 'ritmo', key: 'paseo', score: 75 },
    { t: 'Círculos de oído', d: '4 aciertos en Oído · Círculos', mode: 'oido', set: { oType: 'circulos', oHard: false }, kind: 'oido', key: 'circulos', need: 4 },
    { t: 'Puntillo', d: '75 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'puntillo' }, kind: 'ritmo', key: 'puntillo', score: 75 },
    { t: 'Aire de merengue', d: '75 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'merengue' }, kind: 'ritmo', key: 'merengue', score: 75 },
    { t: 'Dictado largo', d: '3 melodías de 5 notas sin errores (Oído · Dictado, más difícil)', mode: 'oido', set: { oType: 'dictado', oHard: true }, kind: 'oido', key: 'dictado', need: 3, hard: true },
    { t: 'Lectura rápida', d: '15 notas en el Contrarreloj de Lectura', mode: 'lectura', set: { lLevel: 'reloj' }, kind: 'lectura', key: 'reloj', score: 15 },
    { t: 'Sostenidos en tu acordeón', d: '10 notas con el Micrófono, con sostenidos y bemoles', mode: 'mic', set: { mLevel: 'alteradas' }, kind: 'mic', key: 'alteradas', need: 10 },
    { t: 'Aire de son', d: '75 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'son' }, kind: 'ritmo', key: 'son', score: 75 },
    { t: 'Aire de puya', d: '75 puntos en Ritmo', mode: 'ritmo', set: { rLesson: 'puya' }, kind: 'ritmo', key: 'puya', score: 75 },
  ];
  // Identificador fijo por ejercicio: el progreso no se pierde si se agregan pasos nuevos
  STEPS.forEach(st => { st.id = `${st.kind}:${st.key}${st.hard ? '+' : ''}`; });
  const ICON = { lectura: '📖', oido: '👂', ritmo: '🥁', mic: '🎤', canto: '🗣' };

  camino = (() => {
    let active = null, finished = null, count = 0;
    const isDone = st => P.path.includes(st.id);
    const unlocked = i => i === 0 || isDone(STEPS[i - 1]);

    function render() {
      const n = STEPS.filter(isDone).length;
      $('#goalList').innerHTML = `<div class="path-head">Has superado <b>${n}</b> de ${STEPS.length} pasos
          <div class="bar"><i style="width:${Math.round(100 * n / STEPS.length)}%"></i></div></div>
        <p class="muted">Cada paso se desbloquea al superar el anterior. Pulsa «Empezar» y la app te lleva al ejercicio.</p>
        <div class="path">${STEPS.map((st, i) => {
          const done = isDone(st), open = unlocked(i);
          return `<div class="pstep ${done ? 'done' : open ? 'open' : 'locked'}">
            <span class="pnum">${done ? '✅' : open ? i + 1 : '🔒'}</span>
            <div class="ptxt"><b>${st.t}</b><small>${ICON[st.mode]} ${st.d}</small></div>
            ${open ? `<button data-i="${i}" class="${done ? '' : 'primary'}">${done ? 'Repetir' : 'Empezar'}</button>` : ''}</div>`;
        }).join('')}</div>`;
    }

    function bar() {
      const el = $('#goalBar');
      const st = active || finished;
      if (!st) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      const i = STEPS.indexOf(st);
      if (finished) {
        el.className = 'goal done';
        el.innerHTML = `🎉 <b>¡Paso ${i + 1} superado!</b> ${st.t}
          ${i + 1 < STEPS.length ? '<button id="gNext" class="primary">Siguiente paso ▶</button>' : '<b>¡Terminaste todo el camino! 🏆</b>'}
          <button id="gPath">Ver el camino</button>`;
      } else {
        const prog = st.score != null ? `meta: ${st.score} ${st.key === 'reloj' ? 'notas' : 'puntos'}` : `${count} de ${st.need}`;
        el.className = 'goal';
        el.innerHTML = `🎯 <b>Paso ${i + 1}: ${st.t}</b> · ${st.d} <span class="gprog">${prog}</span>
          <button id="gPath">Ver el camino</button> <button id="gQuit" title="Dejar este paso">✕</button>`;
      }
      if ($('#gNext')) $('#gNext').onclick = () => start(i + 1);
      $('#gPath').onclick = () => setMode('camino');
      if ($('#gQuit')) $('#gQuit').onclick = () => { active = null; bar(); };
    }

    function start(i) {
      const st = STEPS[i];
      active = st;
      finished = null;
      count = 0;
      setMode(st.mode);
      Object.entries(st.set).forEach(([id, v]) => {
        const el = $('#' + id);
        if (typeof v === 'boolean') el.checked = v; else el.value = v;
        el.dispatchEvent(new Event('change'));
      });
      if (st.mode === 'lectura') $('#lStart').click();
      if (st.mode === 'oido') $('#oPlay').click();
      bar();
    }

    function hit(kind, key, value) {
      const st = active;
      if (!st || st.kind !== kind || st.key !== key) return;
      if (st.hard && !$('#oHard').checked) return;
      if (st.score != null) { if (value == null || value < st.score) return; }
      else if (++count < st.need) { bar(); return; }
      if (!isDone(st)) { P.path.push(st.id); save(); }
      active = null;
      finished = st;
      bar();
    }

    $('#goalList').addEventListener('click', e => {
      const b = e.target.closest('button[data-i]');
      if (b) start(+b.dataset.i);
    });

    return { render, hit, bar };
  })();

  /* ================= Progreso ================= */
  function dayStreak() {
    const set = new Set(P.days);
    const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(d.toLocaleDateString('sv'))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function renderProgress() {
    const pct = e => (e && e.n ? Math.round(100 * e.ok / e.n) : 0);
    const bar = v => `<div class="bar"><i style="width:${v}%"></i></div>`;
    const row = (name, e, best, value, text = value + '%') => `<tr><td>${name}</td><td>${e ? e.n : 0}</td><td>${bar(value)}<span>${e && e.n ? text : '—'}</span></td><td>${best}</td><td>${e && e.last ? e.last : '—'}</td></tr>`;
    const head = (t, c3, c4) => `<tr class="grp"><th>${t}</th><th>Intentos</th><th>${c3}</th><th>${c4}</th><th>Último día</th></tr>`;

    let h = '<table class="prog">' + head('📖 Lectura', 'Aciertos', 'Mejor racha');
    LEVELS.forEach(l => {
      const e = P.ex['lectura:' + l.id];
      if (l.id === 'reloj') h += row(l.name, e, e ? `${e.best} notas` : '—', e ? Math.min(100, e.best * 3) : 0, e ? `récord ${e.best}` : '');
      else h += row(l.name, e, e ? e.best : '—', pct(e));
    });
    h += head('👂 Oído', 'Aciertos', 'Mejor racha');
    [['notas', 'Notas de la escala'], ['intervalos', 'Intervalos'], ['acordes', 'Acordes'], ['circulos', 'Círculos armónicos'], ['dictado', 'Dictado melódico']]
      .forEach(([id, n]) => ['', '+'].forEach(x => {
        const e = P.ex[`oido:${id}${x}`];
        if (x && !e) return;
        h += row(n + (x ? ' · más difícil' : ''), e, e ? e.best : '—', pct(e));
      }));
    h += head('🎤 Micrófono', 'Aciertos', 'Mejor racha');
    [['escala', 'Notas de la escala'], ['alteradas', 'Con sostenidos y bemoles']].forEach(([id, n]) => {
      const e = P.ex['mic:' + id];
      h += row(n, e, e ? e.best : '—', pct(e));
    });
    h += head('🗣 Cantar', 'Completados', 'Mejor racha');
    [['nota', 'Una nota'], ['escala', 'La escala'], ['melodia', 'Leer y cantar']].forEach(([id, n]) => {
      const e = P.ex['canto:' + id];
      h += row(n, e, e ? e.best : '—', pct(e));
    });
    h += head('🥁 Ritmo', 'Mejor puntuación', 'Última');
    LESSONS.forEach(l => {
      const e = P.ex['ritmo:' + l.id];
      h += row(l.name, e, e ? `${e.lastScore} / 100` : '—', e ? e.best : 0, e ? `${e.best} / 100` : '');
    });
    h += '</table>';

    const total = Object.values(P.ex).reduce((s, e) => s + e.n, 0);
    $('#pList').innerHTML = `<div class="stats">
        <div><b>${P.days.length}</b><span>días practicados</span></div>
        <div><b>${dayStreak()}</b><span>días seguidos</span></div>
        <div><b>${total}</b><span>ejercicios hechos</span></div>
        <div><b>${P.path.length} / ${STEPS.length}</b><span>pasos del camino</span></div>
      </div>${total ? h : '<p class="muted">Todavía no hay progreso guardado. ¡Empieza por el 🎯 Camino!</p>' + h}
      <p class="muted">Tu progreso se guarda solo en este navegador y en este computador.</p>`;
  }

  $('#pReset').addEventListener('click', () => {
    if (!confirm('¿Borrar todo tu progreso de solfeo? No se puede deshacer.')) return;
    P = { ex: {}, days: [], path: [] };
    App.store.set(KEY, JSON.stringify(P));
    renderProgress();
  });

  /* ================= Cambio de sección ================= */
  function stopAll() {
    lectura.stop();
    oido.stop();
    ritmo.stop();
    mic.stop();
    canto.stop();
  }

  function setMode(m) {
    stopAll();
    mode = m;
    $$('#solMode button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
    $$('#tab-solfeo .pane').forEach(p => p.classList.toggle('hidden', p.id !== 'pane-' + m));
    S.hideNames = m === 'lectura' && $('#lHide').checked;
    App.clearHl(); App.setBellows(null); App.renderKeys();
    if (m === 'lectura') lectura.show();
    else if (m === 'ritmo') ritmo.show();
    else if (m === 'mic') mic.show();
    else if (m === 'canto') canto.show();
    else if (m === 'camino') camino.render();
    else if (m === 'progreso') renderProgress();
    camino.bar();
  }

  $$('#solMode button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
  // Instrumento de los ejercicios: solo suena en Solfeo; las demás pestañas siguen con acordeón
  let instr = App.store.get('solfeoInstrumento') === 'piano' ? 'piano' : 'acordeon';
  function setInstr(i) {
    instr = i;
    App.store.set('solfeoInstrumento', i);
    $$('#solInstr button').forEach(b => b.classList.toggle('active', b.dataset.i === i));
    if (S.tab === 'solfeo') Sound.setInstrument(i);
  }
  $$('#solInstr button').forEach(b => b.addEventListener('click', () => {
    setInstr(b.dataset.i);
    Sound.treble([60, 64, 67], 0.9);
  }));
  setInstr(instr);

  App.hooks.refresh = () => { Sound.setInstrument(instr); setMode(mode); };
  App.hooks.stop = () => { stopAll(); Sound.setInstrument('acordeon'); };
  App.hooks.keyClick = (b, dir, isBass) => {
    if (mode === 'lectura') lectura.key(b, dir, isBass);
    else if (mode === 'oido') oido.key(b, dir, isBass);
    else if (mode === 'ritmo') ritmo.tap();
  };
})();
