import { createMiddleware } from "@tanstack/react-start";
import { isMaintenanceExemptPath, isMaintenanceMode } from "@/lib/maintenance";

/**
 * Redirection HTTP côté serveur (Vercel) — ne dépend pas du bundle client.
 * S'applique à toutes les navigations page (handlerType === "router").
 */
export function createMaintenanceMiddleware() {
  return createMiddleware().server(async (ctx) => {
    const handlerType = (ctx as { handlerType?: string }).handlerType;
    if (handlerType !== "router") return ctx.next();

    // Maintenance désactivée par code (choix B)
    return ctx.next();
  });
}

