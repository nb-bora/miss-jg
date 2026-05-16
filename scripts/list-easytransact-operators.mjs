/**
 * Affiche les operator_id Easy Transact à copier dans Vercel / .env (production).
 *
 * Prérequis dans .env :
 *   EASYTRANSACT_API_URL=https://api.easy-transact.net
 *   EASYTRANSACT_API_TOKEN=sk_live_...
 *
 * Usage : npm run et:operators
 */
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function collectOperators(raw, out = []) {
  if (Array.isArray(raw)) {
    for (const item of raw) collectOperators(item, out);
    return out;
  }
  if (typeof raw !== "object" || raw === null) return out;
  const o = raw;
  const id = o.id ?? o.operator_id ?? o.uuid ?? o.code ?? o.slug;
  const name = o.name ?? o.label ?? o.operator_name;
  const code = o.code;
  const keys = Object.keys(o).join(" ").toLowerCase();
  if (
    id &&
    typeof id === "string" &&
    (keys.includes("operator") || ("name" in o || "code" in o || "label" in o))
  ) {
    out.push({ id: String(id).trim(), name: name ? String(name) : undefined, code: code ? String(code) : undefined });
  }
  for (const v of Object.values(o)) {
    if (typeof v === "object" && v !== null) collectOperators(v, out);
  }
  return out;
}

function normalizeList(raw) {
  const top = Array.isArray(raw)
    ? raw
    : raw?.results ?? raw?.data ?? raw?.operators ?? raw?.items ?? [];
  const list = Array.isArray(top) && top.length ? top.map((item) => ({
    id: String(item.id ?? item.operator_id ?? item.uuid ?? item.code ?? "").trim(),
    name: item.name ?? item.label,
    code: item.code,
  })).filter((x) => x.id) : collectOperators(raw);
  const seen = new Set();
  return list.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

function matchOperator(list, operator) {
  const needles =
    operator === "orange"
      ? ["orange", "orange money", "orm"]
      : ["mtn", "momo", "mobile money"];
  return list.find((item) => {
    const hay = `${item.id} ${item.name ?? ""} ${item.code ?? ""}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
}

loadEnv();

const base = (process.env.EASYTRANSACT_API_URL || "https://api.easy-transact.net").replace(/\/$/, "");
const token = process.env.EASYTRANSACT_API_TOKEN?.trim();

if (!token) {
  console.error("❌ EASYTRANSACT_API_TOKEN est vide.");
  console.error("   Dashboard Easy Transact → Clés API → copiez sk_live_… dans .env puis relancez.");
  process.exit(1);
}

const paths = [
  "/api/v1/partner/operators/",
  "/api/v1/operators/",
  "/api/v1/partner/operator/",
  "/api/v1/partner/services/",
];

const merged = [];
const seen = new Set();

for (const p of paths) {
  const res = await fetch(`${base}${p}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    console.warn(`⚠ ${p} → réponse non JSON (${res.status})`);
    continue;
  }
  if (!res.ok) {
    console.warn(`⚠ ${p} → ${res.status} ${typeof json.detail === "string" ? json.detail : text.slice(0, 120)}`);
    continue;
  }
  for (const item of normalizeList(json)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
}

if (!merged.length) {
  console.error("❌ Aucun opérateur trouvé via l’API.");
  console.error("   Contactez le support Easy Transact (compte Miss JG) pour activer Orange / MTN sur DEPOSIT.");
  process.exit(1);
}

console.log("\n✅ Opérateurs détectés :\n");
for (const o of merged) {
  console.log(`  • ${o.name ?? o.code ?? "Opérateur"} → id: ${o.id}`);
}

const orange = matchOperator(merged, "orange");
const mtn = matchOperator(merged, "mtn");

console.log("\n📋 Copiez dans Vercel (Environment Variables) :\n");
if (orange) console.log(`EASYTRANSACT_OPERATOR_ORANGE=${orange.id}`);
else console.log("# EASYTRANSACT_OPERATOR_ORANGE=  ← associez manuellement une ligne Orange ci-dessus");
if (mtn) console.log(`EASYTRANSACT_OPERATOR_MTN=${mtn.id}`);
else console.log("# EASYTRANSACT_OPERATOR_MTN=  ← associez manuellement une ligne MTN ci-dessus");

if (orange && mtn) {
  console.log(`\n# Ou en une ligne :`);
  console.log(`EASYTRANSACT_OPERATORS={"orange":"${orange.id}","mtn":"${mtn.id}"}`);
}

console.log("\nPuis redéployez sur Vercel.\n");
