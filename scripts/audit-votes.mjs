/**
 * Audit rapide: compare vote_transactions 'paid' vs candidate_stats.
 * Usage:
 *   node scripts/audit-votes.mjs
 */

import fs from "fs";
import path from "path";
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

loadEnv();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("❌ Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: paidTxs, error: paidTxErr } = await admin
  .from("vote_transactions")
  .select("id, candidate_id, vote_count, amount, paid_at")
  .eq("payment_status", "paid");

if (paidTxErr) {
  console.error("❌ Erreur lecture vote_transactions:", paidTxErr.message);
  process.exit(1);
}

const paid = paidTxs ?? [];
console.log(`paid tx: ${paid.length}`);

const sumByCandidate = new Map();
for (const t of paid) {
  const prev = sumByCandidate.get(t.candidate_id) ?? { votes: 0, collected: 0 };
  prev.votes += Number(t.vote_count ?? 0);
  prev.collected += Number(t.amount ?? 0);
  sumByCandidate.set(t.candidate_id, prev);
}

const ids = Array.from(sumByCandidate.keys());
const { data: viewRows, error: viewErr } = await admin
  .from("candidate_stats")
  .select("id, total_votes, total_collected")
  .in("id", ids);

if (viewErr) {
  console.error("❌ Erreur lecture candidate_stats:", viewErr.message);
  process.exit(1);
}

let mismatches = [];
for (const row of viewRows ?? []) {
  const s = sumByCandidate.get(row.id);
  if (!s) continue;
  const viewVotes = Number(row.total_votes ?? 0);
  const viewCollected = Number(row.total_collected ?? 0);
  if (viewVotes !== s.votes || viewCollected !== s.collected) {
    mismatches.push({
      candidate_id: row.id,
      viewVotes,
      sumVotes: s.votes,
      viewCollected,
      sumCollected: s.collected,
    });
  }
}

console.log("Mismatch count:", mismatches.length);
if (mismatches.length) {
  console.table(mismatches.slice(0, 50));
}

