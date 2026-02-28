"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LipSyncEngine, type MouthState } from "@/lib/lipSync";
import { useGameStore, resolveCurrentTemplatePart } from "@/lib/gameState";
import type { NpcId } from "@/lib/gameState";

// Mouth position calibrated to the scene-yc.png character (688x384)
const DEFAULT_MOUTH = { left: 46.3, top: 43.0, width: 3.5 };

const MOUTH_SPRITES: Record<Exclude<MouthState, "closed">, string> = {
  aa: "/assets/mouth-aa.png",
  ee: "/assets/mouth-ee.png",
  ih: "/assets/mouth-ih.png",
  oh: "/assets/mouth-oh.png",
  ou: "/assets/mouth-ou.png",
};

export default function CharacterPortrait() {
  const [mouthState, setMouthState] = useState<MouthState>("closed");
  const lipSyncRef = useRef<LipSyncEngine | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track what we've already spoken to avoid re-triggering
  const lastSpokenGreeting = useRef<string | null>(null);
  const lastSpokenReaction = useRef<string | null>(null);
  const lastSpokenMsgCount = useRef<number>(0);

  // Draggable mouth position (dev mode)
  const [mouthPos, setMouthPos] = useState(DEFAULT_MOUTH);
  const [isDragging, setIsDragging] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // New scene-based state
  const activeScene = useGameStore((s) => s.activeScene);
  const sceneStep = useGameStore((s) => s.sceneStep);
  const demoDayPartIndex = useGameStore((s) => s.demoDayPartIndex);
  const generatedGreeting = useGameStore((s) => s.generatedGreeting);
  const lastNpcReaction = useGameStore((s) => s.lastNpcReaction);
  const sceneMessages = useGameStore((s) => s.sceneMessages);

  // Get current NPC from active scene template
  const currentNpcId: NpcId | null = activeScene
    ? resolveCurrentTemplatePart(activeScene, demoDayPartIndex)?.npc.id ?? null
    : null;

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

  // Speak the NPC greeting when it appears
  useEffect(() => {
    if (!currentNpcId || !generatedGreeting) return;
    if (sceneStep !== "greeting") return;
    if (generatedGreeting === lastSpokenGreeting.current) return;

    lastSpokenGreeting.current = generatedGreeting;
    lipSyncRef.current?.stop();
    speakDialogue(generatedGreeting, currentNpcId);
  }, [generatedGreeting, sceneStep, currentNpcId, speakDialogue]);

  // Speak the NPC reaction when it appears
  useEffect(() => {
    if (!currentNpcId || !lastNpcReaction) return;
    if (sceneStep !== "reaction") return;
    if (lastNpcReaction.dialogue === lastSpokenReaction.current) return;

    lastSpokenReaction.current = lastNpcReaction.dialogue;
    lipSyncRef.current?.stop();
    speakDialogue(lastNpcReaction.dialogue, currentNpcId);
  }, [lastNpcReaction, sceneStep, currentNpcId, speakDialogue]);

  // Speak NPC messages added to conversation history (from continueScene)
  useEffect(() => {
    if (!currentNpcId) return;
    const npcMsgs = sceneMessages.filter((m) => m.role === "npc");
    if (npcMsgs.length <= lastSpokenMsgCount.current) return;

    // Only speak the newest NPC message
    const latest = npcMsgs[npcMsgs.length - 1];
    lastSpokenMsgCount.current = npcMsgs.length;

    // Don't double-speak if it was already spoken as a greeting/reaction
    if (
      latest.text === lastSpokenGreeting.current ||
      latest.text === lastSpokenReaction.current
    ) return;

    lipSyncRef.current?.stop();
    speakDialogue(latest.text, currentNpcId);
  }, [sceneMessages, currentNpcId, speakDialogue]);

  // Reset when scene changes
  useEffect(() => {
    lipSyncRef.current?.stop();
    setMouthState("closed");
    lastSpokenGreeting.current = null;
    lastSpokenReaction.current = null;
    lastSpokenMsgCount.current = 0;
  }, [activeScene]);

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
      console.log(`MOUTH_CONFIG: { left: ${mouthPos.left.toFixed(1)}, top: ${mouthPos.top.toFixed(1)}, width: ${mouthPos.width.toFixed(1)} }`);
    }
  }, [isDragging, mouthPos]);

  // Don't render portrait when no scene is active
  if (!activeScene) return null;

  // Use "ee" (closed smile) as the neutral/idle mouth
  const mouthSrc = mouthState !== "closed" ? MOUTH_SPRITES[mouthState] : MOUTH_SPRITES.ee;

  return (
    <div className="w-full bg-black overflow-hidden" style={{ maxHeight: "50vh" }}>
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

        {/* Debug overlay */}
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
