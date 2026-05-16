import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { logPaymentEvent, type PaymentEventSource } from "@/lib/payment-audit";

export async function mergeTransactionMetadata(
  providerRef: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { data: tx } = await supabaseAdmin
    .from("vote_transactions")
    .select("metadata")
    .eq("provider_ref", providerRef)
    .maybeSingle();

  const current =
    tx?.metadata && typeof tx.metadata === "object" && !Array.isArray(tx.metadata)
      ? (tx.metadata as Record<string, unknown>)
      : {};

  await supabaseAdmin
    .from("vote_transactions")
    .update({ metadata: { ...current, ...patch } as Json })
    .eq("provider_ref", providerRef);
}

export async function applyPaymentStatus(
  providerRef: string,
  status: "paid" | "failed",
  options?: {
    source?: PaymentEventSource;
    payload?: Record<string, unknown>;
  },
): Promise<{ updated: boolean; candidate_id?: string; transaction_id?: string }> {
  const { data: existing } = await supabaseAdmin
    .from("vote_transactions")
    .select("id, payment_status, candidate_id")
    .eq("provider_ref", providerRef)
    .maybeSingle();

  if (!existing || existing.payment_status !== "pending") {
    return { updated: false, candidate_id: existing?.candidate_id };
  }

  const patch =
    status === "paid"
      ? { payment_status: "paid" as const, paid_at: new Date().toISOString() }
      : { payment_status: "failed" as const };

  const { data: tx, error } = await supabaseAdmin
    .from("vote_transactions")
    .update(patch)
    .eq("provider_ref", providerRef)
    .eq("payment_status", "pending")
    .select("id, candidate_id")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (tx) {
    await logPaymentEvent({
      transactionId: tx.id,
      providerRef,
      eventType: "status_changed",
      source: options?.source ?? "system",
      previousStatus: "pending",
      newStatus: status,
      payload: {
        ...options?.payload,
        confirmed_at: new Date().toISOString(),
      },
    });
    await mergeTransactionMetadata(providerRef, {
      last_status_change: new Date().toISOString(),
      last_status_source: options?.source ?? "system",
    });
  }

  return {
    updated: Boolean(tx),
    candidate_id: tx?.candidate_id,
    transaction_id: tx?.id,
  };
}
