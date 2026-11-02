/* Sonido sintetizado tipo lengüeta: tres voces desafinadas (Tres Coronas) para los pitos; también piano. */
const Sound = (() => {
  let ctx = null, master = null, bus = null;

  // tremolo = cuántos cents se separan las voces de arriba y abajo de la del centro.
  const PRESETS = {
    seco:       { name: 'Seco',       tremolo: 0,  cutoff: 3000 },
    armonizado: { name: 'Armonizado', tremolo: 6,  cutoff: 2800 },
    brillante:  { name: 'Brillante',  tremolo: 15, cutoff: 3800 },
    lluvia:     { name: 'Lluvia',     tremolo: 26, cutoff: 3400 },
  };
  let tremolo = PRESETS.brillante.tremolo, cutoff = PRESETS.brillante.cutoff;

  function newBus() {
    bus = ctx.createGain();
    bus.connect(master);
  }

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createDynamicsCompressor();
      const g = ctx.createGain();
      g.gain.value = 0.9;
      master.connect(g);
      g.connect(ctx.destination);
      newBus();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  // at = momento exacto (reloj de audio) en que empieza la nota; si falta, suena ya.
  function voice(midis, dur, { detunes, cutoff, level }, at) {
    const c = ensure(), t = at ?? c.currentTime + 0.01;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.035);
    env.gain.setValueAtTime(level, t + dur);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    lp.connect(env);
    env.connect(bus);
    const part = 1 / (detunes.length * Math.max(1, midis.length * 0.7));
    midis.forEach(m => detunes.forEach(d => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq(m);
      o.detune.value = d;
      const g = c.createGain();
      g.gain.value = part;
      o.connect(g);
      g.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.2);
    }));
  }

  // Piano: armónicos que se apagan solos (los agudos antes), golpe rápido y brillo que se cierra con el tiempo.
  let pianoWave = null;
  function piano(midis, dur, level, at) {
    const c = ensure(), t = at ?? c.currentTime + 0.01;
    if (!pianoWave) {
      const amps = [0, 1, 0.55, 0.3, 0.2, 0.12, 0.08, 0.05, 0.03];
      pianoWave = c.createPeriodicWave(new Float32Array(amps.length), Float32Array.from(amps));
    }
    const part = level / Math.max(1, midis.length * 0.75);
    midis.forEach(m => {
      const decay = Math.max(0.35, 1.6 - (m - 48) * 0.025);  // las notas graves duran más
      const end = t + Math.max(dur, 0.15);
      const env = c.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(part, t + 0.006);
      env.gain.setTargetAtTime(part * 0.25, t + 0.006, decay);
      env.gain.setTargetAtTime(0.0001, end, 0.08);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(9000, freq(m) * 9), t);
      lp.frequency.setTargetAtTime(Math.min(4000, freq(m) * 3), t, 0.4);
      lp.connect(env);
      env.connect(bus);
      // Dos cuerdas casi al unísono, como en el piano
      [-1.5, 1.5].forEach(d => {
        const o = c.createOscillator();
        o.setPeriodicWave(pianoWave);
        o.frequency.value = freq(m);
        o.detune.value = d;
        o.connect(lp);
        o.start(t);
        o.stop(end + 0.6);
      });
    });
  }
  let instrument = 'acordeon';

  // Golpe corto de metrónomo (más agudo en el primer tiempo del compás).
  function click(accent, at) {
    const c = ensure(), t = at ?? c.currentTime + 0.01;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1760 : 1175;
    g.gain.setValueAtTime(accent ? 0.28 : 0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.06);
  }

  // Frecuencia fundamental de un trozo de audio del micrófono (autocorrelación); −1 si hay silencio.
  function detectPitch(input, rate) {
    let n = input.length, rms = 0;
    for (let i = 0; i < n; i++) rms += input[i] * input[i];
    if (Math.sqrt(rms / n) < 0.012) return -1;
    // Recorta los bordes hasta el primer cruce suave para evitar saltos
    let a = 0, b = n - 1;
    for (let i = 0; i < n / 2; i++) if (Math.abs(input[i]) < 0.2) { a = i; break; }
    for (let i = 1; i < n / 2; i++) if (Math.abs(input[n - i]) < 0.2) { b = n - i; break; }
    const buf = input.slice(a, b);
    n = buf.length;
    const maxLag = Math.min(n - 1, Math.floor(rate / 60));  // nada por debajo de ~60 Hz
    const c = new Float32Array(maxLag + 1);
    for (let lag = 0; lag <= maxLag; lag++) {
      let s = 0;
      for (let j = 0; j < n - lag; j++) s += buf[j] * buf[j + lag];
      c[lag] = s;
    }
    let d = 0;
    while (d < maxLag && c[d] > c[d + 1]) d++;
    let best = -1, pos = -1;
    for (let i = d; i <= maxLag; i++) if (c[i] > best) { best = c[i]; pos = i; }
    if (pos <= 0 || best < c[0] * 0.3) return -1;
    // Interpolación parabólica para afinar entre muestras
    const x1 = c[pos - 1], x2 = c[pos], x3 = c[pos + 1] ?? x2;
    const p = (x1 + x3 - 2 * x2) / 2, q = (x3 - x1) / 2;
    return rate / (p ? pos - q / (2 * p) : pos);
  }

  return {
    PRESETS,
    detectPitch,
    setPreset: id => { tremolo = PRESETS[id].tremolo; cutoff = PRESETS[id].cutoff; },
    setTremolo: c => { tremolo = c; },
    // 'acordeon' o 'piano' (lo elige la pestaña de Solfeo)
    setInstrument: i => { instrument = i; },
    treble: (midis, dur = 0.5, at) => (instrument === 'piano'
      ? piano(midis, dur, 0.5, at)
      : voice(midis, dur, { detunes: tremolo ? [0, -tremolo, tremolo] : [0], cutoff, level: 0.22 }, at)),
    bass: (midi, dur = 0.35, at) => (instrument === 'piano'
      ? piano([midi, midi + 12], dur, 0.55, at)
      : voice([midi, midi + 12], dur, { detunes: [0, 4], cutoff: 900, level: 0.3 }, at)),
    bassChord: (midis, dur = 0.3, at) => (instrument === 'piano'
      ? piano(midis, dur, 0.4, at)
      : voice(midis, dur, { detunes: [0, 5], cutoff: 1400, level: 0.18 }, at)),
    click,
    now: () => ensure().currentTime,
    // Retraso entre programar un sonido y oírlo (para medir el ritmo con justicia)
    latency: () => { const c = ensure(); return (c.outputLatency || 0) + (c.baseLatency || 0); },
    // Silencia todo lo programado
    cut: () => { if (!ctx) return; bus.disconnect(); newBus(); },
  };
})();
