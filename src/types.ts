export interface Word {
  id: number;
  w: string; // headword
  pos: string; // part of speech, e.g. "n./v."
  zh: string; // 繁中釋義
  lvl: 1 | 2; // 1 = 學測核心 4000, 2 = 指考進階
}

// Per-word spaced-repetition state. Kept compact for localStorage.
export interface WordProgress {
  box: number; // Leitner box 0..5 (0 = never studied/just learned)
  due: number; // next-due epoch ms
  seen: number; // times shown
  ok: number; // times correct
  ng: number; // times wrong
  last: number; // last reviewed epoch ms
}

export interface SaveState {
  v: number;
  startDay: string; // YYYY-MM-DD the plan started
  planDays: number; // total days in the plan (default 30)
  introduced: number; // how many words have been unlocked so far
  xp: number;
  streak: number;
  bestStreak: number;
  lastStudyDay: string; // YYYY-MM-DD
  coins: number;
  badges: string[];
  prog: Record<number, WordProgress>;
  daily: Record<string, number>; // YYYY-MM-DD -> reviews answered that day
  settings: { sound: boolean; voice: boolean; dailyNew: number };
}

export type Mode = "flash" | "mc-en" | "mc-zh" | "listen" | "spell";

export interface Question {
  word: Word;
  mode: Mode;
  options?: Word[]; // for multiple choice
}
