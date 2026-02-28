"use client";

import { useRef, useState } from "react";
import { useGameStore } from "@/lib/gameState";

// ─── Google Calendar Invite ──────────────────────────────

function CalendarInvite({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4">
      <p className="text-zinc-400 text-sm text-center italic">
        Hmm, last-minute meeting with a manager... what could it be?
      </p>

      {/* Notification card */}
      <div className="bg-white rounded-2xl w-full shadow-2xl overflow-hidden">
        {/* Blue header bar */}
        <div className="bg-[#1a73e8] px-5 py-3 flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
          <span className="text-white font-medium text-sm">Google Calendar</span>
        </div>

        {/* Event details */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-gray-900 font-semibold text-lg leading-tight">
              15-min 1:1 with Manager
            </h2>
            <p className="text-gray-500 text-sm mt-1">Today, 3:00 PM – 3:15 PM</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 fill-current mt-0.5 shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
              <span className="text-gray-700">Conf Room 4B</span>
            </div>
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 fill-current mt-0.5 shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              <span className="text-gray-700">your-manager@meta.com</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-gray-400 text-xs italic">No agenda provided</p>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={onJoin}
            className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Join
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Layoff Scene with lip-synced portrait ───────────────

function LayoffScene({ onContinue }: { onContinue: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Video player */}
      <div className="w-full max-w-3xl">
        <video
          ref={videoRef}
          src="/assets/scene-layoff.mp4"
          autoPlay
          className="w-full rounded-lg"
          onEnded={() => setVideoEnded(true)}
        />
      </div>

      {/* Button appears after video ends */}
      <div className="w-full max-w-3xl px-6 py-6 text-center">
        {videoEnded && (
          <button
            onClick={onContinue}
            className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-medium transition-colors animate-fade-in"
          >
            What now? &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Building Scene (post-layoff reflection) ────────────

function BuildingScene({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <img
          src="/assets/scene-building.png"
          alt="Late night at the apartment"
          className="w-full rounded-lg"
        />
      </div>

      <div className="w-full max-w-3xl px-6 py-6 text-center space-y-3">
        <p className="text-zinc-400 text-sm uppercase tracking-widest">That evening</p>
        <p className="text-zinc-200 text-lg leading-relaxed">
          $12,000 severance. A laptop. And zero plan.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          You stare at the screen. The city hums outside. Time to build something.
        </p>
        <button
          onClick={onContinue}
          className="mt-4 bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          What should I build? &rarr;
        </button>
      </div>
    </div>
  );
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

const STARTUP_OPTIONS = [
  {
    name: "Dreamscape",
    idea: "AI-powered game engine that lets anyone create immersive games with natural language — no code required",
    emoji: "🎮",
  },
  {
    name: "Lattice",
    idea: "AI-powered design tool that turns rough sketches into production-ready UI",
    emoji: "🎨",
  },
  {
    name: "Folio",
    idea: "AI copilot for freelancers that auto-generates invoices, contracts, and proposals",
    emoji: "📄",
  },
];

export default function CutsceneOverlay() {
  const activeCutscene = useGameStore((s) => s.activeCutscene);
  const dismissCutscene = useGameStore((s) => s.dismissCutscene);
  const resetGame = useGameStore((s) => s.resetGame);
  const metrics = useGameStore((s) => s.metrics);
  const startupName = useGameStore((s) => s.startupName);
  const keyEvents = useGameStore((s) => s.keyEvents);
  const turn = useGameStore((s) => s.turn);

  if (!activeCutscene) return null;

  // ─── Google Calendar Invite ────────────────────────────
  if (activeCutscene === "zuck_layoff") {
    return <CalendarInvite onJoin={dismissCutscene} />;
  }

  // ─── Layoff Scene (Scene_1.png) ────────────────────────
  if (activeCutscene === "layoff_scene") {
    return <LayoffScene onContinue={dismissCutscene} />;
  }

  // ─── Building Scene (reflection) ────────────────────────
  if (activeCutscene === "building_scene") {
    return <BuildingScene onContinue={dismissCutscene} />;
  }

  // ─── Startup Picker (after layoff) ─────────────────────
  if (activeCutscene === "pick_startup") {
    const handlePick = (option: (typeof STARTUP_OPTIONS)[0]) => {
      useGameStore.setState({
        startupName: option.name,
        startupIdea: option.idea,
        activeCutscene: null,
        stage: "garage",
      });
      useGameStore.getState().addKeyEvent(`Laid off from Meta. Starting ${option.name}: ${option.idea}`);
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-zinc-700 rounded-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <p className="text-3xl mb-3">💡</p>
            <h2 className="text-xl font-bold mb-1">What Will You Build?</h2>
            <p className="text-zinc-500 text-sm">
              You&apos;ve got $12K severance and a laptop. Pick your startup.
            </p>
          </div>

          <div className="space-y-3">
            {STARTUP_OPTIONS.map((option) => (
              <button
                key={option.name}
                onClick={() => handlePick(option)}
                className="w-full text-left px-4 py-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-orange-500/50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div>
                    <p className="font-bold text-sm text-zinc-100">{option.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{option.idea}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Standard Cutscenes ────────────────────────────────

  const scenes: Record<
    string,
    { title: string; body: string; emoji: string; color: string; buttonText: string; onButton: () => void }
  > = {
    yc_accepted: {
      title: "YOU'RE IN!",
      body: `Welcome to Y Combinator.\n\nGarry Tan accepted ${startupName} into the batch.\n\n+$125,000 funding. Energy restored.\n\nTime to build.`,
      emoji: "🏆",
      color: "border-orange-500/50",
      buttonText: "Enter YC Batch →",
      onButton: dismissCutscene,
    },
    yc_rejected: {
      title: "Not This Time",
      body: `Garry passed on ${startupName}.\n\nBut he gave you feedback. Iterate. Talk to more users.\n\nCome back stronger.`,
      emoji: "❌",
      color: "border-red-500/50",
      buttonText: "Keep Building",
      onButton: dismissCutscene,
    },
    demo_day_success: {
      title: "Demo Day: Nailed It",
      body: `The VCs are buzzing. ${startupName}'s pitch landed.\n\nInboxes are filling up. Meetings are being scheduled.\n\nTime to close some deals.`,
      emoji: "🔥",
      color: "border-purple-500/50",
      buttonText: "Meet the VCs →",
      onButton: dismissCutscene,
    },
    demo_day_flop: {
      title: "Demo Day: Rough",
      body: `The pitch didn't land like you hoped.\n\nBut it's not over. Some VCs are still curious.\n\nRegroup and try to close anyway.`,
      emoji: "😬",
      color: "border-yellow-500/50",
      buttonText: "Keep Going",
      onButton: dismissCutscene,
    },
    angel_investment: {
      title: "Angel Investment!",
      body: `Peter Thiel writes ${startupName} a check.\n\n+$200,000 in the bank.\n\n"Zero to one. Now execute."`,
      emoji: "✍️",
      color: "border-green-500/50",
      buttonText: "Continue",
      onButton: dismissCutscene,
    },
    series_a_offer: {
      title: "Series A!",
      body: `Andreessen Horowitz is leading ${startupName}'s Series A.\n\n+$5,000,000.\n\n"Software is eating the world. Now go eat your market."`,
      emoji: "📈",
      color: "border-green-500/50",
      buttonText: "Continue",
      onButton: dismissCutscene,
    },
    term_sheet: {
      title: "Term Sheet!",
      body: `${startupName} has a term sheet on the table.\n\n+$5,000,000.\n\nThe dream is becoming real.`,
      emoji: "📄",
      color: "border-green-500/50",
      buttonText: "Continue",
      onButton: dismissCutscene,
    },
    elon_tweet_positive: {
      title: "Elon Tweeted About You",
      body: `@elonmusk: "Just saw ${startupName}. This is the way."\n\n+20 Hype. Your mentions are exploding.`,
      emoji: "🐦",
      color: "border-blue-400/50",
      buttonText: "Nice",
      onButton: dismissCutscene,
    },
    elon_tweet_negative: {
      title: "Elon Tweeted About You",
      body: `@elonmusk: "Lol ${startupName}. You're solving the wrong problem."\n\n-15 Hype. The ratio is brutal.`,
      emoji: "💀",
      color: "border-red-500/50",
      buttonText: "Survive This",
      onButton: dismissCutscene,
    },
    game_over: {
      title: "GAME OVER",
      body: `Your runway hit $0. ${startupName || "Your startup"} is dead.\n\nYou survived ${turn} turns.\n\nBut every great founder has a failure story...`,
      emoji: "💀",
      color: "border-red-600/50",
      buttonText: "Try Again",
      onButton: resetGame,
    },
    unicorn: {
      title: "UNICORN STATUS",
      body: `${startupName} has reached a valuation of ${formatMoney(
        metrics.hype * metrics.runway
      )}.\n\nYou went from Zero to One.\n\n${turn} turns. ${keyEvents.length} key moments.\n\nFrom a Meta layoff to a unicorn.`,
      emoji: "🦄",
      color: "border-amber-400/50",
      buttonText: "Play Again",
      onButton: resetGame,
    },
  };

  const scene = scenes[activeCutscene];
  if (!scene) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-zinc-950 border ${scene.color} rounded-2xl max-w-md w-full p-8 text-center`}
      >
        <div className="text-5xl mb-4">{scene.emoji}</div>
        <h2 className="text-2xl font-bold mb-4">{scene.title}</h2>
        <p className="text-zinc-300 text-sm whitespace-pre-line mb-6 leading-relaxed">
          {scene.body}
        </p>
        <button
          onClick={scene.onButton}
          className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {scene.buttonText}
        </button>
      </div>
    </div>
  );
}
