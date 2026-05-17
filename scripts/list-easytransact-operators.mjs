/**
 * Affiche la config réseau Easy Transact (CASH_IN) — plus d’operator_id requis.
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

loadEnv();

const token = process.env.EASYTRANSACT_API_TOKEN?.trim();
const service = process.env.EASYTRANSACT_SERVICE_CODE?.trim() || "CASH_IN";
const country = process.env.EASYTRANSACT_COUNTRY_CODE?.trim() || "CM";
const orange = process.env.EASYTRANSACT_NETWORK_ORANGE?.trim() || "ORANGE_CM";
const mtn = process.env.EASYTRANSACT_NETWORK_MTN?.trim() || "MTN_CM";

console.log("\n✅ Easy Transact — configuration CASH_IN (aucun operator_id requis)\n");
console.log("Variables obligatoires :");
console.log(`  EASYTRANSACT_API_URL=https://api.easy-transact.net`);
console.log(`  EASYTRANSACT_API_TOKEN=${token ? "(défini)" : "← sk_live_… à ajouter"}`);
console.log("\nRéseaux (automatiques dans l’app) :");
console.log(`  Orange → network_code: ${orange}`);
console.log(`  MTN    → network_code: ${mtn}`);
console.log(`  service_code: ${service}`);
console.log(`  country_code: ${country}`);
console.log("\nOptionnel : EASYTRANSACT_RECEIVER_NUMBER (sinon = numéro du votant)\n");

if (!token) process.exit(1);
