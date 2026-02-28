import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage, NpcId, NpcResponse, DemoDayResponse } from "./gameState";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const NPC_DISPLAY_NAMES: Record<NpcId, string> = {
  garry: "Garry Tan",
  user: "Early User",
  batchmate: "Batch Mate",
  thiel: "Peter Thiel",
  a16z: "Marc Andreessen",
  elon: "Elon Musk",
};

// ─── Cross-NPC Memory Builder ────────────────────────────

export function buildCrossNpcMemory(chatHistory: ChatMessage[], currentNpc: NpcId): string {
  const otherMessages = chatHistory.filter((m) => m.npcId !== currentNpc);
  if (otherMessages.length === 0) {
    return "The player hasn't spoken to anyone else yet.";
  }

  const byNpc = new Map<NpcId, ChatMessage[]>();
  for (const msg of otherMessages) {
    if (!byNpc.has(msg.npcId)) byNpc.set(msg.npcId, []);
    byNpc.get(msg.npcId)!.push(msg);
  }

  let memory =
    "INTEL FROM OTHER CONVERSATIONS (you've heard through the grapevine — this is a small community, everyone talks):\n\n";

  for (const [npcId, messages] of byNpc) {
    const name = NPC_DISPLAY_NAMES[npcId] || npcId;
    const recent = messages.slice(-6); // last 3 exchanges
    memory += `--- What ${name} and the player discussed ---\n`;
    for (const m of recent) {
      const speaker = m.role === "user" ? "Player" : name;
      memory += `${speaker}: ${m.content}\n`;
    }
    memory += "\n";
  }

  return memory;
}

// ─── Prompt Builder ──────────────────────────────────────

export function buildFullPrompt(
  systemPrompt: string,
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
  chatHistory: ChatMessage[],
  keyEvents: string[],
  currentNpc: NpcId,
  playerMessage: string
): string {
  const gameContext = `
CURRENT GAME STATE:
- Stage: ${gameState.stage}
- Turn: ${gameState.turn}
- Energy: ${gameState.energy}/5
- Runway: $${gameState.runway.toLocaleString()}
- Hype: ${gameState.hype}/100
- Valuation: $${gameState.valuation.toLocaleString()}
- Startup: "${gameState.startupName}" — ${gameState.startupIdea}
`;

  const events =
    keyEvents.length > 0
      ? "KEY EVENTS SO FAR:\n" + keyEvents.map((e) => `- ${e}`).join("\n") + "\n"
      : "No major events have happened yet.\n";

  const crossMemory = buildCrossNpcMemory(chatHistory, currentNpc);

  // Direct conversation history with this NPC
  const directMessages = chatHistory.filter((m) => m.npcId === currentNpc);
  let directHistory = "";
  if (directMessages.length > 0) {
    directHistory = "YOUR PREVIOUS CONVERSATION WITH THIS PLAYER:\n";
    for (const m of directMessages) {
      const speaker = m.role === "user" ? "Player" : NPC_DISPLAY_NAMES[currentNpc];
      directHistory += `${speaker}: ${m.content}\n`;
    }
    directHistory += "\n";
  }

  return `${systemPrompt}

${gameContext}

${events}

${crossMemory}

${directHistory}

Player says: "${playerMessage}"

Remember: respond ONLY with valid JSON. No text outside the JSON object.`;
}

// ─── Gemini Call ─────────────────────────────────────────

export async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
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
    };
  } catch {
    // Fallback: treat raw text as dialogue
    return {
      dialogue: raw.slice(0, 500) || "Hmm, let me think about that...",
      inner_thoughts: "",
      metric_changes: { hype: 0, runway: -500, energy: -1 },
      stage_advance: false,
      special_event: null,
    };
  }
}

export function parseDemoDayResponse(raw: string): DemoDayResponse {
  try {
    const data = JSON.parse(raw);
    return {
      reactions: Array.isArray(data.reactions)
        ? data.reactions.map((r: Record<string, string>) => ({
            npc: r.npc || "Unknown",
            dialogue: r.dialogue || "...",
            inner_thoughts: r.inner_thoughts || "",
          }))
        : [],
      metric_changes: {
        hype: typeof data.metric_changes?.hype === "number" ? data.metric_changes.hype : 0,
        runway: typeof data.metric_changes?.runway === "number" ? data.metric_changes.runway : 0,
        energy: typeof data.metric_changes?.energy === "number" ? data.metric_changes.energy : 0,
      },
      stage_advance: !!data.stage_advance,
      special_event: data.special_event || null,
    };
  } catch {
    return {
      reactions: [
        { npc: "Garry Tan", dialogue: "Interesting pitch. Let's see where this goes.", inner_thoughts: "" },
      ],
      metric_changes: { hype: 5, runway: 0, energy: -2 },
      stage_advance: false,
      special_event: null,
    };
  }
}
