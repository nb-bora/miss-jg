import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Heart, Share2, TrendingUp, ArrowLeft, Instagram, Music2 } from "lucide-react";
import { getCandidate } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { formatNumber } from "@/lib/format";
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

      <article className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <span>/</span>
          <Link to="/classement" className="hover:text-foreground">Classement</Link>
          <span>/</span>
          <span className="text-foreground">{c.name}</span>
        </nav>

        <Link
          to="/classement"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au classement
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Image */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border/60 ring-1 ring-violet/20">
            {c.photo_url ? (
              <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-violet/30 via-transparent to-transparent" />
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
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">{c.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Candidat·e {c.category === "miss" ? "Miss" : "Master"} 2026
            </p>

            {/* Socials */}
            {(c.socials.instagram || c.socials.tiktok) && (
              <div className="mt-5 flex gap-2">
                {c.socials.instagram && (
                  <a
                    href={`https://instagram.com/${c.socials.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs hover:border-magenta/60"
                  >
                    <Instagram className="h-3.5 w-3.5" /> {c.socials.instagram}
                  </a>
                )}
                {c.socials.tiktok && (
                  <a
                    href={`https://tiktok.com/@${c.socials.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs hover:border-magenta/60"
                  >
                    <Music2 className="h-3.5 w-3.5" /> {c.socials.tiktok}
                  </a>
                )}
              </div>
            )}

            {/* Stats — votes seul */}
            <div className="mt-7 rounded-2xl border border-violet/30 bg-gradient-to-br from-violet/15 to-magenta/10 p-5">
              <p className="font-display text-3xl font-extrabold sm:text-4xl">
                <Heart className="mr-2 inline h-6 w-6 text-magenta" />
                {formatNumber(c.total_votes)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Votes reçus
              </p>
            </div>

            {c.bio && (
              <div className="mt-6 rounded-2xl border border-border/60 bg-card/50 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                  À propos de {c.name.split(" ")[0]}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.bio}</p>
              </div>
            )}

            {/* CTA */}
            <Link
              to="/vote/$slug"
              params={{ slug: c.slug }}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold to-[oklch(0.72_0.16_70)] px-8 py-4 font-display text-lg font-bold text-primary-foreground shadow-[0_16px_40px_-12px_oklch(0.82_0.13_85_/_0.55)] transition hover:scale-[1.02]"
            >
              <TrendingUp className="h-5 w-5" /> Voter maintenant
            </Link>

            {/* Share */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Partagez pour soutenir {c.name.split(" ")[0]}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 border border-[#25D366]/40 px-4 py-2 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/25"
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
                <a
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2]/15 border border-[#1877F2]/40 px-4 py-2 text-xs font-semibold text-[#5B9BFF] hover:bg-[#1877F2]/25"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-4 py-2 text-xs font-semibold hover:border-gold/60"
                >
                  <Share2 className="h-3 w-3" /> Copier le lien
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
