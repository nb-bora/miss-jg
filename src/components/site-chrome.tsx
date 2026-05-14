import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-gold" />
          <span className="font-display text-lg font-bold tracking-tight">
            Miss<span className="text-gold">&</span>Master
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
          >
            Accueil
          </Link>
          <Link
            to="/classement"
            className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Classement
          </Link>
          <Link
            to="/admin"
            className="rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition hover:border-gold/60 hover:text-foreground"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Miss & Master. Tous droits réservés.</p>
        <p className="text-xs">
          Le classement officiel est basé sur le montant total collecté via les votes validés.
        </p>
      </div>
    </footer>
  );
}
