import { NextResponse } from "next/server";
import { DEMO_DAY_PROMPT } from "@/lib/npcs";
import { buildFullPrompt, callGemini, parseDemoDayResponse } from "@/lib/gemini";
import type { ChatMessage } from "@/lib/gameState";

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { playerMessage, gameState, chatHistory, keyEvents } = body as {
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

    // For Demo Day, we use a combined prompt with all three VCs
    // We pass "garry" as currentNpc since Garry is the primary, but cross-NPC
    // memory will include ALL conversations
    const fullPrompt = buildFullPrompt(
      DEMO_DAY_PROMPT,
      gameState,
      chatHistory,
      keyEvents,
      "garry", // primary NPC for memory filtering
      playerMessage
    );

    const raw = await callGemini(fullPrompt);
    const parsed = parseDemoDayResponse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Demo Day API error:", error);
    return NextResponse.json(
      {
        reactions: [
          {
            npc: "Garry Tan",
            dialogue: "Solid pitch. Let's see where this goes.",
            inner_thoughts: "(They've come a long way.)",
          },
          {
            npc: "Peter Thiel",
            dialogue: "Interesting.",
            inner_thoughts: "(Needs to be bolder.)",
          },
          {
            npc: "Marc Andreessen",
            dialogue: "Software is eating this market.",
            inner_thoughts: "(Let me test their conviction later.)",
          },
        ],
        metric_changes: { hype: 10, runway: 0, energy: -2 },
        stage_advance: true,
        special_event: "demo_day_success",
      },
      { status: 200 }
    );
  }
}
