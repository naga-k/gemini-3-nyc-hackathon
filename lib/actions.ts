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
    description: "Ship & earn. Hype +2, Runway +$800",
    energyCost: 1,
    stages: ["garage"],
    type: "solo",
  },
  {
    id: "talk_users",
    label: "Talk to Users",
    emoji: "🗣️",
    description: "Get honest feedback from a potential customer",
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
    description: "Tough mentorship from Garry Tan",
    energyCost: 1,
    stages: ["yc"],
    type: "scene",
    sceneId: "office_hours",
  },
  {
    id: "iterate_product",
    label: "Iterate Product",
    emoji: "🔨",
    description: "Ship & grow. Hype +3, Runway +$1,500",
    energyCost: 1,
    stages: ["yc"],
    type: "solo",
  },
  {
    id: "talk_users_2",
    label: "Talk to Users",
    emoji: "🗣️",
    description: "Follow up with your early user",
    energyCost: 1,
    stages: ["yc"],
    type: "scene",
    sceneId: "user_chat_2",
  },
  {
    id: "yc_dinner",
    label: "YC Dinner",
    emoji: "🍕",
    description: "Bond with batch mates, hear gossip",
    energyCost: 1,
    stages: ["yc"],
    type: "scene",
    sceneId: "yc_dinner",
  },
  {
    id: "practice_pitch",
    label: "Demo Day Prep",
    emoji: "🎤",
    description: "Get sharper. Hype +2, Runway -$300",
    energyCost: 1,
    stages: ["yc"],
    type: "solo",
  },

  // ─── Stage 3: Demo Day ─────────────────────────────
  {
    id: "demo_day_pitch",
    label: "Give Your Pitch",
    emoji: "🎤",
    description: "Pitch to a panel of VCs. THE big moment.",
    energyCost: 2,
    stages: ["demo-day"],
    type: "scene",
    sceneId: "demo_day",
  },
  {
    id: "deep_breath",
    label: "Deep Breath",
    emoji: "🧘",
    description: "Center yourself before the big moment.",
    energyCost: 0,
    stages: ["demo-day"],
    type: "solo",
  },

  // ─── Stage 4: Post-Demo Day ────────────────────────
  {
    id: "meet_thiel",
    label: "Meet Peter Thiel",
    emoji: "💰",
    description: "Pitch the contrarian for an angel check",
    energyCost: 2,
    stages: ["post-demo"],
    type: "scene",
    sceneId: "thiel_meeting",
  },
  {
    id: "meet_a16z",
    label: "Meet Marc Andreessen",
    emoji: "💰",
    description: "Pitch a16z for Series A",
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
  {
    id: "check_inbox",
    label: "Check Inbox",
    emoji: "📱",
    description: "52 unread from VCs... just vibes.",
    energyCost: 0,
    stages: ["post-demo"],
    type: "solo",
  },
];

export function getActionsForStage(stage: Stage): GameAction[] {
  return ACTIONS.filter((a) => a.stages.includes(stage));
}
