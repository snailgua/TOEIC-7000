import { useRef, useState } from "react";
import {
  useStore,
  setSettings,
  resetAll,
  exportData,
  importData,
} from "@/lib/store";
import { TOTAL } from "@/lib/words";

export default function Settings() {
  const s = useStore();
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const perDay = s.settings.dailyNew;
  const finishDays = Math.ceil(TOTAL / perDay);

  function doExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toeic7000-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("已匯出進度檔");
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      setMsg(ok ? "已匯入進度 ✓" : "匯入失敗：檔案格式不符");
    };
    reader.readAsText(f);
  }

  return (
    <div className="px-4 pb-28 pt-5">
      <h1 className="px-1 text-xl font-extrabold">設定</h1>

      <Section title="練習">
        <Toggle
          label="音效"
          desc="答對 / 連對 / 升級音效"
          on={s.settings.sound}
          onChange={(v) => setSettings({ sound: v })}
        />
        <Toggle
          label="單字發音"
          desc="自動朗讀英文（裝置語音）"
          on={s.settings.voice}
          onChange={(v) => setSettings({ voice: v })}
        />
      </Section>

      <Section title="每日進度">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">每天新單字</span>
            <span className="text-lg font-extrabold text-cyan-600">{perDay} 字</span>
          </div>
          <input
            type="range"
            min={20}
            max={400}
            step={10}
            value={perDay}
            onChange={(e) => setSettings({ dailyNew: Number(e.target.value) })}
            className="mt-3 w-full accent-cyan-400"
          />
          <div className="mt-1 text-xs text-slate-500">
            照這個速度約 <span className="font-bold text-slate-700">{finishDays} 天</span> 學完全部 {TOTAL.toLocaleString()} 字
            （預設一個月約 {Math.ceil(TOTAL / 30)} 字／天）
          </div>
        </div>
      </Section>

      <Section title="進度備份（換裝置用）">
        <button onClick={doExport} className="w-full px-4 py-3.5 text-left font-semibold">
          📤 匯出進度檔
        </button>
        <div className="border-t border-slate-200" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full px-4 py-3.5 text-left font-semibold"
        >
          📥 匯入進度檔
        </button>
        <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
      </Section>

      {msg && <p className="mt-3 px-1 text-sm text-emerald-600">{msg}</p>}

      <Section title="危險區">
        <button
          onClick={() => {
            if (confirm("確定要清除所有學習進度嗎？此動作無法復原。")) {
              resetAll();
              setMsg("已重設所有進度");
            }
          }}
          className="w-full px-4 py-3.5 text-left font-semibold text-rose-600"
        >
          🗑️ 重設所有進度
        </button>
      </Section>

      <p className="mt-6 px-1 text-xs leading-relaxed text-slate-400">
        單字資料來源：台灣大考中心高中英文參考詞彙表（學測 4000＋指考 7000），共 {TOTAL.toLocaleString()} 個去重單字，
        含詞性與中文釋義，僅供學習用途。進度儲存在此裝置瀏覽器；換裝置請用上方匯出／匯入。
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 px-1 text-sm font-bold text-slate-600">{title}</div>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {children}
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div className={`relative h-7 w-12 rounded-full transition ${on ? "bg-cyan-500" : "bg-slate-200"}`}>
        <div
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${on ? "left-[1.4rem]" : "left-0.5"}`}
        />
      </div>
    </button>
  );
}
