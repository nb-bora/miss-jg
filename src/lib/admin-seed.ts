import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Crée ou met à jour le compte administrateur par défaut (nécessite SUPABASE_SERVICE_ROLE_KEY).
 */
export async function ensureDefaultAdmin(): Promise<{
  created: boolean;
  userId: string;
  email: string;
}> {
  const email = (process.env.ADMIN_SEED_EMAIL ?? "nanyangbrice@gmail.com").trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? "Changeme@2026";

  let userId: string | undefined;

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw new Error(listError.message);

  const existing = list.users.find((u) => u.email?.toLowerCase() === email);
  let created = false;

  if (existing) {
    userId = existing.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateError) throw new Error(updateError.message);
  } else {
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw new Error(createError.message);
    userId = data.user.id;
    created = true;
  }

  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!existingRole) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleError) throw new Error(roleError.message);
  }

  return { created, userId: userId!, email };
}
