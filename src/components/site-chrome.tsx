import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.jpeg"
            alt="Miss-Mister Journées Gestion"
            className="h-12 w-12 rounded-full object-cover ring-1 ring-gold/40"
          />
          <div className="leading-none hidden sm:block">
            <p className="font-display text-base font-extrabold tracking-tight">
              MISS <span className="text-gold">·</span> MISTER
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-gold/80">
              JOURNÉES GESTION
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Accueil
          </Link>
          <Link
            to="/classement"
            className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Classement
          </Link>
        </nav>

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
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-1 ring-gold/40"
            />
            <div className="leading-none">
              <p className="font-display text-sm font-bold">
                MISS <span className="text-gold">·</span> MISTER
              </p>
              <p className="mt-1 text-[9px] tracking-[0.3em] text-gold/70">JOURNÉES GESTION</p>
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
