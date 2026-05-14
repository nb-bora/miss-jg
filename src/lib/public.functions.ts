import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getRanking = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("candidate_stats")
    .select("*")
    .eq("is_active", true)
    .order("total_collected", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: aggRow } = await supabaseAdmin
    .from("vote_transactions")
    .select("amount, vote_count")
    .eq("payment_status", "paid");
  const totals = (aggRow ?? []).reduce(
    (acc, r) => ({
      collected: acc.collected + (r.amount ?? 0),
      votes: acc.votes + (r.vote_count ?? 0),
    }),
    { collected: 0, votes: 0 },
  );

  return {
    ranking: (data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      category: c.category as "miss" | "master",
      photo_url: c.photo_url as string | null,
      total_collected: Number(c.total_collected ?? 0),
      total_votes: Number(c.total_votes ?? 0),
    })),
    totals: {
      collected: totals.collected,
      votes: totals.votes,
      candidates: data?.length ?? 0,
    },
  };
});

export const getCandidate = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { data: c } = await supabaseAdmin
      .from("candidate_stats")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!c) return null;

    const { data: full } = await supabaseAdmin
      .from("candidates")
      .select("bio, gallery, socials, category")
      .eq("id", c.id as string)
      .maybeSingle();

    return {
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      category: c.category as "miss" | "master",
      photo_url: c.photo_url as string | null,
      bio: (full?.bio ?? c.bio ?? null) as string | null,
      gallery: (full?.gallery ?? []) as string[],
      socials: (full?.socials ?? c.socials ?? {}) as Record<string, string>,
      total_collected: Number(c.total_collected ?? 0),
      total_votes: Number(c.total_votes ?? 0),
    };
  });

export const getVotePackages = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("vote_packages")
    .select("id, label, amount, votes, currency")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});
