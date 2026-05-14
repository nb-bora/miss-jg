import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Webhook générique pour fournisseur de paiement.
 *
 * Configurez votre fournisseur (CamPay, CinetPay, Flutterwave, Stripe…) pour appeler :
 *   POST https://<votre-domaine>/api/public/payments/webhook
 *
 * Sécurité :
 *  - Définissez le secret partagé dans la variable d'environnement PAYMENT_WEBHOOK_SECRET
 *  - Le fournisseur doit signer le payload (HMAC SHA256) et envoyer la signature
 *    dans l'en-tête `x-webhook-signature` (hex).
 *
 * Payload attendu (à adapter à votre fournisseur) :
 *   {
 *     "provider": "campay" | "cinetpay" | "flutterwave" | "stripe" | ...,
 *     "provider_ref": "<référence unique de la transaction côté fournisseur>",
 *     "status": "paid" | "failed",
 *     "internal_ref": "<provider_ref retourné par createVoteIntent>"  // optionnel
 *   }
 */
export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const secret = process.env.PAYMENT_WEBHOOK_SECRET;

        if (secret) {
          const sig = request.headers.get("x-webhook-signature") ?? "";
          const expected = createHmac("sha256", secret).update(body).digest("hex");
          const a = Buffer.from(sig);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const ref = payload.internal_ref ?? payload.provider_ref;
        const status = payload.status;
        if (!ref || !status) return new Response("Missing fields", { status: 400 });

        if (status === "paid") {
          const { error } = await supabaseAdmin
            .from("vote_transactions")
            .update({ payment_status: "paid", paid_at: new Date().toISOString() })
            .eq("provider_ref", ref)
            .eq("payment_status", "pending");
          if (error) return new Response(error.message, { status: 500 });
        } else if (status === "failed") {
          await supabaseAdmin
            .from("vote_transactions")
            .update({ payment_status: "failed" })
            .eq("provider_ref", ref)
            .eq("payment_status", "pending");
        }

        return Response.json({ ok: true });
      },
    },
  },
});
