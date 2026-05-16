import { Minus, Plus } from "lucide-react";

const QUICK_VOTES = [5, 10, 20, 50] as const;

export function VoteCounter({
  value,
  onChange,
  min = 1,
  max = 10000,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));

  return (
    <div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-card transition hover:border-rose/50 disabled:opacity-40"
          aria-label="Diminuer"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[3ch] text-center font-display text-4xl font-bold">{value}</span>
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-card transition hover:border-rose/50 disabled:opacity-40"
          aria-label="Augmenter"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {QUICK_VOTES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => set(q)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              value === q
                ? "border-rose bg-rose/10 text-rose"
                : "border-border/60 hover:border-rose/40"
            }`}
          >
            {q} votes
          </button>
        ))}
      </div>
    </div>
  );
}
