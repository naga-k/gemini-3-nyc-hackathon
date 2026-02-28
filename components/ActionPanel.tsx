"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameState";
import { getActionsForStage } from "@/lib/actions";

export default function ActionPanel() {
  const stage = useGameStore((s) => s.stage);
  const metrics = useGameStore((s) => s.metrics);
  const isLoading = useGameStore((s) => s.isLoading);
  const activeScene = useGameStore((s) => s.activeScene);
  const executeAction = useGameStore((s) => s.executeAction);
  const playScene = useGameStore((s) => s.playScene);
  const garryRejected = useGameStore((s) => s.garryRejected);
  const actionsThisStage = useGameStore((s) => s.actionsThisStage);
  const actionFeedback = useGameStore((s) => s.actionFeedback);
  const clearActionFeedback = useGameStore((s) => s.clearActionFeedback);

  const actions = getActionsForStage(stage);

  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(clearActionFeedback, 2500);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback, clearActionFeedback]);

  const handleAction = (action: ReturnType<typeof getActionsForStage>[0]) => {
    if (action.energyCost > metrics.energy) return;

    if (action.type === "scene" && action.sceneId) {
      let sceneId = action.sceneId;
      // Dynamic scene resolution: first vs second YC application
      if (sceneId === "yc_apply_1" && garryRejected) {
        sceneId = "yc_apply_2";
      }
      playScene(sceneId);
      return;
    }

    executeAction(action.id);
  };

  // Demo Day gating: need hype >= 35 and at least 3 actions
  const isDemoDayGated = (actionId: string) => {
    if (actionId === "demo_day_pitch") {
      return metrics.hype < 35 || actionsThisStage < 3;
    }
    return false;
  };

  if (stage === "win" || stage === "layoff" || activeScene) return null;

  return (
    <div className="border-t border-zinc-800 p-3 bg-zinc-950">
      {/* Feedback toast */}
      {actionFeedback && (
        <div className="mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 animate-pulse">
          {actionFeedback}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const canAfford = action.energyCost <= metrics.energy;
          const gated = isDemoDayGated(action.id);
          const isScene = action.type === "scene";

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={!canAfford || isLoading || gated}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm border transition-all active:scale-[0.97] ${
                canAfford && !gated
                  ? isScene
                    ? "border-blue-600/50 bg-blue-950/30 hover:bg-blue-900/40 text-blue-200"
                    : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="font-medium">{action.label}</span>
              <span className="text-xs text-zinc-500">
                {action.energyCost > 0 ? `-${action.energyCost} energy` : "Free"}
              </span>
              {gated && (
                <span className="text-[10px] text-yellow-500 mt-0.5">
                  Need Hype 35+ & 3 actions
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
