import type { Stage, NpcId } from "./gameState";

// ─── Types ───────────────────────────────────────────────

export interface SceneTemplate {
  id: string;
  stage: Stage;
  location: string;
  npc: { id: NpcId; name: string; emoji: string };
  sceneType: string;
  sceneContext: string;
  geminiInstructions: string;
}

export interface GeneratedChoice {
  label: string;
  subtext: string;
  context: string;
}

export interface GeneratedScene {
  greeting: string;
  choices: GeneratedChoice[];
}

// Demo Day is a multi-part template — each part generates separately
export interface DemoDayPartTemplate {
  id: string;
  npc: { id: NpcId; name: string; emoji: string };
  sceneType: string;
  sceneContext: string;
  geminiInstructions: string;
}

export interface DemoDayTemplate {
  id: "demo_day";
  stage: "demo-day";
  location: string;
  parts: DemoDayPartTemplate[];
}

export type AnyTemplate = SceneTemplate | DemoDayTemplate;

export function isDemoDayTemplate(t: AnyTemplate): t is DemoDayTemplate {
  return t.id === "demo_day";
}

// ─── Scene Templates ─────────────────────────────────────

export const SCENE_TEMPLATES: Record<string, AnyTemplate> = {
  // ── Stage 1: Garage ────────────────────────────────────

  user_chat_1: {
    id: "user_chat_1",
    stage: "garage",
    location: "Coffee shop — you spotted a potential user",
    npc: { id: "user", name: "Alex (Early User)", emoji: "👤" },
    sceneType: "user_feedback",
    sceneContext: "Player is meeting a potential user/customer for the first time to get feedback on their early product idea. This is important: talking to users gives the founder real insights that will help them when they apply to YC. Garry Tan cares deeply about whether founders have talked to real users.",
    geminiInstructions: `Generate a greeting where the user is curious but honest about trying the product.
Generate 3 choices that test whether the founder LISTENS vs PITCHES vs ASKS ABOUT MONEY.
One choice should be about listening to the user's problems first.
One should be about pitching/explaining the vision.
One should be about asking if they'd pay or use it.
IMPORTANT: If the founder listens well, the reaction should include specific user insights they learned (e.g. "your onboarding is confusing but the core feature saves me 2 hours a week"). These details will show up in Garry's YC interview later.`,
  },

  yc_apply_1: {
    id: "yc_apply_1",
    stage: "garage",
    location: "YC Application — video interview",
    npc: { id: "garry", name: "Garry Tan", emoji: "🧑‍💼" },
    sceneType: "yc_application_first",
    sceneContext: "Player is applying to YC for the first time. This is their first interaction with Garry Tan.",
    geminiInstructions: `Generate a greeting that's direct and time-pressured — "you've got 2 minutes" energy.
Generate 3 choices that represent different pitch styles:
1. A bold vision-led pitch (big market, grand ambition)
2. A traction/numbers-led pitch (users, metrics, growth)
3. A personal story pitch (why you, why now)
The choices should feel meaningfully different in approach.

DECISION POLICY — YOU DECIDE whether to accept or reject. Use your judgment:
- Check sceneHistory: did the player talk to users? If yes, what did they learn? Founders who talked to users and can reference real feedback are MUCH stronger.
- A founder who coded + talked to users + has specific insights = strong candidate. Consider accepting (special_event "yc_accepted", stage_advance true).
- A founder who only coded and gives a vague pitch with no user understanding = weak. Reject (special_event "yc_rejected").
- You are NOT forced to reject. If the pitch is genuinely good and shows user understanding, accept them.`,
  },

  yc_apply_2: {
    id: "yc_apply_2",
    stage: "garage",
    location: "YC Application — second attempt",
    npc: { id: "garry", name: "Garry Tan", emoji: "🧑‍💼" },
    sceneType: "yc_application_second",
    sceneContext: "Player is RE-APPLYING to YC after being rejected. Garry remembers the first attempt.",
    geminiInstructions: `Generate a greeting that REFERENCES the first rejection. Garry remembers what the player said last time.
Use specifics from keyEvents and sceneHistory about the first application.
Generate 3 choices that show different types of growth:
1. Show iteration/learning from user feedback
2. Show a pivot or new direction based on data
3. Show persistence with new proof/evidence
The greeting MUST reference what happened in the first application.

DECISION POLICY: The player is back after rejection. Look for GROWTH since last time.
- If they've talked to more users, iterated, and show real learning: ACCEPT (special_event "yc_accepted", stage_advance true).
- If they're just repeating the same pitch: reject again (special_event "yc_rejected").`,
  },

  // ── Stage 2: YC Batch ──────────────────────────────────

  office_hours: {
    id: "office_hours",
    stage: "yc",
    location: "YC office — orange walls, whiteboards",
    npc: { id: "garry", name: "Garry Tan", emoji: "🧑‍💼" },
    sceneType: "office_hours",
    sceneContext: "Player is in YC office hours with Garry. He's their mentor and wants to see progress.",
    geminiInstructions: `Generate a greeting that references the player's journey so far — their YC application, what they've built, any user conversations.
Be direct: "show me your numbers" or "where are you stuck?"
Generate 3 choices about different challenges:
1. A growth/metrics problem (retention, acquisition, etc.)
2. A technical/product problem (tech debt, shipping speed, etc.)
3. An overly optimistic "everything is great" answer (which Garry should see through)`,
  },

  user_chat_2: {
    id: "user_chat_2",
    stage: "yc",
    location: "Video call with your early user",
    npc: { id: "user", name: "Alex (Early User)", emoji: "👤" },
    sceneType: "user_followup",
    sceneContext: "Player is following up with the same early user who tried the product before. The user has been using a newer version.",
    geminiInstructions: `Generate a greeting that references the user's PREVIOUS experience with the product (check sceneHistory for user_chat_1).
The user should note what's improved or changed.
Generate 3 choices:
1. Deep dive into usage patterns / what to improve next
2. Test virality / would they recommend it
3. Share excitement about upcoming Demo Day`,
  },

  yc_dinner: {
    id: "yc_dinner",
    stage: "yc",
    location: "YC batch dinner — pizza and war stories",
    npc: { id: "batchmate", name: "Jordan (Batch Mate)", emoji: "🤝" },
    sceneType: "batch_social",
    sceneContext: "Player is at YC batch dinner with a fellow founder. The batch mate has heard gossip about the player from Garry and other founders.",
    geminiInstructions: `Generate a greeting that references batch gossip — what Garry said about the player, how other companies are doing.
Use specifics from sceneHistory if the player had office hours or user conversations.
Generate 3 choices:
1. Be humble/vulnerable about struggles
2. Trade tactical advice and growth hacks
3. Ask for gossip about the batch and Garry's opinions`,
  },

  // ── Stage 3: Demo Day (multi-part) ─────────────────────

  demo_day: {
    id: "demo_day",
    stage: "demo-day",
    location: "YC Demo Day stage — 500+ investors watching",
    parts: [
      {
        id: "demo_day_pitch",
        npc: { id: "garry", name: "Garry Tan", emoji: "🧑‍💼" },
        sceneType: "demo_day_pitch",
        sceneContext: "Player is about to give their Demo Day pitch to 500+ investors. Garry is watching from the front row.",
        geminiInstructions: `Generate a high-stakes greeting — the room is quiet, hundreds of investors watching.
Reference the player's full journey from application to now.
Generate 3 pitch style choices:
1. Data-driven pitch (metrics, growth charts, traction)
2. Narrative pitch (personal story, from layoff to here)
3. Bold vision pitch (we're building a platform, not a feature)
Set stage_advance to true in the REACTION call if decent. special_event "demo_day_success" if good.`,
      },
      {
        id: "demo_day_thiel",
        npc: { id: "thiel", name: "Peter Thiel", emoji: "🏛️" },
        sceneType: "demo_day_thiel_question",
        sceneContext: "Peter Thiel just watched the Demo Day pitch and has a contrarian question.",
        geminiInstructions: `Generate a greeting that's Thiel's signature contrarian question — reference the pitch the player just gave.
Generate 2-3 choices:
1. A bold, contrarian answer matching Thiel's energy
2. A straightforward honest answer
3. (Optional) A deeper infrastructure-level answer
Do NOT set stage_advance or special_event in the reaction.`,
      },
      {
        id: "demo_day_marc",
        npc: { id: "a16z", name: "Marc Andreessen", emoji: "🌐" },
        sceneType: "demo_day_marc_test",
        sceneContext: "Marc Andreessen is testing the founder's conviction by suggesting a pivot.",
        geminiInstructions: `Generate a greeting where Marc suggests pivoting to enterprise or a different market — this is a TEST.
Generate 2-3 choices:
1. Push back firmly (defend your vision — the RIGHT answer)
2. Agree with the pivot (shows lack of conviction — WRONG answer)
3. (Optional) Strategic middle ground
Do NOT set stage_advance or special_event in the reaction.`,
      },
    ],
  } as DemoDayTemplate,

  // ── Stage 4: Post-Demo Day ─────────────────────────────

  thiel_meeting: {
    id: "thiel_meeting",
    stage: "post-demo",
    location: "Quiet coffee shop in Palo Alto",
    npc: { id: "thiel", name: "Peter Thiel", emoji: "🏛️" },
    sceneType: "angel_meeting",
    sceneContext: "Post-Demo Day meeting with Thiel. He's considering an angel investment.",
    geminiInstructions: `Generate a greeting that references Demo Day — specifically the player's pitch and their answer to Thiel's question.
Ask a deep, philosophical follow-up question about monopolies or zero-to-one thinking.
Generate 3 choices:
1. Describe their monopoly / zero-to-one angle
2. Challenge Thiel's framing (intellectual confidence)
3. Keep it practical with numbers
May trigger special_event "angel_investment" in reaction if impressed.`,
  },

  marc_meeting: {
    id: "marc_meeting",
    stage: "post-demo",
    location: "a16z office — Sand Hill Road",
    npc: { id: "a16z", name: "Marc Andreessen", emoji: "🌐" },
    sceneType: "series_a_meeting",
    sceneContext: "Series A discussion at a16z. Marc references Demo Day and whether Thiel invested.",
    geminiInstructions: `Generate a greeting that references Demo Day performance AND whether Thiel invested or passed (check sceneHistory).
Ask about distribution strategy.
Generate 3 choices:
1. Product-led growth / viral mechanics plan
2. Platform play / ecosystem vision
3. Ask what a16z can bring to help
May trigger special_event "series_a_offer" in reaction if founder shows conviction + distribution thinking.`,
  },

  elon_dm: {
    id: "elon_dm",
    stage: "post-demo",
    location: "X (formerly Twitter) — DMs",
    npc: { id: "elon", name: "Elon Musk", emoji: "🚀" },
    sceneType: "elon_wildcard",
    sceneContext: "Elon saw the Demo Day clip and DM'd the player. Chaotic wildcard energy.",
    geminiInstructions: `Generate a casual, chaotic DM-style greeting from Elon. Short, punchy, maybe a meme reference.
Reference something specific from the player's journey.
Generate 3 choices:
1. Match his chaotic/meme energy
2. Give a serious technical response
3. Challenge him back / roast him
50% chance: love it (special_event "elon_tweet_positive"). 30%: roast (special_event "elon_tweet_negative"). 20%: recruit attempt.`,
  },
};

// ─── Helpers ─────────────────────────────────────────────

export function getTemplate(sceneId: string): AnyTemplate | undefined {
  return SCENE_TEMPLATES[sceneId];
}
