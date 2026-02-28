"use client";

import { useGameStore } from "@/lib/gameState";

export default function DemoDayPanel() {
  const reactions = useGameStore((s) => s.demoDayReactions);
  const isLoading = useGameStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">🎤</p>
          <p className="text-zinc-400 animate-pulse">The VCs are listening...</p>
        </div>
      </div>
    );
  }

  if (!reactions || reactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🎤</p>
          <p className="text-xl font-bold mb-1">Demo Day</p>
          <p className="text-zinc-500">Use the Demo Day Pitch action to present to the VCs</p>
        </div>
      </div>
    );
  }

  const npcEmojis: Record<string, string> = {
    "Garry Tan": "🧑‍💼",
    "Peter Thiel": "🏛️",
    "Marc Andreessen": "🌐",
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-lg font-bold text-center mb-4">Demo Day Reactions</h2>
      {reactions.map((r, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{npcEmojis[r.npc] || "👤"}</span>
            <span className="font-medium text-sm">{r.npc}</span>
          </div>
          <p className="text-sm text-zinc-200 mb-1">{r.dialogue}</p>
          {r.inner_thoughts && (
            <p className="text-xs text-zinc-600 italic">{r.inner_thoughts}</p>
          )}
        </div>
      ))}
    </div>
  );
}
