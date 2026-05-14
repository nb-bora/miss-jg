import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { getRanking } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { RankingList } from "@/components/ranking-list";
import { formatXAF, formatNumber } from "@/lib/format";
import heroMiss from "@/assets/hero-miss.jpg";
import heroMaster from "@/assets/hero-master.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Miss & Master — Votez pour vos favoris" },
      {
        name: "description",
        content:
          "Soutenez votre candidat Miss ou Master préféré. Vote payant 100% sécurisé, classement officiel en temps réel.",
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

  const top3 = data?.ranking.slice(0, 3) ?? [];
  const all = data?.ranking ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-grain">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" /> Édition 2026
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
              Couronnez la
              <span className="block text-gradient-gold">prochaine légende.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Chaque vote est un soutien réel. Chaque don propulse un candidat. Le classement
              officiel est basé sur le montant total collecté.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/classement"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:ring-gold-glow"
              >
                Voir le classement
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#candidats"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3.5 text-sm font-semibold transition hover:border-magenta/60"
              >
                Découvrir les candidats
              </a>
            </div>

            {/* KPIs */}
            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6">
              <Kpi
                label="Collecté"
                value={isLoading ? "—" : formatXAF(data!.totals.collected)}
                accent="gold"
              />
              <Kpi
                label="Votes"
                value={isLoading ? "—" : formatNumber(data!.totals.votes)}
                accent="magenta"
              />
              <Kpi
                label="Candidats"
                value={isLoading ? "—" : String(data!.totals.candidates)}
                accent="default"
              />
            </div>
          </div>

          {/* Visual */}
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl ring-gold-glow">
              <img src={heroMiss} alt="Candidate Miss" className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-magenta/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                Miss
              </span>
            </div>
            <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-3xl ring-magenta-glow">
              <img src={heroMaster} alt="Candidate Master" className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                Master
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PODIUM TOP 3 */}
      {top3.length > 0 && (
        <section id="candidats" className="border-t border-border/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Podium en direct</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Le top 3 du moment
                </h2>
              </div>
              <Link
                to="/classement"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Tout voir →
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {top3.map((c, i) => (
                <Link
                  key={c.id}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card transition hover:-translate-y-1 hover:border-gold/60"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {c.photo_url ? (
                      <img
                        src={c.photo_url}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 font-display text-lg font-bold text-gold backdrop-blur">
                      {i + 1}
                    </div>
                    {i === 0 && (
                      <Crown className="absolute right-4 top-4 h-6 w-6 text-gold drop-shadow-lg" />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold">{c.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          c.category === "miss"
                            ? "bg-magenta/20 text-magenta"
                            : "bg-gold/20 text-gold"
                        }`}
                      >
                        {c.category}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xl font-bold text-gold">
                        {formatXAF(c.total_collected)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(c.total_votes)} votes
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RANKING FULL */}
      <section className="border-t border-border/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Classement officiel</h2>
            <span className="text-xs text-muted-foreground">Mis à jour en temps réel</span>
          </div>
          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-card/60" />
                ))}
              </div>
            ) : (
              <RankingList items={all} />
            )}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-t border-border/40 bg-card/30 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
          <Trust
            icon={<ShieldCheck className="h-5 w-5 text-gold" />}
            title="100% sécurisé"
            text="Paiements via passerelle certifiée. Aucune donnée bancaire stockée."
          />
          <Trust
            icon={<Zap className="h-5 w-5 text-magenta" />}
            title="Validation instantanée"
            text="Votre vote est ajouté dès la confirmation du paiement par notre serveur."
          />
          <Trust
            icon={<Sparkles className="h-5 w-5 text-gold" />}
            title="Transparence totale"
            text="Chaque transaction est horodatée et auditable par l'organisation."
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: "gold" | "magenta" | "default" }) {
  const colors = {
    gold: "text-gold",
    magenta: "text-magenta",
    default: "text-foreground",
  } as const;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${colors[accent]}`}>{value}</p>
    </div>
  );
}

function Trust({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background">
        {icon}
      </div>
      <div>
        <p className="font-display font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
