import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { getCandidate } from "@/lib/public.functions";
import { createVoteIntent } from "@/lib/payment.functions";
import { formatXAF } from "@/lib/format";
import { toast } from "sonner";
import {
  detectCameroonMobileOperator,
  normalizeCameroonPhone,
  operatorLabel,
  type Operator,
} from "@/lib/payment.utils";
import { computeVotePayment, UNIT_PRICE } from "@/lib/payment.utils";
import { CandidateVoteHero } from "@/components/vote/candidate-vote-hero";
import { VoteCounter } from "@/components/vote/vote-counter";
import { OperatorToggle } from "@/components/vote/operator-toggle";
import { PaymentSummary } from "@/components/vote/payment-summary";
import { PageLayout } from "@/components/ui/page-layout";
import { SectionHeader } from "@/components/ui/section-header";
import { SoftCard } from "@/components/ui/soft-card";
import { SoftField, SoftInput } from "@/components/ui/soft-field";

export const Route = createFileRoute("/vote/$slug")({
  component: VotePage,
});

function VotePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchCandidate = useServerFn(getCandidate);
  const submit = useServerFn(createVoteIntent);

  const { data: c } = useQuery({
    queryKey: ["candidate", slug],
    queryFn: () => fetchCandidate({ data: { slug } }),
  });

  const [voteCount, setVoteCount] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [operator, setOperator] = useState<Operator>("orange");

  const detectedOperator = useMemo(() => {
    const digits = normalizeCameroonPhone(contact);
    if (digits.length < 3) return null;
    return detectCameroonMobileOperator(digits);
  }, [contact]);

  useEffect(() => {
    if (detectedOperator) setOperator(detectedOperator);
  }, [detectedOperator]);

  const payment = useMemo(() => computeVotePayment(voteCount), [voteCount]);

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          candidate_slug: slug,
          vote_count: voteCount,
          buyer_name: name.trim(),
          buyer_contact: contact.trim(),
          operator,
        },
      }),
    onSuccess: (res) => {
      toast.success("Demande de paiement envoyée sur votre téléphone");
      window.location.href = res.redirect_url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = name.trim().length >= 2 && contact.trim().length >= 9;

  return (
    <PageLayout className="max-w-lg" variant="default">
      <Link
        to="/c/$slug"
        params={{ slug }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au profil
      </Link>

      <SectionHeader
        className="mt-6"
        eyebrow="Vous votez pour"
        title={c?.name ?? "…"}
        description={`${UNIT_PRICE} FCFA par vote · Paiement Mobile Money sécurisé`}
      />

      {c && (
        <div className="mt-6">
          <CandidateVoteHero name={c.name} category={c.category} photoUrl={c.photo_url} />
        </div>
      )}

      <SoftCard className="mt-8 space-y-6">
        <SoftField label="Nom complet">
          <SoftInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Jean Marc"
            maxLength={120}
            autoComplete="name"
          />
        </SoftField>

        <SoftField
          label="Numéro Mobile Money"
          hint={
            detectedOperator
              ? `Détecté : ${operatorLabel(detectedOperator)} (plan ART Cameroun)`
              : "9 chiffres, indicatif +237 (ex. 677123456)"
          }
        >
          <SoftInput
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Ex : 6XXXXXXXX"
            inputMode="tel"
            maxLength={20}
            autoComplete="tel"
          />
        </SoftField>

        <SoftField
          label="Nombre de votes"
          hint="Saisissez le nombre souhaité ou utilisez les raccourcis — le montant est calculé automatiquement"
        >
          <VoteCounter value={voteCount} onChange={setVoteCount} unitPrice={UNIT_PRICE} />
        </SoftField>

        <SoftField
          label="Opérateur de paiement"
          hint={
            detectedOperator
              ? "Sélectionné automatiquement selon votre numéro"
              : "Choisissez Orange ou MTN si la détection n'est pas possible"
          }
        >
          <OperatorToggle
            value={operator}
            onChange={setOperator}
            detected={detectedOperator}
          />
        </SoftField>

        <PaymentSummary payment={payment} />

        <p className="rounded-xl border border-border/40 bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground">
          En cliquant sur « Confirmer et payer », une demande de{" "}
          <strong className="text-foreground">{formatXAF(payment.totalAmount)}</strong> (votes + frais
          de transaction) sera envoyée sur votre téléphone. Vos{" "}
          <strong className="text-foreground">{voteCount}</strong> vote(s) seront validés uniquement
          après confirmation du paiement.
        </p>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-rose" />
          Paiement sécurisé · Easy Transact
        </p>
      </SoftCard>
    </PageLayout>
  );
}
