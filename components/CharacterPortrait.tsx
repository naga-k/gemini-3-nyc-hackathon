"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LipSyncEngine, type MouthState } from "@/lib/lipSync";
import { useGameStore } from "@/lib/gameState";
import type { NpcId } from "@/lib/gameState";

// Mouth position calibrated to the scene-yc.png character (688x384)
// These percentages are relative to the image's native dimensions
const DEFAULT_MOUTH = { left: 46.3, top: 43.0, width: 3.5 };

const MOUTH_SPRITES: Record<Exclude<MouthState, "closed">, string> = {
  aa: "/assets/mouth-aa.png",
  ee: "/assets/mouth-ee.png",
  ih: "/assets/mouth-ih.png",
  oh: "/assets/mouth-oh.png",
  ou: "/assets/mouth-ou.png",
};

export default function SceneView() {
  const [mouthState, setMouthState] = useState<MouthState>("closed");
  const lipSyncRef = useRef<LipSyncEngine | null>(null);
  const lastProcessedMsg = useRef<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Draggable mouth position (dev mode)
  const [mouthPos, setMouthPos] = useState(DEFAULT_MOUTH);
  const [isDragging, setIsDragging] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const chatHistory = useGameStore((s) => s.chatHistory);
  const currentNpc = useGameStore((s) => s.currentNpc);

  useEffect(() => {
    lipSyncRef.current = new LipSyncEngine((state) => {
      setMouthState(state);
    });
    return () => {
      lipSyncRef.current?.dispose();
    };
  }, []);

  const speakDialogue = useCallback(
    async (dialogue: string, npcId: NpcId) => {
      if (!lipSyncRef.current) return;

      setIsSpeaking(true);
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dialogue, npcId }),
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.audio) {
          await lipSyncRef.current.playAudio(data.audio);
        }
      } catch {
        // Voice generation failed silently
      } finally {
        setIsSpeaking(false);
      }
    },
    []
  );

  // Trigger voice on new NPC messages
  useEffect(() => {
    if (!currentNpc) return;
    const npcMessages = chatHistory.filter(
      (m) => m.npcId === currentNpc && m.role === "assistant"
    );
    if (npcMessages.length === 0) return;
    const latestMsg = npcMessages[npcMessages.length - 1];
    if (latestMsg.timestamp > lastProcessedMsg.current) {
      lastProcessedMsg.current = latestMsg.timestamp;
      lipSyncRef.current?.stop();
      speakDialogue(latestMsg.content, currentNpc);
    }
  }, [chatHistory, currentNpc, speakDialogue]);

  useEffect(() => {
    lipSyncRef.current?.stop();
    setMouthState("closed");
  }, [currentNpc]);

  // Drag handlers for mouth positioning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!debugMode) return;
    e.preventDefault();
    setIsDragging(true);
  }, [debugMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const left = ((e.clientX - rect.left) / rect.width) * 100;
    const top = ((e.clientY - rect.top) / rect.height) * 100;
    setMouthPos((prev) => ({
      ...prev,
      left: Math.max(0, Math.min(100, left)),
      top: Math.max(0, Math.min(100, top)),
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Log final position to console so you can copy it
      console.log(`MOUTH_CONFIG: { left: ${mouthPos.left.toFixed(1)}, top: ${mouthPos.top.toFixed(1)}, width: ${mouthPos.width.toFixed(1)} }`);
    }
  }, [isDragging, mouthPos]);

  // Use "ee" (closed smile) as the neutral/idle mouth
  const mouthSrc = mouthState !== "closed" ? MOUTH_SPRITES[mouthState] : MOUTH_SPRITES.ee;

  return (
    <div className="w-full bg-black overflow-hidden" style={{ maxHeight: "50vh" }}>
      {/* Full-width container with image's native aspect ratio */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ aspectRatio: "688 / 384" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src="/assets/scene-yc.png"
          alt="YC Demo Day"
          className="absolute inset-0 w-full h-full"
          draggable={false}
        />

        {/* Mouth overlay - draggable in debug mode */}
        <img
          src={mouthSrc}
          alt=""
          className={`absolute ${debugMode ? "cursor-grab ring-2 ring-red-500/50" : "pointer-events-none"} ${isDragging ? "cursor-grabbing" : ""}`}
          style={{
            left: `${mouthPos.left}%`,
            top: `${mouthPos.top}%`,
            width: `${mouthPos.width}%`,
            transform: "translate(-50%, -50%)",
          }}
          draggable={false}
          onMouseDown={handleMouseDown}
        />

        {/* Debug overlay with position info + width slider */}
        {debugMode && (
          <div className="absolute top-2 left-2 bg-black/80 rounded-lg px-3 py-2 text-xs text-white z-20 space-y-1">
            <div>left: {mouthPos.left.toFixed(1)}% | top: {mouthPos.top.toFixed(1)}%</div>
            <div className="flex items-center gap-2">
              <span>width:</span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={mouthPos.width}
                onChange={(e) => setMouthPos((p) => ({ ...p, width: parseFloat(e.target.value) }))}
                className="w-24"
              />
              <span>{mouthPos.width.toFixed(1)}%</span>
            </div>
            <button
              onClick={() => setDebugMode(false)}
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Lock position
            </button>
          </div>
        )}

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
              <span className="flex gap-0.5">
                <span className="w-1 h-3 bg-orange-400 rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-orange-400 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:300ms]" />
              </span>
              <span className="text-xs text-zinc-300">Speaking</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
