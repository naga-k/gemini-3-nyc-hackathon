import { NextResponse } from "next/server";
import { getNpcPrompt } from "@/lib/npcs";
import { buildFullPrompt, callGemini, parseNpcResponse } from "@/lib/gemini";
import type { NpcId, ChatMessage } from "@/lib/gameState";

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      npcId,
      playerMessage,
      gameState,
      chatHistory,
      keyEvents,
    } = body as {
      npcId: NpcId;
      playerMessage: string;
      gameState: {
        stage: string;
        energy: number;
        runway: number;
        hype: number;
        valuation: number;
        startupName: string;
        startupIdea: string;
        turn: number;
      };
      chatHistory: ChatMessage[];
      keyEvents: string[];
    };

    const systemPrompt = getNpcPrompt(npcId);
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown NPC: ${npcId}` },
        { status: 400 }
      );
    }

    const fullPrompt = buildFullPrompt(
      systemPrompt,
      gameState,
      chatHistory,
      keyEvents,
      npcId,
      playerMessage
    );

    const raw = await callGemini(fullPrompt);
    const parsed = parseNpcResponse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        dialogue: "Sorry, I got distracted. What were you saying?",
        inner_thoughts: "",
        metric_changes: { hype: 0, runway: 0, energy: 0 },
        stage_advance: false,
        special_event: null,
      },
      { status: 200 } // Return 200 with fallback so game doesn't break
    );
  }
}
