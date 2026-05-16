import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { UNIT_PRICE } from "@/lib/payment.utils";
import { SoftInput } from "@/components/ui/soft-field";

const QUICK_VOTES = [5, 10, 20, 50] as const;

export function VoteCounter({
  value,
  onChange,
  min = 1,
  max = 10000,
  unitPrice = UNIT_PRICE,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  unitPrice?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = () => {
    const parsed = Number.parseInt(draft.replace(/\s/g, ""), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    set(parsed);
  };

  const totalAmount = value * unitPrice;

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
        <SoftInput
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          aria-label="Nombre de votes"
          className="max-w-[8rem] text-center font-display text-2xl font-bold tabular-nums"
        />
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
      <p className="mt-3 text-center text-sm text-muted-foreground">
        {value} vote{value > 1 ? "s" : ""} × {formatXAF(unitPrice)} ={" "}
        <strong className="text-rose">{formatXAF(totalAmount)}</strong>
      </p>
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
