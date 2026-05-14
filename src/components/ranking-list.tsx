import { Link } from "@tanstack/react-router";
import { Crown, Heart, TrendingUp } from "lucide-react";
import { formatXAF, formatNumber } from "@/lib/format";

interface Item {
  id: string;
  name: string;
  slug: string;
  category: "miss" | "master";
  photo_url: string | null;
  total_collected: number;
  total_votes: number;
}

export function RankingList({ items }: { items: Item[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
        Aucun candidat actif pour le moment.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((c, i) => (
        <Link
          key={c.id}
          to="/c/$slug"
          params={{ slug: c.slug }}
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-3 transition hover:border-gold/60 hover:bg-card sm:p-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-magenta/20 font-display text-lg font-bold text-gold">
            {i + 1}
            {i === 0 && <Crown className="absolute -mt-12 h-4 w-4 text-gold" />}
          </div>
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
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
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-base font-semibold">{c.name}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  c.category === "miss"
                    ? "bg-magenta/15 text-magenta"
                    : "bg-gold/15 text-gold"
                }`}
              >
                {c.category}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" /> {formatNumber(c.total_votes)} votes
              </span>
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-gold" />
                <span className="font-semibold text-gold">{formatXAF(c.total_collected)}</span>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
