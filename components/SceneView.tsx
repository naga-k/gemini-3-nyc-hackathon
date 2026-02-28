"use client";

import { useGameStore, resolveCurrentTemplatePart } from "@/lib/gameState";
import { getTemplate, isDemoDayTemplate } from "@/lib/scenes";
import type { DemoDayTemplate } from "@/lib/scenes";
import ChoiceButtons from "./ChoiceButtons";
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
  const sceneTurnCount = useGameStore((s) => s.sceneTurnCount);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sceneMessages.length, sceneStep, generatedGreeting]);

  if (!activeScene) return null;

  const template = getTemplate(activeScene);
  if (!template) return null;

  const part = resolveCurrentTemplatePart(activeScene, demoDayPartIndex);
  if (!part) return null;

  // Find selected choice label for display
  const selectedChoiceLabel =
    lastChoiceId !== null && generatedChoices
      ? generatedChoices[Number(lastChoiceId)]?.label
      : null;

  // Multi-part check
  const isMultiPart = isDemoDayTemplate(template);
  const hasMoreParts =
    isMultiPart && demoDayPartIndex < (template as DemoDayTemplate).parts.length - 1;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* NPC Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
        <span className="text-2xl">{part.npc.emoji}</span>
        <div>
          <p className="font-medium text-sm">{part.npc.name}</p>
          <p className="text-xs text-zinc-500">{part.location}</p>
        </div>
        {sceneTurnCount > 0 && (
          <span className="ml-auto text-xs text-zinc-600">
            Turn {sceneTurnCount}/7
          </span>
        )}
        {isMultiPart && (
          <span className={`${sceneTurnCount > 0 ? "" : "ml-auto"} text-xs text-zinc-600`}>
            Part {demoDayPartIndex + 1}/{(template as DemoDayTemplate).parts.length}
          </span>
        )}
      </div>

      {/* Scene Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Generating state — waiting for Gemini call #1 */}
        {sceneStep === "generating" && sceneMessages.length === 0 && (
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">{part.npc.emoji}</span>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-400">
              <span className="animate-pulse">setting the scene...</span>
            </div>
          </div>
        )}

        {/* Previous conversation messages */}
        {sceneMessages.map((msg, i) => (
          <div key={i}>
            {msg.role === "player" ? (
              <div className="flex justify-end">
                <div className="bg-orange-600 rounded-2xl rounded-tr-sm px-4 py-2 text-sm text-white max-w-[80%]">
                  {msg.text}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">{part.npc.emoji}</span>
                  <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-200 max-w-[85%]">
                    {msg.text}
                  </div>
                </div>
                {msg.innerThoughts && (
                  <p className="text-xs text-zinc-600 italic px-8">
                    {msg.innerThoughts}
                  </p>
                )}
              </>
            )}
          </div>
        ))}

        {/* Current NPC greeting (for new/follow-up turn) */}
        {sceneStep === "greeting" && generatedGreeting && (
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">{part.npc.emoji}</span>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-200 max-w-[85%]">
              {generatedGreeting}
            </div>
          </div>
        )}

        {/* Generating follow-up (mid-conversation) */}
        {sceneStep === "generating" && sceneMessages.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">{part.npc.emoji}</span>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-zinc-400">
              <span className="animate-pulse">thinking...</span>
            </div>
          </div>
        )}

        {/* Loading reaction — Gemini call #2 */}
        {sceneStep === "loading" && (
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">{part.npc.emoji}</span>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-zinc-400">
              <span className="animate-pulse">thinking...</span>
            </div>
          </div>
        )}

        {/* Current reaction (not yet added to sceneMessages) */}
        {sceneStep === "reaction" && lastNpcReaction && (
          <>
            {selectedChoiceLabel && (
              <div className="flex justify-end">
                <div className="bg-orange-600 rounded-2xl rounded-tr-sm px-4 py-2 text-sm text-white max-w-[80%]">
                  {selectedChoiceLabel}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">{part.npc.emoji}</span>
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-200 max-w-[85%]">
                {lastNpcReaction.dialogue}
              </div>
            </div>

            {lastNpcReaction.inner_thoughts && (
              <p className="text-xs text-zinc-600 italic px-8">
                {lastNpcReaction.inner_thoughts}
              </p>
            )}

            {/* Metric deltas */}
            {(lastNpcReaction.metric_changes.hype !== 0 ||
              lastNpcReaction.metric_changes.runway !== 0 ||
              lastNpcReaction.metric_changes.energy !== 0) && (
              <div className="flex gap-3 px-8 py-1">
                {lastNpcReaction.metric_changes.hype !== undefined &&
                  lastNpcReaction.metric_changes.hype !== 0 && (
                    <span
                      className={`text-xs font-mono ${
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
                      className={`text-xs font-mono ${
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
                      className={`text-xs font-mono ${
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

      {/* Bottom: Choices, Continue Conversation, or Exit */}
      {sceneStep === "greeting" && generatedChoices && (
        <ChoiceButtons
          choices={generatedChoices}
          onSelect={(idx) => makeChoice(idx)}
          disabled={isLoading}
        />
      )}

      {sceneStep === "reaction" && (
        <div className="p-4 border-t border-zinc-800 space-y-2">
          {/* Scene not complete — continue conversation */}
          {!sceneComplete && (
            <button
              onClick={continueScene}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-3 rounded-lg font-medium transition-colors active:scale-[0.98] text-zinc-200"
            >
              Continue talking...
            </button>
          )}

          {/* Scene complete or exit — leave scene */}
          <button
            onClick={dismissScene}
            className={`w-full py-3 rounded-lg font-medium transition-colors active:scale-[0.98] ${
              sceneComplete
                ? "bg-orange-600 hover:bg-orange-500"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-sm"
            }`}
          >
            {hasMoreParts ? "Next →" : sceneComplete ? "Done" : "Leave conversation"}
          </button>
        </div>
      )}
    </div>
  );
}
