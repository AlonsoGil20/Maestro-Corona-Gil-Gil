/* Sonido sintetizado tipo lengüeta: tres voces desafinadas (Tres Coronas) para los pitos. */
const Sound = (() => {
  let ctx = null, master = null;

  // tremolo = cuántos cents se separan las voces de arriba y abajo de la del centro.
  const PRESETS = {
    seco:       { name: 'Seco',       tremolo: 0,  cutoff: 3000 },
    armonizado: { name: 'Armonizado', tremolo: 6,  cutoff: 2800 },
    brillante:  { name: 'Brillante',  tremolo: 15, cutoff: 3800 },
    lluvia:     { name: 'Lluvia',     tremolo: 26, cutoff: 3400 },
  };
  let tremolo = PRESETS.brillante.tremolo, cutoff = PRESETS.brillante.cutoff;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createDynamicsCompressor();
      const g = ctx.createGain();
      g.gain.value = 0.9;
      master.connect(g);
      g.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  function voice(midis, dur, { detunes, cutoff, level }) {
    const c = ensure(), t = c.currentTime + 0.01;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + 0.035);
    env.gain.setValueAtTime(level, t + dur);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    lp.connect(env);
    env.connect(master);
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

  return {
    PRESETS,
    setPreset: id => { tremolo = PRESETS[id].tremolo; cutoff = PRESETS[id].cutoff; },
    setTremolo: c => { tremolo = c; },
    treble: (midis, dur = 0.5) => voice(midis, dur, {
      detunes: tremolo ? [0, -tremolo, tremolo] : [0], cutoff, level: 0.22,
    }),
    bass: (midi, dur = 0.35) => voice([midi, midi + 12], dur, { detunes: [0, 4], cutoff: 900, level: 0.3 }),
    bassChord: (midis, dur = 0.3) => voice(midis, dur, { detunes: [0, 5], cutoff: 1400, level: 0.18 }),
  };
})();
