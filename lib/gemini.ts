import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SceneOutcome, NpcId, NpcResponse } from "./gameState";
import type { GeneratedScene } from "./scenes";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Cross-NPC Memory Builder ────────────────────────────

export function buildCrossNpcMemory(sceneHistory: SceneOutcome[], currentNpcId: NpcId): string {
  const otherOutcomes = sceneHistory.filter((o) => o.npcId !== currentNpcId);
  if (otherOutcomes.length === 0) {
    return "The player hasn't spoken to anyone else yet.";
  }

  const byNpc = new Map<NpcId, SceneOutcome[]>();
  for (const outcome of otherOutcomes) {
    if (!byNpc.has(outcome.npcId)) byNpc.set(outcome.npcId, []);
    byNpc.get(outcome.npcId)!.push(outcome);
  }

  let memory =
    "INTEL FROM OTHER INTERACTIONS (you've heard through the grapevine — small community, everyone talks):\n\n";

  for (const [, outcomes] of byNpc) {
    const name = outcomes[0]?.npcName || "Unknown";
    memory += `--- What happened with ${name} ---\n`;
    for (const o of outcomes) {
      memory += `Player chose: "${o.playerChoiceLabel}" → ${name} said: "${o.npcReaction}"\n`;
    }
    memory += "\n";
  }

  return memory;
}

// ─── Direct History Builder ──────────────────────────────

function buildDirectHistory(sceneHistory: SceneOutcome[], currentNpcId: NpcId): string {
  const directOutcomes = sceneHistory.filter((o) => o.npcId === currentNpcId);
  if (directOutcomes.length === 0) return "";

  let history = "YOUR PREVIOUS INTERACTIONS WITH THIS PLAYER:\n";
  for (const o of directOutcomes) {
    history += `Scene: ${o.sceneId} — Player chose: "${o.playerChoiceLabel}" → You said: "${o.npcReaction}"\n`;
  }
  return history + "\n";
}

// ─── Game State Block ────────────────────────────────────

function buildGameStateBlock(gameState: {
  stage: string;
  energy: number;
  runway: number;
  hype: number;
  valuation: number;
  startupName: string;
  startupIdea: string;
  turn: number;
}): string {
  return `
CURRENT GAME STATE:
- Stage: ${gameState.stage}
- Turn: ${gameState.turn}
- Energy: ${gameState.energy}/5
- Runway: $${gameState.runway.toLocaleString()}
- Hype: ${gameState.hype}/100
- Valuation: $${gameState.valuation.toLocaleString()}
- Startup: "${gameState.startupName}" — ${gameState.startupIdea}
`;
}

// ─── Key Events Block ────────────────────────────────────

function buildEventsBlock(keyEvents: string[]): string {
  return keyEvents.length > 0
    ? "KEY EVENTS SO FAR:\n" + keyEvents.map((e) => `- ${e}`).join("\n") + "\n"
    : "No major events have happened yet.\n";
}

// ─── Scene Generation Prompt (Gemini Call #1) ────────────

export function buildSceneGenerationPrompt(
  npcSystemPrompt: string,
  sceneContext: string,
  geminiInstructions: string,
  gameState: {
    stage: string;
    energy: number;
    runway: number;
    hype: number;
    valuation: number;
    startupName: string;
    startupIdea: string;
    turn: number;
  },
  sceneHistory: SceneOutcome[],
  keyEvents: string[],
  currentNpcId: NpcId
): string {
  return `${npcSystemPrompt}

SCENE GENERATION TASK:
You are generating the OPENING of a scene. Create an in-character greeting and exactly 3 player choices.

SCENE CONTEXT: ${sceneContext}

INSTRUCTIONS FOR THIS SCENE:
${geminiInstructions}

${buildGameStateBlock(gameState)}

${buildEventsBlock(keyEvents)}

${buildCrossNpcMemory(sceneHistory, currentNpcId)}

${buildDirectHistory(sceneHistory, currentNpcId)}

CRITICAL: Your greeting MUST reference past events from the history above. If you've met this player before, reference what happened. If other NPCs have opinions about this player, weave that in naturally. This cross-reference is the most important feature of the game.

Respond ONLY with valid JSON in this exact format:
{
  "greeting": "Your in-character opening line (1-3 sentences, punchy and direct)",
  "choices": [
    { "label": "Short button text (3-6 words)", "subtext": "Brief hint (2-4 words)", "context": "What this choice means for the Gemini reaction call (1 sentence describing what the player did)" },
    { "label": "...", "subtext": "...", "context": "..." },
    { "label": "...", "subtext": "...", "context": "..." }
  ]
}`;
}

