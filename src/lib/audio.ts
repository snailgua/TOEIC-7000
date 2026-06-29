// Tiny WebAudio sound-effects engine — no audio files, just synthesized tones.
// Kept dependency-free so it works offline and adds no bundle weight.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.18) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.02);
}

export const sfx = {
  correct() {
    tone(660, 0, 0.12, "sine");
    tone(990, 0.08, 0.16, "sine");
  },
  wrong() {
    tone(200, 0, 0.18, "sawtooth", 0.12);
    tone(150, 0.09, 0.2, "sawtooth", 0.12);
  },
  combo(n: number) {
    const base = 520 + Math.min(n, 8) * 70;
    tone(base, 0, 0.1, "triangle", 0.16);
    tone(base * 1.5, 0.06, 0.12, "triangle", 0.14);
  },
  levelup() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.18, "sine", 0.2));
  },
  finish() {
    [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.1, 0.22, "triangle", 0.2));
  },
  tap() {
    tone(440, 0, 0.05, "sine", 0.08);
  },
};
