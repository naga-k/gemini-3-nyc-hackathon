"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameState";
import GameScreen from "@/components/GameScreen";

export default function Home() {
  const started = useGameStore((s) => s.started);
  const startGame = useGameStore((s) => s.startGame);

  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");

  if (started) {
    return <GameScreen />;
  }

  const handleStart = () => {
    if (!name.trim() || !idea.trim()) return;
    startGame(name.trim(), idea.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">
          ZERO <span className="text-zinc-600">to</span> ONE
        </h1>
        <p className="text-zinc-500 mb-8">A startup founder simulation</p>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              What&apos;s your startup called?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dropbox, Airbnb, Stripe..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              What does it do? (one sentence)
            </label>
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="e.g. AI-powered design tool for small agencies..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-zinc-600"
            />
          </div>
          <button
            onClick={handleStart}
            disabled={!name.trim() || !idea.trim()}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 py-3 rounded-lg font-medium transition-colors mt-4"
          >
            Start Your Journey
          </button>
        </div>

        <p className="text-zinc-700 text-xs mt-8">
          Powered by Gemini &bull; Built for Gemini 3 NYC Hackathon
        </p>
      </div>
    </div>
  );
}
