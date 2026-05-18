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

    const url = new URL(ctx.request.url);
    if (!isMaintenanceMode() || isMaintenanceExemptPath(url.pathname)) {
      return ctx.next();
    }

    const target = new URL("/maintenance", url.origin);
    return Response.redirect(target.toString(), 307);
  });
}
