import type { Stage } from "./gameState";

export interface StageConfig {
  id: Stage;
  name: string;
  setting: string;
  goal: string;
  index: number;
}

export const STAGES: StageConfig[] = [
  {
    id: "layoff",
    name: "Meta Layoff",
    setting: "Meta conference room",
    goal: "Get through this.",
    index: 0,
  },
  {
    id: "garage",
    name: "Garage",
    setting: "Your apartment — laptop on kitchen table",
    goal: "Talk to users → get a paying customer → apply to YC",
    index: 1,
  },
  {
    id: "yc",
    name: "YC Batch",
    setting: "YC office — orange walls, whiteboards",
    goal: "Iterate with Garry, then pitch on Demo Day",
    index: 2,
  },
  {
    id: "demo-day",
    name: "Demo Day",
    setting: "YC Demo Day stage — audience of VCs",
    goal: "Lead with traction if you have it. Story if you don't.",
    index: 3,
  },
  {
    id: "post-demo",
    name: "Post-Demo Day",
    setting: "Coffee shops, VC offices, inbox blowing up",
    goal: "Close the deal. One big meeting.",
    index: 4,
  },
  {
    id: "win",
    name: "Unicorn 🦄",
    setting: "The top",
    goal: "You went from Zero to One.",
    index: 5,
  },
];

export function getStageConfig(stage: Stage): StageConfig {
  return STAGES.find((s) => s.id === stage) || STAGES[0];
}
