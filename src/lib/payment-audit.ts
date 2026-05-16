import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export type PaymentEventType =
  | "intent_created"
  | "provider_initiated"
  | "provider_init_failed"
  | "status_poll"
  | "webhook_received"
  | "status_changed"
  | "demo_confirmed";

export type PaymentEventSource = "api" | "webhook" | "poll" | "demo" | "system";

export async function logPaymentEvent(params: {
  transactionId?: string;
  providerRef: string;
  eventType: PaymentEventType;
  source: PaymentEventSource;
  payload?: Record<string, unknown>;
  previousStatus?: string;
  newStatus?: string;
}): Promise<void> {
  try {
    await supabaseAdmin.from("payment_events").insert({
      transaction_id: params.transactionId ?? null,
      provider_ref: params.providerRef,
      event_type: params.eventType,
      source: params.source,
      payload: (params.payload ?? {}) as Json,
      previous_status: params.previousStatus as never,
      new_status: params.newStatus as never,
    });
  } catch (e) {
    console.error("[payment-audit]", params.eventType, params.providerRef, e);
  }
}
