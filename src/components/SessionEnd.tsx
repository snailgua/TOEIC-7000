import { useEffect } from "react";
import type { Word } from "@/types";
import { BADGES } from "@/lib/store";
import { burst, bigCelebrate } from "@/lib/confetti";
import { sfx } from "@/lib/audio";

export default function SessionEnd({
  results,
  bestCombo,
  gainedXp,
  newBadges,
  leveled,
  onExit,
}: {
  results: { word: Word; correct: boolean }[];
  bestCombo: number;
  gainedXp: number;
  newBadges: string[];
  leveled: boolean;
  onExit: () => void;
}) {
  const total = results.length;
  const right = results.filter((r) => r.correct).length;
  const acc = total ? Math.round((right / total) * 100) : 0;
  const wrongWords = results.filter((r) => !r.correct).map((r) => r.word);
  const earnedBadges = BADGES.filter((b) => newBadges.includes(b.id));

  useEffect(() => {
    sfx.finish();
    if (leveled || earnedBadges.length || acc === 100) bigCelebrate();
    else burst();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#0a0e1c]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <div className="animate-slideUp">
          <div className="text-center">
            <div className="text-6xl">{acc === 100 ? "🌟" : acc >= 70 ? "🎉" : "💪"}</div>
            <h1 className="mt-3 text-2xl font-extrabold">完成！</h1>
            <p className="mt-1 text-sm text-slate-400">
              {acc === 100 ? "完美全對，太強了！" : acc >= 70 ? "表現很棒，繼續保持！" : "穩穩前進，明天再戰！"}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Tile label="正確率" value={`${acc}%`} />
            <Tile label="獲得 XP" value={`+${gainedXp}`} />
            <Tile label="最高連對" value={`🔥${bestCombo}`} />
          </div>

          {leveled && (
            <div className="mt-4 animate-pop rounded-2xl bg-gradient-to-r from-amber-400/30 to-orange-400/20 p-4 text-center ring-1 ring-amber-300/40">
              <div className="text-lg font-extrabold text-amber-200">⬆️ 升級了！</div>
            </div>
          )}

          {earnedBadges.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="mb-2 text-sm font-semibold text-slate-300">解鎖成就</div>
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map((b) => (
                  <div key={b.id} className="animate-pop flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2">
                    <span className="text-xl">{b.emoji}</span>
                    <span className="text-sm font-bold text-amber-200">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wrongWords.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="mb-2 text-sm font-semibold text-rose-300">要再記的 ({wrongWords.length})</div>
              <ul className="space-y-1.5">
                {wrongWords.map((w) => (
                  <li key={w.id} className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{w.w}</span>
                    <span className="text-slate-400">{w.zh}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8">
          <button
            onClick={onExit}
            className="w-full rounded-2xl bg-cyan-500 py-4 text-base font-extrabold text-slate-900"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 py-3 ring-1 ring-white/10">
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}
