"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameState";
import { getActionsForStage } from "@/lib/actions";

export default function ActionPanel() {
  const stage = useGameStore((s) => s.stage);
  const metrics = useGameStore((s) => s.metrics);
  const isLoading = useGameStore((s) => s.isLoading);
  const executeAction = useGameStore((s) => s.executeAction);
  const setCurrentNpc = useGameStore((s) => s.setCurrentNpc);
  const sendDemoDayPitch = useGameStore((s) => s.sendDemoDayPitch);
  const actionFeedback = useGameStore((s) => s.actionFeedback);
  const clearActionFeedback = useGameStore((s) => s.clearActionFeedback);

  const actions = getActionsForStage(stage);

  // Auto-dismiss feedback after 2.5s
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(clearActionFeedback, 2500);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback, clearActionFeedback]);

  const handleAction = (action: ReturnType<typeof getActionsForStage>[0]) => {
    if (action.energyCost > metrics.energy) return;

    if (action.type === "npc" && action.npcId) {
      setCurrentNpc(action.npcId);
      return;
    }

    if (action.type === "demo-day") {
      const pitch = window.prompt(
        "Write your Demo Day pitch (2-3 sentences about your startup, traction, and vision):"
      );
      if (pitch) {
        sendDemoDayPitch(pitch);
      }
      return;
    }

    executeAction(action.id);
  };

  if (stage === "win" || stage === "layoff") return null;

  return (
    <div className="border-t border-zinc-800 p-3 bg-zinc-950">
      {/* Feedback toast */}
      {actionFeedback && (
        <div className="mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 animate-pulse">
          {actionFeedback}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Actions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const canAfford = action.energyCost <= metrics.energy;
          const isNpc = action.type === "npc";

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={!canAfford || isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                canAfford
                  ? isNpc
                    ? "border-blue-600/50 bg-blue-950/50 hover:bg-blue-900/50 text-blue-200"
                    : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed"
              } disabled:opacity-50`}
              title={action.description}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
              {action.energyCost > 0 && (
                <span className="text-xs text-zinc-500">
                  -{action.energyCost}🔥
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
