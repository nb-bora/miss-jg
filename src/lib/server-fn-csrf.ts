import { createMiddleware } from "@tanstack/react-start";

/** Même symbole que @tanstack/start-client-core — détecté par TanStack Start en dev */
const csrfSymbol = Symbol.for("tanstack-start:csrf-middleware");

function isServerFnCsrfAllowed(request: Request): boolean {
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite !== null) {
    return fetchSite === "same-origin" || fetchSite === "same-site";
  }

  const origin = request.headers.get("Origin");
  if (origin !== null) {
    return origin === new URL(request.url).origin;
  }

  // Pas d'en-tête Origin (certains clients) — aligné sur le défaut TanStack
  return true;
}

/** Protection CSRF pour les server functions (équivalent createCsrfMiddleware, bundle client-safe). */
export function createServerFnCsrfMiddleware() {
  const middleware = createMiddleware().server(async (ctx) => {
    const handlerType = (ctx as { handlerType?: string }).handlerType;
    if (handlerType !== "serverFn") return ctx.next();

    if (isServerFnCsrfAllowed(ctx.request)) return ctx.next();
    return new Response("Forbidden", { status: 403 });
  });

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(middleware, csrfSymbol, { value: true });
  }

  return middleware;
}
