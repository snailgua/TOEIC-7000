import type { ReactNode } from "react";

export function Ring({
  pct,
  size = 120,
  stroke = 10,
  children,
  color = "#22d3ee",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct / 100)));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Bar({ pct, color = "from-cyan-400 to-indigo-500" }: { pct: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function Stat({ label, value, emoji }: { label: string; value: ReactNode; emoji: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-slate-100 px-3 py-2.5">
      <div className="text-xl">{emoji}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white ring-1 ring-slate-200/80 shadow-sm shadow-slate-200/60 ${className}`}>
      {children}
    </div>
  );
}
