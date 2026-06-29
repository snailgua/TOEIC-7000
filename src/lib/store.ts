import { useSyncExternalStore } from "react";
import type { SaveState, WordProgress, Word } from "@/types";
import { WORDS, TOTAL, getWord } from "@/lib/words";
import { freshProgress, review, isDue, isMastered } from "@/lib/srs";
import { sfx, setSfxEnabled } from "@/lib/audio";

const KEY = "toeic7000:v1";
const DEFAULT_PLAN_DAYS = 30;
const DEFAULT_DAILY_NEW = Math.ceil(TOTAL / DEFAULT_PLAN_DAYS);

// ---- date helpers (local timezone) -----------------------------------------
function dayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ---- initial state ----------------------------------------------------------
function initial(): SaveState {
  const today = dayStr();
  return {
    v: 1,
    startDay: today,
    planDays: DEFAULT_PLAN_DAYS,
    introduced: 0,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastStudyDay: "",
    coins: 0,
    badges: [],
    prog: {},
    daily: {},
    settings: { sound: true, voice: true, dailyNew: DEFAULT_DAILY_NEW },
  };
}

let state: SaveState = load();

function load(): SaveState {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return initial();
    const parsed = JSON.parse(s) as SaveState;
    const base = initial();
    const merged = { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
    setSfxEnabled(merged.settings.sound);
    return merged;
  } catch {
    return initial();
  }
}

