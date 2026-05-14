import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { CheckCircle2, Loader2, Share2 } from "lucide-react";
import { demoConfirmPayment } from "@/lib/payment.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { formatXAF } from "@/lib/format";

export const Route = createFileRoute("/vote/confirm/$ref")({
  component: ConfirmPage,
});

function ConfirmPage() {
  const { ref } = Route.useParams();
  const confirm = useServerFn(demoConfirmPayment);
  const mutation = useMutation({
    mutationFn: () => confirm({ data: { provider_ref: ref } }),
  });

  useEffect(() => {
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        {mutation.isPending && (
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold" />
            <p className="mt-4 text-muted-foreground">Confirmation du paiement…</p>
          </div>
        )}

        {mutation.isError && (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center">
            <h1 className="font-display text-2xl font-bold">Échec de confirmation</h1>
            <p className="mt-2 text-sm text-muted-foreground">{(mutation.error as Error).message}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Retour à l'accueil
            </Link>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="rounded-3xl border border-gold/40 bg-gold/5 p-8 text-center ring-gold-glow">
            <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
            <h1 className="mt-4 font-display text-3xl font-bold">Vote confirmé !</h1>
            <p className="mt-2 text-muted-foreground">
              Merci de soutenir{" "}
              <span className="font-semibold text-foreground">{mutation.data.candidate_name}</span>.
            </p>

            <dl className="mx-auto mt-8 max-w-sm space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5 text-left text-sm">
              <Row label="Référence" value={ref} mono />
              <Row label="Montant" value={formatXAF(mutation.data.amount)} />
              <Row label="Votes ajoutés" value={String(mutation.data.vote_count)} />
              <Row label="Date" value={new Date().toLocaleString("fr-FR")} />
            </dl>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/c/$slug"
                params={{ slug: mutation.data.candidate_slug }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                <Share2 className="h-4 w-4" /> Voir le profil
              </Link>
              <Link
                to="/classement"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold"
              >
                Classement
              </Link>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : "font-medium"}>{value}</dd>
    </div>
  );
}
