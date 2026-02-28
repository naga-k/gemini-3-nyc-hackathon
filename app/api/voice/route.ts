import { NextResponse } from "next/server";
import { generateVoice } from "@/lib/geminiVoice";
import type { NpcId } from "@/lib/gameState";

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { dialogue, npcId } = body as {
      dialogue: string;
      npcId: NpcId;
    };

    if (!dialogue || !npcId) {
      return NextResponse.json(
        { error: "Missing dialogue or npcId" },
        { status: 400 }
      );
    }

    const result = await generateVoice(dialogue, npcId);

    if (!result) {
      return NextResponse.json(
        { error: "Voice generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio: result.audioBase64,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error("Voice API error:", error);
    return NextResponse.json(
      { error: "Voice generation failed" },
      { status: 500 }
    );
  }
}
