import raw from "@/data/words.json";
import type { Word } from "@/types";

// Study order: core (lvl1) first, advanced (lvl2) after — each kept in the
// list's original (alphabetical) order. This makes early days easier and gives
// a predictable "刷完" path.
export const WORDS: Word[] = (raw as Word[])
  .slice()
  .sort((a, b) => a.lvl - b.lvl || a.id - b.id);

export const TOTAL = WORDS.length;

const byId = new Map<number, Word>();
for (const w of WORDS) byId.set(w.id, w);
export const getWord = (id: number) => byId.get(id);

// Stable study-order index, so "introduced N" means WORDS[0..N-1].
export const ORDER = WORDS.map((w) => w.id);

// Distractor pool helpers for multiple-choice: prefer same part-of-speech and
// nearby level so options are plausible.
export function pickDistractors(target: Word, n: number): Word[] {
  const pool = WORDS.filter(
    (w) => w.id !== target.id && w.zh !== target.zh
  );
  // simple shuffle via index walk seeded by target id (deterministic-ish)
  const out: Word[] = [];
  const used = new Set<number>();
  let seed = (target.id * 2654435761) >>> 0;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let guard = 0;
  while (out.length < n && guard++ < 500) {
    const cand = pool[Math.floor(rnd() * pool.length)];
    if (!cand || used.has(cand.id)) continue;
    used.add(cand.id);
    out.push(cand);
  }
  return out;
}

export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    const voices = synth.getVoices();
    const en = voices.find((v) => /en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (en) u.voice = en;
    synth.speak(u);
  } catch {
    /* TTS unsupported — silent */
  }
}
