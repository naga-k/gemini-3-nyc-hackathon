import { GoogleGenAI, Modality } from "@google/genai";
import type { NpcId } from "./gameState";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

// Map NPCs to different Gemini voice presets
const NPC_VOICES: Record<NpcId, string> = {
  garry: "Kore",
  user: "Leda",
  batchmate: "Charon",
  thiel: "Orus",
  a16z: "Zephyr",
  elon: "Fenrir",
  player: "Puck",
};

const NPC_VOICE_INSTRUCTIONS: Record<NpcId, string> = {
  garry: "Speak as Garry Tan — warm, direct, encouraging but real. Builder-first energy. Keep it natural and conversational.",
  user: "Speak as a young woman — friendly, down to earth, casual tone. You're a potential customer giving honest feedback.",
  batchmate: "Speak as a fellow startup founder — energetic, supportive but subtly competitive. Casual peer-to-peer tone.",
  thiel: "Speak as Peter Thiel — quiet intensity, measured words, every sentence has weight. Terse and philosophical.",
  a16z: "Speak as Marc Andreessen — confident, big-picture thinking, techno-optimist energy. Bold and analytical.",
  elon: "Speak as Elon Musk — rapid-fire, unpredictable, mix of technical depth and absurdist humor. Chaotic energy.",
  player: "Speak as a young male startup founder — confident but slightly nervous, passionate about your idea. Natural and conversational.",
};

export async function generateVoice(
  dialogue: string,
  npcId: NpcId
): Promise<{ audioBase64: string; mimeType: string } | null> {
  return new Promise((resolve) => {
    const audioChunks: string[] = [];
    let resolved = false;
    let session: Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null = null;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        session?.close();
        resolve(null);
      }
    }, 20000);

    getAI()
      .live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: NPC_VOICES[npcId] || "Zephyr",
              },
            },
          },
          systemInstruction: NPC_VOICE_INSTRUCTIONS[npcId] || "Speak naturally.",
        },
        callbacks: {
          onopen: () => {},
          onmessage: (msg) => {
            // After setup, send the dialogue text
            if (msg.setupComplete) {
              session?.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Say the following dialogue naturally, in character. Do not add anything extra:\n\n"${dialogue}"`,
                      },
                    ],
                  },
                ],
                turnComplete: true,
              });
              return;
            }

            // Collect audio chunks from model turn
            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  audioChunks.push(part.inlineData.data);
                }
              }
            }

            // When turn is complete, resolve with concatenated audio
            if (msg.serverContent?.turnComplete) {
              clearTimeout(timeout);
              if (!resolved) {
                resolved = true;
                if (audioChunks.length > 0) {
                  resolve({
                    audioBase64: concatBase64PCM(audioChunks),
                    mimeType: "audio/pcm;rate=24000",
                  });
                } else {
                  resolve(null);
                }
              }
              session?.close();
            }
          },
          onerror: () => {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          },
          onclose: () => {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              if (audioChunks.length > 0) {
                resolve({
                  audioBase64: concatBase64PCM(audioChunks),
                  mimeType: "audio/pcm;rate=24000",
                });
              } else {
                resolve(null);
              }
            }
          },
        },
      })
      .then((s) => {
        session = s;
      })
      .catch((err) => {
        console.error("[Voice] Connection failed:", err?.message);
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });
  });
}

function concatBase64PCM(chunks: string[]): string {
  const buffers = chunks.map((c) => Buffer.from(c, "base64"));
  const total = buffers.reduce((acc, b) => acc + b.length, 0);
  const combined = Buffer.alloc(total);
  let offset = 0;
  for (const buf of buffers) {
    buf.copy(combined, offset);
    offset += buf.length;
  }
  return combined.toString("base64");
}
