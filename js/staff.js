/* Pentagrama en SVG: claves de sol y fa, notas con alteraciones, líneas adicionales y figuras rítmicas. */
const Staff = (() => {
  const H = 6;  // distancia entre una línea y el espacio siguiente
  const CLEFS = {
    treble: { bottom: 30, glyph: '𝄞', size: 58, dy: 13 },  // línea inferior = Mi4
    bass:   { bottom: 18, glyph: '𝄢', size: 40, dy: -4 },  // línea inferior = Sol2
  };
  const ACC = { 1: '♯', 2: '𝄪', '-1': '♭', '-2': '𝄫' };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function head(x, y, cls, hollow) {
    return `<ellipse class="head ${cls}${hollow ? ' hollow' : ''}" cx="${x}" cy="${y}" rx="6.6" ry="4.8" transform="rotate(-20 ${x} ${y})"/>`;
  }

  /* opts.staves: ['treble'] | ['bass'] | ['treble', 'bass']
     opts.events: [{ notes: { treble: [{midi, letter}], bass: [...] }, cls, lines: [texto o {t, cls}] }]
     opts.colW: ancho de cada columna · opts.zoom: escala del dibujo */
  function render(svg, { staves, events, colW = 48, zoom = 1, cur = -1, range = {} }) {
    const x0 = 58, padT = 10;
    const blocks = [];
    let y = padT;
    staves.forEach(s => {
      const c = CLEFS[s];
      // range[s] = [nota más grave, más aguda] para que el alto no cambie entre preguntas
      const steps = events.flatMap(e => (e.notes[s] || []).map(n => Music.staffPos(n.midi, n.letter).step))
        .concat((range[s] || []).map(m => Music.staffPos(m).step));
      const hi = Math.max(c.bottom + 10, ...steps), lo = Math.min(c.bottom - 2, ...steps);
      const base = y + (hi - lo) * H;
      blocks.push({ s, c, base, lo, yOf: st => base - (st - lo) * H });
      y = base + 14;
    });
    const nLines = Math.max(0, ...events.map(e => (e.lines || []).length));
    const W = x0 + events.length * colW + 14, Hh = y + nLines * 14 + 6;

    let h = '';
    events.forEach((e, i) => {
      h += `<rect class="col" data-i="${i}" x="${x0 + i * colW}" y="2" width="${colW}" height="${Hh - 4}" rx="8"/>`;
    });
    blocks.forEach(({ s, c, yOf }) => {
      for (let k = 0; k < 5; k++) {
        const ly = yOf(c.bottom + 2 * k);
        h += `<line class="sl" x1="6" x2="${W - 6}" y1="${ly}" y2="${ly}"/>`;
      }
      h += `<text class="clef" x="10" y="${yOf(c.bottom + 4) + c.dy}" font-size="${c.size}">${c.glyph}</text>`;
    });
    if (blocks.length > 1) h += `<line class="sl" x1="6" x2="6" y1="${blocks[0].yOf(blocks[0].c.bottom + 8)}" y2="${blocks[1].yOf(blocks[1].c.bottom)}"/>`;

    events.forEach((e, i) => {
      const cx = x0 + i * colW + colW / 2;
      let g = '';
      blocks.forEach(({ s, c, yOf }) => {
        const ps = (e.notes[s] || []).map(n => Music.staffPos(n.midi, n.letter)).sort((a, b) => a.step - b.step);
        if (!ps.length) return;
        // Líneas adicionales arriba y abajo del pentagrama
        for (let st = c.bottom - 2; st >= ps[0].step; st -= 2)
          g += `<line class="ledger" x1="${cx - 11}" x2="${cx + 11}" y1="${yOf(st)}" y2="${yOf(st)}"/>`;
        for (let st = c.bottom + 10; st <= ps[ps.length - 1].step; st += 2)
          g += `<line class="ledger" x1="${cx - 11}" x2="${cx + 11}" y1="${yOf(st)}" y2="${yOf(st)}"/>`;
        let shifted = false;
        ps.forEach((p, k) => {
          // Dos notas vecinas (segunda) no caben una encima de otra: la de arriba se corre
          shifted = k > 0 && p.step - ps[k - 1].step === 1 && !shifted;
          const nx = cx + (shifted ? 12 : 0), ny = yOf(p.step);
          if (p.acc) g += `<text class="acc" x="${cx - 12 - (k % 2) * 7}" y="${ny + 5}">${ACC[p.acc]}</text>`;
          g += head(nx, ny, e.cls || 'ink');
        });
      });
      const ly = y + 10;
      (e.lines || []).forEach((l, k) => {
        const o = typeof l === 'string' ? { t: l } : l;
        g += `<text class="lbl ${o.cls || ''}" x="${cx}" y="${ly + k * 14}">${esc(o.t)}</text>`;
      });
      h += `<g class="ev" data-i="${i}">${g}</g>`;
    });

    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.setAttribute('width', W * zoom);
    svg.setAttribute('height', Hh * zoom);
    svg.dataset.colw = colW * zoom;
    svg.innerHTML = h;
    mark(svg, cur);
  }

  // Marca la columna actual y la desplaza a la vista.
  function mark(svg, i) {
    svg.querySelectorAll('.cur').forEach(n => n.classList.remove('cur'));
    if (i < 0) return;
    svg.querySelectorAll(`[data-i="${i}"]`).forEach(n => n.classList.add('cur'));
    const box = svg.parentElement, cw = +svg.dataset.colw || 48;
    const x = 58 * (cw / 48) + i * cw;
    if (x < box.scrollLeft + 40 || x + cw > box.scrollLeft + box.clientWidth - 20)
      box.scrollTo({ left: Math.max(0, x - box.clientWidth / 3), behavior: 'smooth' });
  }

  /* ---------- Figuras rítmicas en una sola línea ----------
     items: [{ d: duración en negras (4 redonda … 0.25 semicorchea, 1/3 tresillo), rest, k: texto encima }] */
  const EPS = 1e-6;
  const isDotted = d => [3, 1.5, 0.75].some(v => Math.abs(d - v) < EPS);
  const beams = d => (d < 0.25 + EPS ? 2 : d < 1 - EPS ? 1 : 0);
  const RESTS = { 1: '𝄽', 0.5: '𝄾', 0.25: '𝄿' };

  function rhythm(svg, { items, meter, marks = [], cur = -1 }) {
    const [num, den] = meter;
    const barQ = num * 4 / den, grpQ = den === 8 ? 1.5 : 1;
    const ly = 74, stemH = 30, x0 = 66;
    const pos = [], bars = [];
    let x = x0, t = 0;
    items.forEach((it, i) => {
      pos.push({ x, t });
      x += Math.max(30, it.d * 58);
      t += it.d;
      if (Math.abs(t / barQ - Math.round(t / barQ)) < EPS && i < items.length - 1) { bars.push(x - 10); x += 8; }
    });
    const W = x + 10, Hh = 112;

    // Grupos de corcheas/semicorcheas unidas por barra dentro del mismo tiempo
    const group = new Array(items.length).fill(-1);
    let gi = 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i].rest || !beams(items[i].d) || group[i] >= 0) continue;
      const beat = Math.floor((pos[i].t + EPS) / grpQ);
      let j = i;
      while (j + 1 < items.length && !items[j + 1].rest && beams(items[j + 1].d)
        && Math.floor((pos[j + 1].t + EPS) / grpQ) === beat) j++;
      if (j > i) { for (let k = i; k <= j; k++) group[k] = gi; gi++; }
    }

    let h = `<line class="sl" x1="8" x2="${W - 4}" y1="${ly}" y2="${ly}"/>
      <text class="tsig" x="40" y="${ly - 4}">${num}</text><text class="tsig" x="40" y="${ly + 20}">${den}</text>`;
    bars.forEach(bx => { h += `<line class="sl bar" x1="${bx}" x2="${bx}" y1="${ly - 16}" y2="${ly + 16}"/>`; });
    h += `<line class="sl bar" x1="${W - 10}" x2="${W - 10}" y1="${ly - 16}" y2="${ly + 16}"/>
      <line class="sl bar end" x1="${W - 5}" x2="${W - 5}" y1="${ly - 16}" y2="${ly + 16}"/>`;

    const top = ly - stemH;
    items.forEach((it, i) => {
      const cx = pos[i].x, sx = cx + 5.8, m = marks[i] || '';
      let g = `<rect class="col" data-i="${i}" x="${cx - 13}" y="6" width="${Math.max(26, it.d * 58 - 4)}" height="${Hh - 12}" rx="7"/>`;
      if (it.k) g += `<text class="rk" x="${cx}" y="22">${esc(it.k)}</text>`;
      if (it.rest) {
        if (it.d >= 4 - EPS) g += `<rect class="rest" x="${cx - 7}" y="${ly}" width="14" height="5"/>`;
        else if (it.d >= 2 - EPS) g += `<rect class="rest" x="${cx - 7}" y="${ly - 5}" width="14" height="5"/>`;
        else g += `<text class="rest" x="${cx}" y="${ly + 10}">${RESTS[it.d >= 1 - EPS ? 1 : it.d >= 0.5 - EPS ? 0.5 : 0.25]}</text>`;
      } else {
        g += head(cx, ly, m || 'ink', it.d >= 2 - EPS);
        if (it.d < 4 - EPS) g += `<line class="stem" x1="${sx}" x2="${sx}" y1="${ly - 2}" y2="${top}"/>`;
        if (group[i] < 0) {
          for (let b = 0; b < beams(it.d); b++)
            g += `<path class="flag" d="M${sx},${top + b * 7} c1,6 9,8 8,18 c0,-6 -4,-9 -8,-11"/>`;
        }
      }
      if (isDotted(it.d)) g += `<circle class="dot-r" cx="${cx + 11}" cy="${ly - 3}" r="2"/>`;
      h += `<g class="ev" data-i="${i}">${g}</g>`;
    });

    // Barras de unión, barras secundarias (semicorcheas) y el "3" de los tresillos
    for (let g = 0; g < gi; g++) {
      const idx = items.map((_, i) => i).filter(i => group[i] === g);
      const xs = idx.map(i => pos[i].x + 5.8), a = xs[0], b = xs[xs.length - 1];
      h += `<rect class="beam" x="${a - 0.7}" y="${top}" width="${b - a + 1.4}" height="4.5"/>`;
      idx.forEach((i, k) => {
        if (beams(items[i].d) < 2) return;
        const prev = k > 0 && beams(items[idx[k - 1]].d) === 2, next = k < idx.length - 1 && beams(items[idx[k + 1]].d) === 2;
        if (next) h += `<rect class="beam" x="${xs[k]}" y="${top + 7}" width="${xs[k + 1] - xs[k]}" height="4.5"/>`;
        else if (!prev) {
          const w = 9, sx = k === idx.length - 1 ? xs[k] - w : xs[k];
          h += `<rect class="beam" x="${sx}" y="${top + 7}" width="${w}" height="4.5"/>`;
        }
      });
      if (idx.some(i => Math.abs(items[i].d - 1 / 3) < EPS))
        h += `<text class="tup" x="${(a + b) / 2}" y="${top - 5}">3</text>`;
    }

    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', Hh);
    svg.dataset.colw = 0;
    svg.innerHTML = h;
    markRhythm(svg, cur);
    return pos;
  }

  function markRhythm(svg, i) {
    svg.querySelectorAll('.cur').forEach(n => n.classList.remove('cur'));
    if (i >= 0) svg.querySelectorAll(`[data-i="${i}"]`).forEach(n => n.classList.add('cur'));
  }

  return { render, mark, rhythm, markRhythm };
})();
