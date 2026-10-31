(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const DIRS = {
    push: { label: 'Cerrando', long: 'Cerrando · fuelle hacia adentro', arrow: '→ ←' },
    pull: { label: 'Abriendo', long: 'Abriendo · fuelle hacia afuera', arrow: '← →' },
  };
  const other = d => (d === 'push' ? 'pull' : 'push');

  const S = {
    tuning: TUNINGS[0], display: 'both', tab: 'circles', dir: 'push',
    hl: new Map(), bhl: new Map(), timer: null,
    circle: null, selChord: 0, scale: null, selStep: -1,
  };
  let L;

  /* ---------------- Distribución actual ---------------- */
  function buildLayout() {
    const off = S.tuning.offset;
    const treble = [];
    BASE_LAYOUT.treble.forEach((row, r) => row.push.forEach((m, i) => treble.push({
      id: `t${r}-${i}`, row: r, idx: i, push: m + off, pull: row.pull[i] + off,
      x: i + (row.push.length === 10 ? 0.5 : 0), y: r,
    })));
    const bass = [];
    BASE_LAYOUT.bass.forEach((row, r) => row.buttons.forEach((b, i) => bass.push({
      id: `b${r}-${i}`, row: r, idx: i, type: b.type, x: i, y: r,
      push: Music.pc(b.push + off), pull: Music.pc(b.pull + off),
    })));
    L = {
      treble, bass,
      rowKeys: BASE_LAYOUT.treble.map(r => Music.pc(r.keyPc + off)),
      lo: 57 + off, hi: 86 + off, center: 69 + off,
    };
  }

  const nn = m => Music.name(m, S.tuning.pref);
  const nnOct = m => nn(m) + Music.octave(m);
  const ref = b => `H${b.row + 1}·${b.idx + 1}`;
  const isBassBtn = b => b.id[0] === 'b';
  const refAny = b => (isBassBtn(b) ? `${b.row === 0 ? 'Int' : 'Ext'}·${b.idx + 1}` : ref(b));
  const hlMap = b => (isBassBtn(b) ? S.bhl : S.hl);
  const bassMidi = p => 40 + ((p - 4 + 12) % 12);
  const bassChordMidis = p => { const r = 52 + ((p - 4 + 12) % 12); return [r, r + 4, r + 7]; };

  /* ---------------- Resaltado ---------------- */
  function addHl(map, id, dir, badge) {
    const h = map.get(id);
    if (!h) map.set(id, { dir, badges: badge != null ? [badge] : [] });
    else {
      if (h.dir !== dir) h.dir = 'both';
      if (badge != null) h.badges.push(badge);
    }
  }
  function clearHl() { S.hl.clear(); S.bhl.clear(); }

  /* ---------------- Dibujo del acordeón ---------------- */
  const GRAD = `<defs><linearGradient id="gBoth" x1="0" y1="0" x2="0" y2="1">
    <stop offset="50%" stop-color="var(--push)"/><stop offset="50%" stop-color="var(--pull)"/></linearGradient></defs>`;

  function keySVG(b, cx, cy, R, label, hl, isChord) {
    const showPush = S.display !== 'pull', showPull = S.display !== 'push';
    let cls = 'key' + (isChord ? ' chord' : '');
    if (hl) cls += ' hl ' + hl.dir;
    const cap = isChord
      ? `<rect class="cap" x="${-R}" y="${-R}" width="${2 * R}" height="${2 * R}" rx="9"/>`
      : `<circle class="cap" r="${R}"/>`;
    let inner;
    if (hl && hl.dir !== 'both') {
      inner = `<text class="big" y="5">${label(hl.dir)}</text>`;
    } else if (showPush && showPull) {
      inner = `<line x1="${-R + 6}" x2="${R - 6}" y1="0" y2="0"/>
        <text class="push" y="-5">${label('push')}</text><text class="pull" y="14">${label('pull')}</text>`;
    } else {
      const d = showPush ? 'push' : 'pull';
      inner = `<text class="big ${d}" y="5">${label(d)}</text>`;
    }
    let badge = '';
    if (hl && hl.badges.length) {
      const t = hl.badges.slice(0, 3).join('·') + (hl.badges.length > 3 ? '…' : '');
      const w = Math.max(20, t.length * 6.5 + 8);
      badge = `<g class="badge" transform="translate(${R - 6},${-R + 2})">
        <rect x="${-w / 2}" y="-9" width="${w}" height="18" rx="9" fill="var(--gold)" stroke="#241a0b"/>
        <text y="4">${t}</text></g>`;
    }
    return `<g class="${cls}" data-id="${b.id}" transform="translate(${cx},${cy})">${cap}${inner}${badge}</g>`;
  }

  // Teclado vertical: pito 1 arriba. Columnas de izquierda a derecha: 1ª hilera (afuera), 2ª, 3ª (junto al fuelle).
  function renderTreble() {
    const gap = 58, R = 25, x0 = 44, y0 = 84, cg = 64;
    const W = x0 * 2 + 2 * cg, H = y0 + 10 * gap + 44;
    let h = GRAD + `<rect class="panel" x="3" y="3" width="${W - 6}" height="${H - 6}" rx="22"/>`;
    BASE_LAYOUT.treble.forEach((row, r) => {
      const x = x0 + r * cg;
      h += `<text class="rowlbl" x="${x}" y="24">${row.name}</text>
        <text class="rowkey" x="${x}" y="41">${nn(L.rowKeys[r])}</text>
        <text class="rowplace" x="${x}" y="55">${row.place}</text>`;
    });
    L.treble.forEach(b => {
      h += keySVG(b, x0 + b.row * cg, y0 + b.x * gap, R, d => nn(b[d]), S.hl.get(b.id), false);
    });
    const svg = $('#treble');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = h;
  }

  // Bajos verticales: la fila interna queda a la izquierda, junto al fuelle.
  function renderBass() {
    const gap = 58, R = 23, x0 = 42, y0 = 64, cg = 60;
    const W = x0 * 2 + cg, H = y0 + 5 * gap + 42;
    const colX = r => x0 + r * cg;
    let h = GRAD + `<rect class="panel" x="3" y="3" width="${W - 6}" height="${H - 6}" rx="20"/>`;
    BASE_LAYOUT.bass.forEach((row, r) => {
      h += `<text class="rowlbl" x="${colX(r)}" y="30">${row.name}</text>`;
    });
    L.bass.forEach(b => {
      h += keySVG(b, colX(b.row), y0 + b.idx * gap, R, d => Music.name(b[d], S.tuning.pref),
        S.bhl.get(b.id), b.type === 'chord');
    });
    const svg = $('#bass');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = h;
  }

  function setBellows(dir) {
    const el = $('#bellows');
    el.classList.remove('push', 'pull');
    const known = dir === 'push' || dir === 'pull';
    if (known) {
      el.classList.add(dir);
      // Reinicia la animación de "bombeo" en cada cambio
      el.classList.remove('pump');
      void el.offsetWidth;
      el.classList.add('pump');
    }
    $('#bellowsLabel').textContent = known ? (dir === 'push' ? 'ADENTRO' : 'AFUERA') : 'FUELLE';
    $('#bellowsSub').textContent = known ? (dir === 'push' ? 'Cerrando el fuelle' : 'Abriendo el fuelle') : 'Toca un botón';
    $('#arrowL').textContent = known ? (dir === 'push' ? '▶' : '◀') : '';
    $('#arrowR').textContent = known ? (dir === 'push' ? '◀' : '▶') : '';
  }

  function renderKeys() { renderTreble(); renderBass(); }

  /* ---------------- Utilidades de posición ---------------- */
  const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
  function spread(btns) {
    let m = 0;
    for (let i = 0; i < btns.length; i++)
      for (let j = i + 1; j < btns.length; j++)
        m = Math.max(m, Math.hypot(btns[i].x - btns[j].x, (btns[i].y - btns[j].y) * 1.1));
    return m;
  }
  function combos(arr, k, cb, start = 0, acc = []) {
    if (acc.length === k) { cb(acc); return; }
    for (let i = start; i < arr.length; i++) { acc.push(arr[i]); combos(arr, k, cb, i + 1, acc); acc.pop(); }
  }
  function cartesian(lists) {
    return lists.reduce((res, list) => res.flatMap(r => list.map(x => [...r, x])), [[]]);
  }

  /* ---------------- Acordes ---------------- */
  function findVoicings(tones, optional) {
    const pcs = tones.map(t => t.pc);
    const req = pcs.filter((_, i) => !optional.includes(i));
    const sizes = optional.length ? [pcs.length, pcs.length - 1] : [pcs.length];
    const found = [];
    for (const dir of ['push', 'pull']) {
      const cands = L.treble.filter(b => pcs.includes(Music.pc(b[dir])) && b[dir] >= L.lo && b[dir] <= L.hi);
      let best = null;
      for (const k of sizes) {
        combos(cands, k, combo => {
          const ps = new Set(combo.map(b => Music.pc(b[dir])));
          if (ps.size !== k || !req.every(p => ps.has(p))) return;
          const cost = spread(combo) + Math.abs(avg(combo.map(b => b[dir])) - L.center) / 12 * 0.8
            + (k < pcs.length ? 0.6 : 0);
          if (!best || cost < best.cost) best = { dir, buttons: combo.slice(), cost };
        });
      }
      if (best) found.push(best);
    }
    return found.sort((a, b) => a.cost - b.cost);
  }

  function findBass(rootPc, quality, dir) {
    const pick = (type, d) => L.bass.find(b => b.type === type && b[d] === rootPc);
    const res = { bass: null, chord: null, warn: [], note: '' };
    for (const [key, type] of [['bass', 'bass'], ['chord', 'chord']]) {
      if (type === 'chord' && quality === 'min') continue;
      let b = pick(type, dir), d = dir;
      if (!b) {
        b = pick(type, other(dir)); d = other(dir);
        if (b) res.warn.push(`El ${type === 'bass' ? 'bajo' : 'acorde de bajo'} solo existe ${DIRS[d].label.toLowerCase()} (dirección contraria a los pitos).`);
        else res.warn.push(`Este ${type === 'bass' ? 'bajo' : 'acorde de bajo'} no existe en el acordeón.`);
      }
      if (b) res[key] = { btn: b, dir: d };
    }
    if (quality === 'min') res.note = 'Acorde menor: en los bajos se toca la nota fundamental (los botones de acorde son mayores).';
    return res;
  }

  function circleChords(keyPc, mode, degrees) {
    const steps = Music.SCALES[mode === 'maj' ? 'mayor' : 'menor'].steps;
    const rootLetter = Music.letterOf(keyPc, Music.rootPref(keyPc, mode));
    return degrees.map(deg => {
      const d = Music.DEGREES[mode][deg];
      const q = Music.CHORDS[d.q];
      const rootPc = Music.pc(keyPc + steps[d.deg]);
      const letter = (rootLetter + d.deg) % 7;
      const tones = q.iv.map((iv, k) => ({
        pc: Music.pc(rootPc + iv), name: Music.spell((letter + q.lt[k]) % 7, rootPc + iv),
      }));
      const voicings = findVoicings(tones, q.optional);
      return {
        deg, rootPc, quality: d.q, tones, voicings, alt: 0,
        name: Music.spell(letter, rootPc) + q.suffix,
      };
    });
  }

  const chordVoicing = ch => ch.voicings[ch.alt] || null;
  function chordBass(ch) {
    const v = chordVoicing(ch);
    return findBass(ch.rootPc, ch.quality, v ? v.dir : 'push');
  }

  /* ---------------- Pestaña: círculos ---------------- */
  function fillKeySelect(resetToDefault) {
    const sel = $('#cKey');
    const prev = sel.value;
    const natural = [];
    L.rowKeys.forEach(p => natural.push(`${p}:maj`));
    L.rowKeys.forEach(p => natural.push(`${(p + 9) % 12}:min`));
    const others = [];
    for (const mode of ['maj', 'min'])
      for (let p = 0; p < 12; p++) if (!natural.includes(`${p}:${mode}`)) others.push(`${p}:${mode}`);
    const label = v => {
      const [p, mode] = v.split(':');
      const ok = circleChords(+p, mode, Music.CIRCLES[mode][0].degrees).every(c => c.voicings.length);
      return Music.keyName(+p, mode) + (ok ? '' : ' (incompleto)');
    };
    sel.innerHTML = `<optgroup label="Tonos naturales del acordeón">${natural.map(v => `<option value="${v}">${label(v)}</option>`).join('')}</optgroup>
      <optgroup label="Otras tonalidades">${others.map(v => `<option value="${v}">${label(v)}</option>`).join('')}</optgroup>`;
    sel.value = !resetToDefault && prev ? prev : `${L.rowKeys[1]}:maj`;
  }

  function fillCircleTypes() {
    const mode = $('#cKey').value.split(':')[1];
    const sel = $('#cType');
    const prev = sel.dataset.mode === mode ? sel.value : '0';
    sel.innerHTML = Music.CIRCLES[mode].map((c, i) => `<option value="${i}">${c.name}</option>`).join('');
    sel.dataset.mode = mode;
    sel.value = prev;
  }

  function computeCircle() {
    stop();
    const [p, mode] = $('#cKey').value.split(':');
    const circle = Music.CIRCLES[mode][+$('#cType').value];
    S.circle = { keyPc: +p, mode, def: circle, chords: circleChords(+p, mode, circle.degrees) };
    selectChord(Math.min(S.selChord, S.circle.chords.length - 1), false);
  }

  function renderCircle() {
    const { chords, keyPc, mode, def } = S.circle;
    const n = chords.length, C = 160, R = 112, r = 40;
    const ang = i => (-90 + i * 360 / n) * Math.PI / 180;
    const pt = a => [C + R * Math.cos(a), C + R * Math.sin(a)];
    const gapA = (r + 8) / R;
    let h = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>
      <circle class="ring" cx="${C}" cy="${C}" r="${R}"/>`;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pt(ang(i) + gapA), [x2, y2] = pt(ang(i + 1) - gapA);
      h += `<path class="arc" d="M${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2}" marker-end="url(#arr)"/>`;
    }
    h += `<text class="center-t" x="${C}" y="${C - 4}">${Music.keyName(keyPc, mode)}</text>
      <text class="center-s" x="${C}" y="${C + 16}">${def.name.split(' (')[0]}</text>`;
    chords.forEach((ch, i) => {
      const [x, y] = pt(ang(i));
      const v = chordVoicing(ch);
      h += `<g class="node ${v ? v.dir : 'na'} ${i === S.selChord ? 'sel' : ''}" data-i="${i}" transform="translate(${x},${y})">
        <circle r="${r}"/><text class="nm" y="2">${ch.name}</text><text class="dg" y="19">${ch.deg}</text></g>`;
    });
    $('#circleSvg').innerHTML = h;
  }

  function renderChordInfo() {
    const ch = S.circle.chords[S.selChord];
    const v = chordVoicing(ch);
    const bass = chordBass(ch);
    let h = `<h3>${ch.name}<span class="deg">${ch.deg} de ${Music.keyName(S.circle.keyPc, S.circle.mode)}</span></h3>
      <div class="tones">${ch.tones.map(t => `<span class="tone">${t.name}</span>`).join('')}</div>`;
    if (v) {
      const btns = [...v.buttons].sort((a, b) => a[v.dir] - b[v.dir]);
      h += `<div class="dirbadge ${v.dir}">${DIRS[v.dir].arrow} ${DIRS[v.dir].long}</div>
        <div class="sub">Pitos · mano derecha</div>
        <ul>${btns.map(b => `<li><b>${ref(b)}</b> — ${BASE_LAYOUT.treble[b.row].name}, pito ${b.idx + 1}: ${nnOct(b[v.dir])}</li>`).join('')}</ul>`;
      if (v.buttons.length < ch.tones.length) h += `<div class="note">Se omite la quinta (común en acordes de séptima).</div>`;
    } else {
      h += `<div class="warn">Este acorde no tiene una posición completa en los pitos de este acordeón.</div>`;
    }
    h += `<div class="sub">Bajos · mano izquierda</div><ul>`;
    if (bass.bass) h += `<li><b>Bajo</b> ${Music.name(ch.rootPc, S.tuning.pref)} — ${DIRS[bass.bass.dir].label.toLowerCase()} (fila ${BASE_LAYOUT.bass[bass.bass.btn.row].name.toLowerCase()})</li>`;
    if (bass.chord) h += `<li><b>Acorde</b> ${Music.name(ch.rootPc, S.tuning.pref)} — ${DIRS[bass.chord.dir].label.toLowerCase()} (fila ${BASE_LAYOUT.bass[bass.chord.btn.row].name.toLowerCase()})</li>`;
    h += `</ul>${bass.warn.map(w => `<div class="warn">⚠ ${w}</div>`).join('')}${bass.note ? `<div class="note">${bass.note}</div>` : ''}
      <div class="btnrow"><button id="chordPlay">🔊 Escuchar acorde</button>
      ${ch.voicings.length > 1 ? `<button id="chordAlt">Ver posición ${DIRS[ch.voicings[1 - ch.alt].dir].label.toLowerCase()}</button>` : ''}</div>`;
    $('#chordInfo').innerHTML = h;
    $('#chordPlay').onclick = () => playChord(ch);
    if ($('#chordAlt')) $('#chordAlt').onclick = () => { ch.alt = 1 - ch.alt; selectChord(S.selChord, true); };
  }

  function highlightChord(ch) {
    clearHl();
    const v = chordVoicing(ch);
    if (v) v.buttons.forEach(b => addHl(S.hl, b.id, v.dir));
    const bass = chordBass(ch);
    if (bass.bass) addHl(S.bhl, bass.bass.btn.id, bass.bass.dir, 'B');
    if (bass.chord) addHl(S.bhl, bass.chord.btn.id, bass.chord.dir, 'A');
    setBellows(v ? v.dir : null);
    renderKeys();
  }

  function selectChord(i, sound = true) {
    S.selChord = i;
    const ch = S.circle.chords[i];
    highlightChord(ch);
    renderCircle();
    renderChordInfo();
    if (sound) playChord(ch);
  }

  function playChord(ch, beatMs = 500) {
    const v = chordVoicing(ch);
    if (v) Sound.treble(v.buttons.map(b => b[v.dir]), (beatMs * 2) / 1000 - 0.08);
    const bass = chordBass(ch);
    if (bass.bass) Sound.bass(bassMidi(ch.rootPc), beatMs / 1000 * 0.7);
    if (bass.chord) setTimeout(() => Sound.bassChord(bassChordMidis(ch.rootPc), beatMs / 1000 * 0.6), beatMs);
    else if (bass.bass) setTimeout(() => Sound.bass(bassMidi(ch.rootPc) + 7, beatMs / 1000 * 0.6), beatMs);
  }

  function playCircle() {
    if (S.timer) return stop();
    $('#cPlay').textContent = '■ Detener';
    let i = 0;
    const tick = () => {
      const beat = 60000 / +$('#cTempo').value;
      selectChord(i, false);
      playChord(S.circle.chords[i], beat);
      i = (i + 1) % S.circle.chords.length;
      S.timer = setTimeout(tick, beat * 2);
    };
    tick();
  }

  /* ---------------- Pestaña: escalas ---------------- */
  function optionsFor(midis) {
    const out = [];
    for (const dir of ['push', 'pull']) {
      const lists = midis.map(m => L.treble.filter(b => b[dir] === m));
      if (lists.some(l => !l.length)) continue;
      for (const combo of cartesian(lists)) {
        if (new Set(combo.map(b => b.id)).size !== combo.length) continue;
        out.push({
          dir, btns: combo, cx: avg(combo.map(b => b.x)), cy: avg(combo.map(b => b.y)),
          local: combo.length > 1 ? spread(combo) * 0.5 : 0,
        });
      }
    }
    return out;
  }

  // En los bajos cada botón da una sola nota (sin octavas): se busca por clase de nota.
  function bassOptionsFor(midi) {
    const p = Music.pc(midi), out = [];
    L.bass.filter(b => b.type === 'bass').forEach(b => ['push', 'pull'].forEach(dir => {
      if (b[dir] === p) out.push({ dir, btns: [b], cx: b.x, cy: b.y, local: 0 });
    }));
    return out;
  }

  // Elige la digitación con menos cambios de fuelle y menos saltos (Viterbi por tramos).
  function planFingering(opts) {
    const res = new Array(opts.length).fill(null);
    let i = 0;
    while (i < opts.length) {
      if (!opts[i].length) { i++; continue; }
      let j = i;
      while (j < opts.length && opts[j].length) j++;
      let cost = opts[i].map(o => o.local);
      const back = [];
      for (let k = i + 1; k < j; k++) {
        const nc = [], bk = [];
        opts[k].forEach(o => {
          let best = Infinity, bi = 0;
          opts[k - 1].forEach((p, pi) => {
            const c = cost[pi] + (p.dir !== o.dir ? 3 : 0) + Math.hypot(p.cx - o.cx, (p.cy - o.cy) * 1.2) * 0.8;
            if (c < best) { best = c; bi = pi; }
          });
          nc.push(best + o.local);
          bk.push(bi);
        });
        cost = nc;
        back[k] = bk;
      }
      let bi = cost.indexOf(Math.min(...cost));
      for (let k = j - 1; k >= i; k--) {
        res[k] = opts[k][bi];
        if (k > i) bi = back[k][bi];
      }
      i = j;
    }
    return res;
  }

  function computeScale() {
    stop();
    const root = +$('#sRoot').value, sc = Music.SCALES[$('#sType').value];
    const hand = $('#sHand').value;
    $('#sInt').disabled = hand === 'bajos';
    const iv = Music.INTERVALS[hand === 'bajos' ? 'simple' : $('#sInt').value];
    const span = +$('#sSpan').value;
    const tonic = 12 * (+$('#sOct').value + 1) + root;
    const rl = Music.letterOf(root, Music.rootPref(root, sc.mode));

    const len = sc.chromatic ? 12 : sc.steps.length;
    const note = (d, desc) => {
      if (sc.chromatic) { const m = tonic + d; return { midi: m, name: Music.name(m, desc ? 'flat' : 'sharp') }; }
      const steps = desc && sc.desc ? sc.desc : sc.steps;
      const m = tonic + 12 * Math.floor(d / len) + steps[d % len];
      const letter = sc.letters ? sc.letters[d % len] : d % len;
      return { midi: m, name: Music.spell((rl + letter) % 7, m) };
    };
    // Los saltos de octava (7) y décima (9) se adaptan a escalas de 5 notas
    const degJump = k => (k >= 7 ? k - 7 + len : k);
    const N = len * span;
    const chord = (d, desc) => {
      const lower = note(d, desc);
      const upper = iv.stack.map((k, j) => sc.chromatic
        ? { midi: lower.midi + iv.semis[j], name: Music.name(lower.midi + iv.semis[j], desc ? 'flat' : 'sharp') }
        : note(d + degJump(k), desc));
      return [lower, ...upper];
    };
    const steps = [];
    let ascLen = N + 1;
    if (iv.arp) {
      // Arpegio de cada grado: sube 1-3-5-8 y al regresar baja 8-5-3-1
      for (let d = 0; d < N; d++)
        chord(d, false).forEach((n, j) => steps.push({ notes: [n], desc: false, group: j === 0 }));
      ascLen = steps.length;
      for (let d = N - 1; d >= 0; d--)
        chord(d, true).reverse().forEach((n, j) => steps.push({ notes: [n], desc: true, group: j === 0 }));
    } else {
      for (let d = 0; d <= N; d++) steps.push({ notes: chord(d, false), desc: false });
      for (let d = N - 1; d >= 0; d--) steps.push({ notes: chord(d, true), desc: true });
    }

    const plan = planFingering(steps.map(s => hand === 'bajos'
      ? bassOptionsFor(s.notes[0].midi)
      : optionsFor(s.notes.map(n => n.midi))));
    let prevBass = null;
    steps.forEach((s, k) => {
      s.opt = plan[k];
      if (!s.opt) {
        if (hand === 'bajos') { s.why = `No hay bajo de ${s.notes[0].name}`; return; }
        const missing = s.notes.filter(n => !L.treble.some(b => b.push === n.midi || b.pull === n.midi));
        s.why = missing.length
          ? `No existe: ${missing.map(n => n.name + Music.octave(n.midi)).join(', ')}`
          : 'Las notas están en direcciones opuestas del fuelle';
        return;
      }
      if (hand === 'ambas') {
        // El bajo tiene que ir en la misma dirección del fuelle que los pitos.
        const p = Music.pc(s.notes[0].midi);
        const cands = L.bass.filter(b => b.type === 'bass' && b[s.opt.dir] === p);
        const btn = cands.includes(prevBass) ? prevBass : cands[0];
        if (btn) { s.bass = { btn, dir: s.opt.dir }; prevBass = btn; }
      }
    });
    S.scale = { steps, ascLen, name: `${sc.name} de ${Music.spell(rl, root)}`, iv, hand };
    S.selStep = -1;
    renderSteps();
    showWholePath();
  }

  function renderSteps() {
    const { steps, ascLen, name, iv, hand } = S.scale;
    const ok = steps.filter(s => s.opt);
    let changes = 0;
    for (let k = 1; k < steps.length; k++)
      if (steps[k].opt && steps[k - 1].opt && steps[k].opt.dir !== steps[k - 1].opt.dir) changes++;
    const missing = [...new Set(steps.filter(s => !s.opt).map(s => s.why))];
    let extra = '';
    if (hand === 'bajos') {
      const list = dir => [...new Set(L.bass.filter(b => b.type === 'bass').map(b => b[dir]))]
        .map(p => Music.name(p, S.tuning.pref)).join(', ');
      extra = `<div class="note">En los 12 bajos cada botón da una sola nota (no hay octavas), así que la escala
        se toca con los bajos que existen, cambiando el fuelle cuando haga falta.
        Bajos cerrando: <b>${list('push')}</b> · abriendo: <b>${list('pull')}</b>.</div>`;
    } else if (hand === 'ambas') {
      const noBass = ok.filter(s => !s.bass).length;
      extra = `<div class="note">El bajo acompaña la nota más grave de cada paso, en la misma dirección del fuelle que los pitos.
        ${noBass ? `${noBass} pasos no tienen bajo en esa dirección.` : 'Todos los pasos tienen bajo.'}</div>`;
    }
    const what = hand === 'bajos' ? 'en los bajos' : iv.name.toLowerCase() + (hand === 'ambas' ? ' + bajos' : '');
    $('#scaleSummary').innerHTML = `<b>${name}</b> · ${what} · ${ok.length} de ${steps.length} pasos tocables · ${changes} cambios de fuelle
      ${missing.length ? `<div class="warn">⚠ ${missing.slice(0, 4).join(' · ')}</div>` : ''}${extra}`;
    $('#steps').innerHTML = steps.map((s, k) => {
      const o = s.opt;
      const names = [...s.notes].reverse().map(n => n.name).join('<br>');
      return `<button class="step ${o ? o.dir : 'na'} ${k === S.selStep ? 'active' : ''} ${k === ascLen ? 'sep' : s.group && k ? 'gs' : ''}" data-i="${k}" title="${o ? DIRS[o.dir].long : s.why}">
        <span class="num">${k + 1}${k === ascLen ? ' ↓' : ''}</span><span class="nn">${names}</span>
        <span class="dir">${o ? DIRS[o.dir].arrow : '✕'}</span>
        <span class="refs">${o ? o.btns.map(refAny).join(' ') : 'no disponible'}</span>
        ${hand === 'ambas' && o ? `<span class="refs">${s.bass ? 'B ' + refAny(s.bass.btn) : 'sin bajo'}</span>` : ''}</button>`;
    }).join('');
  }

  function showWholePath() {
    clearHl();
    S.scale.steps.slice(0, S.scale.ascLen).forEach((s, k) => {
      if (s.opt) s.opt.btns.forEach(b => addHl(hlMap(b), b.id, s.opt.dir, k + 1));
      if (s.bass) addHl(S.bhl, s.bass.btn.id, s.bass.dir, k + 1);
    });
    setBellows(null);
    S.selStep = -1;
    $$('.step.active').forEach(e => e.classList.remove('active'));
    renderKeys();
  }

  function selectStep(k, beatMs = 450) {
    const steps = S.scale.steps;
    S.selStep = (k + steps.length) % steps.length;
    const s = steps[S.selStep];
    clearHl();
    if (s.opt) {
      s.opt.btns.forEach(b => addHl(hlMap(b), b.id, s.opt.dir));
      setBellows(s.opt.dir);
      const dur = beatMs / 1000 * 0.85;
      if (S.scale.hand === 'bajos') Sound.bass(bassMidi(Music.pc(s.notes[0].midi)), dur);
      else Sound.treble(s.notes.map(n => n.midi), dur);
      if (s.bass) {
        addHl(S.bhl, s.bass.btn.id, s.bass.dir);
        Sound.bass(bassMidi(Music.pc(s.notes[0].midi)), dur);
      }
    } else setBellows(null);
    renderKeys();
    $$('.step').forEach(e => e.classList.toggle('active', +e.dataset.i === S.selStep));
  }

  function playScale() {
    if (S.timer) return stop();
    $('#sPlay').textContent = '■ Detener';
    let k = 0;
    const tick = () => {
      if (k >= S.scale.steps.length) { stop(); return; }
      const beat = 60000 / +$('#sTempo').value;
      selectStep(k++, beat);
      S.timer = setTimeout(tick, beat);
    };
    tick();
  }

  function stop() {
    clearTimeout(S.timer);
    S.timer = null;
    $('#cPlay').textContent = '▶ Reproducir círculo';
    $('#sPlay').textContent = '▶ Reproducir';
  }

  /* ---------------- Pestaña: explorar ---------------- */
  function setDir(d) {
    S.dir = d;
    $$('#dirSeg button').forEach(b => b.classList.toggle('active', b.dataset.dir === d));
    setBellows(d);
  }

  function findNote() {
    clearHl();
    const v = $('#eFind').value;
    if (v !== '') {
      const p = +v;
      const hits = [];
      L.treble.forEach(b => ['push', 'pull'].forEach(d => {
        if (Music.pc(b[d]) === p) { addHl(S.hl, b.id, d); hits.push(`${ref(b)} ${DIRS[d].label.toLowerCase()} (${nnOct(b[d])})`); }
      }));
      L.bass.forEach(b => ['push', 'pull'].forEach(d => { if (b[d] === p) addHl(S.bhl, b.id, d); }));
      $('#exploreInfo').innerHTML = hits.length
        ? `<b>${Music.name(p, S.tuning.pref)}</b> aparece en ${hits.length} posiciones: ${hits.join(' · ')}`
        : `<span class="warn">La nota ${Music.name(p, S.tuning.pref)} no existe en los pitos de este acordeón.</span>`;
    }
    renderKeys();
  }

  /* ---------------- Clic en los botones ---------------- */
  function onKeyClick(e, isBass) {
    const g = e.target.closest('.key');
    if (!g) return;
    const map = isBass ? S.bhl : S.hl;
    const b = (isBass ? L.bass : L.treble).find(x => x.id === g.dataset.id);
    const h = map.get(b.id);
    const dir = S.tab === 'explore' ? S.dir
      : h && h.dir !== 'both' ? h.dir
      : S.display !== 'both' ? S.display : S.dir;
    if (isBass) {
      if (b.type === 'bass') Sound.bass(bassMidi(b[dir]));
      else Sound.bassChord(bassChordMidis(b[dir]));
    } else Sound.treble([b[dir]]);
    setBellows(dir);
    if (S.tab === 'explore') {
      $('#eFind').value = '';
      clearHl();
      addHl(map, b.id, dir);
      renderKeys();
      const what = isBass
        ? `${b.type === 'bass' ? 'Bajo' : 'Acorde'} ${Music.name(b[dir], S.tuning.pref)} · fila ${BASE_LAYOUT.bass[b.row].name.toLowerCase()}`
        : `${ref(b)} — ${BASE_LAYOUT.treble[b.row].name}, pito ${b.idx + 1}: <b>${nnOct(b[dir])}</b>`;
      $('#exploreInfo').innerHTML = `${what} · <span style="color:var(--${dir})">${DIRS[dir].long}</span>`;
    }
  }

  /* ---------------- Inicio y eventos ---------------- */
  function fillStaticSelects() {
    $('#tuning').innerHTML = TUNINGS.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    $('#tuning').value = S.tuning.id;
    const rootSel = $('#sRoot'), r = rootSel.value || '0';
    rootSel.innerHTML = Array.from({ length: 12 }, (_, p) =>
      `<option value="${p}">${Music.spell(Music.letterOf(p, Music.rootPref(p, 'maj')), p)}</option>`).join('');
    rootSel.value = r;
    const t = $('#sType').value || 'mayor';
    $('#sType').innerHTML = Object.entries(Music.SCALES).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('');
    $('#sType').value = t;
    const iv = $('#sInt').value || 'simple';
    $('#sInt').innerHTML = Object.entries(Music.INTERVALS).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('');
    $('#sInt').value = iv;
    const f = $('#eFind').value;
    $('#eFind').innerHTML = '<option value="">—</option>' + Array.from({ length: 12 }, (_, p) =>
      `<option value="${p}">${Music.name(p, S.tuning.pref)}</option>`).join('');
    $('#eFind').value = f;
  }

  function refreshTab() {
    stop();
    if (S.tab === 'circles') computeCircle();
    else if (S.tab === 'scales') computeScale();
    else { setDir(S.dir); findNote(); }
  }

  function refreshAll(resetKey) {
    buildLayout();
    fillStaticSelects();
    fillKeySelect(resetKey);
    fillCircleTypes();
    renderKeys();
    refreshTab();
  }

  $('#tuning').addEventListener('change', e => {
    S.tuning = TUNINGS.find(t => t.id === e.target.value);
    $('#sRoot').value = String(Music.pc(BASE_LAYOUT.treble[1].keyPc + S.tuning.offset));
    refreshAll(true);
  });
  $('#notation').addEventListener('change', e => { Music.setNotation(e.target.value); refreshAll(false); });
  $('#display').addEventListener('change', e => { S.display = e.target.value; renderKeys(); });

  $$('.tabs button').forEach(btn => btn.addEventListener('click', () => {
    S.tab = btn.dataset.tab;
    $$('.tabs button').forEach(b => b.classList.toggle('active', b === btn));
    $$('.tab').forEach(t => t.classList.toggle('hidden', t.id !== `tab-${S.tab}`));
    refreshTab();
  }));

  $('#cKey').addEventListener('change', () => { fillCircleTypes(); S.selChord = 0; computeCircle(); });
  $('#cType').addEventListener('change', () => { S.selChord = 0; computeCircle(); });
  $('#cPlay').addEventListener('click', playCircle);
  $('#cTempo').addEventListener('input', e => { $('#cTempoOut').textContent = e.target.value; });
  $('#circleSvg').addEventListener('click', e => {
    const n = e.target.closest('.node');
    if (n) { stop(); selectChord(+n.dataset.i); }
  });

  ['#sRoot', '#sType', '#sHand', '#sInt', '#sOct', '#sSpan'].forEach(id => $(id).addEventListener('change', computeScale));
  $('#sPlay').addEventListener('click', playScale);
  $('#sPrev').addEventListener('click', () => { stop(); selectStep(S.selStep < 0 ? 0 : S.selStep - 1); });
  $('#sNext').addEventListener('click', () => { stop(); selectStep(S.selStep + 1); });
  $('#sMap').addEventListener('click', () => { stop(); showWholePath(); });
  $('#sTempo').addEventListener('input', e => { $('#sTempoOut').textContent = e.target.value; });
  $('#steps').addEventListener('click', e => {
    const s = e.target.closest('.step');
    if (s) { stop(); selectStep(+s.dataset.i); }
  });

  $$('#dirSeg button').forEach(b => b.addEventListener('click', () => setDir(b.dataset.dir)));
  $('#eFind').addEventListener('change', findNote);
  $('#eClear').addEventListener('click', () => { $('#eFind').value = ''; $('#exploreInfo').innerHTML = ''; findNote(); });
  document.addEventListener('keydown', e => {
    if (S.tab !== 'explore' || e.code !== 'Space' || /SELECT|INPUT/.test(e.target.tagName)) return;
    e.preventDefault();
    setDir(other(S.dir));
  });

  /* ---------------- Sonido del acordeón ---------------- */
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };
  const demo = () => Sound.treble([60, 64, 67], 1.1);

  function setVoice(id, cents) {
    const p = Sound.PRESETS[id];
    Sound.setPreset(id === 'custom' ? 'brillante' : id);
    const c = cents ?? (p ? p.tremolo : +$('#tremolo').value);
    Sound.setTremolo(c);
    $('#voice').value = id;
    $('#tremolo').value = c;
    $('#tremoloOut').textContent = c ? `±${c} cents` : 'sin vibrar';
    store.set('voice', id);
    store.set('tremolo', c);
  }

  $('#voice').innerHTML = Object.entries(Sound.PRESETS)
    .map(([k, p]) => `<option value="${k}">${p.name}</option>`).join('')
    + '<option value="custom">Personalizado</option>';
  $('#voice').addEventListener('change', e => { setVoice(e.target.value); demo(); });
  $('#tremolo').addEventListener('input', e => {
    const c = +e.target.value;
    const match = Object.keys(Sound.PRESETS).find(k => Sound.PRESETS[k].tremolo === c);
    setVoice(match || 'custom', c);
  });
  $('#tremolo').addEventListener('change', demo);
  {
    const saved = store.get('voice');
    const id = saved in Sound.PRESETS || saved === 'custom' ? saved : 'brillante';
    const c = store.get('tremolo');
    setVoice(id, id === 'custom' && c != null ? +c : undefined);
  }

  $('#treble').addEventListener('click', e => onKeyClick(e, false));
  $('#bass').addEventListener('click', e => onKeyClick(e, true));

  refreshAll(true);
})();
