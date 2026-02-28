"use client";

import { useGameStore } from "@/lib/gameState";

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function MetricsBar() {
  const metrics = useGameStore((s) => s.metrics);
  const valuation = metrics.hype * metrics.runway;

  const runwayColor =
    metrics.runway < 3000
      ? "text-red-400"
      : metrics.runway < 8000
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className="flex items-center gap-6 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
      {/* Energy */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Energy</span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < metrics.energy ? "bg-orange-400" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Money (Stripe-style) */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 tracking-wide">stripe:</span>
        <span className={`font-mono font-bold ${runwayColor}`}>
          {formatMoney(metrics.runway)}
        </span>
      </div>

      {/* Hype */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Hype</span>
        <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${metrics.hype}%` }}
          />
        </div>
        <span className="text-xs text-zinc-400 font-mono">{metrics.hype}</span>
      </div>

      {/* Valuation */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Valuation</span>
        <span className="font-mono font-bold text-amber-400">
          {formatMoney(valuation)}
        </span>
      </div>
    </div>
  );
}
