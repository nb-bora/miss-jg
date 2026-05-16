import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Smartphone, Wallet } from "lucide-react";
import { getRanking } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { RankingList } from "@/components/ranking-list";
import { formatNumber, formatXAF } from "@/lib/format";
import { UNIT_PRICE } from "@/lib/payment.utils";
import { VoteStepCard } from "@/components/vote/vote-step-card";
import { InfoRuleCard } from "@/components/vote/info-rule-card";
import { CandidateGridCard } from "@/components/vote/candidate-grid-card";
import { CandidatesLoading } from "@/components/vote/candidates-loading";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Miss & Master — Votez pour vos favoris" },
      {
        name: "description",
        content:
          "Concours officiel Miss & Master. Vote payant 100 FCFA, Orange Money et MTN MoMo.",
      },
    ],
  }),
});

function HomePage() {
  const fetchRanking = useServerFn(getRanking);
  const { data, isLoading } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => fetchRanking(),
    refetchInterval: 15000,
  });

  const all = data?.ranking ?? [];
  const missCount = all.filter((c) => c.category === "miss").length;
  const masterCount = all.filter((c) => c.category === "master").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-ucac-gradient">
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(280px,420px)] lg:gap-12">
            <div>
              <span className="inline-flex rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                Concours officiel Miss & Master
              </span>
              <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Votez pour l&apos;élégance, le charisme et le leadership étudiant.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Participez au choix du public pour le concours Miss & Master. Sélectionnez votre
                candidat(e), choisissez le nombre de votes, puis confirmez le paiement via{" "}
                <strong className="text-foreground">Orange Money</strong> ou{" "}
                <strong className="text-foreground">MTN Mobile Money</strong>.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <StatCard label="Prix d'un vote" value={formatXAF(UNIT_PRICE)} />
                <StatCard
                  label="Candidats"
                  value={isLoading ? "—" : String(data?.totals.candidates ?? 0)}
                />
                <StatCard label="Paiement" value="OM / MTN" />
              </div>

              <a
                href="#candidats"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose px-8 py-4 text-sm font-bold text-white shadow-rose-glow transition hover:opacity-95"
              >
                Découvrir les candidats
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-2xl shadow-black/20 ring-1 ring-white/5">
                <img
                  src="/images/hero-miss-mister.png"
                  alt="Miss & Mister Journées Gestion — candidats du concours"
                  className="aspect-[4/5] w-full object-cover object-center"
                  width={420}
                  height={525}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-rose">Processus de vote</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Un vote simple, rapide et transparent
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Pour faciliter la participation du public, la plateforme vous permet de voter en
            quelques étapes avec votre téléphone Mobile Money.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <VoteStepCard
              step="01"
              title="Choisissez"
              description="Parcourez les photos et sélectionnez votre candidat préféré."
            />
            <VoteStepCard
              step="02"
              title="Indiquez vos votes"
              description="Entrez votre nom, votre numéro et le nombre de votes souhaité."
            />
            <VoteStepCard
              step="03"
              title="Payez"
              description="Confirmez le paiement Orange Money ou MTN Mobile Money."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-card/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-rose">Informations importantes</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Avant de valider votre vote</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <InfoRuleCard title="Vote payant">
              Chaque vote coûte {formatXAF(UNIT_PRICE)}. Si vous choisissez 10 votes, le montant
              sera automatiquement de {formatXAF(1000)}.
            </InfoRuleCard>
            <InfoRuleCard title="Votes multiples">
              Une personne peut soutenir son candidat avec plusieurs votes en une seule
              transaction.
            </InfoRuleCard>
            <InfoRuleCard title="Confirmation obligatoire">
              Les votes ne sont enregistrés qu&apos;après confirmation du paiement par
              l&apos;opérateur.
            </InfoRuleCard>
            <InfoRuleCard title="Numéro valide">
              Utilisez un numéro Orange Money ou MTN Mobile Money actif.
            </InfoRuleCard>
          </div>
        </div>
      </section>

      <section id="candidats" className="border-t border-border/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-rose">Candidats officiels</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Sélectionnez votre favori</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cliquez sur la carte d&apos;un candidat pour ouvrir le formulaire de vote. Vous pouvez{" "}
            <span className="font-semibold text-rose">acheter un ou plusieurs votes</span> en une
            seule transaction.
          </p>
          <span className="mt-4 inline-flex rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-semibold">
            {formatXAF(UNIT_PRICE)} / vote
          </span>

          <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-rose" />
              {missCount} Candidates Miss
            </span>
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-rose" />
              {masterCount} Candidats Master
            </span>
          </div>

          {isLoading ? (
            <CandidatesLoading />
          ) : all.length === 0 ? (
            <p className="mt-10 text-center text-muted-foreground">Aucun candidat pour le moment.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {all.map((c) => (
                <CandidateGridCard
                  key={c.id}
                  slug={c.slug}
                  name={c.name}
                  category={c.category}
                  photoUrl={c.photo_url}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {all.length > 0 && (
        <section className="border-t border-border/40 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-extrabold">Classement officiel</h2>
              <Link to="/classement" className="text-sm font-semibold text-rose hover:text-rose/80">
                Voir tout →
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(data?.totals.votes ?? 0)} votes validés
            </p>
            <div className="mt-6">
              <RankingList items={all} />
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
