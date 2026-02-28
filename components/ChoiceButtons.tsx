"use client";

import type { GeneratedChoice } from "@/lib/scenes";

interface ChoiceButtonsProps {
  choices: GeneratedChoice[];
  onSelect: (index: number) => void;
  disabled?: boolean;
}

export default function ChoiceButtons({ choices, onSelect, disabled }: ChoiceButtonsProps) {
  return (
    <div className="space-y-2 p-4 border-t border-zinc-800">
      {choices.map((choice, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          disabled={disabled}
          className="w-full text-left px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <p className="text-sm font-medium text-zinc-100">{choice.label}</p>
          {choice.subtext && (
            <p className="text-xs text-zinc-500 mt-0.5">{choice.subtext}</p>
          )}
        </button>
      ))}
    </div>
  );
}
