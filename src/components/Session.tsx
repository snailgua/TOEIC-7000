import { useEffect, useMemo, useRef, useState } from "react";
import type { Step } from "@/lib/session";
import type { Word } from "@/types";
import { answer, introduceOne } from "@/lib/store";
import { pickDistractors, speak } from "@/lib/words";
import { sfx } from "@/lib/audio";
import { Bar } from "@/components/ui";
import SessionEnd from "@/components/SessionEnd";

interface Res {
  word: Word;
  correct: boolean;
}

export default function Session({
  steps,
  title,
  voice,
  onExit,
}: {
  steps: Step[];
  title: string;
  voice: boolean;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [results, setResults] = useState<Res[]>([]);
  const [gainedXp, setGainedXp] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [leveled, setLeveled] = useState(false);
  const [floatXp, setFloatXp] = useState<{ id: number; n: number } | null>(null);

  const done = idx >= steps.length;
  const step = steps[idx];

  function handle(correct: boolean) {
    const r = answer(step.word.id, correct, combo);
    if (step.mode === "flash") introduceOne();
    const nc = correct ? combo + 1 : 0;
    setCombo(nc);
    setBestCombo((b) => Math.max(b, nc));
    setResults((rs) => [...rs, { word: step.word, correct }]);
    setGainedXp((x) => x + r.xpGain);
    if (r.newBadges.length) setNewBadges((b) => [...b, ...r.newBadges]);
    if (r.leveledUp) setLeveled(true);
    setFloatXp({ id: idx, n: r.xpGain });
    setIdx((i) => i + 1);
  }

  if (steps.length === 0) {
    return (
      <Overlay>
        <div className="grid flex-1 place-items-center px-8 text-center">
          <div>
            <div className="text-6xl">🎉</div>
            <p className="mt-4 text-lg font-semibold">今天沒有待複習的單字！</p>
            <p className="mt-1 text-sm text-slate-400">回首頁開始今日新單字吧。</p>
            <button
              onClick={onExit}
              className="mt-6 rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-slate-900"
            >
              回首頁
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  if (done) {
    return (
      <SessionEnd
        results={results}
        bestCombo={bestCombo}
        gainedXp={gainedXp}
        newBadges={newBadges}
        leveled={leveled}
        onExit={onExit}
      />
    );
  }

  const pct = (idx / steps.length) * 100;

  return (
    <Overlay>
      {/* top bar */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          onClick={onExit}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg"
          aria-label="關閉"
        >
          ✕
        </button>
        <div className="flex-1">
          <Bar pct={pct} />
        </div>
        <div className="min-w-[3.5rem] text-right text-sm font-semibold text-slate-300">
          {idx + 1}/{steps.length}
        </div>
      </div>

      {/* combo + title */}
      <div className="flex items-center justify-between px-5 pt-3">
        <span className="text-xs text-slate-400">{title}</span>
        {combo >= 2 && (
          <span key={combo} className="animate-pop rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
            🔥 連對 {combo}
          </span>
        )}
      </div>

      {/* card */}
      <div className="relative flex flex-1 flex-col px-5 pb-6 pt-2">
        {floatXp && (
          <div
            key={floatXp.id}
            className="animate-floatUp pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 text-lg font-extrabold text-emerald-300"
          >
            +{floatXp.n} XP
          </div>
        )}
        <CardSwitch key={idx} step={step} voice={voice} onDone={handle} />
      </div>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0e1c]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
    </div>
  );
}

function CardSwitch({
  step,
  voice,
  onDone,
}: {
  step: Step;
  voice: boolean;
  onDone: (correct: boolean) => void;
}) {
  if (step.mode === "flash") return <FlashCard word={step.word} voice={voice} onDone={onDone} />;
  if (step.mode === "spell") return <SpellCard word={step.word} onDone={onDone} />;
  return <ChoiceCard step={step} voice={voice} onDone={onDone} />;
}

/* ---------------- Flashcard (learn new) ---------------- */
function FlashCard({ word, voice, onDone }: { word: Word; voice: boolean; onDone: (c: boolean) => void }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (voice) speak(word.w);
  }, [word, voice]);
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-cyan-300">
        新單字 · 點卡片看中文
      </div>
      <button
        onClick={() => {
          sfx.tap();
          setFlipped((f) => !f);
        }}
        className="relative flex-1"
        style={{ perspective: 1000 }}
      >
        <div className={`flip relative h-full w-full ${flipped ? "is-flipped" : ""}`}>
          <Face className="flip-face bg-gradient-to-br from-indigo-500/30 to-cyan-500/20">
            <div className="text-4xl font-extrabold tracking-tight">{word.w}</div>
            <div className="mt-2 text-sm text-slate-300">{word.pos}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.w);
              }}
              className="mt-5 rounded-full bg-white/15 px-4 py-2 text-sm"
            >
              🔊 發音
            </button>
            <div className="mt-6 text-xs text-slate-400">點一下翻面 →</div>
          </Face>
          <Face className="flip-face flip-back bg-gradient-to-br from-emerald-500/25 to-cyan-500/20">
            <div className="text-2xl font-bold text-slate-200">{word.w}</div>
            <div className="mt-3 text-2xl font-extrabold text-emerald-200">{word.zh}</div>
            <div className="mt-2 text-sm text-slate-300">{word.pos}</div>
          </Face>
        </div>
      </button>
      {flipped ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => onDone(false)}
            className="rounded-2xl bg-rose-500/20 py-4 text-base font-bold text-rose-200 ring-1 ring-rose-400/30"
          >
            還不熟 🤔
          </button>
          <button
            onClick={() => onDone(true)}
            className="rounded-2xl bg-emerald-500/25 py-4 text-base font-bold text-emerald-200 ring-1 ring-emerald-400/30"
          >
            記住了 ✓
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="mt-4 rounded-2xl bg-white/10 py-4 text-base font-bold text-slate-200"
        >
          翻面看意思
        </button>
      )}
    </div>
  );
}

