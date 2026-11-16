// WebAudio synth effects + a soft ambient pad. No audio files: everything is
// generated, and the context only starts after the player's first input.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    padNodes: null,
  };

  function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      audio.ctx = new AC();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = audio.muted ? 0 : 0.5;
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!ensure() || audio.muted) return;
    const t0 = audio.ctx.currentTime + delay;
    const osc = audio.ctx.createOscillator();
    const g = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, freq, delay = 0) {
    if (!ensure() || audio.muted) return;
    const t0 = audio.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(audio.ctx.sampleRate * dur));
    const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.ctx.createBufferSource();
    src.buffer = buf;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const g = audio.ctx.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(audio.master);
    src.start(t0);
  }

  audio.unlock = function unlock() {
    ensure();
  };

  audio.setMuted = function setMuted(m) {
    audio.muted = m;
    if (audio.master) audio.master.gain.value = m ? 0 : 0.5;
  };

  audio.burn = function burn() {
    noise(0.14, 0.22, 2400);
    tone(720, 0.1, 'square', 0.06, 240);
  };
  audio.pulse = function pulse() {
    tone(392, 0.16, 'sine', 0.22, 784);
    tone(523, 0.18, 'sine', 0.18, 1046, 0.05);
    tone(784, 0.24, 'sine', 0.16, 1568, 0.1);
    noise(0.25, 0.12, 900);
  };
  audio.hurt = function hurt() {
    tone(140, 0.28, 'sawtooth', 0.22, 55);
    noise(0.18, 0.18, 300);
  };
  audio.wave = function wave() {
    tone(262, 0.18, 'triangle', 0.2);
    tone(392, 0.22, 'triangle', 0.2, null, 0.12);
  };
  audio.clear = function clear() {
    tone(523, 0.14, 'triangle', 0.2);
    tone(659, 0.14, 'triangle', 0.2, null, 0.09);
    tone(784, 0.22, 'triangle', 0.22, null, 0.18);
  };
  audio.upgrade = function upgrade() {
    tone(660, 0.12, 'sine', 0.2);
    tone(880, 0.2, 'sine', 0.2, null, 0.08);
  };
  audio.win = function win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'triangle', 0.2, null, i * 0.11));
  };
  audio.lose = function lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.34, 'sawtooth', 0.14, null, i * 0.16));
  };
  audio.click = function click() {
    tone(880, 0.06, 'sine', 0.14, 660);
  };

  audio.startPad = function startPad() {
    if (!ensure() || audio.padNodes) return;
    const g = audio.ctx.createGain();
    g.gain.value = 0.035;
    g.connect(audio.master);
    const freqs = [110, 164.8, 220];
    const oscs = freqs.map((f, i) => {
      const o = audio.ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = i * 4 - 4;
      o.connect(g);
      o.start();
      return o;
    });
    const lfo = audio.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = audio.ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    audio.padNodes = { oscs, lfo, g };
  };

  return audio;
}
