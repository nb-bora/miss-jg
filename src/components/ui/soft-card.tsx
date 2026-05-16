import { cn } from "@/lib/utils";

export function SoftCard({
  children,
  className = "",
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}) {
  const pad = { sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" }[padding];
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm",
        pad,
        className,
      )}
    >
      {children}
    </div>
  );
}
