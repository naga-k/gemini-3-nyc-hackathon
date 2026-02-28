import { create } from "zustand";

// ─── Types ───────────────────────────────────────────────

export type Stage = "layoff" | "garage" | "yc" | "demo-day" | "post-demo" | "win";

export const STAGE_ORDER: Stage[] = ["layoff", "garage", "yc", "demo-day", "post-demo", "win"];

export type NpcId = "garry" | "user" | "batchmate" | "thiel" | "a16z" | "elon";

export interface ChatMessage {
  npcId: NpcId;
  role: "user" | "assistant";
  content: string;
  innerThoughts?: string;
  stage: Stage;
  timestamp: number;
}

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
}

export interface DemoDayReaction {
  npc: string;
  dialogue: string;
  inner_thoughts: string;
}

export interface DemoDayResponse {
  reactions: DemoDayReaction[];
  metric_changes: {
    hype?: number;
    runway?: number;
    energy?: number;
  };
  stage_advance: boolean;
  special_event: SpecialEvent;
}

export interface Metrics {
  energy: number;
  runway: number;
  hype: number;
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

  // Conversation
  chatHistory: ChatMessage[];
  keyEvents: string[];
  currentNpc: NpcId | null;

  // UI state
  activeCutscene: SpecialEvent | "zuck_layoff" | null;
  isLoading: boolean;
  demoDayReactions: DemoDayReaction[] | null;
  actionFeedback: string | null;

  // Actions
  startGame: (name: string, idea: string) => void;
  setCurrentNpc: (npc: NpcId | null) => void;
  sendMessage: (message: string) => Promise<void>;
  sendDemoDayPitch: (pitch: string) => Promise<void>;
  executeAction: (actionId: string) => void;
  clearActionFeedback: () => void;
  dismissCutscene: () => void;
  advanceStage: (newStage: Stage) => void;
  addKeyEvent: (event: string) => void;
  resetGame: () => void;

