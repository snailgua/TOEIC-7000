import type { WordProgress } from "@/types";

// Leitner-style boxes. Interval (in days) until a word is due again after a
// correct answer at each box. Box 0 = brand new.
const INTERVALS_DAYS = [0, 1, 2, 4, 8, 16, 32];
export const MAX_BOX = INTERVALS_DAYS.length - 1; // 6
const DAY = 86_400_000;

export function freshProgress(now: number): WordProgress {
  return { box: 0, due: now, seen: 0, ok: 0, ng: 0, last: 0 };
}

// A word is "mastered" once it has climbed to a high box.
export const MASTERED_BOX = 5;
export const isMastered = (p?: WordProgress) => !!p && p.box >= MASTERED_BOX;

export function review(
  p: WordProgress,
  correct: boolean,
  now: number
): WordProgress {
  const box = correct ? Math.min(p.box + 1, MAX_BOX) : Math.max(1, p.box - 2);
  // wrong answers also re-queue within the same session (due now)
  const interval = correct ? INTERVALS_DAYS[box] : 0;
  return {
    box,
    due: now + interval * DAY,
    seen: p.seen + 1,
    ok: p.ok + (correct ? 1 : 0),
    ng: p.ng + (correct ? 0 : 1),
    last: now,
  };
}

export const isDue = (p: WordProgress | undefined, now: number) =>
  !!p && p.due <= now;
