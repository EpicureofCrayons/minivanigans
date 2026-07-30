// Tiny synthesized sound effects for the match screen. Everything is generated
// with WebAudio oscillators/noise — no audio assets, so the app stays fully
// offline and the bundle stays light. Volumes are deliberately gentle.

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SfxPrefs {
  muted: boolean;
  setMuted: (m: boolean) => void;
}

export const useSfxPrefs = create<SfxPrefs>()(
  persist(
    (set) => ({
      muted: false,
      setMuted: (muted) => set({ muted }),
    }),
    { name: "day-shifters:sfx" }
  )
);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Lazily create (and resume) the shared AudioContext. Null when unavailable. */
function audio(): { ctx: AudioContext; master: GainNode } | null {
  if (useSfxPrefs.getState().muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return master ? { ctx, master } : null;
  } catch {
    return null;
  }
}

/** One oscillator note: frequency (optionally sliding to `to`), duration, shape. */
function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; at?: number; to?: number } = {}
) {
  const a = audio();
  if (!a) return;
  const { type = "sine", gain = 0.18, at = 0, to } = opts;
  const t0 = a.ctx.currentTime + at;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
  osc.connect(g).connect(a.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** A short filtered noise burst — the "physical contact" layer. */
function thump(dur: number, opts: { gain?: number; cutoff?: number; at?: number } = {}) {
  const a = audio();
  if (!a) return;
  const { gain = 0.22, cutoff = 1200, at = 0 } = opts;
  const t0 = a.ctx.currentTime + at;
  const frames = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
  const buf = a.ctx.createBuffer(1, frames, a.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const filter = a.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
  src.connect(filter).connect(g).connect(a.master);
  src.start(t0);
}

/** The match-screen sound board. Each call is fire-and-forget and mute-aware. */
export const sfx = {
  /** An attack lands: contact thump + a low body note. */
  hit() {
    thump(0.09, { gain: 0.26, cutoff: 1800 });
    tone(160, 0.16, { type: "square", gain: 0.1, to: 85 });
  },
  /** Dodged — an airy downward whiff, no contact. */
  miss() {
    tone(650, 0.22, { type: "sine", gain: 0.1, to: 220 });
  },
  /** Not So Fast: a blunt interruption. */
  cancel() {
    tone(210, 0.1, { type: "square", gain: 0.14 });
    tone(140, 0.16, { type: "square", gain: 0.12, at: 0.09 });
  },
  /** Knockout: heavy contact + a long falling growl. */
  ko() {
    thump(0.16, { gain: 0.3, cutoff: 900 });
    tone(220, 0.55, { type: "sawtooth", gain: 0.14, to: 50 });
  },
  /** Healing: two soft rising chimes. */
  heal() {
    tone(523, 0.14, { gain: 0.1 });
    tone(784, 0.22, { gain: 0.1, at: 0.11 });
  },
  /** A Support card is played: a quick card-swoosh. */
  card() {
    thump(0.14, { gain: 0.1, cutoff: 3800 });
    tone(880, 0.1, { type: "triangle", gain: 0.06, at: 0.03, to: 1180 });
  },
  /** Sneak Peek: a small sparkle. */
  peek() {
    tone(1180, 0.09, { type: "triangle", gain: 0.08 });
    tone(1568, 0.14, { type: "triangle", gain: 0.08, at: 0.08 });
  },
  /** Your turn begins: one soft tick. */
  turn() {
    tone(880, 0.06, { type: "triangle", gain: 0.07 });
  },
  /** Victory: a little rising fanfare. */
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(f, i === notes.length - 1 ? 0.5 : 0.16, { type: "triangle", gain: 0.14, at: i * 0.13 }));
  },
  /** Defeat: three descending notes, gently. */
  lose() {
    const notes = [330, 262, 220];
    notes.forEach((f, i) => tone(f, i === notes.length - 1 ? 0.55 : 0.2, { type: "triangle", gain: 0.12, at: i * 0.17 }));
  },
};
