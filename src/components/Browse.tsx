import { useMemo, useState } from "react";
import { WORDS, speak } from "@/lib/words";
import { useStore } from "@/lib/store";
import { isMastered } from "@/lib/srs";

type Filter = "all" | "learned" | "mastered" | "todo" | "weak";

export default function Browse() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return WORDS.filter((w) => {
      const p = s.prog[w.id];
      if (filter === "learned" && !p) return false;
      if (filter === "mastered" && !isMastered(p)) return false;
      if (filter === "todo" && p) return false;
      if (filter === "weak" && !(p && p.ng > p.ok)) return false;
      if (!query) return true;
      return w.w.toLowerCase().includes(query) || w.zh.includes(query);
    }).slice(0, 400);
  }, [q, filter, s.prog]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "全部" },
    { id: "learned", label: "已學" },
    { id: "mastered", label: "精熟" },
    { id: "weak", label: "易錯" },
    { id: "todo", label: "未學" },
  ];

  return (
    <div className="px-4 pb-28 pt-5">
      <h1 className="px-1 text-xl font-extrabold">單字庫</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜尋英文或中文…"
        className="mt-3 w-full rounded-2xl bg-white/8 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-cyan-400/60"
      />
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition ${
              filter === f.id
                ? "bg-cyan-500 text-slate-900 ring-cyan-400"
                : "bg-white/5 text-slate-300 ring-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {list.map((w) => {
          const p = s.prog[w.id];
          const status = isMastered(p) ? "🧠" : p ? "📖" : "";
          return (
            <button
              key={w.id}
              onClick={() => speak(w.w)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-left ring-1 ring-white/10"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{w.w}</span>
                  <span className="text-xs text-slate-500">{w.pos}</span>
                  {w.lvl === 2 && (
                    <span className="rounded bg-fuchsia-400/15 px-1.5 text-[10px] font-semibold text-fuchsia-300">
                      進階
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-300">{w.zh}</div>
              </div>
              <span className="text-lg">{status}</span>
              <span className="text-slate-500">🔊</span>
            </button>
          );
        })}
        {list.length === 0 && <p className="px-1 py-8 text-center text-slate-500">找不到符合的單字</p>}
        {list.length >= 400 && (
          <p className="px-1 py-3 text-center text-xs text-slate-500">只顯示前 400 筆，輸入關鍵字縮小範圍</p>
        )}
      </div>
    </div>
  );
}
