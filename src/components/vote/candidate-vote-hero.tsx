import { formatXAF } from "@/lib/format";
import { UNIT_PRICE } from "@/lib/payment.utils";

export function CandidateVoteHero({
  name,
  category,
  faculty,
  photoUrl,
}: {
  name: string;
  category: "miss" | "master";
  faculty?: string | null;
  photoUrl?: string | null;
}) {
  const label = category === "miss" ? "Candidate Miss" : "Candidat Master";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 o">
      <div className="flex items-center gap-4">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-16 w-16 rounded-full object-cover ring-2 ring-rose/30" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted" />
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rose">{label}</p>
          <p className="font-display text-xl font-bold">{name}</p>
          {faculty && <p className="text-sm text-muted-foreground">{faculty}</p>}
          <p className="mt-1 text-sm font-semibold text-foreground">
            <strong>{formatXAF(UNIT_PRICE)}</strong> / vote
          </p>
        </div>
      </div>
    </div>
  );
}
