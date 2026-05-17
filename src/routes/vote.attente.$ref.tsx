import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { pollPaymentStatus, demoConfirmPayment } from "@/lib/payment.functions";
import { formatXAF } from "@/lib/format";
import { PageLayout } from "@/components/ui/page-layout";
import { SoftCard } from "@/components/ui/soft-card";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const TIMEOUT_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/vote/attente/$ref")({
  component: AttentePage,
});

function AttentePage() {
  const { ref } = Route.useParams();
  const navigate = useNavigate();
  const poll = useServerFn(pollPaymentStatus);
  const demoConfirm = useServerFn(demoConfirmPayment);
  const [startedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const { data } = useQuery({
    queryKey: ["payment-status", ref],
    queryFn: () => poll({ data: { provider_ref: ref } }),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (data?.payment_status === "paid") {
      navigate({ to: "/vote/success/$ref", params: { ref } });
    } else if (data?.payment_status === "failed") {
      navigate({ to: "/vote/echec/$ref", params: { ref } });
    }
  }, [data?.payment_status, ref, navigate]);

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - startedAt > TIMEOUT_MS) setTimedOut(true);
    }, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  // Simulation uniquement pour les transactions « demo » — jamais pour Easy Transact réel
  useEffect(() => {
    if (!DEMO_MODE || data?.provider !== "demo" || data?.payment_status !== "pending") return;
    const t = setTimeout(() => {
      demoConfirm({ data: { provider_ref: ref } }).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [ref, data?.provider, data?.payment_status, demoConfirm]);

  return (
    <PageLayout className="max-w-lg" variant="gradient">
      <SoftCard className="text-center" padding="lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose/10">
          <Smartphone className="h-8 w-8 text-rose animate-pulse" />
        </div>
        <Loader2 className="mx-auto mt-6 h-8 w-8 animate-spin text-rose" />
        <h1 className="mt-4 font-display text-2xl font-bold">Validez sur votre téléphone</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Une demande de paiement a été envoyée sur votre numéro Mobile Money.
          Confirmez-la sur votre téléphone — vos votes seront comptabilisés uniquement après
          validation par l&apos;opérateur (Easy Transact).
        </p>
        {data && (
          <dl className="mx-auto mt-6 max-w-xs space-y-2 rounded-xl border border-border/60 bg-background/50 p-4 text-left text-sm">
            <Row label="Référence" value={ref} mono />
            {data.vote_subtotal != null && data.transaction_fee != null ? (
              <>
                <Row label="Montant des votes" value={formatXAF(data.vote_subtotal)} />
                <Row label="Frais (4 %)" value={formatXAF(data.transaction_fee)} />
                <Row label="Total prélevé" value={formatXAF(data.amount)} />
              </>
            ) : (
              <Row label="Montant" value={formatXAF(data.amount)} />
            )}
            <Row label="Votes" value={String(data.vote_count)} />
            {data.operator && <Row label="Opérateur" value={data.operator.toUpperCase()} />}
          </dl>
        )}
        {timedOut && data?.payment_status === "pending" && (
          <p className="mt-4 text-xs text-amber-400/90">
            Délai dépassé ? Vérifiez votre solde ou réessayez depuis la page du candidat.
          </p>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Mise à jour automatique toutes les 3 secondes.
        </p>
      </SoftCard>
    </PageLayout>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : "font-medium"}>{value}</dd>
    </div>
  );
}
