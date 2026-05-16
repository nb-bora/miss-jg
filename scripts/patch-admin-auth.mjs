import fs from "fs";

const p = "src/routes/admin.tsx";
let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("function AuthForm()");
const end = s.indexOf("type Tab =", start);
if (start < 0 || end < 0) throw new Error("markers not found");

const neu = `function AuthForm() {
  const [email, setEmail] = useState("nanyangbrice@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connexion réussie");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ucac-gradient">
      <SiteHeader />
      <PageLayout className="max-w-md py-16">
        <SoftCard padding="lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose/10">
            <ShieldCheck className="h-7 w-7 text-rose" />
          </div>
          <h1 className="mt-4 text-center font-display text-3xl font-bold">Espace Admin</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Connectez-vous pour gérer les candidats, les votes et les transactions.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <SoftField label="Email">
              <SoftInput
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </SoftField>
            <SoftField label="Mot de passe" hint="">
              <SoftInput
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </SoftField>
            <button type="submit" disabled={loading} className="btn-rose w-full disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Se connecter
            </button>
          </form>
        </SoftCard>
      </PageLayout>
    </div>
  );
}

`;

s = s.slice(0, start) + neu + s.slice(end);
fs.writeFileSync(p, s);
console.log("AuthForm patched");
