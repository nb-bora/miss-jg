import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut, Plus, ShieldCheck, Pencil, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminBootstrap,
  getAdminMe,
  getDashboard,
  listAllCandidates,
  listTransactions,
  setCandidateActive,
  upsertCandidate,
  deleteCandidate,
  uploadCandidatePhoto,
  listAllPackages,
  upsertPackage,
  deletePackage,
} from "@/lib/admin.functions";
import { SiteHeader } from "@/components/site-chrome";
import { formatXAF, formatNumber, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Miss-Mister Journées Gestion" }] }),
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
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

type Tab = "dashboard" | "transactions" | "candidates" | "packages";

function AdminConsole() {
  const qc = useQueryClient();
  const bootstrap = useServerFn(adminBootstrap);
  const me = useServerFn(getAdminMe);
  const dash = useServerFn(getDashboard);
  const txs = useServerFn(listTransactions);
  const cands = useServerFn(listAllCandidates);
  const toggle = useServerFn(setCandidateActive);
  const pkgs = useServerFn(listAllPackages);

  const [tab, setTab] = useState<Tab>("dashboard");

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
  const pkgQ = useQuery({
    queryKey: ["admin-pkgs"],
    queryFn: () => pkgs(),
    enabled: !!meQ.data?.isAdmin && tab === "packages",
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "transactions", label: "Transactions" },
    { key: "candidates", label: "Candidats" },
    { key: "packages", label: "Packs de vote" },
  ];

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

        <div className="mt-6 flex flex-wrap gap-1 rounded-full border border-border/60 bg-card/60 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2 text-sm transition ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
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
              onChanged={() => qc.invalidateQueries({ queryKey: ["admin-cands"] })}
            />
          )}
          {tab === "packages" && (
            <PackagesView
              data={pkgQ.data ?? []}
              loading={pkgQ.isLoading}
              onChanged={() => qc.invalidateQueries({ queryKey: ["admin-pkgs"] })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type DashData = {
  totalCollected: number;
  totalVotes: number;
  avgBasket: number;
  txToday: number;
  successRate: number;
  candidatesCount: number;
  top: { name: string; slug: string; total_collected: number; total_votes: number }[];
};

function DashboardView({ data, loading }: { data?: DashData; loading: boolean }) {
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
              {data.top.map((t, i) => (
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

type TxRow = {
  id: string;
  amount: number;
  vote_count: number;
  provider_ref: string;
  payment_status: string;
  buyer_name: string | null;
  buyer_contact: string | null;
  created_at: string;
  candidate_name: string;
};

function TransactionsView({ data, loading }: { data: TxRow[]; loading: boolean }) {
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
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

// ===== Candidates =====

type CandidateRow = {
  id: string;
  name: string;
  slug: string;
  category: "miss" | "master";
  bio: string | null;
  is_active: boolean;
  display_order: number;
  photo_url: string | null;
};

function CandidatesView({
  data,
  loading,
  onToggle,
  onChanged,
}: {
  data: CandidateRow[];
  loading: boolean;
  onToggle: (id: string, v: boolean) => void;
  onChanged: () => void;
}) {
  const del = useServerFn(deleteCandidate);
  const [editing, setEditing] = useState<CandidateRow | "new" | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try {
      await del({ data: { id } });
      toast.success("Candidat supprimé");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nouveau candidat
        </button>
      </div>

      {editing && (
        <CandidateForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
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
              <span className="w-6 text-center font-display text-sm text-gold">
                {c.display_order}
              </span>
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-muted">
                {c.photo_url && (
                  <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{c.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                      c.category === "miss"
                        ? "bg-magenta/15 text-magenta"
                        : "bg-gold/15 text-gold"
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
              <button
                onClick={() => setEditing(c)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: CandidateRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const upsert = useServerFn(upsertCandidate);
  const upload = useServerFn(uploadCandidatePhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    category: (initial?.category ?? "miss") as "miss" | "master",
    bio: initial?.bio ?? "",
    photo_url: initial?.photo_url ?? "",
    display_order: initial?.display_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), ""),
      );
      const res = await upload({
        data: { filename: file.name, contentType: file.type || "image/jpeg", base64 },
      });
      setForm((f) => ({ ...f, photo_url: res.url }));
      toast.success("Photo uploadée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert({
        data: {
          ...(initial?.id ? { id: initial.id } : {}),
          name: form.name,
          slug: form.slug,
          category: form.category,
          bio: form.bio || null,
          photo_url: form.photo_url || null,
          display_order: form.display_order,
          is_active: form.is_active,
        },
      });
      toast.success("Candidat enregistré");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-3 rounded-2xl border border-gold/40 bg-card/60 p-5 sm:grid-cols-2"
    >
      <div className="flex items-center justify-between sm:col-span-2">
        <h3 className="font-display text-lg font-bold">
          {initial ? "Modifier" : "Nouveau candidat"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Photo uploader */}
      <div className="sm:col-span-2">
        <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
          Photo
        </label>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-xl bg-muted">
            {form.photo_url ? (
              <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Upload className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Upload…" : "Uploader une photo"}
            </button>
            <input
              placeholder="ou coller une URL"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      <Field label="Nom complet">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <Field label="Slug (URL)">
        <input
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="ex: ophelie"
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <Field label="Catégorie">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as "miss" | "master" })}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        >
          <option value="miss">Miss</option>
          <option value="master">Master</option>
        </select>
      </Field>

      <Field label="Position (ordre d'affichage)">
        <input
          type="number"
          min={0}
          value={form.display_order}
          onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <Field label="Description / bio" full>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={5}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="h-4 w-4"
        />
        Actif (visible publiquement)
      </label>

      <button
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial ? "Enregistrer les modifications" : "Créer le candidat"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// ===== Packages =====

type PkgRow = {
  id: string;
  label: string;
  amount: number;
  votes: number;
  currency: string;
  is_active: boolean;
  display_order: number;
};

function PackagesView({
  data,
  loading,
  onChanged,
}: {
  data: PkgRow[];
  loading: boolean;
  onChanged: () => void;
}) {
  const upsert = useServerFn(upsertPackage);
  const del = useServerFn(deletePackage);
  const [editing, setEditing] = useState<PkgRow | "new" | null>(null);

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Supprimer le pack "${label}" ?`)) return;
    try {
      await del({ data: { id } });
      toast.success("Pack supprimé");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Définissez les packs de vote disponibles sur la page de paiement.
        </p>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nouveau pack
        </button>
      </div>

      {editing && (
        <PackageForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (input) => {
            try {
              await upsert({ data: input });
              toast.success("Pack enregistré");
              setEditing(null);
              onChanged();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erreur");
            }
          }}
        />
      )}

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card/60" />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Pack</th>
                <th className="px-4 py-3 text-right">Votes</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun pack défini
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-display text-gold">{p.display_order}</td>
                    <td className="px-4 py-3 font-semibold">{p.label}</td>
                    <td className="px-4 py-3 text-right">{p.votes}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gold">
                      {formatXAF(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          p.is_active
                            ? "bg-gold/15 text-gold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.label)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PackageForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: PkgRow | null;
  onClose: () => void;
  onSaved: (input: {
    id?: string;
    label: string;
    amount: number;
    votes: number;
    currency: string;
    display_order: number;
    is_active: boolean;
  }) => void;
}) {
  const [form, setForm] = useState({
    label: initial?.label ?? "",
    amount: initial?.amount ?? 500,
    votes: initial?.votes ?? 1,
    currency: initial?.currency ?? "XAF",
    display_order: initial?.display_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaved({ ...(initial?.id ? { id: initial.id } : {}), ...form });
      }}
      className="mt-4 grid gap-3 rounded-2xl border border-gold/40 bg-card/60 p-5 sm:grid-cols-2"
    >
      <div className="flex items-center justify-between sm:col-span-2">
        <h3 className="font-display text-lg font-bold">
          {initial ? "Modifier le pack" : "Nouveau pack"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Field label="Libellé">
        <input
          required
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="ex: Pack Champion"
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <Field label="Position">
        <input
          type="number"
          min={0}
          value={form.display_order}
          onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <Field label="Nombre de votes">
        <input
          type="number"
          required
          min={1}
          value={form.votes}
          onChange={(e) => setForm({ ...form, votes: Number(e.target.value) })}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <Field label="Montant (XAF)">
        <input
          type="number"
          required
          min={1}
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm"
        />
      </Field>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="h-4 w-4"
        />
        Actif (proposé sur la page de paiement)
      </label>

      <button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2">
        {initial ? "Enregistrer" : "Créer le pack"}
      </button>
    </form>
  );
}
