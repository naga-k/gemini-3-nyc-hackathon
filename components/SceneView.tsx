"use client";

import { useGameStore, resolveCurrentTemplatePart } from "@/lib/gameState";
import { getTemplate, isDemoDayTemplate } from "@/lib/scenes";
import type { DemoDayTemplate } from "@/lib/scenes";
import { useEffect, useRef } from "react";

export default function SceneView() {
  const activeScene = useGameStore((s) => s.activeScene);
  const sceneStep = useGameStore((s) => s.sceneStep);
  const demoDayPartIndex = useGameStore((s) => s.demoDayPartIndex);
  const lastNpcReaction = useGameStore((s) => s.lastNpcReaction);
  const lastChoiceId = useGameStore((s) => s.lastChoiceId);
  const isLoading = useGameStore((s) => s.isLoading);
  const makeChoice = useGameStore((s) => s.makeChoice);
  const continueScene = useGameStore((s) => s.continueScene);
  const dismissScene = useGameStore((s) => s.dismissScene);
  const generatedGreeting = useGameStore((s) => s.generatedGreeting);
  const generatedChoices = useGameStore((s) => s.generatedChoices);
  const sceneMessages = useGameStore((s) => s.sceneMessages);
  const sceneComplete = useGameStore((s) => s.sceneComplete);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sceneMessages.length, sceneStep, generatedGreeting]);

  if (!activeScene) return null;

  const template = getTemplate(activeScene);
  if (!template) return null;

  const part = resolveCurrentTemplatePart(activeScene, demoDayPartIndex);
  if (!part) return null;

  const selectedChoiceLabel =
    lastChoiceId !== null && generatedChoices
      ? generatedChoices[Number(lastChoiceId)]?.label
      : null;

  const isMultiPart = isDemoDayTemplate(template);
  const hasMoreParts =
    isMultiPart && demoDayPartIndex < (template as DemoDayTemplate).parts.length - 1;

  const npcBubble = "bg-black/70 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-zinc-100";
  const playerBubble = "bg-orange-600/80 backdrop-blur-sm border border-orange-500/30 rounded-2xl rounded-br-sm px-4 py-2 text-sm text-white";

  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      {/* NPC name tag — top of scene */}
      <div className="px-4 py-2 flex items-center gap-2">
        <span className="text-lg drop-shadow">{part.npc.emoji}</span>
        <div>
          <p className="font-medium text-xs text-white drop-shadow">{part.npc.name}</p>
          <p className="text-[10px] text-zinc-300 drop-shadow">{part.location}</p>
        </div>
        {isMultiPart && (
          <span className="ml-auto text-[10px] text-zinc-300 drop-shadow">
            Part {demoDayPartIndex + 1}/{(template as DemoDayTemplate).parts.length}
          </span>
        )}
      </div>

      {/* Spacer — pushes chat to bottom */}
      <div className="flex-1" />

      {/* Dark gradient behind chat area */}
      <div className="relative">
        <div className="absolute inset-0 -top-16 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

        {/* Chat messages — anchored to bottom */}
        <div className="relative max-h-[40vh] overflow-y-auto px-4 py-2">
          <div className="space-y-2">
            {/* Generating state */}
            {sceneStep === "generating" && sceneMessages.length === 0 && (
              <div className="max-w-[70%]">
                <div className={npcBubble}>
                  <span className="animate-pulse text-zinc-400">setting the scene...</span>
                </div>
              </div>
            )}

            {/* Previous conversation messages */}
            {sceneMessages.map((msg, i) => (
              <div key={i}>
                {msg.role === "player" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[70%]">
                      <div className={playerBubble}>{msg.text}</div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[70%]">
                    <div className={npcBubble}>{msg.text}</div>
                    {msg.innerThoughts && (
                      <p className="text-[10px] text-zinc-400 italic mt-1 ml-1 drop-shadow">
                        {msg.innerThoughts}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Current NPC greeting */}
            {sceneStep === "greeting" && generatedGreeting && (
              <div className="max-w-[70%]">
                <div className={npcBubble}>{generatedGreeting}</div>
              </div>
            )}

            {/* Generating follow-up */}
            {sceneStep === "generating" && sceneMessages.length > 0 && (
              <div className="max-w-[70%]">
                <div className={npcBubble}>
                  <span className="animate-pulse text-zinc-400">thinking...</span>
                </div>
              </div>
            )}

            {/* Loading reaction */}
            {sceneStep === "loading" && (
              <div className="max-w-[70%]">
                <div className={npcBubble}>
                  <span className="animate-pulse text-zinc-400">thinking...</span>
                </div>
              </div>
            )}

            {/* Current reaction */}
            {sceneStep === "reaction" && lastNpcReaction && (
              <>
                {selectedChoiceLabel && (
                  <div className="flex justify-end">
                    <div className="max-w-[70%]">
                      <div className={playerBubble}>{selectedChoiceLabel}</div>
                    </div>
                  </div>
                )}

                <div className="max-w-[70%]">
                  <div className={npcBubble}>{lastNpcReaction.dialogue}</div>
                </div>

                {lastNpcReaction.inner_thoughts && (
                  <p className="text-[10px] text-zinc-400 italic ml-1 drop-shadow max-w-[70%]">
                    {lastNpcReaction.inner_thoughts}
                  </p>
                )}

                {/* Metric deltas */}
                {(lastNpcReaction.metric_changes.hype !== 0 ||
                  lastNpcReaction.metric_changes.runway !== 0 ||
                  lastNpcReaction.metric_changes.energy !== 0) && (
                  <div className="flex gap-3 ml-1 py-1">
                    {lastNpcReaction.metric_changes.hype !== undefined &&
                      lastNpcReaction.metric_changes.hype !== 0 && (
                        <span
                          className={`text-xs font-mono drop-shadow ${
                            lastNpcReaction.metric_changes.hype > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          Hype {lastNpcReaction.metric_changes.hype > 0 ? "+" : ""}
                          {lastNpcReaction.metric_changes.hype}
                        </span>
                      )}
                    {lastNpcReaction.metric_changes.runway !== undefined &&
                      lastNpcReaction.metric_changes.runway !== 0 && (
                        <span
                          className={`text-xs font-mono drop-shadow ${
                            lastNpcReaction.metric_changes.runway > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          Runway {lastNpcReaction.metric_changes.runway > 0 ? "+$" : "-$"}
                          {Math.abs(lastNpcReaction.metric_changes.runway).toLocaleString()}
                        </span>
                      )}
                    {lastNpcReaction.metric_changes.energy !== undefined &&
                      lastNpcReaction.metric_changes.energy !== 0 && (
                        <span
                          className={`text-xs font-mono drop-shadow ${
                            lastNpcReaction.metric_changes.energy > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          Energy {lastNpcReaction.metric_changes.energy > 0 ? "+" : ""}
                          {lastNpcReaction.metric_changes.energy}
                        </span>
                      )}
                  </div>
                )}
              </>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="relative px-3 pb-3">
          {sceneStep === "greeting" && generatedChoices && (
            <div className="flex gap-2">
              {generatedChoices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => makeChoice(idx)}
                  disabled={isLoading}
                  className="flex-1 text-center px-3 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/15 hover:bg-black/80 hover:border-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                  <p className="text-sm font-medium text-white">{choice.label}</p>
                  {choice.subtext && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">{choice.subtext}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {sceneStep === "reaction" && (
            <div className="flex gap-2">
              {!sceneComplete && (
                <button
                  onClick={continueScene}
                  className="flex-1 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/15 hover:bg-black/80 font-medium transition-all active:scale-[0.97] text-zinc-200 text-sm"
                >
                  Continue talking...
                </button>
              )}
              <button
                onClick={dismissScene}
                className={`${!sceneComplete ? "flex-1" : "w-full"} py-3 rounded-xl backdrop-blur-sm font-medium transition-all active:scale-[0.97] text-sm ${
                  sceneComplete
                    ? "bg-orange-600/90 border border-orange-500/30 hover:bg-orange-500/90 text-white"
                    : "bg-black/50 border border-white/10 hover:bg-black/70 text-zinc-400"
                }`}
              >
                {hasMoreParts ? "Next →" : sceneComplete ? "Done" : "Leave"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
