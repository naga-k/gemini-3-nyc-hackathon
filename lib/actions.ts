import type { Stage, NpcId } from "./gameState";

export interface GameAction {
  id: string;
  label: string;
  emoji: string;
  description: string;
  energyCost: number;
  stages: Stage[];
  type: "solo" | "npc" | "demo-day";
  npcId?: NpcId;
}

export const ACTIONS: GameAction[] = [
  // ─── Stage 1: Garage ───────────────────────────────
  {
    id: "code_mvp",
    label: "Code MVP",
    emoji: "🔨",
    description: "Build features. Hype +2, Runway -$500",
    energyCost: 1,
    stages: ["garage", "yc"],
    type: "solo",
  },
  {
    id: "talk_users",
    label: "Talk to Users",
    emoji: "🗣️",
    description: "Get honest feedback from a potential customer",
    energyCost: 1,
    stages: ["garage", "yc"],
    type: "npc",
    npcId: "user",
  },
  {
    id: "apply_yc",
    label: "Apply to YC",
    emoji: "📝",
    description: "Pitch Garry Tan for YC admission",
    energyCost: 2,
    stages: ["garage"],
    type: "npc",
    npcId: "garry",
  },
  {
    id: "eat_ramen",
    label: "Eat Ramen",
    emoji: "🍜",
    description: "Cheap meal. No cost. Just vibes.",
    energyCost: 0,
    stages: ["garage", "yc"],
    type: "solo",
  },

  // ─── Stage 2: YC Batch ─────────────────────────────
  {
    id: "office_hours",
    label: "Office Hours",
    emoji: "💬",
    description: "Tough mentorship from Garry Tan",
    energyCost: 1,
    stages: ["yc"],
    type: "npc",
    npcId: "garry",
  },
  {
    id: "iterate_product",
    label: "Iterate Product",
    emoji: "🔨",
    description: "Ship improvements. Hype +3, Runway -$800",
    energyCost: 1,
    stages: ["yc"],
    type: "solo",
  },
  {
    id: "yc_dinner",
    label: "YC Dinner",
    emoji: "🍕",
    description: "Bond with batch mates, hear gossip",
    energyCost: 1,
    stages: ["yc"],
    type: "npc",
    npcId: "batchmate",
  },
  {
    id: "practice_pitch",
    label: "Practice Pitch",
    emoji: "🎤",
    description: "Prep for Demo Day. Hype +2, Runway -$300",
    energyCost: 1,
    stages: ["yc"],
    type: "solo",
  },

  // ─── Stage 3: Demo Day ─────────────────────────────
  {
    id: "demo_day_pitch",
    label: "Demo Day Pitch",
    emoji: "🎤",
    description: "Pitch to a panel of VCs. THE big moment.",
    energyCost: 2,
    stages: ["demo-day"],
    type: "demo-day",
  },

  // ─── Stage 4: Post-Demo Day ────────────────────────
  {
    id: "meet_thiel",
    label: "Meet Peter Thiel",
    emoji: "💰",
    description: "Pitch the contrarian for an angel check",
    energyCost: 2,
    stages: ["post-demo"],
    type: "npc",
    npcId: "thiel",
  },
  {
    id: "meet_a16z",
    label: "Meet Marc Andreessen",
    emoji: "💰",
    description: "Pitch a16z for Series A",
    energyCost: 2,
    stages: ["post-demo"],
    type: "npc",
    npcId: "a16z",
  },
  {
    id: "talk_elon",
    label: "Talk to Elon",
    emoji: "🎲",
    description: "High risk, high reward. Wildcard.",
    energyCost: 1,
    stages: ["post-demo"],
    type: "npc",
    npcId: "elon",
  },
  {
    id: "check_inbox",
    label: "Check Inbox",
    emoji: "📱",
    description: "47 unread from VCs... just vibes.",
    energyCost: 0,
    stages: ["post-demo"],
    type: "solo",
  },
];

export function getActionsForStage(stage: Stage): GameAction[] {
  return ACTIONS.filter((a) => a.stages.includes(stage));
}
