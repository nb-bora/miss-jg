import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, Loader2, ShieldCheck } from "lucide-react";
import { getCandidate, getVotePackages } from "@/lib/public.functions";
import { createVoteIntent } from "@/lib/payment.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { formatXAF } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/vote/$slug")({
  component: VotePage,
});

function VotePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchCandidate = useServerFn(getCandidate);
  const fetchPackages = useServerFn(getVotePackages);
  const submit = useServerFn(createVoteIntent);

  const { data: c } = useQuery({ queryKey: ["candidate", slug], queryFn: () => fetchCandidate({ data: { slug } }) });
  const { data: packages } = useQuery({ queryKey: ["packages"], queryFn: () => fetchPackages() });

  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Choisissez un pack");
      return submit({
        data: {
          candidate_slug: slug,
          package_id: selected,
          buyer_name: name || undefined,
          buyer_contact: contact || undefined,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Redirection vers le paiement…");
      navigate({ to: res.redirect_url });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pkg = packages?.find((p) => p.id === selected);

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

        {/* Packages */}
        <h2 className="mt-10 font-display text-lg font-semibold">1. Choisissez votre pack</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(packages ?? []).map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`relative flex items-center justify-between rounded-2xl border p-5 text-left transition ${
                  active
                    ? "border-gold bg-gold/10 ring-gold-glow"
                    : "border-border/60 bg-card/60 hover:border-gold/40"
                }`}
              >
                <div>
                  <p className="font-display text-lg font-bold">{p.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.votes} vote{p.votes > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-gold">
                    {formatXAF(p.amount)}
                  </p>
                </div>
                {active && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-gold" />
                )}
              </button>
            );
          })}
        </div>

        {/* Buyer */}
        <h2 className="mt-10 font-display text-lg font-semibold">
          2. Vos coordonnées <span className="text-sm font-normal text-muted-foreground">(optionnel)</span>
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
            <Row label="Pack" value={pkg?.label ?? "—"} />
            <Row label="Votes" value={pkg ? `${pkg.votes}` : "—"} />
            <div className="my-3 border-t border-border/60" />
            <Row
              label="Total à payer"
              value={pkg ? formatXAF(pkg.amount) : "—"}
              highlight
            />
          </dl>

          <button
            disabled={!selected || mutation.isPending}
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
