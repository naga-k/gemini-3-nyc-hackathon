"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LipSyncEngine, type MouthState } from "@/lib/lipSync";
import { useGameStore, resolveCurrentTemplatePart } from "@/lib/gameState";
import type { NpcId } from "@/lib/gameState";
import { getCachedVoice } from "@/lib/voiceCache";

// ─── Mouth sprites ──────────────────────────────────────
const MOUTH_SPRITES: Record<Exclude<MouthState, "closed">, string> = {
  aa: "/assets/mouth-aa.png",
  ee: "/assets/mouth-ee.png",
  ih: "/assets/mouth-ih.png",
  oh: "/assets/mouth-oh.png",
  ou: "/assets/mouth-ou.png",
};

interface MouthConfig {
  left: number;
  top: number;
  width: number;
  flip?: boolean;
}

interface SceneVisualConfig {
  bg: string;
  npcMouth: MouthConfig;
  playerMouth?: MouthConfig;
}

// ─── Scene-specific visual configs ──────────────────────
const SCENE_VISUALS: Record<string, SceneVisualConfig> = {
  _garage: {
    bg: "/assets/scene-building.png",
    npcMouth: { left: 43.3, top: 40.3, width: 3.5, flip: true },
  },
  user_chat_1: {
    bg: "/assets/scene-talk-user.png",
    npcMouth: { left: 74.4, top: 42.3, width: 5.0 },
    playerMouth: { left: 26.2, top: 42.3, width: 5.2, flip: true },
  },
  user_chat_2: {
    bg: "/assets/scene-talk-user.png",
    npcMouth: { left: 74.4, top: 42.3, width: 5.0 },
    playerMouth: { left: 26.2, top: 42.3, width: 5.2, flip: true },
  },
  yc_apply_1: {
    bg: "/assets/scene-yc-interview.png",
    npcMouth: { left: 27.3, top: 45.1, width: 3.0 },
    playerMouth: { left: 76.3, top: 50.2, width: 3.0, flip: true },
  },
  yc_apply_2: {
    bg: "/assets/scene-yc-interview.png",
    npcMouth: { left: 27.3, top: 45.1, width: 3.0 },
    playerMouth: { left: 76.3, top: 50.2, width: 3.0, flip: true },
  },
  office_hours: {
    bg: "/assets/scene-office-hours.png",
    npcMouth: { left: 72, top: 42, width: 3.5 },
    playerMouth: { left: 30, top: 42, width: 3.5, flip: true },
  },
  _yc: {
    bg: "/assets/scene-office-hours.png",
    npcMouth: { left: 72, top: 42, width: 3.5 },
  },
  demo_day: {
    bg: "/assets/scene-demoday.png",
    npcMouth: { left: 42, top: 42, width: 3.5 },
  },
  "_demo-day": {
    bg: "/assets/scene-demoday.png",
    npcMouth: { left: 42, top: 42, width: 3.5 },
  },
  _default: {
    bg: "/assets/scene-yc.png",
    npcMouth: { left: 46.3, top: 43.0, width: 3.5 },
  },
};

export function getVisualConfig(stage: string, activeScene: string | null): SceneVisualConfig {
  if (activeScene && SCENE_VISUALS[activeScene]) return SCENE_VISUALS[activeScene];
  const stageKey = `_${stage}`;
  if (SCENE_VISUALS[stageKey]) return SCENE_VISUALS[stageKey];
  return SCENE_VISUALS._default;
}

