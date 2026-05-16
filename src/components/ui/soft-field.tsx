import { cn } from "@/lib/utils";

export function SoftField({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const softInputClass =
  "w-full rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-rose focus:ring-2 focus:ring-rose/20";

export function SoftInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(softInputClass, props.className)} />;
}
