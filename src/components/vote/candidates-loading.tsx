export function CandidatesLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-20">
      <div className="relative">
        <img
          src="/logo.jpeg"
          alt="UCAC"
          className="h-24 w-24 rounded-full object-cover ring-2 ring-rose/40 animate-pulse"
        />
      </div>
      <div className="mt-10 w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-rose">Miss & Master</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Chargement des candidats</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nous préparons la liste des candidats Miss & Master.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-rose animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