// ─── Reaction Prompt (Gemini Call #2) ────────────────────

export function buildReactionPrompt(
  npcSystemPrompt: string,
  sceneContext: string,
  geminiInstructions: string,
  gameState: {
    stage: string;
    energy: number;
    runway: number;
    hype: number;
    valuation: number;
    startupName: string;
    startupIdea: string;
    turn: number;
  },
  sceneHistory: SceneOutcome[],
  keyEvents: string[],
  currentNpcId: NpcId,
  playerChoice: string
): string {
  return `${npcSystemPrompt}

SCENE-SPECIFIC INSTRUCTIONS:
${geminiInstructions}

SCENE CONTEXT: ${sceneContext}

${buildGameStateBlock(gameState)}

${buildEventsBlock(keyEvents)}

${buildCrossNpcMemory(sceneHistory, currentNpcId)}

${buildDirectHistory(sceneHistory, currentNpcId)}

The player chose this action: "${playerChoice}"

Remember: respond ONLY with valid JSON. No text outside the JSON object. Keep dialogue to 1-3 sentences MAX.
Include "scene_complete": true if this interaction has reached a natural end point (you've made your decision, given your verdict, or the conversation has run its course). Set false if you want to continue the conversation.`;
}

// ─── Gemini Call ─────────────────────────────────────────

export async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.9,
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ─── Response Parsing ────────────────────────────────────

export function parseNpcResponse(raw: string): NpcResponse {
  try {
    const data = JSON.parse(raw);
    return {
      dialogue: data.dialogue || "...",
      inner_thoughts: data.inner_thoughts || "",
      metric_changes: {
        hype: typeof data.metric_changes?.hype === "number" ? data.metric_changes.hype : 0,
        runway: typeof data.metric_changes?.runway === "number" ? data.metric_changes.runway : 0,
        energy: typeof data.metric_changes?.energy === "number" ? data.metric_changes.energy : 0,
      },
      stage_advance: !!data.stage_advance,
      special_event: data.special_event || null,
      scene_complete: !!data.scene_complete,
    };
  } catch {
    return {
      dialogue: raw.slice(0, 500) || "Hmm, let me think about that...",
      inner_thoughts: "",
      metric_changes: { hype: 0, runway: -500, energy: -1 },
      stage_advance: false,
      special_event: null,
      scene_complete: true,
    };
  }
}

export function parseGeneratedScene(raw: string): GeneratedScene {
  try {
    const data = JSON.parse(raw);
    const choices = Array.isArray(data.choices)
      ? data.choices.slice(0, 3).map((c: Record<string, string>) => ({
          label: c.label || "Continue",
          subtext: c.subtext || "",
          context: c.context || "Player made a choice",
        }))
      : [
          { label: "Tell me more", subtext: "Stay curious", context: "Player asked to hear more" },
          { label: "Get to the point", subtext: "Be direct", context: "Player pushed for directness" },
          { label: "I have an idea", subtext: "Take initiative", context: "Player took initiative" },
        ];

    return {
      greeting: data.greeting || "So, tell me about your startup.",
      choices,
    };
  } catch {
    return {
      greeting: "Let's talk about your startup.",
      choices: [
        { label: "Pitch confidently", subtext: "Lead with vision", context: "Player pitched with confidence" },
        { label: "Show the numbers", subtext: "Data-driven", context: "Player led with metrics and data" },
        { label: "Ask for advice", subtext: "Be humble", context: "Player asked for guidance" },
      ],
    };
  }
}
