import fs from "fs";

const p = "src/routes/admin.tsx";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  `  const [tab, setTab] = useState<Tab>("dashboard");

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
  });`,
  `  const [tab, setTab] = useState<Tab>("dashboard");
  const [txFilters, setTxFilters] = useState({
    status: "all" as "all" | "paid" | "pending" | "failed",
    operator: "all" as "all" | "orange" | "mtn",
    search: "",
    date_from: "",
    date_to: "",
  });

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
    queryKey: ["admin-tx", txFilters],
    queryFn: () =>
      txs({
        data: {
          status: txFilters.status,
          operator: txFilters.operator,
          search: txFilters.search || undefined,
          date_from: txFilters.date_from || undefined,
          date_to: txFilters.date_to || undefined,
        },
      }),
    enabled: !!meQ.data?.isAdmin && tab === "transactions",
  });`,
);

s = s.replace(
  `{tab === "transactions" && (
            <TransactionsView data={txQ.data ?? []} loading={txQ.isLoading} />
          )}`,
  `{tab === "transactions" && (
            <TransactionsView
              data={txQ.data?.items ?? []}
              stats={txQ.data?.stats}
              loading={txQ.isLoading}
              filters={txFilters}
              onFiltersChange={setTxFilters}
            />
          )}`,
);

if (!s.includes("pendingCount")) {
  s = s.replace(
    `type DashData = {
  totalCollected: number;
  totalVotes: number;
  avgBasket: number;
  txToday: number;
  successRate: number;
  candidatesCount: number;
  top: { name: string; slug: string; total_collected: number; total_votes: number }[];
};`,
    `type DashData = {
  totalCollected: number;
  totalVotes: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  avgBasket: number;
  txToday: number;
  collectedToday: number;
  votesToday: number;
  successRate: number;
  candidatesCount: number;
  top: { name: string; slug: string; total_collected: number; total_votes: number }[];
};`,
  );

  s = s.replace(
    `  const kpis = [
    { label: "Total collecté", value: formatXAF(data.totalCollected), accent: "text-gold" },
    { label: "Votes validés", value: formatNumber(data.totalVotes), accent: "text-magenta" },
    { label: "Panier moyen", value: formatXAF(data.avgBasket), accent: "" },
    { label: "Tx aujourd'hui", value: String(data.txToday), accent: "" },
    { label: "Taux succès", value: \`\${data.successRate}%\`, accent: "" },
    { label: "Candidats", value: String(data.candidatesCount), accent: "" },
  ];`,
    `  const kpis = [
    { label: "Total collecté", value: formatXAF(data.totalCollected), accent: "text-gold" },
    { label: "Votes validés", value: formatNumber(data.totalVotes), accent: "text-magenta" },
    { label: "Collecté aujourd'hui", value: formatXAF(data.collectedToday), accent: "text-rose" },
    { label: "Votes aujourd'hui", value: formatNumber(data.votesToday), accent: "" },
    { label: "En attente", value: \`\${data.pendingCount} · \${formatXAF(data.pendingAmount)}\`, accent: "text-muted-foreground" },
    { label: "Échecs", value: String(data.failedCount), accent: "text-destructive" },
    { label: "Panier moyen (payé)", value: formatXAF(data.avgBasket), accent: "" },
    { label: "Tx aujourd'hui", value: String(data.txToday), accent: "" },
    { label: "Taux succès", value: \`\${data.successRate}%\`, accent: "" },
    { label: "Candidats", value: String(data.candidatesCount), accent: "" },
  ];`,
  );

  s = s.replace(
    `      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">`,
    `      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">`,
  );
}

if (!s.includes("softInputClass")) {
  s = s.replace(
    `import { SoftField, SoftInput } from "@/components/ui/soft-field";`,
    `import { SoftField, SoftInput, softInputClass } from "@/components/ui/soft-field";`,
  );
}

if (!s.includes("type TxFilters")) {
  const txStart = s.indexOf("function TransactionsView");
  const txEnd = s.indexOf("function StatusBadge", txStart);
  if (txStart < 0 || txEnd < 0) throw new Error("TransactionsView not found");

  const txView = `type TxFilters = {
  status: "all" | "paid" | "pending" | "failed";
  operator: "all" | "orange" | "mtn";
  search: string;
  date_from: string;
  date_to: string;
};

type TxStats = {
  count: number;
  totalAmount: number;
  totalVotes: number;
  collectedAmount: number;
  validatedVotes: number;
};

function TransactionsView({
  data,
  stats,
  loading,
  filters,
  onFiltersChange,
}: {
  data: TxRow[];
  stats?: TxStats;
  loading: boolean;
  filters: TxFilters;
  onFiltersChange: (f: TxFilters) => void;
}) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-card/60" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-card/40 p-3">
        <select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value as TxFilters["status"] })
          }
          className={softInputClass + " w-auto min-w-[8rem]"}
        >
          <option value="all">Tous statuts</option>
          <option value="paid">Payé</option>
          <option value="pending">En attente</option>
          <option value="failed">Échoué</option>
        </select>
        <select
          value={filters.operator}
          onChange={(e) =>
            onFiltersChange({ ...filters, operator: e.target.value as TxFilters["operator"] })
          }
          className={softInputClass + " w-auto min-w-[8rem]"}
        >
          <option value="all">Tous opérateurs</option>
          <option value="orange">Orange</option>
          <option value="mtn">MTN</option>
        </select>
        <SoftInput
          type="search"
          placeholder="Référence…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="min-w-[10rem] flex-1"
        />
        <SoftInput
          type="date"
          value={filters.date_from}
          onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
          className="w-auto"
        />
        <SoftInput
          type="date"
          value={filters.date_to}
          onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
          className="w-auto"
        />
      </div>

      {stats && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Résultats", value: String(stats.count) },
            { label: "Montant affiché", value: formatXAF(stats.totalAmount) },
            { label: "Collecté (payé)", value: formatXAF(stats.collectedAmount) },
            { label: "Votes validés", value: formatNumber(stats.validatedVotes) },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border/60 bg-card/60 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-display text-lg font-bold">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Candidat</th>
              <th className="px-4 py-3 text-left">Référence</th>
              <th className="px-4 py-3 text-left">Opérateur</th>
              <th className="px-4 py-3 text-left">Acheteur</th>
              <th className="px-4 py-3 text-right">Votes</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
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
                  <td className="px-4 py-3 text-xs uppercase">
                    {t.operator ?? "—"}
                    <div className="text-[10px] normal-case text-muted-foreground">{t.provider}</motion.div>
                  </td>
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
      </motion.div>
    </motion.div>
  );
}

`;

  const txViewClean = txView.replace(/motion\.div/g, "motion.div");
  s = s.slice(0, txStart) + txViewClean.replace(/motion\.div/g, "div") + s.slice(txEnd);
}

fs.writeFileSync(p, s);
console.log("patched");
