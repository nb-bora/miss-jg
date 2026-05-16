import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import {
  getOperatorId,
  getTransactionStatus,
  initiateDeposit,
  isEasyTransactConfigured,
  mapEasyTransactStatusToPayment,
} from "@/lib/easytransact";
import { createVoteIntentSchema, UNIT_PRICE } from "@/lib/payment.utils";
import { applyPaymentStatus, mergeTransactionMetadata } from "@/lib/payment-status";
import { logPaymentEvent } from "@/lib/payment-audit";

export const createVoteIntent = createServerFn({ method: "POST" })
  .inputValidator((d) => createVoteIntentSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: candidate } = await supabaseAdmin
      .from("candidates")
      .select("id, name, is_active")
      .eq("slug", data.candidate_slug)
      .maybeSingle();
    if (!candidate || !candidate.is_active) throw new Error("Candidat introuvable");

    const amount = data.vote_count * UNIT_PRICE;
    const provider_ref = `mv_${crypto.randomUUID()}`;
    const description = `Vote ${data.vote_count}x pour ${candidate.name}`;
    const useDemo = !isEasyTransactConfigured() && process.env.DEMO_MODE === "true";
    const provider = useDemo ? "demo" : "easytransact";
    const operator_id = useDemo ? `demo_${data.operator}` : getOperatorId(data.operator);

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
        operator: data.operator,
        metadata: {
          operator: data.operator,
          operator_id,
          buyer_msisdn: data.buyer_msisdn,
          initiated_at: new Date().toISOString(),
          candidate_slug: data.candidate_slug,
          candidate_name: candidate.name,
        },
      })
      .select("id, provider_ref, amount, vote_count")
      .single();
    if (error) throw new Error(error.message);

    await logPaymentEvent({
      transactionId: tx.id,
      providerRef: provider_ref,
      eventType: "intent_created",
      source: useDemo ? "demo" : "api",
      newStatus: "pending",
      payload: {
        amount,
        vote_count: data.vote_count,
        operator: data.operator,
        buyer_contact: data.buyer_contact,
      },
    });

    if (useDemo) {
      return {
        tx_id: tx.id,
        provider_ref: tx.provider_ref,
        amount: tx.amount,
        vote_count: tx.vote_count,
        redirect_url: `/vote/attente/${tx.provider_ref}`,
        demo_mode: true,
      };
    }

    if (!isEasyTransactConfigured()) {
      await supabaseAdmin.from("vote_transactions").update({ payment_status: "failed" }).eq("id", tx.id);
      throw new Error(
        "Paiement non configuré. Contactez l'organisateur ou activez DEMO_MODE=true en développement.",
      );
    }

    let etResponse;
    try {
      etResponse = await initiateDeposit({
        vendor_reference: provider_ref,
        amount,
        description,
        sender_number: data.buyer_msisdn,
        operator_id,
      });
      await logPaymentEvent({
        transactionId: tx.id,
        providerRef: provider_ref,
        eventType: "provider_initiated",
        source: "api",
        payload: { status: etResponse.status, provider_transaction_id: etResponse.provider_transaction_id },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec d'initiation du paiement";
      await supabaseAdmin.from("vote_transactions").update({ payment_status: "failed" }).eq("id", tx.id);
      await logPaymentEvent({
        transactionId: tx.id,
        providerRef: provider_ref,
        eventType: "provider_init_failed",
        source: "api",
        newStatus: "failed",
        payload: { error: message },
      });
      throw new Error(message);
    }

    await mergeTransactionMetadata(provider_ref, {
      easytransact_status: etResponse.status,
      provider_transaction_id: etResponse.provider_transaction_id ?? null,
      easytransact_initiated_at: new Date().toISOString(),
    });

    return {
      tx_id: tx.id,
      provider_ref: tx.provider_ref,
      amount: tx.amount,
      vote_count: tx.vote_count,
      redirect_url: `/vote/attente/${tx.provider_ref}`,
    };
  });

export const pollPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ provider_ref: z.string().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: tx } = await supabaseAdmin
      .from("vote_transactions")
      .select(
        "id, provider_ref, payment_status, amount, vote_count, candidate_id, provider, metadata, operator",
      )
      .eq("provider_ref", data.provider_ref)
      .maybeSingle();

    if (!tx) throw new Error("Transaction introuvable");

    const { data: candidate } = await supabaseAdmin
      .from("candidates")
      .select("name, slug")
      .eq("id", tx.candidate_id)
      .maybeSingle();

    const base = {
      provider_ref: tx.provider_ref,
      payment_status: tx.payment_status,
      amount: tx.amount,
      vote_count: tx.vote_count,
      candidate_name: candidate?.name ?? "",
      candidate_slug: candidate?.slug ?? "",
      operator: tx.operator ?? null,
      provider: tx.provider,
    };

    if (tx.payment_status !== "pending") return base;

    if (tx.provider === "demo" && process.env.DEMO_MODE === "true") return base;

    if (tx.provider === "easytransact" && isEasyTransactConfigured()) {
      try {
        const remote = await getTransactionStatus(tx.provider_ref);
        await logPaymentEvent({
          transactionId: tx.id,
          providerRef: tx.provider_ref,
          eventType: "status_poll",
          source: "poll",
          payload: { remote_status: remote.status },
        });
        const mapped = mapEasyTransactStatusToPayment(remote.status);
        if (mapped === "paid" || mapped === "failed") {
          await applyPaymentStatus(tx.provider_ref, mapped, {
            source: "poll",
            payload: { remote_status: remote.status },
          });
          return { ...base, payment_status: mapped };
        }
      } catch {
        /* API indisponible — on garde pending */
      }
    }

    return base;
  });

export const demoConfirmPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ provider_ref: z.string().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    if (process.env.DEMO_MODE !== "true") throw new Error("Mode démo désactivé");

    const { updated, transaction_id } = await applyPaymentStatus(data.provider_ref, "paid", {
      source: "demo",
    });
    if (!updated) throw new Error("Transaction introuvable ou déjà traitée");

    await logPaymentEvent({
      transactionId: transaction_id,
      providerRef: data.provider_ref,
      eventType: "demo_confirmed",
      source: "demo",
      newStatus: "paid",
    });

    const { data: tx } = await supabaseAdmin
      .from("vote_transactions")
      .select("amount, vote_count, candidate_id")
      .eq("provider_ref", data.provider_ref)
      .single();

    const { data: candidate } = await supabaseAdmin
      .from("candidates")
      .select("name, slug")
      .eq("id", tx!.candidate_id)
      .maybeSingle();

    return {
      ok: true,
      amount: tx!.amount,
      vote_count: tx!.vote_count,
      candidate_name: candidate?.name ?? "",
      candidate_slug: candidate?.slug ?? "",
    };
  });

export const getTransactionAudit = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ provider_ref: z.string().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: events } = await supabaseAdmin
      .from("payment_events")
      .select("event_type, source, previous_status, new_status, payload, created_at")
      .eq("provider_ref", data.provider_ref)
      .order("created_at", { ascending: true });
    return events ?? [];
  });
