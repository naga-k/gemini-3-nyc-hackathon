"use client";

import { useGameStore, STAGE_ORDER } from "@/lib/gameState";
import { STAGES } from "@/lib/stages";
import type { Stage } from "@/lib/gameState";

export default function StageHeader() {
  const stage = useGameStore((s) => s.stage);
  const turn = useGameStore((s) => s.turn);
  const advanceStage = useGameStore((s) => s.advanceStage);
  const currentIndex = STAGE_ORDER.indexOf(stage);

  // Cheat: double-click a stage to jump to it
  const handleCheat = (targetStage: Stage) => {
    if (targetStage === stage) return;
    // Give some resources when cheating forward
    useGameStore.setState((s) => ({
      metrics: {
        energy: 5,
        runway: Math.max(s.metrics.runway, 50000),
        hype: Math.max(s.metrics.hype, 40),
      },
      activeScene: null,
    }));
    advanceStage(targetStage);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <div className="flex items-center gap-1">
        {STAGES.filter((s) => s.id !== "layoff").map((s) => {
          const idx = STAGE_ORDER.indexOf(s.id);
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;

          return (
            <div key={s.id} className="flex items-center">
              <div
                onDoubleClick={() => handleCheat(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : isCompleted
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {s.name}
              </div>
              {idx < STAGES.length - 1 && s.id !== "win" && (
                <div
                  className={`w-6 h-0.5 ${
                    isCompleted ? "bg-green-600" : "bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-zinc-500 text-sm">Turn {turn}</div>
    </div>
  );
}
