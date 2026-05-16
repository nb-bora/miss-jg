import type { Operator } from "@/lib/payment.utils";
import { operatorLabel } from "@/lib/payment.utils";

export function OperatorToggle({
  value,
  onChange,
  detected,
}: {
  value: Operator;
  onChange: (op: Operator) => void;
  detected?: Operator | null;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("orange")}
          disabled={Boolean(detected && detected !== "orange")}
          className={`rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            value === "orange"
              ? "border-orange-500/60 bg-orange-950/40 ring-1 ring-orange-500/30"
              : "border-border/60 bg-card/60 hover:border-orange-500/30"
          }`}
        >
          <span className="font-display font-bold">Orange Money</span>
          <span className="mt-1 block text-xs text-muted-foreground">69, 655–659</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("mtn")}
          disabled={Boolean(detected && detected !== "mtn")}
          className={`rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            value === "mtn"
              ? "border-yellow-500/60 bg-yellow-950/30 ring-1 ring-yellow-500/30"
              : "border-border/60 bg-card/60 hover:border-yellow-500/30"
          }`}
        >
          <span className="font-display font-bold">MTN MoMo</span>
          <span className="mt-1 block text-xs text-muted-foreground">67, 650–654</span>
        </button>
      </div>
      {detected && (
        <p className="text-center text-xs text-rose">
          Opérateur détecté : {operatorLabel(detected)}
        </p>
      )}
    </div>
  );
}
