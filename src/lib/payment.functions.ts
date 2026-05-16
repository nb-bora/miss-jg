import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

/**
 * Crée une transaction PENDING et retourne sa référence.
 * À brancher avec votre API de paiement : remplacer le bloc `// TODO PROVIDER`
 * pour appeler votre endpoint de création de session, puis renvoyer l'URL de redirection.
 *
 * Le passage en `paid` se fait UNIQUEMENT via le webhook (/api/public/payments/webhook),
 * jamais depuis le client.
 */
export const createVoteIntent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        candidate_slug: z.string().min(1).max(100),
        vote_count: z.number().int().min(1).max(10000),
        buyer_name: z.string().trim().min(1).max(120).optional(),
        buyer_contact: z.string().trim().min(3).max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: candidate } = await supabaseAdmin
      .from("candidates")
      .select("id, is_active")
      .eq("slug", data.candidate_slug)
      .maybeSingle();
    if (!candidate || !candidate.is_active) throw new Error("Candidat introuvable");

    const UNIT_PRICE = 100;
    const amount = data.vote_count * UNIT_PRICE;

    const provider = "manual";
    const provider_ref = `mv_${crypto.randomUUID()}`;

    const { data: tx, error } = await supabaseAdmin
      .from("vote_transactions")
      .insert({
        candidate_id: candidate.id,
        package_id: null,
        amount,
        currency: "XAF",
        vote_count: data.vote_count,
        provider,
        provider_ref,
        payment_status: "pending",
        buyer_name: data.buyer_name,
        buyer_contact: data.buyer_contact,
      })
      .select("id, provider_ref, amount, vote_count")
      .single();
    if (error) throw new Error(error.message);

    // TODO PROVIDER: appeler ici votre API de paiement (CamPay, CinetPay, Flutterwave…)
    // const session = await fetch("https://votre-api/checkout", { ... })
    // return { tx_id: tx.id, redirect_url: session.payment_url, ... }

    return {
      tx_id: tx.id,
      provider_ref: tx.provider_ref,
      amount: tx.amount,
      vote_count: tx.vote_count,
      // Pour la démo : URL interne qui simule la confirmation côté serveur via webhook
      redirect_url: `/vote/confirm/${tx.provider_ref}`,
    };
  });

/**
 * DEMO ONLY — déclenche manuellement la confirmation côté serveur.
 * En production, c'est votre webhook (signé) qui appellera la même logique.
 * À retirer dès que votre webhook réel est branché.
 */
export const demoConfirmPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ provider_ref: z.string().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: tx, error } = await supabaseAdmin
      .from("vote_transactions")
      .update({ payment_status: "paid", paid_at: new Date().toISOString() })
      .eq("provider_ref", data.provider_ref)
      .eq("payment_status", "pending")
      .select("id, amount, vote_count, candidate_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tx) throw new Error("Transaction introuvable ou déjà traitée");

    const { data: candidate } = await supabaseAdmin
      .from("candidates")
      .select("name, slug")
      .eq("id", tx.candidate_id)
      .maybeSingle();

    return {
      ok: true,
      amount: tx.amount,
      vote_count: tx.vote_count,
      candidate_name: candidate?.name ?? "",
      candidate_slug: candidate?.slug ?? "",
    };
  });
