export function formatXAF(amount: number | bigint): string {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export function formatNumber(n: number | bigint): string {
  return new Intl.NumberFormat("fr-FR").format(typeof n === "bigint" ? Number(n) : n);
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
