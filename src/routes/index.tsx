import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Crown,
  Users,
  Heart,
  Calendar,
} from "lucide-react";
import { getRanking } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { RankingList } from "@/components/ranking-list";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Miss & Master 2026 — Votez pour vos favoris" },
      {
        name: "description",
        content:
          "Soutenez votre candidat(e) Miss ou Master favori(te). Vote payant 100% sécurisé, classement officiel en temps réel.",
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

  const top5 = data?.ranking.slice(0, 5) ?? [];
  const all = data?.ranking ?? [];
  const daysLeft = 12;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO with royal violet/magenta gradient */}
      <section className="relative overflow-hidden bg-royal">
        {/* sparkle texture */}
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:32px_32px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-20 lg:pt-24">
          <div className="flex flex-col">
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[3.75rem]">
              Soutenez votre
              <br />
              candidat(e) <span className="text-gradient-gold">favori(te)</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
              Chaque vote compte, chaque soutien fait la différence.
              <br className="hidden sm:block" />
              Ensemble, faisons de cet événement un succès !
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#candidats"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-[oklch(0.72_0.16_70)] px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_12px_32px_-8px_oklch(0.82_0.13_85_/_0.5)] transition hover:scale-[1.02]"
              >
                Découvrir les candidats
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* KPIs row */}
            <div className="mt-10 grid grid-cols-3 gap-x-8 gap-y-5">
              <Kpi
                icon={<Users className="h-4 w-4" />}
                label="Candidats"
                value={isLoading ? "—" : String(data!.totals.candidates)}
              />
              <Kpi
                icon={<Heart className="h-4 w-4" />}
                label="Votes"
                value={isLoading ? "—" : formatNumber(data!.totals.votes)}
              />
              <Kpi
                icon={<Calendar className="h-4 w-4" />}
                label="Jours restants"
                value={String(daysLeft)}
              />
            </div>
          </div>

          {/* Visual — group photo */}
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-gold/30 ring-gold-glow">
              <img
                src="/hero-group.jpeg"
                alt="Candidates Miss Journées Gestion"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-violet/30 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-magenta px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                Miss · Édition 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSEMENT ACTUEL — horizontal cards */}
      {top5.length > 0 && (
        <section id="candidats" className="border-t border-border/40 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                Classement actuel
              </h2>
              <Link
                to="/classement"
                className="text-sm font-semibold text-gold hover:text-gold/80"
              >
                Voir tout →
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {top5.map((c, i) => (
                <PodiumCard key={c.id} candidate={c} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RANKING FULL */}
      <section className="border-t border-border/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              Classement officiel
            </h2>
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



      <SiteFooter />
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
        {icon}
      </div>
      <div className="leading-tight">
        <p className="font-display text-xl font-extrabold sm:text-2xl">{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-white/55">{label}</p>
      </div>
    </div>
  );
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-br from-gold to-[oklch(0.65_0.15_60)] text-primary-foreground",
  2: "bg-gradient-to-br from-[oklch(0.85_0.02_280)] to-[oklch(0.6_0.02_280)] text-primary-foreground",
  3: "bg-gradient-to-br from-[oklch(0.7_0.15_45)] to-[oklch(0.5_0.12_35)] text-white",
  4: "bg-gradient-to-br from-violet to-[oklch(0.4_0.18_300)] text-white",
  5: "bg-gradient-to-br from-magenta to-[oklch(0.5_0.22_355)] text-white",
};

function PodiumCard({
  candidate: c,
  rank,
}: {
  candidate: {
    id: string;
    name: string;
    slug: string;
    category: "miss" | "master";
    photo_url: string | null;
    total_collected: number;
    total_votes: number;
  };
  rank: number;
}) {
  return (
    <Link
      to="/c/$slug"
      params={{ slug: c.slug }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:-translate-y-1 hover:border-gold/50"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div
          className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-extrabold shadow-lg ${
            RANK_STYLES[rank] ?? "bg-card text-foreground"
          }`}
        >
          {rank}
        </div>
        {rank === 1 && (
          <Crown className="absolute right-3 top-3 h-5 w-5 text-gold drop-shadow-lg" />
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-display text-base font-bold">{c.name}</h3>
        <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">
          {c.category === "miss" ? "Miss" : "Master"} · {formatNumber(c.total_votes)} votes
        </p>
      </div>
    </Link>
  );
}
