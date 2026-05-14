import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Heart, Share2, TrendingUp, ArrowLeft, Instagram, Music2 } from "lucide-react";
import { getCandidate } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { formatXAF, formatNumber } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$slug")({
  component: CandidatePage,
});

function CandidatePage() {
  const { slug } = Route.useParams();
  const fetchCandidate = useServerFn(getCandidate);
  const { data: c, isLoading } = useQuery({
    queryKey: ["candidate", slug],
    queryFn: () => fetchCandidate({ data: { slug } }),
    refetchInterval: 20000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-3xl bg-card/60" />
        </div>
      </div>
    );
  }

  if (!c) throw notFound();

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Je soutiens ${c.name} pour ${c.category === "miss" ? "Miss" : "Master"} ! Votez ici 👉`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié !");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <Link
          to="/classement"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au classement
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border/60">
            {c.photo_url ? (
              <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                c.category === "miss"
                  ? "bg-magenta text-white"
                  : "bg-gold text-primary-foreground"
              }`}
            >
              {c.category}
            </span>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{c.name}</h1>

            {c.bio && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{c.bio}</p>
            )}

            {/* Socials */}
            {(c.socials.instagram || c.socials.tiktok) && (
              <div className="mt-5 flex gap-2">
                {c.socials.instagram && (
                  <a
                    href={`https://instagram.com/${c.socials.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-magenta/60"
                  >
                    <Instagram className="h-3.5 w-3.5" /> {c.socials.instagram}
                  </a>
                )}
                {c.socials.tiktok && (
                  <a
                    href={`https://tiktok.com/@${c.socials.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-magenta/60"
                  >
                    <Music2 className="h-3.5 w-3.5" /> {c.socials.tiktok}
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
                <p className="text-[10px] uppercase tracking-widest text-gold">Total collecté</p>
                <p className="mt-1 font-display text-3xl font-bold text-gold">
                  {formatXAF(c.total_collected)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Votes
                </p>
                <p className="mt-1 font-display text-3xl font-bold">
                  <Heart className="mr-1 inline h-5 w-5 text-magenta" />
                  {formatNumber(c.total_votes)}
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/vote/$slug"
              params={{ slug: c.slug }}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-bold text-primary-foreground transition hover:ring-gold-glow"
            >
              <TrendingUp className="h-5 w-5" /> Voter maintenant
            </Link>

            {/* Share */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Partager :</span>
              <a
                className="rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-magenta/60"
                href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-magenta/60"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-magenta/60"
              >
                <Share2 className="h-3 w-3" /> Copier le lien
              </button>
            </div>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
