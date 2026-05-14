import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { formatNumber } from "@/lib/format";

interface Item {
  id: string;
  name: string;
  slug: string;
  category: "miss" | "master";
  photo_url: string | null;
  total_collected: number;
  total_votes: number;
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-br from-gold to-[oklch(0.65_0.15_60)] text-primary-foreground",
  2: "bg-gradient-to-br from-[oklch(0.85_0.02_280)] to-[oklch(0.6_0.02_280)] text-primary-foreground",
  3: "bg-gradient-to-br from-[oklch(0.7_0.15_45)] to-[oklch(0.5_0.12_35)] text-white",
  4: "bg-gradient-to-br from-violet to-[oklch(0.4_0.18_300)] text-white",
  5: "bg-gradient-to-br from-magenta to-[oklch(0.5_0.22_355)] text-white",
};

export function RankingList({ items }: { items: Item[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
        Aucun candidat actif pour le moment.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {items.map((c, i) => {
        const rank = i + 1;
        return (
          <Link
            key={c.id}
            to="/c/$slug"
            params={{ slug: c.slug }}
            className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-3 transition hover:border-gold/50 hover:bg-card sm:p-4"
          >
            <div
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold shadow-md ${
                RANK_STYLES[rank] ?? "bg-muted text-foreground"
              }`}
            >
              {rank}
              {rank === 1 && (
                <Crown className="absolute -top-2.5 h-3.5 w-3.5 text-gold" />
              )}
            </div>
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
              {c.photo_url ? (
                <img
                  src={c.photo_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold">{c.name}</p>
              <p className="font-display text-sm font-extrabold text-gold">
                {formatXAF(c.total_collected)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatNumber(c.total_votes)} votes
              </p>
            </div>
            <span
              className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${
                c.category === "miss"
                  ? "bg-magenta/15 text-magenta"
                  : "bg-gold/15 text-gold"
              }`}
            >
              {c.category}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
