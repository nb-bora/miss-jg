/** Active via VITE_MAINTENANCE_MODE ou MAINTENANCE_MODE (= true ou 1) */
export function isMaintenanceMode(): boolean {
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_MAINTENANCE_MODE) ||
    (typeof process !== "undefined" && process.env?.MAINTENANCE_MODE) ||
    (typeof process !== "undefined" && process.env?.VITE_MAINTENANCE_MODE);
  return raw === "true" || raw === "1";
}

/** Chemins accessibles pendant la maintenance (webhooks, page maintenance). */
export function isMaintenanceExemptPath(pathname: string): boolean {
  if (pathname === "/maintenance" || pathname.startsWith("/maintenance/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}
