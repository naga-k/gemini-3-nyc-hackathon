import type { Stage } from "./gameState";

export interface GameAction {
  id: string;
  label: string;
  emoji: string;
  description: string;
  energyCost: number;
  stages: Stage[];
  type: "solo" | "scene";
  sceneId?: string;
}

export const ACTIONS: GameAction[] = [
  // ─── Stage 1: Garage ───────────────────────────────
  {
    id: "code_mvp",
    label: "Code MVP",
    emoji: "🔨",
    description: "Build features. Burns cash. -$500, Hype +1",
    energyCost: 1,
    stages: ["garage"],
    type: "solo",
  },
  {
    id: "talk_users",
    label: "Talk to Users",
    emoji: "🗣️",
    description: "Find your first paying user. +$1,500 on success",
    energyCost: 1,
    stages: ["garage"],
    type: "scene",
    sceneId: "user_chat_1",
  },
  {
    id: "apply_yc",
    label: "Apply to YC",
    emoji: "📝",
    description: "Pitch Garry Tan for YC admission",
    energyCost: 2,
    stages: ["garage"],
    type: "scene",
    sceneId: "yc_apply_1", // dynamically resolved to yc_apply_2 if garryRejected
  },
  {
    id: "eat_ramen",
    label: "Eat Ramen",
    emoji: "🍜",
    description: "Cheap fuel. +1 Energy, -$200",
    energyCost: 0,
    stages: ["garage", "yc"],
    type: "solo",
  },

  // ─── Stage 2: YC Batch ─────────────────────────────
  {
    id: "office_hours",
    label: "Office Hours",
    emoji: "💬",
    description: "Get tough mentorship from Garry Tan",
    energyCost: 1,
    stages: ["yc"],
    type: "scene",
    sceneId: "office_hours",
  },
  {
    id: "iterate_product",
    label: "Iterate & Ship",
    emoji: "🔨",
    description: "Build what users asked for. Hype +3, +$1,500",
    energyCost: 1,
    stages: ["yc"],
    type: "solo",
  },

  // Demo Day pitch unlocks within YC stage after 2 actions
  {
    id: "demo_day_pitch",
    label: "Give Your Pitch",
    emoji: "🎤",
    description: "Demo Day. Lead with traction if you have it.",
    energyCost: 2,
    stages: ["yc"],
    type: "scene",
    sceneId: "demo_day",
  },

  // ─── Stage 4: Post-Demo Day ────────────────────────
  {
    id: "meet_a16z",
    label: "Close Series A",
    emoji: "💰",
    description: "One meeting. Marc Andreessen. Go big.",
    energyCost: 2,
    stages: ["post-demo"],
    type: "scene",
    sceneId: "marc_meeting",
  },
  {
    id: "talk_elon",
    label: "Elon Slid Into DMs",
    emoji: "🎲",
    description: "High risk, high reward. Wildcard.",
    energyCost: 1,
    stages: ["post-demo"],
    type: "scene",
    sceneId: "elon_dm",
  },
];

export function getActionsForStage(stage: Stage): GameAction[] {
  return ACTIONS.filter((a) => a.stages.includes(stage));
}
