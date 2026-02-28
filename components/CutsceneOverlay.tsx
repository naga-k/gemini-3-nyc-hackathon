"use client";

import { useGameStore } from "@/lib/gameState";

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

  // ─── Startup Picker (after layoff) ─────────────────────
  if (activeCutscene === "pick_startup") {
    const handlePick = (option: (typeof STARTUP_OPTIONS)[0]) => {
      // Set startup info and advance to garage
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
    zuck_layoff: {
      title: "You've Been Laid Off",
      body: `Mark Zuckerberg appears on your screen.\n\n"We're restructuring teams. Your role is being eliminated."\n\n"You're talented. You'll build something."\n\nYou stare at your $12,000 severance. Time to start something.`,
      emoji: "📱",
      color: "border-blue-500/50",
      buttonText: "What now? →",
      onButton: () => {
        // Transition to startup picker instead of directly to garage
        useGameStore.setState({ activeCutscene: "pick_startup" as never });
      },
    },
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