  // Derived
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

function applyMetricChanges(
  current: Metrics,
  changes: NpcResponse["metric_changes"]
): Metrics {
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

// ─── Store ───────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  started: false,
  startupName: "",
  startupIdea: "",
  stage: "layoff",
  metrics: { energy: 5, runway: 12000, hype: 0 },
  turn: 0,
  chatHistory: [],
  keyEvents: [],
  currentNpc: null,
  activeCutscene: null,
  isLoading: false,
  demoDayReactions: null,
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
      chatHistory: [],
      keyEvents: [],
      currentNpc: null,
    });
  },

  setCurrentNpc: (npc) => set({ currentNpc: npc }),

  sendMessage: async (message: string) => {
    const state = get();
    if (!state.currentNpc || state.isLoading) return;

    const userMsg: ChatMessage = {
      npcId: state.currentNpc,
      role: "user",
      content: message,
      stage: state.stage,
      timestamp: Date.now(),
    };

    set((s) => ({
      chatHistory: [...s.chatHistory, userMsg],
      isLoading: true,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: state.currentNpc,
          playerMessage: message,
          gameState: {
            stage: state.stage,
            stageName: state.stage,
            energy: state.metrics.energy,
            runway: state.metrics.runway,
            hype: state.metrics.hype,
            valuation: state.metrics.hype * state.metrics.runway,
            startupName: state.startupName,
            startupIdea: state.startupIdea,
            turn: state.turn,
          },
          chatHistory: [...state.chatHistory, userMsg],
          keyEvents: state.keyEvents,
        }),
      });

      const data: NpcResponse = await res.json();

      const npcMsg: ChatMessage = {
        npcId: state.currentNpc,
        role: "assistant",
        content: data.dialogue,
        innerThoughts: data.inner_thoughts,
        stage: state.stage,
        timestamp: Date.now(),
      };

      let newMetrics = applyMetricChanges(get().metrics, data.metric_changes);

      // Apply special event rewards
      if (data.special_event) {
        newMetrics = applySpecialEventRewards(newMetrics, data.special_event);
      }

      const newKeyEvents = [...get().keyEvents];
      if (data.special_event) {
        newKeyEvents.push(
          `${data.special_event} triggered after talking to ${state.currentNpc} (turn ${state.turn + 1})`
        );
      }

      set((s) => ({
        chatHistory: [...s.chatHistory, npcMsg],
        metrics: newMetrics,
        turn: s.turn + 1,
        isLoading: false,
        keyEvents: newKeyEvents,
      }));

      // Stage advance
      if (data.stage_advance) {
        get().advanceStage(getNextStage(get().stage));
      }

      // Cutscenes for special events
      if (data.special_event) {
        set({ activeCutscene: data.special_event });
      }

      // Check game over
      if (newMetrics.runway <= 0) {
        set({ activeCutscene: "game_over" });
      }

      // Check win
      if (newMetrics.hype * newMetrics.runway >= 1_000_000_000) {
        set({ activeCutscene: "unicorn" });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  sendDemoDayPitch: async (pitch: string) => {
    const state = get();
    if (state.isLoading) return;

    set({ isLoading: true });

    try {
      const res = await fetch("/api/demo-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerMessage: pitch,
          gameState: {
            stage: state.stage,
            stageName: state.stage,
            energy: state.metrics.energy,
            runway: state.metrics.runway,
            hype: state.metrics.hype,
            valuation: state.metrics.hype * state.metrics.runway,
            startupName: state.startupName,
            startupIdea: state.startupIdea,
            turn: state.turn,
          },
          chatHistory: state.chatHistory,
          keyEvents: state.keyEvents,
        }),
      });

      const data: DemoDayResponse = await res.json();

      let newMetrics = applyMetricChanges(get().metrics, data.metric_changes);
      if (data.special_event) {
        newMetrics = applySpecialEventRewards(newMetrics, data.special_event);
      }

      const newKeyEvents = [...get().keyEvents];
      if (data.special_event) {
        newKeyEvents.push(
          `Demo Day result: ${data.special_event} (turn ${state.turn + 1})`
        );
      }

      set({
        demoDayReactions: data.reactions,
        metrics: newMetrics,
        turn: state.turn + 1,
        isLoading: false,
        keyEvents: newKeyEvents,
      });

      if (data.stage_advance) {
        get().advanceStage(getNextStage(get().stage));
      }

      if (data.special_event) {
        set({ activeCutscene: data.special_event });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  executeAction: (actionId: string) => {
    const state = get();
    // Import action defs inline to avoid circular — actions are simple objects
    const ACTION_EFFECTS: Record<string, { energy: number; runway: number; hype: number; feedback: string }> = {
      code_mvp: { energy: -1, runway: -500, hype: 2, feedback: "🔨 Shipped some code. Hype +2." },
      eat_ramen: { energy: 1, runway: -200, hype: 0, feedback: "🍜 Cheap fuel. Energy restored. (-$200)" },
      iterate_product: { energy: -1, runway: -800, hype: 3, feedback: "🔨 Product improved. Hype +3." },
      practice_pitch: { energy: -1, runway: -300, hype: 2, feedback: "🎤 Getting sharper. Hype +2." },
      check_inbox: { energy: 0, runway: 0, hype: 1, feedback: "📱 47 unread from VCs. You feel validated. Hype +1." },
    };

    const effect = ACTION_EFFECTS[actionId];
    if (!effect) return;

    if (state.metrics.energy + effect.energy < 0) return; // not enough energy

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
    });

    // Game over check
    if (newMetrics.runway <= 0) {
      set({ activeCutscene: "game_over" });
    }
  },

  clearActionFeedback: () => set({ actionFeedback: null }),

  dismissCutscene: () => {
    const state = get();
    // If it was the layoff cutscene, advance to garage
    if (state.activeCutscene === "zuck_layoff") {
      set({ activeCutscene: null, stage: "garage" });
      get().addKeyEvent("Laid off from Meta. Starting a company.");
      return;
    }
    // If it was a stage-advancing event, stage was already advanced
    set({ activeCutscene: null });
  },

  advanceStage: (newStage: Stage) => {
    set((s) => ({
      stage: newStage,
      metrics: { ...s.metrics, energy: 5 },
      currentNpc: null,
      demoDayReactions: null,
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
      chatHistory: [],
      keyEvents: [],
      currentNpc: null,
      activeCutscene: null,
      isLoading: false,
      demoDayReactions: null,
      actionFeedback: null,
    });
  },

  getValuation: () => {
    const { hype, runway } = get().metrics;
    return hype * runway;
  },
}));
