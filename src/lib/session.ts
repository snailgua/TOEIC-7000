import type { Word, Mode } from "@/types";
import { WORDS } from "@/lib/words";
import {
  dueReviews,
  newWordsToLearn,
  newQuotaToday,
  getState,
} from "@/lib/store";

export interface Step {
  word: Word;
  mode: Mode;
}

// Choose a quiz mode for a review based on how well the word is known.
// Higher box → harder recall mode. `voice` gates listening mode.
function reviewMode(box: number, voice: boolean): Mode {
  if (box <= 1) return "mc-en"; // see English, pick 中文 (easiest)
  if (box === 2) return "mc-zh"; // see 中文, pick English
  if (box === 3) return voice ? "listen" : "mc-zh";
  return "spell"; // box >= 4: type it out
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Today's mission: learn new words (flashcards) + clear due reviews.
export function buildDaily(maxNew = 0): Step[] {
  const s = getState();
  const voice = s.settings.voice;
  const newQuota = maxNew > 0 ? Math.min(maxNew, newQuotaToday(s)) : newQuotaToday(s);
  const news = newWordsToLearn(newQuota, s).map<Step>((word) => ({ word, mode: "flash" }));
  const reviews = dueReviews(Date.now(), s)
    .slice(0, 80)
    .map<Step>((word) => ({ word, mode: reviewMode(s.prog[word.id]?.box ?? 1, voice) }));
  // interleave a few reviews between new words so it doesn't feel like a wall
  return [...news, ...reviews];
}

// Pure review session (no new words).
export function buildReview(limit = 60): Step[] {
  const s = getState();
  const voice = s.settings.voice;
  return dueReviews(Date.now(), s)
    .slice(0, limit)
    .map<Step>((word) => ({ word, mode: reviewMode(s.prog[word.id]?.box ?? 1, voice) }));
}

// Practice a single mode over already-introduced words (random).
export function buildModePractice(mode: Mode, count = 15): Step[] {
  const s = getState();
  const pool = WORDS.slice(0, Math.max(s.introduced, 20));
  return shuffle(pool)
    .slice(0, count)
    .map<Step>((word) => ({ word, mode }));
}
