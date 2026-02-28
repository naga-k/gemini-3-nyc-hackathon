"use client";

import { NPC_CONFIG } from "@/lib/npcs";
import type { NpcId } from "@/lib/gameState";

interface NPCPortraitProps {
  npcId: NpcId;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
}

export default function NPCPortrait({ npcId, size = "md", selected, onClick }: NPCPortraitProps) {
  const config = NPC_CONFIG[npcId];
  if (!config) return null;

  const sizes = {
    sm: "w-8 h-8 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        selected
          ? "bg-orange-500/20 border border-orange-500/50"
          : "hover:bg-zinc-800 border border-transparent"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div
        className={`${sizes[size]} rounded-full bg-zinc-800 flex items-center justify-center`}
      >
        {config.emoji}
      </div>
      <span className="text-xs text-zinc-400 whitespace-nowrap">{config.name}</span>
    </button>
  );
}
