import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { XCircle } from "lucide-react";
import { pollPaymentStatus } from "@/lib/payment.functions";
import { PageLayout } from "@/components/ui/page-layout";
import { SoftCard } from "@/components/ui/soft-card";

export const Route = createFileRoute("/vote/echec/$ref")({
  component: EchecPage,
});

function EchecPage() {
  const { ref } = Route.useParams();
  const poll = useServerFn(pollPaymentStatus);

  const { data } = useQuery({
    queryKey: ["payment-failed", ref],
    queryFn: () => poll({ data: { provider_ref: ref } }),
  });

  return (
    <PageLayout className="max-w-xl">
      <SoftCard className="border-destructive/30 text-center" padding="lg">
        <XCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold">Paiement non confirmé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le paiement n&apos;a pas été validé ou a expiré. Aucun vote n&apos;a été comptabilisé.
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{ref}</p>
        {data?.candidate_slug && (
          <Link
            to="/vote/$slug"
            params={{ slug: data.candidate_slug }}
            className="btn-rose mt-8 inline-flex"
          >
            Réessayer
          </Link>
        )}
        <Link
          to="/"
          className="mt-4 block text-sm text-muted-foreground hover:text-foreground"
        >
          Retour à l&apos;accueil
        </Link>
      </SoftCard>
    </PageLayout>
  );
}
