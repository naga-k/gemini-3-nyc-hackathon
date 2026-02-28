"use client";

import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/lib/gameState";
import { NPC_CONFIG } from "@/lib/npcs";
import NPCPortrait from "./NPCPortrait";
import type { NpcId, Stage } from "@/lib/gameState";

function getAvailableNpcs(stage: Stage): NpcId[] {
  return (Object.values(NPC_CONFIG) as { id: NpcId; availableStages: Stage[] }[])
    .filter((npc) => npc.availableStages.includes(stage))
    .map((npc) => npc.id);
}

export default function ChatWindow() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stage = useGameStore((s) => s.stage);
  const currentNpc = useGameStore((s) => s.currentNpc);
  const chatHistory = useGameStore((s) => s.chatHistory);
  const isLoading = useGameStore((s) => s.isLoading);
  const metrics = useGameStore((s) => s.metrics);
  const setCurrentNpc = useGameStore((s) => s.setCurrentNpc);
  const sendMessage = useGameStore((s) => s.sendMessage);

  const availableNpcs = getAvailableNpcs(stage);
  const currentMessages = chatHistory.filter((m) => m.npcId === currentNpc);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentNpc) return;
    if (metrics.energy <= 0) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* NPC Sidebar */}
      <div className="w-24 border-r border-zinc-800 flex flex-col items-center py-3 gap-2 overflow-y-auto">
        {availableNpcs.map((npcId) => (
          <NPCPortrait
            key={npcId}
            npcId={npcId}
            size="sm"
            selected={currentNpc === npcId}
            onClick={() => setCurrentNpc(npcId)}
          />
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {!currentNpc ? (
          <div className="flex-1 flex items-center justify-center text-zinc-600">
            <div className="text-center">
              <p className="text-lg">Select an NPC to talk to</p>
              <p className="text-sm mt-1">or use an action below</p>
            </div>
          </div>
        ) : (
          <>
            {/* NPC Header */}
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-3">
              <span className="text-xl">{NPC_CONFIG[currentNpc]?.emoji}</span>
              <div>
                <p className="font-medium text-sm">{NPC_CONFIG[currentNpc]?.name}</p>
                <p className="text-xs text-zinc-500">{NPC_CONFIG[currentNpc]?.description}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentMessages.length === 0 && (
                <p className="text-zinc-600 text-sm text-center mt-8">
                  Start a conversation with {NPC_CONFIG[currentNpc]?.name}...
                </p>
              )}
              {currentMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-orange-600 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.innerThoughts && (
                    <p className="text-xs text-zinc-600 italic mt-1 px-2">
                      {msg.innerThoughts}
                    </p>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-zinc-800 rounded-2xl px-4 py-2 text-sm text-zinc-400">
                    <span className="animate-pulse">typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    metrics.energy <= 0
                      ? "No energy left..."
                      : `Talk to ${NPC_CONFIG[currentNpc]?.name}...`
                  }
                  disabled={isLoading || metrics.energy <= 0}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50 placeholder-zinc-600"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || metrics.energy <= 0}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
              {metrics.energy <= 0 && (
                <p className="text-xs text-red-400 mt-1">
                  No energy! Use a free action or advance to the next stage.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
