import {
  useStore,
  BADGES,
  levelInfo,
  masteredCount,
  masteryPct,
} from "@/lib/store";
import { TOTAL } from "@/lib/words";
import { Ring, Stat } from "@/components/ui";

export default function Achievements() {
  const s = useStore();
  const have = new Set(s.badges);
  const lvl = levelInfo(s.xp);

  return (
    <div className="px-4 pb-28 pt-5">
      <h1 className="px-1 text-xl font-extrabold">成就</h1>

      <div className="mt-4 flex items-center gap-5 rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <Ring pct={masteryPct(s)} color="#34d399">
          <div className="text-center">
            <div className="text-2xl font-extrabold">{masteryPct(s)}%</div>
            <div className="text-[11px] text-slate-500">精熟度</div>
          </div>
        </Ring>
        <div className="flex-1 space-y-2">
          <Stat emoji="⭐" label="等級" value={lvl.level} />
          <Stat emoji="🧠" label="精熟單字" value={`${masteredCount(s)} / ${TOTAL}`} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat emoji="🔥" label="目前連續" value={`${s.streak} 天`} />
        <Stat emoji="🏅" label="最佳連續" value={`${s.bestStreak} 天`} />
        <Stat emoji="🪙" label="金幣" value={s.coins} />
      </div>

      <div className="mt-6 px-1 text-sm font-bold text-slate-600">徽章 ({have.size}/{BADGES.length})</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {BADGES.map((b) => {
          const got = have.has(b.id);
          return (
            <div
              key={b.id}
              className={`rounded-2xl p-4 ring-1 transition ${
                got ? "bg-amber-400/12 ring-amber-300/30" : "bg-white ring-slate-200"
              }`}
            >
              <div className={`text-3xl ${got ? "" : "grayscale opacity-35"}`}>{b.emoji}</div>
              <div className={`mt-1.5 font-bold ${got ? "text-amber-600" : "text-slate-500"}`}>{b.name}</div>
              <div className="text-xs text-slate-400">{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
