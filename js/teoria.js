/* Pestaña Teoría: muestra el libro (js/teoria-libro.js) con ejemplos que suenan y se iluminan en el acordeón. */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const S = App.S;
  const KEY = 'teoria-leidas';
  let leidas = [];
  try { leidas = JSON.parse(App.store.get(KEY)) || []; } catch { /* sin datos guardados */ }
  let cap = 0, lec = 0, timers = [];

  // Lista plana de lecciones para «anterior / siguiente»
  const todas = LIBRO.flatMap((c, ci) => c.lecciones.map((l, li) => ({ ci, li, id: `${ci}.${li}` })));
  const pos = () => todas.findIndex(x => x.ci === cap && x.li === lec);

  /* ---------- Notas escritas como «Do4», «Fa#4», «Mib5» ---------- */
  const LETRAS = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const PC = [0, 2, 4, 5, 7, 9, 11];
  function nota(s) {
    const [, n, acc, oct] = s.match(/^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(\d)$/);
    const letter = LETRAS.indexOf(n);
    return { midi: 12 * (+oct + 1) + PC[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0), letter };
  }
  // «Do4+Mi4 Re4» → [[Do4, Mi4], [Re4]], en la altura real del acordeón elegido (los ejemplos están en Sol-Do-Fa)
  const pasos = ej => ej.split(' ').map(t => t.split('+').map(nota));

  /* ---------- Dibujo ---------- */
  function renderIndice() {
    const n = leidas.length;
    $('#tIndex').innerHTML = `<div class="t-prog">Leíste <b>${n}</b> de ${todas.length} lecciones
        <div class="bar"><i style="width:${Math.round(100 * n / todas.length)}%"></i></div></div>`
      + LIBRO.map((c, ci) => `<details ${ci === cap ? 'open' : ''}><summary>${ci + 1}. ${c.titulo}</summary>
        ${c.lecciones.map((l, li) => `<button class="t-lec ${ci === cap && li === lec ? 'active' : ''} ${leidas.includes(`${ci}.${li}`) ? 'leida' : ''}"
          data-c="${ci}" data-l="${li}">${leidas.includes(`${ci}.${li}`) ? '✓' : '○'} ${l.titulo}</button>`).join('')}</details>`).join('');
    $('#tSelect').innerHTML = todas.map(x => `<option value="${x.ci}.${x.li}">${x.ci + 1}.${x.li + 1} ${LIBRO[x.ci].lecciones[x.li].titulo}</option>`).join('');
    $('#tSelect').value = `${cap}.${lec}`;
  }

  function renderLeccion() {
    const c = LIBRO[cap], l = c.lecciones[lec], p = pos();
    let h = `<div class="t-head"><small>Capítulo ${cap + 1} · ${c.titulo}</small><h2>${lec + 1}. ${l.titulo}</h2></div>`;
    l.bloques.forEach((b, i) => {
      if (typeof b === 'string') h += `<p>${b}</p>`;
      else if (b.ej) h += `<div class="t-ej" data-i="${i}">
          <div class="t-ej-top"><button class="primary" data-play="${i}">▶ Escuchar</button><span>${b.label}</span></div>
          <div class="staff-wrap"><svg class="staff" id="tSt${i}"></svg></div></div>`;
      else if (b.ir) h += `<p><button class="t-ir" data-ir="${i}">➜ ${b.texto}</button></p>`;
      else if (b.q) h += `<div class="t-q" data-i="${i}"><b>✎ ${b.q}</b>
          <div class="answers">${b.opts.map((o, k) => `<button class="ans" data-k="${k}">${o}</button>`).join('')}</div>
          <div class="t-why"></div></div>`;
    });
    h += `<div class="t-nav">
        <button id="tPrev" ${p === 0 ? 'disabled' : ''}>◀ Anterior</button>
        <span>${p + 1} de ${todas.length}</span>
        <button id="tNext" class="primary" ${p === todas.length - 1 ? 'disabled' : ''}>Siguiente ▶</button></div>`;
    $('#tLesson').innerHTML = h;
    l.bloques.forEach((b, i) => { if (b.ej) dibujarEjemplo(b, i, -1); });
  }

  function dibujarEjemplo(b, i, cur) {
    const ps = pasos(b.ej), all = ps.flat().map(n => n.midi);
    const clef = Math.max(...all) < 60 ? 'bass' : 'treble';
    Staff.render($(`#tSt${i}`), {
      staves: [clef],
      events: ps.map(notes => ({ notes: { [clef]: notes }, cls: 'ink', lines: [notes.map(n => Music.spell(n.letter, n.midi)).join('·')] })),
      colW: ps.some(x => x.length > 1) ? 70 : 56, cur,
    });
  }

  function ir(dest) {
    App.tabOpen(dest.tab);
    if (dest.mode) $(`#solMode [data-m="${dest.mode}"]`).click();
    if (dest.key) {
      $('#cKey').value = dest.key;
      $('#cKey').dispatchEvent(new Event('change'));
      $('#cType').value = String(dest.type || 0);
      $('#cType').dispatchEvent(new Event('change'));
    }
    (dest.set || []).forEach(([sel, v]) => { const el = $(sel); el.value = v; el.dispatchEvent(new Event('change')); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Sonido e iluminación en el acordeón ---------- */
  function callar() { timers.forEach(clearTimeout); timers = []; }

  // Para cada paso busca botones en una misma dirección del fuelle; si no existen, suena igual sin iluminar
  function botones(midis) {
    const L = App.L;
    for (const d of ['pull', 'push']) {
      const bs = midis.map(m => L.treble.find(b => b[d] === m));
      if (bs.every(Boolean)) return { d, bs };
    }
    return null;
  }

  function tocar(i) {
    callar();
    const b = LIBRO[cap].lecciones[lec].bloques[i];
    const off = S.tuning.offset;
    const ps = pasos(b.ej);
    const gap = ps.some(x => x.length > 1) ? 1100 : 550;
    ps.forEach((notes, k) => timers.push(setTimeout(() => {
      const midis = notes.map(n => n.midi + off);  // transpuesto al tono del acordeón elegido
      Sound.treble(midis, gap / 1000 * 0.85);
      App.clearHl();
      const sitio = botones(midis);
      if (sitio) { sitio.bs.forEach(bt => App.addHl(S.hl, bt.id, sitio.d)); App.setBellows(sitio.d); } else App.setBellows(null);
      App.renderKeys();
      dibujarEjemplo(b, i, k);
    }, k * gap)));
    timers.push(setTimeout(() => dibujarEjemplo(b, i, -1), ps.length * gap + 300));
  }

  function responder(qEl, k) {
    const b = LIBRO[cap].lecciones[lec].bloques[+qEl.dataset.i];
    const ok = k === b.a;
    qEl.querySelectorAll('.ans').forEach(x => {
      x.classList.toggle('right', +x.dataset.k === b.a);
      x.classList.toggle('wrong', +x.dataset.k === k && !ok);
    });
    qEl.querySelector('.t-why').innerHTML = `<span class="${ok ? 'ok' : 'bad'}">${ok ? '✔ ¡Correcto!' : '✘ No es esa.'}</span> ${b.why}`;
  }

  function abrir(ci, li) {
    callar();
    cap = ci;
    lec = li;
    const id = `${ci}.${li}`;
    if (!leidas.includes(id)) { leidas.push(id); App.store.set(KEY, JSON.stringify(leidas)); }
    App.store.set('teoria-ultima', id);
    App.clearHl(); App.setBellows(null); App.renderKeys();
    renderIndice();
    renderLeccion();
    const top = $('#tLesson').getBoundingClientRect().top;
    if (top < 0) window.scrollBy(0, top - 60);
  }

  /* ---------- Eventos ---------- */
  $('#tIndex').addEventListener('click', e => {
    const b = e.target.closest('.t-lec');
    if (b) abrir(+b.dataset.c, +b.dataset.l);
  });
  $('#tSelect').addEventListener('change', e => { const [c, l] = e.target.value.split('.'); abrir(+c, +l); });
  $('#tLesson').addEventListener('click', e => {
    const t = e.target;
    if (t.id === 'tPrev') { const x = todas[pos() - 1]; abrir(x.ci, x.li); return; }
    if (t.id === 'tNext') { const x = todas[pos() + 1]; abrir(x.ci, x.li); return; }
    if (t.dataset.play != null) { tocar(+t.dataset.play); return; }
    if (t.dataset.ir != null) { ir(LIBRO[cap].lecciones[lec].bloques[+t.dataset.ir].ir); return; }
    const ans = t.closest('.ans');
    if (ans && ans.closest('.t-q')) responder(ans.closest('.t-q'), +ans.dataset.k);
  });

  App.hooks.teoria = () => {
    const last = (App.store.get('teoria-ultima') || '0.0').split('.').map(Number);
    if (LIBRO[last[0]] && LIBRO[last[0]].lecciones[last[1]]) { cap = last[0]; lec = last[1]; }
    renderIndice();
    renderLeccion();
  };
  const stopPrev = App.hooks.stop;
  App.hooks.stop = () => { callar(); if (stopPrev) stopPrev(); };
})();
