import { Link } from "@tanstack/react-router";
import { Crown, LogIn } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo stacked */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-gold/20 to-magenta/10">
            <Crown className="h-5 w-5 text-gold" />
          </div>
          <div className="leading-none">
            <p className="font-display text-base font-extrabold tracking-tight">
              MISS <span className="text-gold">&</span> MASTER
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-gold/80">2026</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Accueil", exact: true },
            { to: "/classement", label: "Candidats" },
            { to: "/classement", label: "Classement" },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              activeOptions={item.exact ? { exact: true } : undefined}
              className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-4 py-2 text-xs font-semibold text-foreground transition hover:border-gold/50"
          >
            <LogIn className="h-3.5 w-3.5" /> Se connecter
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-gold/10">
              <Crown className="h-4 w-4 text-gold" />
            </div>
            <div className="leading-none">
              <p className="font-display text-sm font-bold">MISS <span className="text-gold">&</span> MASTER</p>
              <p className="mt-1 text-[9px] tracking-[0.3em] text-gold/70">ÉDITION 2026</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} — Classement basé sur le total des votes payés validés.
          </p>
        </div>
      </div>
    </footer>
  );
}
