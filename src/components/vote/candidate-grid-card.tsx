import { Link } from "@tanstack/react-router";

export function CandidateGridCard({
  slug,
  name,
  category,
  faculty,
  photoUrl,
}: {
  slug: string;
  name: string;
  category: "miss" | "master";
  faculty?: string | null;
  photoUrl?: string | null;
}) {
  const catLabel = category === "miss" ? "Miss" : "Master";

  return (
    <Link
      to="/vote/$slug"
      params={{ slug }}
      className="group relative block overflow-hidden rounded-3xl border border-border/60 bg-card transition hover:-translate-y-0.5 hover:border-rose/40 hover:ring-rose-glow"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
          {catLabel}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-rose px-4 py-1.5 text-xs font-bold text-white">
          Voter
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose">
            {category === "miss" ? "Candidate Miss" : "Candidat Master"}
          </p>
          <h3 className="font-display text-2xl font-bold text-white">{name}</h3>
          {faculty && <p className="mt-1 text-sm text-white/70">{faculty}</p>}
        </div>
      </div>
    </Link>
  );
}
