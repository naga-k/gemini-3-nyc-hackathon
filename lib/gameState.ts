import { create } from "zustand";
import { getTemplate, isDemoDayTemplate } from "./scenes";
import type { DemoDayTemplate, SceneTemplate, GeneratedChoice, DemoDayPartTemplate } from "./scenes";

// ─── Types ───────────────────────────────────────────────

export type Stage = "layoff" | "garage" | "yc" | "demo-day" | "post-demo" | "win";

export const STAGE_ORDER: Stage[] = ["layoff", "garage", "yc", "demo-day", "post-demo", "win"];

export type NpcId = "garry" | "user" | "batchmate" | "thiel" | "a16z" | "elon" | "player";

export type SpecialEvent =
  | "yc_accepted"
  | "yc_rejected"
  | "demo_day_success"
  | "demo_day_flop"
  | "angel_investment"
  | "series_a_offer"
  | "term_sheet"
  | "elon_tweet_positive"
  | "elon_tweet_negative"
  | "game_over"
  | "unicorn"
  | null;

export interface NpcResponse {
  dialogue: string;
  inner_thoughts: string;
  metric_changes: {
    hype?: number;
    runway?: number;
    energy?: number;
  };
  stage_advance: boolean;
  special_event: SpecialEvent;
  scene_complete: boolean;
}

export interface Metrics {
  energy: number;
  runway: number;
  hype: number;
}

export interface SceneOutcome {
  sceneId: string;
  partId?: string;
  npcId: NpcId;
  npcName: string;
  playerChoiceId: string;
  playerChoiceLabel: string;
  npcReaction: string;
  npcInnerThoughts: string;
  stage: Stage;
  timestamp: number;
}

// ─── State ───────────────────────────────────────────────

interface GameState {
  // Game setup
  started: boolean;
  startupName: string;
  startupIdea: string;

  // Core state
  stage: Stage;
  metrics: Metrics;
  turn: number;

  // Scene state
  sceneHistory: SceneOutcome[];
  keyEvents: string[];
  activeScene: string | null;
  sceneStep: "generating" | "greeting" | "loading" | "reaction";
  demoDayPartIndex: number;
  lastNpcReaction: NpcResponse | null;
  lastChoiceId: string | null;

  // Generated scene content (from Gemini call #1)
  generatedGreeting: string | null;
  generatedChoices: GeneratedChoice[] | null;
  sceneTurnCount: number;
  sceneComplete: boolean;

  // Conversation log for current scene (for display)
  sceneMessages: { role: "npc" | "player"; text: string; innerThoughts?: string }[];

  // Progression flags
  garryRejected: boolean;
  demoDayDone: boolean;
  actionsThisStage: number;

  // UI state
  activeCutscene: SpecialEvent | "zuck_layoff" | "layoff_scene" | "building_scene" | "pick_startup" | null;
  isLoading: boolean;
  actionFeedback: string | null;

  // Actions
  startGame: (name: string, idea: string) => void;
  playScene: (sceneId: string) => Promise<void>;
  makeChoice: (choiceIdx: number) => Promise<void>;
  continueScene: () => Promise<void>;
  dismissScene: () => void;
  executeAction: (actionId: string) => void;
  clearActionFeedback: () => void;
  dismissCutscene: () => void;
  advanceStage: (newStage: Stage) => void;
  addKeyEvent: (event: string) => void;
  resetGame: () => void;
  getValuation: () => number;
}

// ─── Helpers ─────────────────────────────────────────────

function clampMetricChange(field: "hype" | "runway" | "energy", value: number): number {
  const ranges: Record<string, [number, number]> = {
    hype: [-20, 30],
    runway: [-5000, 2000000],
    energy: [-3, 2],
  };
  const [min, max] = ranges[field];
  return Math.max(min, Math.min(max, value));
}

function applyMetricChanges(current: Metrics, changes: NpcResponse["metric_changes"]): Metrics {
  return {
    energy: Math.max(0, Math.min(5, current.energy + clampMetricChange("energy", changes.energy ?? 0))),
    runway: Math.max(0, current.runway + clampMetricChange("runway", changes.runway ?? 0)),
    hype: Math.max(0, Math.min(100, current.hype + clampMetricChange("hype", changes.hype ?? 0))),
  };
}

