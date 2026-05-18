function isTruthyEnv(value: unknown): boolean {
  return value === "true" || value === "1" || value === true;
}

/** Active via VITE_MAINTENANCE_MODE ou MAINTENANCE_MODE (= true ou 1) */
export function isMaintenanceMode(): boolean {
  if (isTruthyEnv(import.meta.env?.VITE_MAINTENANCE_MODE)) return true;

  if (typeof process !== "undefined" && process.env) {
    if (isTruthyEnv(process.env.MAINTENANCE_MODE)) return true;
    if (isTruthyEnv(process.env.VITE_MAINTENANCE_MODE)) return true;
  }

  return false;
}

/** Chemins accessibles pendant la maintenance (webhooks, assets, page maintenance). */
export function isMaintenanceExemptPath(pathname: string): boolean {
  if (pathname === "/maintenance" || pathname.startsWith("/maintenance/")) return true;
  if (pathname.startsWith("/api/")) return true;
  // Assets Vite / fichiers statiques
  if (pathname.startsWith("/assets/")) return true;
  if (/\.[a-zA-Z0-9]{2,8}$/.test(pathname)) return true;
  return false;
}
