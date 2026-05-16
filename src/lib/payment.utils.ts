import { z } from "zod";
import {
  detectCameroonMobileOperator,
  normalizeCameroonPhone,
  parseCameroonMobilePhone,
} from "@/lib/cameroon-phone";

export const UNIT_PRICE = 100;

export const operatorSchema = z.enum(["orange", "mtn"]);
export type Operator = z.infer<typeof operatorSchema>;

export {
  detectCameroonMobileOperator,
  normalizeCameroonPhone,
  parseCameroonMobilePhone,
};

export function operatorLabel(op: Operator | undefined) {
  if (!op) return "Inconnu";

  switch (op) {
    case "orange":
      return "Orange Money";
    case "mtn":
      return "MTN Mobile Money";
  }
}
export const phoneSchema = z
  .string()
  .trim()
  .transform((raw) => parseCameroonMobilePhone(raw).national)
  .pipe(z.string().regex(/^6\d{8}$/));

export const createVoteIntentSchema = z
  .object({
    candidate_slug: z.string().min(1).max(100),
    vote_count: z.number().int().min(1).max(10000),
    buyer_name: z.string().trim().min(2).max(120),
    buyer_contact: z.string().trim().min(8).max(24),
    operator: operatorSchema.optional(),
  })
  .transform((data) => {
    const parsed = parseCameroonMobilePhone(data.buyer_contact);
    if (data.operator && data.operator !== parsed.operator) {
      throw new Error(
        `Le numéro correspond à ${parsed.operator === "orange" ? "Orange Money" : "MTN MoMo"}, pas à l'opérateur sélectionné.`,
      );
    }
    return {
      ...data,
      buyer_contact: parsed.national,
      buyer_msisdn: parsed.msisdn,
      operator: operatorSchema.parse(parsed.operator),
    };
  });