function applySpecialEventRewards(metrics: Metrics, event: SpecialEvent): Metrics {
  const m = { ...metrics };
  switch (event) {
    case "yc_accepted":
      m.runway += 125000;
      m.hype = Math.min(100, m.hype + 15);
      break;
    case "angel_investment":
      m.runway += 200000;
      break;
    case "series_a_offer":
    case "term_sheet":
      m.runway += 5000000;
      break;
    case "elon_tweet_positive":
      m.hype = Math.min(100, m.hype + 20);
      break;
    case "elon_tweet_negative":
      m.hype = Math.max(0, m.hype - 15);
      break;
    default:
      break;
  }
  return m;
}

function getNextStage(current: Stage): Stage {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < STAGE_ORDER.length - 1) return STAGE_ORDER[idx + 1];
  return current;
}

// Resolve the current template part (handles both regular and demo day)
function resolveCurrentTemplatePart(sceneId: string, demoDayPartIndex: number) {
  const template = getTemplate(sceneId);
  if (!template) return null;

  if (isDemoDayTemplate(template)) {
    const part = (template as DemoDayTemplate).parts[demoDayPartIndex];
    return {
      npc: part.npc,
      sceneContext: part.sceneContext,
      geminiInstructions: part.geminiInstructions,
      partId: part.id,
      isDemoDay: true,
      totalParts: (template as DemoDayTemplate).parts.length,
      location: template.location,
    };
  }

  const t = template as SceneTemplate;
  return {
    npc: t.npc,
    sceneContext: t.sceneContext,
    geminiInstructions: t.geminiInstructions,
    partId: undefined,
    isDemoDay: false,
    totalParts: 1,
    location: t.location,
  };
}

// Build common game state payload
function buildGameStatePayload(state: GameState) {
  return {
    stage: state.stage,
    energy: state.metrics.energy,
    runway: state.metrics.runway,
    hype: state.metrics.hype,
    valuation: state.metrics.hype * state.metrics.runway,
    startupName: state.startupName,
    startupIdea: state.startupIdea,
    turn: state.turn,
  };
}

