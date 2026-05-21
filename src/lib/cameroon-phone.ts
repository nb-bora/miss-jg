import type { Operator } from "@/lib/payment.utils";

export function normalizeCameroonPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00237") && digits.length >= 14) {
    digits = digits.slice(5);
  } else if (digits.startsWith("237") && digits.length >= 12) {
    digits = digits.slice(3);
  }

  // ancien format 8 chiffres
  if (digits.length === 8 && /^[79]/.test(digits)) {
    digits = `6${digits}`;
  }

  return digits;
}

/**
 * Check si prefix 3 digits est dans un range
 */
function inRange(prefix: string, start: number, end: number): boolean {
  const p = parseInt(prefix, 10);
  return p >= start && p <= end;
}

export function detectCameroonMobileOperator(national: string): Operator | null {
  if (!/^6\d{8}$/.test(national)) return null;

  const p2 = national.slice(0, 2); // ex: 67
  const p3 = national.slice(0, 3); // ex: 650

  const p3num = parseInt(p3, 10);

  // MTN
  if (
    p2 === "67" ||
    inRange(p3, 650, 654) ||
    inRange(p3, 670, 684)
  ) {
    return "mtn";
  }

  // Orange
  if (
    p2 === "69" ||
    inRange(p3, 640, 649) ||
    inRange(p3, 655, 659) ||
    inRange(p3, 685, 699)
  ) {
    return "orange";
  }

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
      "Numéro Mobile Money invalide. Utilisez 9 chiffres commençant par 6 (ex: 677123456 ou +237 6 77 12 34 56)."
    );
  }

  const operator = detectCameroonMobileOperator(national);

  if (!operator) {
    throw new Error(
      "Numéro non reconnu MTN ou Orange selon les plages camerounaises."
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