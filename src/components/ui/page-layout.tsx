import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export function PageLayout({
  children,
  className = "",
  variant = "default",
  showFooter = true,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient";
  showFooter?: boolean;
}) {
  return (
    <div
      className={`min-h-screen ${variant === "gradient" ? "bg-ucac-gradient" : "bg-background"}`}
    >
      <SiteHeader />
      <main className={`mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 ${className}`}>
        {children}
      </main>
      {showFooter && <SiteFooter />}
    </div>
  );
}
