/**
 * Crée l'administrateur par défaut sur Supabase.
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY dans .env
 *
 * Usage : yarn db:seed:admin
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
const email = (process.env.ADMIN_SEED_EMAIL ?? "nanyangbrice@gmail.com").trim().toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD ?? "Changeme@2026";

if (!url || !serviceKey) {
  console.error("❌ Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error("❌ listUsers:", listError.message);
  process.exit(1);
}

let userId = list.users.find((u) => u.email?.toLowerCase() === email)?.id;
let created = false;

if (userId) {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("❌ updateUser:", error.message);
    process.exit(1);
  }
  console.log("✓ Compte existant mis à jour :", email);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("❌ createUser:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  created = true;
  console.log("✓ Compte créé :", email);
}

const { error: roleError } = await admin.from("user_roles").upsert(
  { user_id: userId, role: "admin" },
  { onConflict: "user_id,role" },
);
if (roleError) {
  console.error("❌ user_roles:", roleError.message);
  process.exit(1);
}

console.log(created ? "✓ Rôle admin attribué (nouveau compte)" : "✓ Rôle admin confirmé");
console.log("\nConnexion :", email);
console.log("Mot de passe :", password);
