import type { Operator } from "@/lib/payment.utils";

/**
 * Plan de numérotage national Cameroun (ART) — mobile à 9 chiffres, S = 6.
 * @see https://www.itu.int — communications ART Cameroun
 */
export function normalizeCameroonPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00237") && digits.length >= 14) {
    digits = digits.slice(5);
  } else if (digits.startsWith("237") && digits.length >= 12) {
    digits = digits.slice(3);
  }

  // Ancien format 8 chiffres (pré-2014) : 7XXXXXXX → 67XXXXXXX, 9XXXXXXX → 69XXXXXXX
  if (digits.length === 8 && /^[79]/.test(digits)) {
    digits = `6${digits}`;
  }

  return digits;
}

/** MTN : 67x, 650–654. Orange : 69x, 655–659. Nexttel (66) : non pris en charge ici. */
export function detectCameroonMobileOperator(national: string): Operator | null {
  if (!/^6\d{8}$/.test(national)) return null;

  const prefix3 = national.slice(0, 3);

  if (national.startsWith("67")) return "mtn";
  if (prefix3 >= "650" && prefix3 <= "654") return "mtn";

  if (national.startsWith("69")) return "orange";
  if (prefix3 >= "655" && prefix3 <= "659") return "orange";

  return null;
}

export function parseCameroonMobilePhone(raw: string): {
  national: string;
  operator: Operator;
  msisdn: string;
} {
  const national = normalizeCameroonPhone(raw);

  if (!/^6\d{8}$/.test(national)) {
    throw new Error(
      "Numéro Mobile Money invalide. Utilisez 9 chiffres commençant par 6 (ex. 677123456 ou +237 6 77 12 34 56).",
    );
  }

  const operator = detectCameroonMobileOperator(national);
  if (!operator) {
    throw new Error(
      "Ce numéro n'est pas reconnu comme Orange Money (69, 655–659) ou MTN MoMo (67, 650–654).",
    );
  }

  return {
    national,
    operator,
    msisdn: `237${national}`,
  };
}

export function operatorLabel(op: Operator): string {
  return op === "orange" ? "Orange Money" : "MTN MoMo";
}