function Face({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6 text-center ring-1 ring-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- Multiple choice / listening ---------------- */
function ChoiceCard({
  step,
  voice,
  onDone,
}: {
  step: Step;
  voice: boolean;
  onDone: (c: boolean) => void;
}) {
  const { word, mode } = step;
  const askEnglish = mode === "mc-zh"; // prompt 中文, options English
  const listen = mode === "listen";
  const options = useMemo(() => {
    const opts = [word, ...pickDistractors(word, 3)];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [word]);
  const [picked, setPicked] = useState<number | null>(null);
  const locked = picked !== null;

  useEffect(() => {
    if (listen && voice) speak(word.w);
  }, [listen, voice, word]);

  function choose(o: Word) {
    if (locked) return;
    const correct = o.id === word.id;
    setPicked(o.id);
    if (voice && correct) speak(word.w);
    setTimeout(() => onDone(correct), correct ? 650 : 1100);
  }

  const label = (o: Word) => (askEnglish ? o.w : o.zh);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-cyan-300">
        {listen ? "聽發音選意思" : askEnglish ? "選出正確的英文" : "選出正確的中文"}
      </div>
      <div className="grid flex-1 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500/25 to-cyan-500/15 p-6 text-center ring-1 ring-white/10">
        {listen ? (
          <button onClick={() => speak(word.w)} className="grid place-items-center">
            <div className="text-7xl">🔊</div>
            <div className="mt-3 text-sm text-slate-300">點一下再聽一次</div>
          </button>
        ) : askEnglish ? (
          <div>
            <div className="text-3xl font-extrabold text-emerald-200">{word.zh}</div>
            <div className="mt-2 text-sm text-slate-300">{word.pos}</div>
          </div>
        ) : (
          <div>
            <div className="text-4xl font-extrabold tracking-tight">{word.w}</div>
            <div className="mt-2 text-sm text-slate-300">{word.pos}</div>
            {voice && (
              <button
                onClick={() => speak(word.w)}
                className="mt-4 rounded-full bg-white/15 px-4 py-1.5 text-sm"
              >
                🔊
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5">
        {options.map((o) => {
          const isCorrect = o.id === word.id;
          const show = locked && (o.id === picked || isCorrect);
          const cls = !locked
            ? "bg-white/8 ring-white/10"
            : isCorrect
              ? "bg-emerald-500/25 ring-emerald-400/50"
              : o.id === picked
                ? "bg-rose-500/25 ring-rose-400/50 animate-shake"
                : "bg-white/5 ring-white/5 opacity-50";
          return (
            <button
              key={o.id}
              disabled={locked}
              onClick={() => choose(o)}
              className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left text-lg font-semibold ring-1 transition ${cls}`}
            >
              <span>{label(o)}</span>
              {show && <span>{isCorrect ? "✓" : "✕"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Spelling ---------------- */
function SpellCard({ word, onDone }: { word: Word; onDone: (c: boolean) => void }) {
  const [val, setVal] = useState("");
  const [state, setState] = useState<"input" | "right" | "wrong">("input");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  function submit() {
    if (state !== "input") return;
    const correct = val.trim().toLowerCase() === word.w.toLowerCase();
    setState(correct ? "right" : "wrong");
    setTimeout(() => onDone(correct), correct ? 700 : 1500);
  }

  const hint = word.w.length > 1 ? `${word.w[0]} ${"_ ".repeat(word.w.length - 1).trim()}` : word.w[0];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-cyan-300">
        拼出英文單字
      </div>
      <div className="grid flex-1 place-items-center rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/15 p-6 text-center ring-1 ring-white/10">
        <div>
          <div className="text-3xl font-extrabold text-emerald-200">{word.zh}</div>
          <div className="mt-2 text-sm text-slate-300">{word.pos}</div>
          <div className="mt-5 font-mono text-xl tracking-[0.3em] text-slate-400">{hint}</div>
          {state === "wrong" && (
            <div className="mt-4 text-lg font-bold text-rose-300">
              正解：<span className="text-white">{word.w}</span>
            </div>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={state !== "input"}
        placeholder="輸入英文…"
        className={`mt-4 w-full rounded-2xl bg-white/8 px-4 py-4 text-center text-xl font-semibold outline-none ring-1 transition ${
          state === "right"
            ? "ring-emerald-400/60"
            : state === "wrong"
              ? "ring-rose-400/60"
              : "ring-white/10 focus:ring-cyan-400/60"
        }`}
      />
      <button
        onClick={submit}
        disabled={state !== "input" || !val.trim()}
        className="mt-3 rounded-2xl bg-cyan-500 py-4 text-base font-bold text-slate-900 disabled:opacity-40"
      >
        確認
      </button>
    </div>
  );
}
