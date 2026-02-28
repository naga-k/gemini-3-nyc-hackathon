"use client";

import { useGameStore } from "@/lib/gameState";
import StageHeader from "./StageHeader";
import MetricsBar from "./MetricsBar";
import ChatWindow from "./ChatWindow";
import ActionPanel from "./ActionPanel";
import CutsceneOverlay from "./CutsceneOverlay";
import DemoDayPanel from "./DemoDayPanel";
import { getStageConfig } from "@/lib/stages";

export default function GameScreen() {
  const stage = useGameStore((s) => s.stage);
  const stageConfig = getStageConfig(stage);
  const isDemoDay = stage === "demo-day";
  const isWin = stage === "win";

  if (isWin) {
    return (
      <div className="h-screen flex flex-col">
        <CutsceneOverlay />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl mb-4">🦄</p>
            <h1 className="text-4xl font-bold mb-2">You Did It.</h1>
            <p className="text-zinc-400">From Zero to One.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <CutsceneOverlay />
      <StageHeader />
      <MetricsBar />

      {/* Stage Setting */}
      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
        <p className="text-xs text-zinc-500">
          📍 {stageConfig.setting} — <span className="text-zinc-400">{stageConfig.goal}</span>
        </p>
      </div>

      {/* Main Content */}
      {isDemoDay ? <DemoDayPanel /> : <ChatWindow />}

      <ActionPanel />
    </div>
  );
}
