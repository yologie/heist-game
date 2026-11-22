// Midnight Vault — all sound is synthesized with WebAudio. No audio files,
// no network: short oscillator blips and one filtered-noise puff.

let ctx = null;
let muted = false;
let alarmBeepAt = 0;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Browsers only let audio start after a user gesture; call this from the
// first key press or click so the context exists by the time a cue plays.
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function puff(dur = 0.35) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.25, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  click() {
    tone(660, 0.07, 'square', 0.08);
  },
  pickup() {
    tone(880, 0.09, 'sine', 0.16);
    tone(1318, 0.14, 'sine', 0.14, 0.07);
  },
  diamond() {
    tone(1046, 0.1, 'sine', 0.16);
    tone(1568, 0.12, 'sine', 0.14, 0.08);
    tone(2093, 0.2, 'sine', 0.12, 0.16);
  },
  smoke() {
    puff(0.4);
  },
  exitOpen() {
    tone(523, 0.1, 'triangle', 0.14);
    tone(784, 0.16, 'triangle', 0.14, 0.09);
  },
  roomClear() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, i * 0.1));
  },
  caught() {
    tone(392, 0.22, 'sawtooth', 0.14, 0, 196);
    tone(196, 0.4, 'sawtooth', 0.14, 0.18, 98);
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.15, i * 0.11));
  },
  tick() {
    tone(1200, 0.05, 'square', 0.06);
  },
};

// While the thief is inside a cone, beep faster the hotter the alarm gets.
export function alarmTick(alarm) {
  if (!ctx || muted || alarm < 5) return;
  const now = performance.now();
  const gap = alarm > 70 ? 260 : alarm > 35 ? 480 : 800;
  if (now - alarmBeepAt >= gap) {
    alarmBeepAt = now;
    tone(alarm > 70 ? 980 : 740, 0.06, 'square', 0.07);
  }
}
