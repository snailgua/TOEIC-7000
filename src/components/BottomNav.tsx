export type Tab = "home" | "browse" | "achv" | "settings";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "home", label: "今日", emoji: "🏠" },
  { id: "browse", label: "單字庫", emoji: "📚" },
  { id: "achv", label: "成就", emoji: "🏆" },
  { id: "settings", label: "設定", emoji: "⚙️" },
];

export default function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto grid max-w-md grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition ${
                active ? "text-cyan-600" : "text-slate-400"
              }`}
            >
              <span className={`text-xl transition ${active ? "scale-110" : ""}`}>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
