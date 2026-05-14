import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès refusé : admin requis");
}

export const adminBootstrap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
      return { promoted: true };
    }
    return { promoted: false };
  });

export const getAdminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data, userId: context.userId };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: txs } = await supabaseAdmin
      .from("vote_transactions")
      .select("amount, vote_count, payment_status, created_at");

    const all = txs ?? [];
    const paid = all.filter((t) => t.payment_status === "paid");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = all.filter((t) => new Date(t.created_at) >= today).length;
    const successRate = all.length ? (paid.length / all.length) * 100 : 0;

    const { count: candidatesCount } = await supabaseAdmin
      .from("candidates")
      .select("*", { count: "exact", head: true });

    const { data: top } = await supabaseAdmin
      .from("candidate_stats")
      .select("name, slug, total_collected, total_votes")
      .order("total_collected", { ascending: false })
      .limit(5);

    return {
      totalCollected: paid.reduce((a, t) => a + (t.amount ?? 0), 0),
      totalVotes: paid.reduce((a, t) => a + (t.vote_count ?? 0), 0),
      avgBasket: paid.length ? Math.round(paid.reduce((a, t) => a + (t.amount ?? 0), 0) / paid.length) : 0,
      txToday: todayCount,
      successRate: Math.round(successRate * 10) / 10,
      candidatesCount: candidatesCount ?? 0,
      top: (top ?? []).map((t) => ({
        name: t.name as string,
        slug: t.slug as string,
        total_collected: Number(t.total_collected ?? 0),
        total_votes: Number(t.total_votes ?? 0),
      })),
    };
  });

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ status: z.enum(["all", "paid", "pending", "failed"]).optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("vote_transactions")
      .select("id, amount, currency, vote_count, provider, provider_ref, payment_status, buyer_name, buyer_contact, created_at, paid_at, candidate_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("payment_status", data.status);
    const { data: txs, error } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((txs ?? []).map((t) => t.candidate_id)));
    const { data: cands } = await supabaseAdmin.from("candidates").select("id, name, slug").in("id", ids);
    const map = new Map((cands ?? []).map((c) => [c.id, c]));
    return (txs ?? []).map((t) => ({
      ...t,
      candidate_name: map.get(t.candidate_id)?.name ?? "—",
      candidate_slug: map.get(t.candidate_id)?.slug ?? "",
    }));
  });

export const listAllCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("id, name, slug, category, is_active, display_order, photo_url")
      .order("display_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(120),
        slug: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9-]+$/, "Slug : minuscules, chiffres et tirets uniquement"),
        category: z.enum(["miss", "master"]),
        bio: z.string().trim().max(2000).optional().nullable(),
        photo_url: z.string().trim().max(500).url().optional().nullable(),
        is_active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin.from("candidates").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("candidates").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setCandidateActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("candidates")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
