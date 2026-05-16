import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRanking } from "@/lib/public.functions";
import { RankingList } from "@/components/ranking-list";
import { useState } from "react";
import { PageLayout } from "@/components/ui/page-layout";
import { SectionHeader } from "@/components/ui/section-header";
import { SoftCard } from "@/components/ui/soft-card";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/classement")({
  component: ClassementPage,
  head: () => ({
    meta: [
      { title: "Classement officiel — Miss & Master" },
      {
        name: "description",
        content: "Classement temps réel basé sur les votes payés et validés.",
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

  const items = data?.ranking.filter((c) => filter === "all" || c.category === filter) ?? [];

  return (
    <PageLayout className="max-w-3xl">
      <SectionHeader
        eyebrow="Live"
        title="Classement officiel"
        description="Le rang est calculé sur les votes payés et confirmés par l'opérateur Mobile Money."
      />

      <div className="mt-8 inline-flex rounded-full border border-border/60 bg-card/60 p-1">
        {(["all", "miss", "master"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`filter-pill ${filter === f ? "filter-pill-active" : "filter-pill-inactive"}`}
          >
            {f === "all" ? "Tous" : f === "miss" ? "Miss" : "Master"}
          </button>
        ))}
      </div>

      {!isLoading && data && (
        <p className="mt-4 text-sm text-muted-foreground">
          {formatNumber(data.totals.votes)} votes validés · {data.totals.candidates} candidats
        </p>
      )}

      <SoftCard className="mt-8" padding="sm">
        {isLoading ? (
          <div className="space-y-3 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : (
          <RankingList items={items} />
        )}
      </SoftCard>
    </PageLayout>
  );
}
