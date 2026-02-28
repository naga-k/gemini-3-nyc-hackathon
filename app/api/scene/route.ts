import { NextResponse } from "next/server";
import { getNpcPrompt } from "@/lib/npcs";
import { buildSceneGenerationPrompt, callGemini, parseGeneratedScene } from "@/lib/gemini";
import type { NpcId, SceneOutcome } from "@/lib/gameState";

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
      sceneContext,
      geminiInstructions,
      gameState,
      sceneHistory,
      keyEvents,
    } = body as {
      npcId: NpcId;
      sceneContext: string;
      geminiInstructions: string;
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
      sceneHistory: SceneOutcome[];
      keyEvents: string[];
    };

    const systemPrompt = getNpcPrompt(npcId);
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown NPC: ${npcId}` },
        { status: 400 }
      );
    }

    const prompt = buildSceneGenerationPrompt(
      systemPrompt,
      sceneContext,
      geminiInstructions,
      gameState,
      sceneHistory,
      keyEvents,
      npcId
    );

    const raw = await callGemini(prompt);
    const parsed = parseGeneratedScene(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Scene generation API error:", error);
    return NextResponse.json(
      {
        greeting: "So, tell me what you've been working on.",
        choices: [
          { label: "Pitch confidently", subtext: "Lead with vision", context: "Player pitched with confidence" },
          { label: "Show the data", subtext: "Numbers first", context: "Player led with metrics" },
          { label: "Ask for feedback", subtext: "Stay humble", context: "Player asked for honest feedback" },
        ],
      },
      { status: 200 }
    );
  }
}
