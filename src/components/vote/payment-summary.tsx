import { Info } from "lucide-react";
import { formatXAF } from "@/lib/format";
import {
  TRANSACTION_FEE_RATE,
  UNIT_PRICE,
  type VotePaymentBreakdown,
} from "@/lib/payment.utils";

export function PaymentSummary({ payment }: { payment: VotePaymentBreakdown }) {
  const feePercent = Math.round(TRANSACTION_FEE_RATE * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
        <dl className="space-y-2 text-sm">
          <Row label="Prix unitaire" value={formatXAF(UNIT_PRICE)} />
          <Row label="Nombre de votes" value={String(payment.voteCount)} />
          <Row label="Montant des votes" value={formatXAF(payment.subtotal)} />
          <Row
            label={`Frais de transaction (${feePercent} %)`}
            value={formatXAF(payment.feeAmount)}
          />
          <div className="my-3 border-t border-border/60" />
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Total à prélever</dt>
            <dd className="font-display text-2xl font-bold text-rose">
              {formatXAF(payment.totalAmount)}
            </dd>
          </div>
        </dl>
      </div>

      <p className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/90" aria-hidden />
        <span>
          Des frais de transaction de <strong className="text-foreground">{feePercent} %</strong>{" "}
          ({formatXAF(payment.feeAmount)}) seront prélevés en plus du montant de vos votes. Le total
          de <strong className="text-foreground">{formatXAF(payment.totalAmount)}</strong> sera
          débité sur votre Mobile Money lors de la confirmation.
        </span>
      </p>
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
