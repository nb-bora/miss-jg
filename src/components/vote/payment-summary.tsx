import { formatXAF } from "@/lib/format";
import { UNIT_PRICE } from "@/lib/payment.utils";

export function PaymentSummary({
  voteCount,
  totalAmount,
}: {
  voteCount: number;
  totalAmount: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <dl className="space-y-2 text-sm">
        <Row label="Prix unitaire" value={formatXAF(UNIT_PRICE)} />
        <Row label="Nombre de votes" value={String(voteCount)} />
        <div className="my-3 border-t border-border/60" />
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Montant total</dt>
          <dd className="font-display text-2xl font-bold text-rose">{formatXAF(totalAmount)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
