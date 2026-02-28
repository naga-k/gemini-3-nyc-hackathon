"use client";

import { useGameStore } from "@/lib/gameState";
import StageHeader from "./StageHeader";
import MetricsBar from "./MetricsBar";
import SceneView from "./SceneView";
import ActionPanel from "./ActionPanel";
import CutsceneOverlay from "./CutsceneOverlay";
import { getStageConfig } from "@/lib/stages";

export default function GameScreen() {
  const stage = useGameStore((s) => s.stage);
  const activeScene = useGameStore((s) => s.activeScene);
  const activeCutscene = useGameStore((s) => s.activeCutscene);
  const stageConfig = getStageConfig(stage);
  const isWin = stage === "win";

  if (isWin) {
    return (
      <div className="h-screen flex flex-col">
        <CutsceneOverlay />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <img
              src="/assets/scene-ipo.png"
              alt="IPO victory stage"
              className="w-[min(900px,90vw)] mx-auto rounded-2xl border border-zinc-800 mb-6"
            />
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

      {!activeCutscene && (
        <>
          <StageHeader />
          <MetricsBar />

          {/* Stage Setting */}
          {!activeScene && (
            <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
              <p className="text-xs text-zinc-500">
                📍 {stageConfig.setting} —{" "}
                <span className="text-zinc-400">{stageConfig.goal}</span>
              </p>
            </div>
          )}

          {/* Main Content: Scene or Hub */}
          {activeScene ? (
            <SceneView />
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-600">
                  <p className="text-lg">Choose an action</p>
                  <p className="text-sm mt-1">Each one costs energy 🔥</p>
                </div>
              </div>
              <ActionPanel />
            </div>
          )}
        </>
      )}
    </div>
  );
}
