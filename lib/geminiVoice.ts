import { GoogleGenAI, Modality } from "@google/genai";
import type { NpcId } from "./gameState";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

// Use standard generateContent for TTS — much faster than Live API (no WebSocket overhead)
const MODEL = "gemini-2.5-flash-preview-tts";

// Map NPCs to different Gemini voice presets
const NPC_VOICES: Record<NpcId, string> = {
  garry: "Orus",
  user: "Leda",
  batchmate: "Charon",
  thiel: "Orus",
  a16z: "Zephyr",
  elon: "Fenrir",
  player: "Puck",
};

export async function generateVoice(
  dialogue: string,
  npcId: NpcId
): Promise<{ audioBase64: string; mimeType: string } | null> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: dialogue }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: NPC_VOICES[npcId] || "Zephyr",
            },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return {
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
      };
    }

    return null;
  } catch (err) {
    console.error("[Voice] Generation failed:", (err as Error)?.message);
    return null;
  }
}