// ─── Single mouth overlay ───────────────────────────────
function MouthOverlay({
  mouthState,
  config,
  debugMode,
  label,
}: {
  mouthState: MouthState;
  config: MouthConfig;
  debugMode: boolean;
  label?: string;
}) {
  const [pos, setPos] = useState(config);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setPos(config), [config]);

  const mouthSrc = mouthState !== "closed" ? MOUTH_SPRITES[mouthState] : MOUTH_SPRITES.ee;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!debugMode) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      containerRef.current = (e.target as HTMLElement).closest("[data-mouth-container]") as HTMLDivElement;
    },
    [debugMode]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPos((p) => ({
        ...p,
        left: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
        top: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
      }));
    };

    const onUp = () => {
      setIsDragging(false);
      console.log(`${label || "MOUTH"}: { left: ${pos.left.toFixed(1)}, top: ${pos.top.toFixed(1)}, width: ${pos.width.toFixed(1)} }`);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, pos, label]);

  // Hide mouth when not speaking (unless debug mode)
  if (mouthState === "closed" && !debugMode) return null;

  return (
    <>
      <img
        src={mouthSrc}
        alt=""
        className={`absolute ${debugMode ? "cursor-grab ring-2 ring-red-500/50 z-50" : "pointer-events-none"} ${isDragging ? "cursor-grabbing" : ""}`}
        style={{
          left: `${pos.left}%`,
          top: `${pos.top}%`,
          width: `${pos.width}%`,
          transform: `translate(-50%, -50%)${config.flip ? " scaleX(-1)" : ""}`,
        }}
        draggable={false}
        onMouseDown={handleMouseDown}
      />
      {debugMode && (
        <div
          className="absolute bg-black/80 rounded px-2 py-1 text-xs text-white z-50 flex items-center gap-1"
          style={{ left: `${pos.left}%`, top: `${pos.top + 4}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-zinc-400">{label}</span>
          <input
            type="range"
            min="1"
            max="15"
            step="0.1"
            value={pos.width}
            onChange={(e) => setPos((p) => ({ ...p, width: parseFloat(e.target.value) }))}
            className="w-16"
          />
          <span>{pos.width.toFixed(1)}%</span>
        </div>
      )}
    </>
  );
}

// ─── Main component ─────────────────────────────────────
export default function CharacterPortrait() {
  const [npcMouthState, setNpcMouthState] = useState<MouthState>("closed");
  const [playerMouthState, setPlayerMouthState] = useState<MouthState>("closed");
  const npcLipSyncRef = useRef<LipSyncEngine | null>(null);
  const playerLipSyncRef = useRef<LipSyncEngine | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const activeSpeechRef = useRef<AbortController | null>(null);

  // Track what we've already spoken
  const lastSpokenGreeting = useRef<string | null>(null);
  const lastSpokenReaction = useRef<string | null>(null);
  const lastSpokenNpcMsgCount = useRef<number>(0);
  const lastSpokenPlayerMsgCount = useRef<number>(0);

  const stage = useGameStore((s) => s.stage);
  const activeScene = useGameStore((s) => s.activeScene);
  const activeCutscene = useGameStore((s) => s.activeCutscene);
  const sceneStep = useGameStore((s) => s.sceneStep);
  const demoDayPartIndex = useGameStore((s) => s.demoDayPartIndex);
  const generatedGreeting = useGameStore((s) => s.generatedGreeting);
  const lastNpcReaction = useGameStore((s) => s.lastNpcReaction);
  const sceneMessages = useGameStore((s) => s.sceneMessages);

  const effectiveDebugMode = process.env.NODE_ENV === "development" ? debugMode : false;

  const config = getVisualConfig(stage, activeScene);

  // Get current NPC from active scene template
  const currentNpcId: NpcId | null = activeScene
    ? resolveCurrentTemplatePart(activeScene, demoDayPartIndex)?.npc.id ?? null
    : null;

  // Init both lip-sync engines
  useEffect(() => {
    npcLipSyncRef.current = new LipSyncEngine((state) => setNpcMouthState(state));
    playerLipSyncRef.current = new LipSyncEngine((state) => setPlayerMouthState(state));
    return () => {
      npcLipSyncRef.current?.dispose();
      playerLipSyncRef.current?.dispose();
    };
  }, []);

  const speakDialogue = useCallback(async (
    dialogue: string,
    voiceId: NpcId,
    engine: LipSyncEngine | null,
    setActive: (v: boolean) => void,
    signal: AbortSignal
  ) => {
    if (!engine) return;
    setActive(true);
    try {
      // Check prefetch cache first
      const cached = getCachedVoice(dialogue, voiceId);
      if (cached) {
        const audio = await cached;
        if (signal.aborted) return;
        if (audio) {
          await engine.playAudio(audio);
          if (!signal.aborted) setActive(false);
          return;
        }
      }
      if (signal.aborted) return;

      // Fallback: fetch directly
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogue, npcId: voiceId }),
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) await engine.playAudio(data.audio);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    if (!signal.aborted) setActive(false);
  }, []);

  const speakNpc = useCallback((dialogue: string) => {
    if (!currentNpcId) return;
    // Abort any in-flight voice fetch and stop current audio
    activeSpeechRef.current?.abort();
    npcLipSyncRef.current?.stop();
    const controller = new AbortController();
    activeSpeechRef.current = controller;
    speakDialogue(dialogue, currentNpcId, npcLipSyncRef.current, setIsSpeaking, controller.signal);
  }, [currentNpcId, speakDialogue]);

  const speakPlayer = useCallback((dialogue: string) => {
    playerLipSyncRef.current?.stop();
    const controller = new AbortController();
    speakDialogue(dialogue, "player", playerLipSyncRef.current, () => {}, controller.signal);
  }, [speakDialogue]);

  // Speak NPC greeting
  useEffect(() => {
    if (!currentNpcId || !generatedGreeting) return;
    if (sceneStep !== "greeting") return;
    if (generatedGreeting === lastSpokenGreeting.current) return;
    lastSpokenGreeting.current = generatedGreeting;
    speakNpc(generatedGreeting);
  }, [generatedGreeting, sceneStep, currentNpcId, speakNpc]);

  // Speak NPC reaction
  useEffect(() => {
    if (!currentNpcId || !lastNpcReaction) return;
    if (sceneStep !== "reaction") return;
    if (lastNpcReaction.dialogue === lastSpokenReaction.current) return;
    lastSpokenReaction.current = lastNpcReaction.dialogue;
    speakNpc(lastNpcReaction.dialogue);
  }, [lastNpcReaction, sceneStep, currentNpcId, speakNpc]);

  // Speak NPC messages from continueScene
  useEffect(() => {
    if (!currentNpcId) return;
    const npcMsgs = sceneMessages.filter((m) => m.role === "npc");
    if (npcMsgs.length <= lastSpokenNpcMsgCount.current) return;
    const latest = npcMsgs[npcMsgs.length - 1];
    lastSpokenNpcMsgCount.current = npcMsgs.length;
    if (latest.text === lastSpokenGreeting.current || latest.text === lastSpokenReaction.current) return;
    speakNpc(latest.text);
  }, [sceneMessages, currentNpcId, speakNpc]);

  // Speak player choices (voice over when player selects an option)
  useEffect(() => {
    if (!config.playerMouth) return; // Only in two-character scenes
    const playerMsgs = sceneMessages.filter((m) => m.role === "player");
    if (playerMsgs.length <= lastSpokenPlayerMsgCount.current) return;
    const latest = playerMsgs[playerMsgs.length - 1];
    lastSpokenPlayerMsgCount.current = playerMsgs.length;
    speakPlayer(latest.text);
  }, [sceneMessages, config.playerMouth, speakPlayer]);

  // Reset when scene changes
  useEffect(() => {
    activeSpeechRef.current?.abort();
    activeSpeechRef.current = null;
    npcLipSyncRef.current?.stop();
    playerLipSyncRef.current?.stop();
    setNpcMouthState("closed");
    setPlayerMouthState("closed");
    setIsSpeaking(false);
    lastSpokenGreeting.current = null;
    lastSpokenReaction.current = null;
    lastSpokenNpcMsgCount.current = 0;
    lastSpokenPlayerMsgCount.current = 0;
  }, [activeScene]);

  // Stop audio immediately when a cutscene appears (e.g. Stripe purchase banner)
  useEffect(() => {
    if (activeCutscene) {
      activeSpeechRef.current?.abort();
      activeSpeechRef.current = null;
      npcLipSyncRef.current?.stop();
      playerLipSyncRef.current?.stop();
      setNpcMouthState("closed");
      setPlayerMouthState("closed");
      setIsSpeaking(false);
    }
  }, [activeCutscene]);

  return (
    <div className={`absolute inset-0 ${effectiveDebugMode ? "z-50" : "z-0"}`}>
      <div
        data-mouth-container
        className="relative w-full h-full"
      >
        <img
          src={config.bg}
          alt="Scene background"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* NPC mouth */}
        <MouthOverlay
          mouthState={npcMouthState}
          config={config.npcMouth}
          debugMode={effectiveDebugMode}
          label="NPC_MOUTH"
        />

        {/* Player mouth (only in two-character scenes) */}
        {config.playerMouth && (
          <MouthOverlay
            mouthState={playerMouthState}
            config={config.playerMouth}
            debugMode={effectiveDebugMode}
            label="PLAYER_MOUTH"
          />
        )}

        {/* Debug overlay */}
        {effectiveDebugMode && (
          <div className="absolute top-2 left-2 bg-black/80 rounded-lg px-3 py-2 text-xs text-white z-20">
            <button
              onClick={() => setDebugMode(false)}
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Lock mouths
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
