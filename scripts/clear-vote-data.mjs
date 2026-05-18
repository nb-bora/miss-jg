/**
 * Supprime toutes les transactions et l'historique de paiement (votes remis à zéro).
 * Les candidats et les packs ne sont pas touchés.
 *
 * Usage : node scripts/clear-vote-data.mjs
 *         node scripts/clear-vote-data.mjs --yes   (sans confirmation)
 */
import fs from "fs";
import path from "path";
import readline from "readline";
import { createClient } from "@supabase/supabase-js";

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

async function confirm(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question(`${message} (oui/non) : `, resolve);
  });
  rl.close();
  return answer.trim().toLowerCase() === "oui" || answer.trim().toLowerCase() === "o";
}

loadEnv();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const skipConfirm = process.argv.includes("--yes");

if (!url || !serviceKey) {
  console.error("❌ Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env");
  process.exit(1);
}

if (!skipConfirm) {
  const ok = await confirm(
    "⚠️  Supprimer TOUTES les transactions et événements de paiement ? Le classement sera remis à zéro",
  );
  if (!ok) {
    console.log("Annulé.");
    process.exit(0);
  }
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const nil = "00000000-0000-0000-0000-000000000000";

const { count: eventsBefore } = await admin
  .from("payment_events")
  .select("*", { count: "exact", head: true });
const { count: txsBefore } = await admin
  .from("vote_transactions")
  .select("*", { count: "exact", head: true });

console.log(`Avant : ${txsBefore ?? 0} transaction(s), ${eventsBefore ?? 0} événement(s)`);

const { error: evErr } = await admin.from("payment_events").delete().neq("id", nil);
if (evErr) {
  console.error("❌ payment_events:", evErr.message);
  process.exit(1);
}

const { error: txErr } = await admin.from("vote_transactions").delete().neq("id", nil);
if (txErr) {
  console.error("❌ vote_transactions:", txErr.message);
  process.exit(1);
}

const { count: eventsAfter } = await admin
  .from("payment_events")
  .select("*", { count: "exact", head: true });
const { count: txsAfter } = await admin
  .from("vote_transactions")
  .select("*", { count: "exact", head: true });

console.log(`Après : ${txsAfter ?? 0} transaction(s), ${eventsAfter ?? 0} événement(s)`);
console.log("✓ Votes et transactions vidés. Le classement est remis à zéro.");
