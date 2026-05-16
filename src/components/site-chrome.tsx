import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Miss & Master"
            className="h-10 w-10 rounded-full object-cover ring-1 ring-rose/40"
          />
          <div className="hidden leading-none sm:block">
            <p className="font-display text-sm font-extrabold tracking-tight">
              MISS <span className="text-rose">·</span> MASTER
            </p>
            <p className="mt-0.5 text-[9px] font-semibold tracking-[0.25em] text-muted-foreground">
              VOTE OFFICIEL
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Accueil
          </Link>
          <Link
            to="/classement"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Classement
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            hash="candidats"
            className="hidden rounded-full bg-rose px-4 py-2 text-xs font-bold text-white shadow-rose-glow sm:inline-flex"
          >
            Voter maintenant
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-2 text-xs font-semibold transition hover:border-rose/40"
          >
            <LogIn className="h-3.5 w-3.5" /> Admin
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-rose/30" />
            <div className="leading-none">
              <p className="font-display text-sm font-bold">MISS · MASTER</p>
              <p className="mt-1 text-[9px] tracking-[0.2em] text-muted-foreground">VOTE PAYANT</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} — Votes comptabilisés après confirmation Mobile Money.
          </p>
        </div>
      </div>
    </footer>
  );
}
