import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { applyPaymentStatus } from "@/lib/payment-status";
import { mapEasyTransactStatusToPayment, mapWebhookEventToStatus } from "@/lib/easytransact";
import { logPaymentEvent } from "@/lib/payment-audit";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function verifySignature(body: string, secret: string, sig: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractWebhookPayload(payload: Record<string, unknown>) {
  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : null;

  const ref =
    (payload.vendor_reference as string) ??
    (payload.internal_ref as string) ??
    (payload.provider_ref as string) ??
    (data?.vendor_reference != null ? String(data.vendor_reference) : undefined) ??
    (data?.reference != null ? String(data.reference) : undefined);

  const rawStatus =
    mapWebhookEventToStatus(payload) ??
    (payload.status as string) ??
    (data?.status != null ? String(data.status) : undefined);

  return { ref, rawStatus };
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const secret = process.env.PAYMENT_WEBHOOK_SECRET;
        const isProd = process.env.NODE_ENV === "production";

        if (isProd && !secret) {
          return new Response("Webhook secret not configured", { status: 503 });
        }

        if (secret) {
          const sig = request.headers.get("x-webhook-signature") ?? "";
          if (!verifySignature(body, secret, sig)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(body) as Record<string, unknown>;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const { ref, rawStatus } = extractWebhookPayload(payload);
        if (!ref || !rawStatus) {
          return new Response("Missing fields", { status: 400 });
        }

        const { data: tx } = await supabaseAdmin
          .from("vote_transactions")
          .select("id")
          .eq("provider_ref", ref)
          .maybeSingle();

        await logPaymentEvent({
          transactionId: tx?.id,
          providerRef: ref,
          eventType: "webhook_received",
          source: "webhook",
          payload: { raw_status: rawStatus, body: payload },
        });

        const mapped =
          mapEasyTransactStatusToPayment(rawStatus) ??
          (rawStatus === "paid" ? "paid" : rawStatus === "failed" ? "failed" : null);

        if (!mapped || mapped === "pending") {
          return Response.json({ ok: true, ignored: true });
        }

        try {
          const { updated } = await applyPaymentStatus(ref, mapped, {
            source: "webhook",
            payload: { raw_status: rawStatus },
          });
          return Response.json({ ok: true, updated });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
