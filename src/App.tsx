import { useState } from "react";
import type { Step } from "@/lib/session";
import BottomNav, { type Tab } from "@/components/BottomNav";
import Home from "@/components/Home";
import Browse from "@/components/Browse";
import Achievements from "@/components/Achievements";
import Settings from "@/components/Settings";
import Session from "@/components/Session";
import { useStore } from "@/lib/store";

interface ActiveSession {
  steps: Step[];
  title: string;
}

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [session, setSession] = useState<ActiveSession | null>(null);

  const launch = (steps: Step[], title: string) => setSession({ steps, title });

  return (
    <div className="mx-auto min-h-full max-w-md">
      {tab === "home" && <Home launch={launch} />}
      {tab === "browse" && <Browse />}
      {tab === "achv" && <Achievements />}
      {tab === "settings" && <Settings />}

      <BottomNav tab={tab} onTab={setTab} />

      {session && (
        <Session
          steps={session.steps}
          title={session.title}
          voice={s.settings.voice}
          onExit={() => setSession(null)}
        />
      )}
    </div>
  );
}
