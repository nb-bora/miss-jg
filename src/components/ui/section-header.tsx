export function SectionHeader({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">{eyebrow}</p>
      )}
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}
