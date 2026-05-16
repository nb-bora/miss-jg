import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck, Minus, Plus } from "lucide-react";
import { getCandidate } from "@/lib/public.functions";
import { createVoteIntent } from "@/lib/payment.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { formatXAF } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/vote/$slug")({
  component: VotePage,
});

const UNIT_PRICE = 100;
const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

function VotePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchCandidate = useServerFn(getCandidate);
  const submit = useServerFn(createVoteIntent);

  const { data: c } = useQuery({
    queryKey: ["candidate", slug],
    queryFn: () => fetchCandidate({ data: { slug } }),
  });

  const [amount, setAmount] = useState<number>(500);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const voteCount = Math.max(1, Math.floor(amount / UNIT_PRICE));
  const totalAmount = voteCount * UNIT_PRICE;

  const setSafeAmount = (val: number) => {
    if (!Number.isFinite(val)) return;
    const snapped = Math.max(UNIT_PRICE, Math.round(val / UNIT_PRICE) * UNIT_PRICE);
    setAmount(Math.min(snapped, 1_000_000));
  };

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          candidate_slug: slug,
          vote_count: voteCount,
          buyer_name: name || undefined,
          buyer_contact: contact || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success("Redirection vers le paiement…");
      navigate({ to: res.redirect_url });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          to="/c/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au profil
        </Link>

        <div className="mt-6 flex items-center gap-4">
          {c?.photo_url && (
            <img src={c.photo_url} alt={c.name} className="h-16 w-16 rounded-2xl object-cover" />
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Vous votez pour</p>
            <h1 className="font-display text-3xl font-bold">{c?.name ?? "…"}</h1>
          </div>
        </div>

        {/* Amount selector */}
        <h2 className="mt-10 font-display text-lg font-semibold">
          1. Combien de votes ?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          1 vote = {formatXAF(UNIT_PRICE)}. Choisissez le montant que vous souhaitez engager.
        </p>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-6">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSafeAmount(amount - UNIT_PRICE)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 hover:border-gold"
              aria-label="Diminuer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={UNIT_PRICE}
                step={UNIT_PRICE}
                value={amount}
                onChange={(e) => setSafeAmount(Number(e.target.value))}
                className="w-40 bg-transparent text-center font-display text-4xl font-bold text-gold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="font-display text-lg font-semibold text-muted-foreground">FCFA</span>
            </div>
            <button
              onClick={() => setSafeAmount(amount + UNIT_PRICE)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 hover:border-gold"
              aria-label="Augmenter"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-center text-sm text-muted-foreground">
            = <span className="font-semibold text-foreground">{voteCount}</span> vote
            {voteCount > 1 ? "s" : ""}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                onClick={() => setSafeAmount(q)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  amount === q
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border/60 hover:border-gold/60"
                }`}
              >
                {formatXAF(q)}
              </button>
            ))}
          </div>
        </div>

        {/* Buyer */}
        <h2 className="mt-10 font-display text-lg font-semibold">
          2. Vos coordonnées{" "}
          <span className="text-sm font-normal text-muted-foreground">(optionnel)</span>
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            maxLength={120}
            className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm outline-none transition focus:border-gold"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Téléphone ou email"
            maxLength={120}
            className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm outline-none transition focus:border-gold"
          />
        </div>

        {/* Summary */}
        <div className="mt-10 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h3 className="font-display text-lg font-semibold">Récapitulatif</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Candidat" value={c?.name ?? "—"} />
            <Row label="Prix unitaire" value={formatXAF(UNIT_PRICE)} />
            <Row label="Votes" value={String(voteCount)} />
            <div className="my-3 border-t border-border/60" />
            <Row label="Total à payer" value={formatXAF(totalAmount)} highlight />
          </dl>

          <button
            disabled={mutation.isPending || voteCount < 1}
            onClick={() => mutation.mutate()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-bold text-primary-foreground transition hover:ring-gold-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Préparation…
              </>
            ) : (
              <>Payer et voter</>
            )}
          </button>

          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" />
            Votre vote est validé uniquement après confirmation du paiement.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={highlight ? "font-display text-2xl font-bold text-gold" : "font-medium"}>
        {value}
      </dd>
    </div>
  );
}
