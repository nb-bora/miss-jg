export function VoteStepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm">
      <p className="text-sm font-semibold text-rose">
        <span className="mr-2">{step}</span>
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
