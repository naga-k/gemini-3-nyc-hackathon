"use client";

import { useGameStore } from "@/lib/gameState";
import GameScreen from "@/components/GameScreen";

export default function Home() {
  const started = useGameStore((s) => s.started);
  const startGame = useGameStore((s) => s.startGame);

  if (started) {
    return <GameScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">
          ZERO <span className="text-zinc-600">to</span> ONE
        </h1>
        <p className="text-zinc-500 mb-2">A startup founder simulation</p>
        <p className="text-zinc-600 text-sm mb-8">Powered by Gemini</p>

        <button
          onClick={() => startGame("", "")}
          className="bg-orange-600 hover:bg-orange-500 px-8 py-3 rounded-lg font-medium transition-colors text-lg"
        >
          Start Game
        </button>

        <p className="text-zinc-700 text-xs mt-8">
          Built for Gemini 3 NYC Hackathon
        </p>
      </div>
    </div>
  );
}
