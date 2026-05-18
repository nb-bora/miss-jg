import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
  head: () => ({
    meta: [
      { title: "Maintenance — Miss & Master JG 2026" },
      {
        name: "description",
        content: "Le site est temporairement indisponible pour maintenance.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ucac-gradient px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, color-mix(in oklab, var(--rose) 25%, transparent), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-border/60 bg-card/80 ring-rose-glow backdrop-blur-sm">
          <Construction className="h-10 w-10 text-rose" strokeWidth={1.5} />
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          Miss & Master · JG 2026
        </p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Site en maintenance
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Nous préparons la plateforme de vote pour vous offrir une meilleure expérience. Le site
          sera de nouveau accessible très prochainement.
        </p>

        <div className="gold-divider mx-auto mt-10 h-px w-32" />

        <p className="mt-8 text-sm text-muted-foreground">
          Merci pour votre patience et votre soutien aux candidats.
        </p>
      </div>

      <footer className="relative mt-16 text-center text-xs text-muted-foreground/80">
        © {new Date().getFullYear()} Miss & Master — Journées Gestion
      </footer>
    </div>
  );
}
