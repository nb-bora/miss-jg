import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut, Plus, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminBootstrap,
  getAdminMe,
  getDashboard,
  listAllCandidates,
  listTransactions,
  setCandidateActive,
  upsertCandidate,
} from "@/lib/admin.functions";
import { SiteHeader } from "@/components/site-chrome";
import { formatXAF, formatNumber, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Miss & Master" }] }),
});

function AdminPage() {
  const [session, setSession] = useState<null | { user_id: string }>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { user_id: data.session.user.id } : null);
      setLoadingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { user_id: s.user.id } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!session) return <AuthForm />;
  return <AdminConsole />;
}

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-3xl border border-border/60 bg-card/60 p-8">
          <ShieldCheck className="h-8 w-8 text-gold" />
          <h1 className="mt-3 font-display text-3xl font-bold">Espace Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Créez le compte administrateur (le premier inscrit devient admin)."
              : "Connectez-vous pour accéder au tableau de bord."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus:border-gold"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus:border-gold"
            />
            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Créer le compte" : "Se connecter"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Créer un compte admin" : "J'ai déjà un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminConsole() {
  const qc = useQueryClient();
  const bootstrap = useServerFn(adminBootstrap);
  const me = useServerFn(getAdminMe);
  const dash = useServerFn(getDashboard);
  const txs = useServerFn(listTransactions);
  const cands = useServerFn(listAllCandidates);
  const upsert = useServerFn(upsertCandidate);
  const toggle = useServerFn(setCandidateActive);

  const [tab, setTab] = useState<"dashboard" | "transactions" | "candidates">("dashboard");

  // Bootstrap: first user becomes admin
  useEffect(() => {
    bootstrap().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meQ = useQuery({ queryKey: ["admin-me"], queryFn: () => me() });
  const dashQ = useQuery({
    queryKey: ["admin-dash"],
    queryFn: () => dash(),
    enabled: !!meQ.data?.isAdmin,
  });
  const txQ = useQuery({
    queryKey: ["admin-tx"],
    queryFn: () => txs({ data: {} }),
    enabled: !!meQ.data?.isAdmin && tab === "transactions",
  });
  const candQ = useQuery({
    queryKey: ["admin-cands"],
    queryFn: () => cands(),
    enabled: !!meQ.data?.isAdmin && tab === "candidates",
  });

  const toggleM = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cands"] }),
  });

  if (meQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!meQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte n'a pas le rôle administrateur.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Console admin</p>
            <h1 className="mt-1 font-display text-3xl font-bold">Tableau de bord</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm hover:border-magenta/60"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>

        <div className="mt-6 inline-flex rounded-full border border-border/60 bg-card/60 p-1">
          {(["dashboard", "transactions", "candidates"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm capitalize transition ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "dashboard" ? "Dashboard" : t === "transactions" ? "Transactions" : "Candidats"}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "dashboard" && (
            <DashboardView data={dashQ.data} loading={dashQ.isLoading} />
          )}
          {tab === "transactions" && (
            <TransactionsView data={txQ.data ?? []} loading={txQ.isLoading} />
          )}
          {tab === "candidates" && (
            <CandidatesView
              data={candQ.data ?? []}
              loading={candQ.isLoading}
              onToggle={(id, v) => toggleM.mutate({ id, is_active: v })}
              onCreate={async (input) => {
                await upsert({ data: input });
                toast.success("Candidat enregistré");
                qc.invalidateQueries({ queryKey: ["admin-cands"] });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardView({ data, loading }: { data: any; loading: boolean }) {
  if (loading || !data) return <div className="h-40 animate-pulse rounded-2xl bg-card/60" />;
  const kpis = [
    { label: "Total collecté", value: formatXAF(data.totalCollected), accent: "text-gold" },
    { label: "Votes validés", value: formatNumber(data.totalVotes), accent: "text-magenta" },
    { label: "Panier moyen", value: formatXAF(data.avgBasket), accent: "" },
    { label: "Tx aujourd'hui", value: String(data.txToday), accent: "" },
    { label: "Taux succès", value: `${data.successRate}%`, accent: "" },
    { label: "Candidats", value: String(data.candidatesCount), accent: "" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {k.label}
            </p>
            <p className={`mt-1 font-display text-xl font-bold ${k.accent}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Top 5 candidats</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Candidat</th>
                <th className="px-4 py-3 text-right">Votes</th>
                <th className="px-4 py-3 text-right">Collecté</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((t: any, i: number) => (
                <tr key={t.slug} className="border-t border-border/40">
                  <td className="px-4 py-3 font-display text-gold">{i + 1}</td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(t.total_votes)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gold">
                    {formatXAF(t.total_collected)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TransactionsView({ data, loading }: { data: any[]; loading: boolean }) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-card/60" />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Candidat</th>
            <th className="px-4 py-3 text-left">Référence</th>
            <th className="px-4 py-3 text-left">Acheteur</th>
            <th className="px-4 py-3 text-right">Votes</th>
            <th className="px-4 py-3 text-right">Montant</th>
            <th className="px-4 py-3 text-left">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                Aucune transaction
              </td>
            </tr>
          ) : (
            data.map((t) => (
              <tr key={t.id} className="border-t border-border/40">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(t.created_at)}
                </td>
                <td className="px-4 py-3">{t.candidate_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.provider_ref}</td>
                <td className="px-4 py-3 text-xs">
                  {t.buyer_name ?? "—"}
                  {t.buyer_contact && (
                    <div className="text-muted-foreground">{t.buyer_contact}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{t.vote_count}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatXAF(t.amount)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.payment_status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-gold/15 text-gold",
    pending: "bg-muted text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
    refunded: "bg-magenta/15 text-magenta",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

function CandidatesView({
  data,
  loading,
  onToggle,
  onCreate,
}: {
  data: any[];
  loading: boolean;
  onToggle: (id: string, v: boolean) => void;
  onCreate: (input: any) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "miss" as "miss" | "master",
    bio: "",
    photo_url: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate({ ...form, photo_url: form.photo_url || null, bio: form.bio || null });
      setOpen(false);
      setForm({ name: "", slug: "", category: "miss", bio: "", photo_url: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nouveau candidat
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 rounded-2xl border border-gold/40 bg-card/60 p-5 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Nom complet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
          />
          <input
            required
            placeholder="slug-unique"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            className="rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
          >
            <option value="miss">Miss</option>
            <option value="master">Master</option>
          </select>
          <input
            placeholder="URL photo (https://…)"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            className="rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
          />
          <textarea
            placeholder="Bio courte"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="min-h-20 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm sm:col-span-2"
          />
          <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2">
            Enregistrer
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card/60" />
      ) : (
        <div className="mt-6 space-y-2">
          {data.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
            >
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                {c.photo_url && (
                  <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                      c.category === "miss" ? "bg-magenta/15 text-magenta" : "bg-gold/15 text-gold"
                    }`}
                  >
                    {c.category}
                  </span>
                </div>
                <Link
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  /c/{c.slug}
                </Link>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={c.is_active}
                  onChange={(e) => onToggle(c.id, e.target.checked)}
                  className="h-4 w-4 accent-current"
                />
                {c.is_active ? "Actif" : "Archivé"}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
