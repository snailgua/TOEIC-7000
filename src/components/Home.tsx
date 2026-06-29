import type { Step } from "@/lib/session";
import { buildDaily, buildReview, buildModePractice } from "@/lib/session";
import type { Mode } from "@/types";
import {
  useStore,
  levelInfo,
  planDayNumber,
  newQuotaToday,
  dueCount,
  masteryPct,
  masteredCount,
} from "@/lib/store";
import { TOTAL } from "@/lib/words";
import { Ring, Bar, Stat, Card } from "@/components/ui";
import { sfx } from "@/lib/audio";

export default function Home({ launch }: { launch: (steps: Step[], title: string) => void }) {
  const s = useStore();
  const lvl = levelInfo(s.xp);
  const day = planDayNumber(s);
  const newToday = newQuotaToday(s);
  const due = dueCount(Date.now(), s);
  const mastery = masteryPct(s);
  const planPct = Math.round((s.introduced / TOTAL) * 100);

  const go = (build: () => Step[], title: string) => () => {
    sfx.tap();
    launch(build(), title);
  };

  const practice: { mode: Mode; label: string; emoji: string }[] = [
    { mode: "mc-en", label: "看英選中", emoji: "🟢" },
    { mode: "mc-zh", label: "看中選英", emoji: "🔵" },
    { mode: "listen", label: "聽力", emoji: "🎧" },
    { mode: "spell", label: "拼字", emoji: "⌨️" },
  ];

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      {/* header: level + streak */}
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-lg font-extrabold text-slate-900">
          {lvl.level}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">等級 {lvl.level}</span>
            <span className="text-slate-400">
              {lvl.intoLevel}/{lvl.levelSpan} XP
            </span>
          </div>
          <div className="mt-1">
            <Bar pct={lvl.pct} />
          </div>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-amber-400/15 px-3 py-1.5">
          <span className="text-lg leading-none">🔥</span>
          <span className="text-sm font-extrabold text-amber-300">{s.streak}</span>
        </div>
      </div>

      {/* day ring + plan */}
      <Card className="flex items-center gap-5 p-5">
        <Ring pct={(day / s.planDays) * 100} color="#22d3ee">
          <div className="text-center">
            <div className="text-xs text-slate-400">Day</div>
            <div className="text-3xl font-extrabold leading-none">{day}</div>
            <div className="text-xs text-slate-400">/ {s.planDays}</div>
          </div>
        </Ring>
        <div className="flex-1">
          <div className="text-sm text-slate-300">一個月衝刺計畫</div>
          <div className="mt-1 text-2xl font-extrabold">
            {s.introduced.toLocaleString()}
            <span className="text-base font-medium text-slate-400"> / {TOTAL.toLocaleString()} 字</span>
          </div>
          <div className="mt-2">
            <Bar pct={planPct} color="from-emerald-400 to-cyan-500" />
          </div>
          <div className="mt-1 text-xs text-slate-400">已解鎖 {planPct}% · 精熟 {mastery}%</div>
        </div>
      </Card>

      {/* today's mission */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="text-lg font-extrabold">今日任務</div>
          <div className="text-xs text-slate-400">Day {day}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          <MiniStat emoji="✨" n={newToday} label="新單字" tint="text-cyan-300" />
          <MiniStat emoji="🔁" n={due} label="待複習" tint="text-amber-300" />
        </div>
        <div className="p-5 pt-4">
          <button
            onClick={go(() => buildDaily(), "今日任務")}
            disabled={newToday === 0 && due === 0}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-4 text-base font-extrabold text-slate-900 disabled:opacity-40"
          >
            {newToday === 0 && due === 0 ? "今天都完成了 🎉" : "開始今日任務 →"}
          </button>
          {due > 0 && (
            <button
              onClick={go(() => buildReview(), "複習到期單字")}
              className="mt-2.5 w-full rounded-2xl bg-white/8 py-3 text-sm font-bold text-amber-200 ring-1 ring-white/10"
            >
              只複習到期單字（{due}）
            </button>
          )}
        </div>
      </Card>

      {/* practice modes */}
      <div>
        <div className="mb-2 px-1 text-sm font-bold text-slate-300">自由練習</div>
        <div className="grid grid-cols-2 gap-3">
          {practice.map((p) => (
            <button
              key={p.mode}
              onClick={go(() => buildModePractice(p.mode), p.label)}
              disabled={s.introduced < 4}
              className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-4 text-left ring-1 ring-white/10 disabled:opacity-40"
            >
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <div className="font-bold">{p.label}</div>
                <div className="text-xs text-slate-400">隨機 15 題</div>
              </div>
            </button>
          ))}
        </div>
        {s.introduced < 4 && (
          <p className="mt-2 px-1 text-xs text-slate-500">先學幾個新單字就能解鎖自由練習。</p>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat emoji="📚" label="已學單字" value={s.introduced.toLocaleString()} />
        <Stat emoji="🧠" label="已精熟" value={masteredCount(s).toLocaleString()} />
        <Stat emoji="🪙" label="金幣" value={s.coins.toLocaleString()} />
      </div>
    </div>
  );
}

function MiniStat({ emoji, n, label, tint }: { emoji: string; n: number; label: string; tint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className={`text-2xl font-extrabold ${tint}`}>{n}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}
