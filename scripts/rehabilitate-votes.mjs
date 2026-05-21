/**
 * Rehabilite / audite les votes en fonction des paiements.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { createClient } from "@supabase/supabase-js";

/* =========================
   ENV LOADER
========================= */
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

    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = val;
  }
}

/* =========================
   CONFIRMATION CLI
========================= */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question(`${message} (oui/non) : `, resolve);
  });

  rl.close();
  return ["oui", "o"].includes(answer.trim().toLowerCase());
}

loadEnv();

/* =========================
   CONFIG
========================= */
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const skipConfirm = process.argv.includes("--yes");
const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--apply");
const apply = !dryRun;

/* =========================
   INIT SUPABASE
========================= */
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* =========================
   SLUG ARG
========================= */
const slugIndex = process.argv.indexOf("--slug");
const argSlug = slugIndex !== -1 ? process.argv[slugIndex + 1] : undefined;

/* =========================
   CONFIRM
========================= */
if (apply && !skipConfirm) {
  const ok = await confirm("⚠️ Appliquer la réhabilitation ?");
  if (!ok) process.exit(0);
}

/* =========================
   FETCH PAID TX
========================= */
const { data: paidTxs, error } = await admin
  .from("vote_transactions")
  .select("id, candidate_id, paid_at, amount, vote_count")
  .eq("payment_status", "paid");

if (error) {
  console.error("❌ vote_transactions error:", error.message);
  process.exit(1);
}

const paid = paidTxs ?? [];
console.log("Transactions paid:", paid.length);

/* =========================
   FILTER BY SLUG
========================= */
let filteredPaid = paid;

if (argSlug) {
  const { data: stats, error: statsErr } = await admin
    .from("candidate_stats")
    .select("id")
    .eq("slug", argSlug);

  if (statsErr) {
    console.error("❌ candidate_stats error:", statsErr.message);
    process.exit(1);
  }

  const ids = new Set((stats ?? []).map((s) => s.id));

  filteredPaid = paid.filter((t) => ids.has(t.candidate_id));
}

console.log("Considered paid:", filteredPaid.length);

/* =========================
   PAID_AT FIX
========================= */
const nowIso = new Date().toISOString();
let updatedPaidAt = 0;
let fixedAmount = 0;
let fixedVoteCount = 0;

/* =========================
   FIX amount/vote_count
========================= */
if (apply) {
  const toFix = filteredPaid.filter((t) => {
    const v = Number(t.vote_count ?? 0);
    const a = Number(t.amount ?? 0);
    return v > 0 && a > 0 && a !== v * 100;
  });

  for (const t of toFix) {
    const v = Number(t.vote_count ?? 0);
    const a = Number(t.amount ?? 0);

    const payload = {};

    if (a % 100 === 0) {
      payload.vote_count = a / 100;
      payload.amount = a;
      fixedVoteCount++;
    } else {
      payload.amount = v * 100;
      fixedAmount++;
    }

    const { error } = await admin
      .from("vote_transactions")
      .update(payload)
      .eq("id", t.id);

    if (error) {
      console.error("❌ update error:", error.message);
      process.exit(1);
    }
  }
}

/* =========================
   FIX paid_at
========================= */
if (apply) {
  const missing = filteredPaid.filter((t) => !t.paid_at);

  if (missing.length) {
    const ids = missing.map((t) => t.id);

    const { error } = await admin
      .from("vote_transactions")
      .update({ paid_at: nowIso })
      .in("id", ids);

    if (error) {
      console.error("❌ paid_at update error:", error.message);
      process.exit(1);
    }

    updatedPaidAt = ids.length;
  }
}

/* =========================
   TOUCH METADATA SAFE
========================= */
let touchedMetadata = 0;

if (apply) {
  const ids = filteredPaid.map((t) => t.id);

  if (ids.length) {
    const { error } = await admin
      .from("vote_transactions")
      .update({
        metadata: {
          rehabilitated_at: nowIso,
        },
      })
      .in("id", ids.slice(0, 5000));

    if (!error) touchedMetadata = ids.length;
  }
}

/* =========================
   SUMMARY
========================= */
console.log("---- SUMMARY ----");
console.log({
  dryRun,
  slug: argSlug ?? null,
  totalPaid: paid.length,
  consideredPaid: filteredPaid.length,
  updatedPaidAt,
  fixedAmount,
  fixedVoteCount,
  touchedMetadata,
});