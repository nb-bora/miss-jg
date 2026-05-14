import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRanking } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { RankingList } from "@/components/ranking-list";
import { useState } from "react";

export const Route = createFileRoute("/classement")({
  component: ClassementPage,
  head: () => ({
    meta: [
      { title: "Classement officiel — Miss & Master" },
      {
        name: "description",
        content:
          "Classement temps réel des candidats Miss & Master, basé sur le montant collecté via les votes validés.",
      },
    ],
  }),
});

function ClassementPage() {
  const fetchRanking = useServerFn(getRanking);
  const { data, isLoading } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => fetchRanking(),
    refetchInterval: 15000,
  });
  const [filter, setFilter] = useState<"all" | "miss" | "master">("all");

  const items =
    data?.ranking.filter((c) => filter === "all" || c.category === filter) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Live</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Classement officiel</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Le rang est calculé sur le montant total collecté via les votes validés.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-border/60 bg-card/60 p-1">
          {(["all", "miss", "master"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-2 text-sm capitalize transition ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Tous" : f}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-card/60" />
              ))}
            </div>
          ) : (
            <RankingList items={items} />
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