// ─── Store ───────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  started: false,
  startupName: "",
  startupIdea: "",
  stage: "layoff",
  metrics: { energy: 5, runway: 12000, hype: 0 },
  turn: 0,
  sceneHistory: [],
  keyEvents: [],
  activeScene: null,
  sceneStep: "generating",
  demoDayPartIndex: 0,
  lastNpcReaction: null,
  lastChoiceId: null,
  generatedGreeting: null,
  generatedChoices: null,
  sceneTurnCount: 0,
  sceneComplete: false,
  sceneMessages: [],
  garryRejected: false,
  demoDayDone: false,
  actionsThisStage: 0,
  activeCutscene: null,
  isLoading: false,
  actionFeedback: null,

  startGame: (name, idea) => {
    set({
      started: true,
      startupName: name,
      startupIdea: idea,
      stage: "layoff",
      activeCutscene: "zuck_layoff",
      metrics: { energy: 5, runway: 12000, hype: 0 },
      turn: 0,
      sceneHistory: [],
      keyEvents: [],
      activeScene: null,
      sceneStep: "generating",
      demoDayPartIndex: 0,
      lastNpcReaction: null,
      lastChoiceId: null,
      generatedGreeting: null,
      generatedChoices: null,
      sceneTurnCount: 0,
      sceneComplete: false,
      sceneMessages: [],
      garryRejected: false,
      demoDayDone: false,
      actionsThisStage: 0,
    });
  },

  // Gemini Call #1: Generate the scene (greeting + choices)
  playScene: async (sceneId: string) => {
    const state = get();

    set({
      activeScene: sceneId,
      sceneStep: "generating",
      demoDayPartIndex: 0,
      lastNpcReaction: null,
      lastChoiceId: null,
      generatedGreeting: null,
      generatedChoices: null,
      sceneTurnCount: 0,
      sceneComplete: false,
      sceneMessages: [],
      isLoading: true,
    });

    const part = resolveCurrentTemplatePart(sceneId, 0);
    if (!part) {
      set({ isLoading: false, activeScene: null });
      return;
    }

    try {
      const res = await fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: part.npc.id,
          sceneContext: part.sceneContext,
          geminiInstructions: part.geminiInstructions,
          gameState: buildGameStatePayload(state),
          sceneHistory: state.sceneHistory,
          keyEvents: state.keyEvents,
        }),
      });

      const data = await res.json();

      set({
        generatedGreeting: data.greeting,
        generatedChoices: data.choices,
        sceneStep: "greeting",
        isLoading: false,
      });
    } catch {
      // Fallback scene
      set({
        generatedGreeting: "So, tell me what you've got.",
        generatedChoices: [
          { label: "Pitch confidently", subtext: "Lead with vision", context: "Player pitched with confidence" },
          { label: "Show the data", subtext: "Numbers first", context: "Player led with metrics" },
          { label: "Ask for advice", subtext: "Stay humble", context: "Player asked for guidance" },
        ],
        sceneStep: "greeting",
        isLoading: false,
      });
    }
  },

  // Gemini Call #2: React to the player's choice
  makeChoice: async (choiceIdx: number) => {
    const state = get();
    if (!state.activeScene || state.isLoading || !state.generatedChoices) return;

    const choice = state.generatedChoices[choiceIdx];
    if (!choice) return;

    const part = resolveCurrentTemplatePart(state.activeScene, state.demoDayPartIndex);
    if (!part) return;

    set({ isLoading: true, sceneStep: "loading", lastChoiceId: String(choiceIdx) });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: part.npc.id,
          sceneContext: part.sceneContext,
          geminiInstructions: part.geminiInstructions,
          playerChoice: choice.context,
          playerChoiceLabel: choice.label,
          gameState: buildGameStatePayload(state),
          sceneHistory: state.sceneHistory,
          keyEvents: state.keyEvents,
        }),
      });

      const data: NpcResponse = await res.json();

      const outcome: SceneOutcome = {
        sceneId: state.activeScene,
        partId: part.partId,
        npcId: part.npc.id as NpcId,
        npcName: part.npc.name,
        playerChoiceId: String(choiceIdx),
        playerChoiceLabel: choice.label,
        npcReaction: data.dialogue,
        npcInnerThoughts: data.inner_thoughts,
        stage: state.stage,
        timestamp: Date.now(),
      };

      let newMetrics = applyMetricChanges(get().metrics, data.metric_changes);
      if (data.special_event) {
        newMetrics = applySpecialEventRewards(newMetrics, data.special_event);
      }

      const newKeyEvents = [...get().keyEvents];
      const shortReaction = data.dialogue.length > 80 ? data.dialogue.slice(0, 80) + "..." : data.dialogue;
      newKeyEvents.push(
        `[${state.stage}] ${state.activeScene}: Player chose "${choice.label}" → ${part.npc.name}: "${shortReaction}"`
      );
      if (data.special_event) {
        newKeyEvents.push(`Event: ${data.special_event} (turn ${state.turn + 1})`);
      }

      let garryRejected = state.garryRejected;
      if (data.special_event === "yc_rejected") garryRejected = true;

      const newTurnCount = state.sceneTurnCount + 1;
      const isComplete = data.scene_complete || newTurnCount >= 7 || !!data.special_event;

      set((s) => ({
        sceneHistory: [...s.sceneHistory, outcome],
        lastNpcReaction: data,
        metrics: newMetrics,
        turn: s.turn + 1,
        isLoading: false,
        keyEvents: newKeyEvents,
        garryRejected,
        actionsThisStage: s.actionsThisStage + 1,
        sceneStep: "reaction",
        sceneTurnCount: newTurnCount,
        sceneComplete: isComplete,
        sceneMessages: [
          ...s.sceneMessages,
          { role: "player" as const, text: choice.label },
          { role: "npc" as const, text: data.dialogue, innerThoughts: data.inner_thoughts },
        ],
      }));

      if (data.stage_advance) {
        get().advanceStage(getNextStage(get().stage));
      }

      if (data.special_event) {
        set({ activeCutscene: data.special_event });
      }

      if (newMetrics.runway <= 0) set({ activeCutscene: "game_over" });
      if (newMetrics.hype * newMetrics.runway >= 1_000_000_000) set({ activeCutscene: "unicorn" });
    } catch {
      set({ isLoading: false, sceneStep: "greeting" });
    }
  },

  // Generate follow-up choices for multi-turn scene
  continueScene: async () => {
    const state = get();
    if (!state.activeScene || state.isLoading || state.sceneComplete) return;

    const part = resolveCurrentTemplatePart(state.activeScene, state.demoDayPartIndex);
    if (!part) return;

    set({ isLoading: true, sceneStep: "generating" });

    // Build a follow-up instruction that includes the conversation so far
    const convoSoFar = state.sceneMessages
      .map((m) => (m.role === "player" ? `Player: "${m.text}"` : `${part.npc.name}: "${m.text}"`))
      .join("\n");

    const followUpInstructions = `${part.geminiInstructions}

CONVERSATION SO FAR IN THIS SCENE (turn ${state.sceneTurnCount} of max 7):
${convoSoFar}

Generate a FOLLOW-UP response and new choices. Continue the conversation naturally. Do NOT repeat what was already said.
If the conversation has reached a natural conclusion (2-7 turns), you may generate a shorter list of choices or wrap-up choices.
The greeting should be the NPC's next line continuing the conversation.`;

    try {
      const res = await fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: part.npc.id,
          sceneContext: part.sceneContext,
          geminiInstructions: followUpInstructions,
          gameState: buildGameStatePayload(get()),
          sceneHistory: get().sceneHistory,
          keyEvents: get().keyEvents,
        }),
      });

      const data = await res.json();

      set({
        generatedGreeting: data.greeting,
        generatedChoices: data.choices,
        sceneStep: "greeting",
        isLoading: false,
        lastNpcReaction: null,
        lastChoiceId: null,
      });
    } catch {
      set({
        sceneComplete: true,
        sceneStep: "reaction",
        isLoading: false,
      });
    }
  },

  dismissScene: () => {
    const state = get();

    // For demo_day multi-part: generate the next part
    if (state.activeScene === "demo_day") {
      const template = getTemplate("demo_day");
      if (template && isDemoDayTemplate(template)) {
        const nextIdx = state.demoDayPartIndex + 1;
        if (nextIdx < template.parts.length) {
          // Generate next part's scene
          const nextPart = template.parts[nextIdx] as DemoDayPartTemplate;

          set({
            sceneStep: "generating",
            demoDayPartIndex: nextIdx,
            lastNpcReaction: null,
            lastChoiceId: null,
            generatedGreeting: null,
            generatedChoices: null,
            isLoading: true,
          });

          // Fire off scene generation for next part
          fetch("/api/scene", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              npcId: nextPart.npc.id,
              sceneContext: nextPart.sceneContext,
              geminiInstructions: nextPart.geminiInstructions,
              gameState: buildGameStatePayload(get()),
              sceneHistory: get().sceneHistory,
              keyEvents: get().keyEvents,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              set({
                generatedGreeting: data.greeting,
                generatedChoices: data.choices,
                sceneStep: "greeting",
                isLoading: false,
              });
            })
            .catch(() => {
              set({
                generatedGreeting: "What do you think?",
                generatedChoices: [
                  { label: "Go bold", subtext: "Swing big", context: "Player chose a bold approach" },
                  { label: "Play it safe", subtext: "Measured response", context: "Player chose a safe approach" },
                  { label: "Surprise them", subtext: "Unexpected angle", context: "Player took an unexpected angle" },
                ],
                sceneStep: "greeting",
                isLoading: false,
              });
            });

          return;
        }
      }
    }

    // Return to hub
    set({
      activeScene: null,
      sceneStep: "generating",
      lastNpcReaction: null,
      lastChoiceId: null,
      generatedGreeting: null,
      generatedChoices: null,
      sceneTurnCount: 0,
      sceneComplete: false,
      sceneMessages: [],
      demoDayPartIndex: 0,
    });
  },

  executeAction: (actionId: string) => {
    const state = get();
    const ACTION_EFFECTS: Record<string, { energy: number; runway: number; hype: number; feedback: string }> = {
      code_mvp: { energy: -1, runway: 800, hype: 2, feedback: "🔨 Shipped a feature. First paying user! +$800, Hype +2." },
      eat_ramen: { energy: 1, runway: -200, hype: 0, feedback: "🍜 Cheap fuel. Energy restored. (-$200)" },
      iterate_product: { energy: -1, runway: 1500, hype: 3, feedback: "🔨 Shipped improvements. Users upgraded! +$1,500, Hype +3." },
      practice_pitch: { energy: -1, runway: -300, hype: 2, feedback: "🎤 Getting sharper. Hype +2. (-$300)" },
      check_inbox: { energy: 0, runway: 0, hype: 1, feedback: "📱 52 unread from VCs. You feel validated. Hype +1." },
      deep_breath: { energy: 0, runway: 0, hype: 0, feedback: "🧘 You center yourself. Ready to pitch." },
    };

    const effect = ACTION_EFFECTS[actionId];
    if (!effect) return;
    if (state.metrics.energy + effect.energy < 0) return;

    const newMetrics = {
      energy: Math.max(0, Math.min(5, state.metrics.energy + effect.energy)),
      runway: Math.max(0, state.metrics.runway + effect.runway),
      hype: Math.max(0, Math.min(100, state.metrics.hype + effect.hype)),
    };

    const newKeyEvents = [...state.keyEvents];
    if (actionId === "code_mvp") newKeyEvents.push(`Coded on MVP (turn ${state.turn + 1})`);
    if (actionId === "iterate_product") newKeyEvents.push(`Iterated product (turn ${state.turn + 1})`);

    set({
      metrics: newMetrics,
      turn: state.turn + 1,
      keyEvents: newKeyEvents,
      actionFeedback: effect.feedback,
      actionsThisStage: state.actionsThisStage + 1,
    });

    if (newMetrics.runway <= 0) {
      set({ activeCutscene: "game_over" });
    }
  },

  clearActionFeedback: () => set({ actionFeedback: null }),

  dismissCutscene: () => {
    const state = get();
    if (state.activeCutscene === "zuck_layoff") {
      set({ activeCutscene: "layoff_scene" });
      return;
    }
    if (state.activeCutscene === "layoff_scene") {
      set({ activeCutscene: "building_scene" });
      return;
    }
    if (state.activeCutscene === "building_scene") {
      set({ activeCutscene: "pick_startup" });
      return;
    }
    set({ activeCutscene: null });
  },

  advanceStage: (newStage: Stage) => {
    set((s) => ({
      stage: newStage,
      metrics: { ...s.metrics, energy: 5 },
      activeScene: null,
      actionsThisStage: 0,
    }));
    get().addKeyEvent(`Advanced to ${newStage} stage (turn ${get().turn})`);
  },

  addKeyEvent: (event: string) => {
    set((s) => ({ keyEvents: [...s.keyEvents, event] }));
  },

  resetGame: () => {
    set({
      started: false,
      startupName: "",
      startupIdea: "",
      stage: "layoff",
      metrics: { energy: 5, runway: 12000, hype: 0 },
      turn: 0,
      sceneHistory: [],
      keyEvents: [],
      activeScene: null,
      sceneStep: "generating",
      demoDayPartIndex: 0,
      lastNpcReaction: null,
      lastChoiceId: null,
      generatedGreeting: null,
      generatedChoices: null,
      sceneTurnCount: 0,
      sceneComplete: false,
      sceneMessages: [],
      garryRejected: false,
      demoDayDone: false,
      actionsThisStage: 0,
      activeCutscene: null,
      isLoading: false,
      actionFeedback: null,
    });
  },

  getValuation: () => {
    const { hype, runway } = get().metrics;
    return hype * runway;
  },
}));

// Export for SceneView
export { resolveCurrentTemplatePart };
