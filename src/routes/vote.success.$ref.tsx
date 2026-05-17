import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Share2 } from "lucide-react";
import { pollPaymentStatus } from "@/lib/payment.functions";
import { formatXAF } from "@/lib/format";
import { PageLayout } from "@/components/ui/page-layout";
import { SoftCard } from "@/components/ui/soft-card";

export const Route = createFileRoute("/vote/success/$ref")({
  component: SuccessPage,
});

function SuccessPage() {
  const { ref } = Route.useParams();
  const poll = useServerFn(pollPaymentStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["payment-success", ref],
    queryFn: () => poll({ data: { provider_ref: ref } }),
  });

  if (isLoading || !data) {
    return (
      <PageLayout className="max-w-xl flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement…</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="max-w-xl">
      <SoftCard className="border-rose/30 text-center ring-rose-glow" padding="lg">
        <CheckCircle2 className="mx-auto h-16 w-16 text-rose" />
        <h1 className="mt-4 font-display text-3xl font-bold">Vote confirmé !</h1>
        <p className="mt-2 text-muted-foreground">
          Merci de soutenir{" "}
          <span className="font-semibold text-foreground">{data.candidate_name}</span>.
        </p>

        <dl className="mx-auto mt-8 max-w-sm space-y-2 rounded-2xl border border-border/60 bg-background/50 p-5 text-left text-sm">
          <Row label="Référence" value={ref} mono />
          {data.vote_subtotal != null && data.transaction_fee != null ? (
            <>
              <Row label="Montant des votes" value={formatXAF(data.vote_subtotal)} />
              <Row label="Frais (4 %)" value={formatXAF(data.transaction_fee)} />
              <Row label="Total débité" value={formatXAF(data.total_charged)} />
            </>
          ) : (
            <Row label="Montant" value={formatXAF(data.amount)} />
          )}
          <Row label="Votes ajoutés" value={String(data.vote_count)} />
          <Row label="Date" value={new Date().toLocaleString("fr-FR")} />
        </dl>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {data.candidate_slug && (
            <Link
              to="/c/$slug"
              params={{ slug: data.candidate_slug }}
              className="btn-rose inline-flex gap-2"
            >
              <Share2 className="h-4 w-4" /> Voir le profil
            </Link>
          )}
          <Link
            to="/classement"
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:border-rose/40"
          >
            Classement
          </Link>
        </div>
      </SoftCard>
    </PageLayout>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : "font-medium"}>{value}</dd>
    </div>
  );
}