const listeners = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}
function set(updater: (s: SaveState) => SaveState) {
  state = updater(state);
  emit();
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export const getState = () => state;
export function useStore(): SaveState {
  return useSyncExternalStore(subscribe, getState, getState);
}

// ---- level / xp -------------------------------------------------------------
// Cumulative XP to reach level n: 50 * n * (n+1). Level 1 starts at 0.
export function levelInfo(xp: number) {
  const cum = (n: number) => 50 * n * (n + 1);
  let level = 1;
  while (cum(level) <= xp) level++;
  const floor = cum(level - 1);
  const ceil = cum(level);
  return {
    level,
    intoLevel: xp - floor,
    levelSpan: ceil - floor,
    pct: Math.min(100, Math.round(((xp - floor) / (ceil - floor)) * 100)),
  };
}

// ---- plan / day -------------------------------------------------------------
export function planDayNumber(s: SaveState = state): number {
  return Math.min(s.planDays, daysBetween(s.startDay, dayStr()) + 1);
}
// new words allowed to be introduced through today (lets you catch up if behind)
export function newQuotaToday(s: SaveState = state): number {
  const allowedByToday = Math.min(TOTAL, planDayNumber(s) * s.settings.dailyNew);
  return Math.max(0, allowedByToday - s.introduced);
}
export const masteredCount = (s: SaveState = state) =>
  Object.values(s.prog).filter(isMastered).length;
export const masteryPct = (s: SaveState = state) =>
  Math.round((masteredCount(s) / TOTAL) * 100);
export const learnedCount = (s: SaveState = state) => s.introduced;

// ---- queue building ---------------------------------------------------------
export function dueReviews(now: number, s: SaveState = state): Word[] {
  const out: Word[] = [];
  for (const idStr of Object.keys(s.prog)) {
    const id = Number(idStr);
    const p = s.prog[id];
    if (p.box > 0 && isDue(p, now)) {
      const w = getWord(id);
      if (w) out.push(w);
    }
  }
  // soonest-due first
  out.sort((a, b) => s.prog[a.id].due - s.prog[b.id].due);
  return out;
}
export function newWordsToLearn(limit?: number, s: SaveState = state): Word[] {
  const quota = limit ?? newQuotaToday(s);
  return WORDS.slice(s.introduced, s.introduced + quota);
}
export function dueCount(now: number, s: SaveState = state): number {
  return dueReviews(now, s).length;
}

// ---- badges -----------------------------------------------------------------
export const BADGES: { id: string; name: string; emoji: string; desc: string; test: (s: SaveState) => boolean }[] = [
  { id: "first", name: "啟程", emoji: "🚀", desc: "完成第一個單字", test: (s) => s.introduced >= 1 },
  { id: "n100", name: "百字斬", emoji: "💯", desc: "學過 100 個單字", test: (s) => s.introduced >= 100 },
  { id: "n1000", name: "千字王", emoji: "👑", desc: "學過 1000 個單字", test: (s) => s.introduced >= 1000 },
  { id: "half", name: "半程英雄", emoji: "⛰️", desc: "學過一半單字", test: (s) => s.introduced >= TOTAL / 2 },
  { id: "all", name: "7000 達成", emoji: "🏆", desc: "學完所有單字", test: (s) => s.introduced >= TOTAL },
  { id: "streak3", name: "三日連火", emoji: "🔥", desc: "連續 3 天學習", test: (s) => s.bestStreak >= 3 },
  { id: "streak7", name: "一週不斷", emoji: "🗓️", desc: "連續 7 天學習", test: (s) => s.bestStreak >= 7 },
  { id: "streak30", name: "月之達人", emoji: "🌙", desc: "連續 30 天學習", test: (s) => s.bestStreak >= 30 },
  { id: "master100", name: "熟練百字", emoji: "🧠", desc: "精熟 100 個單字", test: (s) => masteredCount(s) >= 100 },
  { id: "lv10", name: "十級玩家", emoji: "⭐", desc: "達到等級 10", test: (s) => levelInfo(s.xp).level >= 10 },
];

function recomputeBadges(s: SaveState): string[] {
  const have = new Set(s.badges);
  const fresh: string[] = [];
  for (const b of BADGES) if (b.test(s) && !have.has(b.id)) fresh.push(b.id);
  return fresh;
}

// ---- actions ----------------------------------------------------------------
export interface AnswerResult {
  correct: boolean;
  xpGain: number;
  newBadges: string[];
  leveledUp: boolean;
}

// Touch streak/day bookkeeping for "studied today".
function touchStreak(s: SaveState): SaveState {
  const today = dayStr();
  if (s.lastStudyDay === today) return s;
  let streak = 1;
  if (s.lastStudyDay && daysBetween(s.lastStudyDay, today) === 1) streak = s.streak + 1;
  const bestStreak = Math.max(s.bestStreak, streak);
  return { ...s, streak, bestStreak, lastStudyDay: today };
}

export function answer(wordId: number, correct: boolean, combo: number): AnswerResult {
  const now = Date.now();
  let leveledUp = false;
  let xpGain = 0;
  let newBadges: string[] = [];

  set((s0) => {
    let s = touchStreak(s0);
    const prev = s.prog[wordId] ?? freshProgress(now);
    const wasNew = prev.box === 0 && prev.seen === 0;
    const np = review(prev, correct, now);

    const beforeLevel = levelInfo(s.xp).level;
    xpGain = correct ? 10 + Math.min(combo, 10) * 2 : 1;
    if (wasNew) xpGain += 5;
    const xp = s.xp + xpGain;
    leveledUp = levelInfo(xp).level > beforeLevel;

    const today = dayStr();
    s = {
      ...s,
      prog: { ...s.prog, [wordId]: np },
      xp,
      coins: s.coins + (correct ? 1 + Math.min(combo, 5) : 0),
      daily: { ...s.daily, [today]: (s.daily[today] ?? 0) + 1 },
    };
    newBadges = recomputeBadges(s);
    if (newBadges.length) s = { ...s, badges: [...s.badges, ...newBadges] };
    return s;
  });

  if (correct) (combo >= 3 ? sfx.combo(combo) : sfx.correct());
  else sfx.wrong();
  if (leveledUp) sfx.levelup();

  return { correct, xpGain, newBadges, leveledUp };
}

// Mark a brand-new word as introduced (used when a "learn" card is flipped/seen)
export function introduceUpTo(count: number) {
  set((s) => (count > s.introduced ? { ...s, introduced: Math.min(TOTAL, count) } : s));
}
export function introduceOne() {
  set((s) => ({ ...s, introduced: Math.min(TOTAL, s.introduced + 1) }));
}

export function setSettings(patch: Partial<SaveState["settings"]>) {
  set((s) => {
    const settings = { ...s.settings, ...patch };
    setSfxEnabled(settings.sound);
    return { ...s, settings };
  });
}

export function resetAll() {
  state = initial();
  emit();
}

export function exportData(): string {
  return JSON.stringify(state);
}
export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as SaveState;
    if (typeof parsed !== "object" || !parsed.prog) return false;
    const base = initial();
    state = { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
    setSfxEnabled(state.settings.sound);
    emit();
    return true;
  } catch {
    return false;
  }
}

export { dayStr };
export type { WordProgress };
