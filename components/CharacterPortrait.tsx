"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LipSyncEngine, type MouthState } from "@/lib/lipSync";
import { useGameStore, resolveCurrentTemplatePart } from "@/lib/gameState";
import type { NpcId } from "@/lib/gameState";

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
    npcMouth: { left: 68.0, top: 42.0, width: 2.5 },
    playerMouth: { left: 32.0, top: 42.0, width: 2.5, flip: true },
  },
  user_chat_2: {
    bg: "/assets/scene-talk-user.png",
    npcMouth: { left: 68.0, top: 42.0, width: 2.5 },
    playerMouth: { left: 32.0, top: 42.0, width: 2.5, flip: true },
  },
  _default: {
    bg: "/assets/scene-yc.png",
    npcMouth: { left: 46.3, top: 43.0, width: 3.5 },
  },
};

function getVisualConfig(stage: string, activeScene: string | null): SceneVisualConfig {
  if (activeScene && SCENE_VISUALS[activeScene]) return SCENE_VISUALS[activeScene];
  const stageKey = `_${stage}`;
  if (SCENE_VISUALS[stageKey]) return SCENE_VISUALS[stageKey];
  return SCENE_VISUALS._default;
}

// ─── Mic-based mouth animation ──────────────────────────
function useMicMouth(): MouthState {
  const [micMouth, setMicMouth] = useState<MouthState>("closed");
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;

          if (avg < 0.03) {
            setMicMouth("closed");
          } else {
            const low = data[4]! / 255;
            const mid = data[12]! / 255;
            const high = data[24]! / 255;
            const max = Math.max(low, mid, high);
            if (max === low) setMicMouth(avg > 0.1 ? "ou" : "oh");
            else if (max === mid) setMicMouth(avg > 0.1 ? "aa" : "oh");
            else setMicMouth(avg > 0.1 ? "ee" : "ih");
          }

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // Mic permission denied
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, []);

  return micMouth;
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

  return (
    <img
      src={mouthSrc}
      alt=""
      className={`absolute ${debugMode ? "cursor-grab ring-2 ring-red-500/50" : "pointer-events-none"} ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        width: `${pos.width}%`,
        transform: `translate(-50%, -50%)${config.flip ? " scaleX(-1)" : ""}`,
      }}
      draggable={false}
      onMouseDown={handleMouseDown}
    />
  );
}

// ─── Main component ─────────────────────────────────────
export default function CharacterPortrait() {
  const [npcMouthState, setNpcMouthState] = useState<MouthState>("closed");
  const lipSyncRef = useRef<LipSyncEngine | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [debugMode, setDebugMode] = useState(true);

  // Track what we've already spoken to avoid re-triggering
  const lastSpokenGreeting = useRef<string | null>(null);
  const lastSpokenReaction = useRef<string | null>(null);
  const lastSpokenMsgCount = useRef<number>(0);

  const stage = useGameStore((s) => s.stage);
  const activeScene = useGameStore((s) => s.activeScene);
  const sceneStep = useGameStore((s) => s.sceneStep);
  const demoDayPartIndex = useGameStore((s) => s.demoDayPartIndex);
  const generatedGreeting = useGameStore((s) => s.generatedGreeting);
  const lastNpcReaction = useGameStore((s) => s.lastNpcReaction);
  const sceneMessages = useGameStore((s) => s.sceneMessages);

  const config = getVisualConfig(stage, activeScene);
  const hasTwoMouths = !!config.playerMouth;

  // Get current NPC from active scene template
  const currentNpcId: NpcId | null = activeScene
    ? resolveCurrentTemplatePart(activeScene, demoDayPartIndex)?.npc.id ?? null
    : null;

  // Mic-based player mouth
  const micMouth = useMicMouth();
  const playerMouthState = hasTwoMouths ? micMouth : ("closed" as MouthState);

  // NPC lip-sync engine
  useEffect(() => {
    lipSyncRef.current = new LipSyncEngine((state) => setNpcMouthState(state));
    return () => { lipSyncRef.current?.dispose(); };
  }, []);

  const speakDialogue = useCallback(async (dialogue: string, npcId: NpcId) => {
    if (!lipSyncRef.current) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogue, npcId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) await lipSyncRef.current.playAudio(data.audio);
      }
    } catch { /* silent */ }
    setIsSpeaking(false);
  }, []);

  // Speak NPC greeting when it appears
  useEffect(() => {
    if (!currentNpcId || !generatedGreeting) return;
    if (sceneStep !== "greeting") return;
    if (generatedGreeting === lastSpokenGreeting.current) return;

    lastSpokenGreeting.current = generatedGreeting;
    lipSyncRef.current?.stop();
    speakDialogue(generatedGreeting, currentNpcId);
  }, [generatedGreeting, sceneStep, currentNpcId, speakDialogue]);

  // Speak NPC reaction when it appears
  useEffect(() => {
    if (!currentNpcId || !lastNpcReaction) return;
    if (sceneStep !== "reaction") return;
    if (lastNpcReaction.dialogue === lastSpokenReaction.current) return;

    lastSpokenReaction.current = lastNpcReaction.dialogue;
    lipSyncRef.current?.stop();
    speakDialogue(lastNpcReaction.dialogue, currentNpcId);
  }, [lastNpcReaction, sceneStep, currentNpcId, speakDialogue]);

  // Speak NPC messages from continueScene
  useEffect(() => {
    if (!currentNpcId) return;
    const npcMsgs = sceneMessages.filter((m) => m.role === "npc");
    if (npcMsgs.length <= lastSpokenMsgCount.current) return;

    const latest = npcMsgs[npcMsgs.length - 1];
    lastSpokenMsgCount.current = npcMsgs.length;

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
    setNpcMouthState("closed");
    lastSpokenGreeting.current = null;
    lastSpokenReaction.current = null;
    lastSpokenMsgCount.current = 0;
  }, [activeScene]);

  // Don't render portrait when no scene is active
  if (!activeScene) return null;

  return (
    <div className="w-full bg-black overflow-hidden" style={{ maxHeight: "50vh" }}>
      <div
        data-mouth-container
        className="relative w-full"
        style={{ aspectRatio: "688 / 384" }}
      >
        <img
          src={config.bg}
          alt="Scene background"
          className="absolute inset-0 w-full h-full"
          draggable={false}
        />

        {/* NPC mouth */}
        <MouthOverlay
          mouthState={npcMouthState}
          config={config.npcMouth}
          debugMode={debugMode}
          label="NPC_MOUTH"
        />

        {/* Player mouth (only in two-character scenes) */}
        {config.playerMouth && (
          <MouthOverlay
            mouthState={playerMouthState}
            config={config.playerMouth}
            debugMode={debugMode}
            label="PLAYER_MOUTH"
          />
        )}

        {/* Debug overlay */}
        {debugMode && (
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
