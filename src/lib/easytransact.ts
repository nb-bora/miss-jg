import { z } from "zod";

/** Statuts officiels Easy Transact Gateway API (OpenAPI TransactionStatusEnum) */
export const EASY_TRANSACT_STATUSES = [
  "INITIATED",
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "SUCCESSFUL",
  "COMPLETED",
  "FAILED",
  "TIMEOUT",
  "REVERSED",
  "REFUNDED",
  "EXPIRED",
  "CANCELLED",
  "CANCELED",
] as const;

const transactionStatusSchema = z.enum([
  "INITIATED",
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "SUCCESSFUL",
  "COMPLETED",
  "FAILED",
  "TIMEOUT",
  "REVERSED",
  "REFUNDED",
  "EXPIRED",
  "CANCELLED",
  "CANCELED",
]);

/** Réponse partenaire (PartnerTransaction) */
export const easyTransactTransactionSchema = z.object({
  vendor_reference: z.string().nullable().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  fees: z.string().nullable().optional(),
  total_amount: z.string().nullable().optional(),
  currency_code: z.string().optional(),
  status: transactionStatusSchema.or(z.string()),
  date: z.string().optional(),
  completed_at: z.string().nullable().optional(),
  sender_number: z.string().nullable().optional(),
  receiver_number: z.string().nullable().optional(),
  operator_id: z.string().nullable().optional(),
  provider_transaction_id: z.string().nullable().optional(),
  service_code: z.string().optional(),
  is_fees_inclusive: z.boolean().optional(),
});

export type EasyTransactTransaction = z.infer<typeof easyTransactTransactionSchema>;

const initiateBodySchema = z.object({
  vendor_reference: z.string().min(1).max(100),
  amount: z.string(),
  currency_code: z.string().max(3).default("XAF"),
  service_code: z.string().max(50),
  description: z.string().max(255),
  sender_number: z.string().max(20),
  operator_id: z.string().min(1),
});

function getConfig() {
  const baseUrl = process.env.EASYTRANSACT_API_URL?.replace(/\/$/, "");
  const token = process.env.EASYTRANSACT_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error(
      "Configuration Easy Transact manquante (EASYTRANSACT_API_URL, EASYTRANSACT_API_TOKEN)",
    );
  }
  return { baseUrl, token };
}

export function getOperatorId(operator: "orange" | "mtn"): string {
  const id =
    operator === "orange"
      ? process.env.EASYTRANSACT_OPERATOR_ORANGE
      : process.env.EASYTRANSACT_OPERATOR_MTN;
  if (!id) {
    throw new Error(
      `Opérateur ${operator} non configuré (EASYTRANSACT_OPERATOR_${operator === "orange" ? "ORANGE" : "MTN"})`,
    );
  }
  return id;
}

export function isEasyTransactConfigured(): boolean {
  return Boolean(
    process.env.EASYTRANSACT_API_URL &&
      process.env.EASYTRANSACT_API_TOKEN &&
      process.env.EASYTRANSACT_OPERATOR_ORANGE &&
      process.env.EASYTRANSACT_OPERATOR_MTN,
  );
}

function parseApiError(json: unknown, status: number, text: string): string {
  if (typeof json === "object" && json !== null) {
    const o = json as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    if (Array.isArray(o.detail)) {
      return o.detail.map((d) => (typeof d === "string" ? d : JSON.stringify(d))).join("; ");
    }
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    const fieldErrors = o.errors;
    if (typeof fieldErrors === "object" && fieldErrors !== null) {
      return Object.entries(fieldErrors as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join("; ");
    }
  }
  return text || `Erreur Easy Transact (${status})`;
}

async function easyTransactFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; searchParams?: Record<string, string> } = {},
): Promise<T> {
  const { baseUrl, token } = getConfig();
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Réponse Easy Transact invalide (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(parseApiError(json, res.status, text));
  }

  return json as T;
}

export type InitiateDepositInput = {
  vendor_reference: string;
  amount: number;
  currency_code?: string;
  service_code?: string;
  description: string;
  sender_number: string;
  operator_id: string;
};

/**
 * POST /api/v1/partner/transactions/initiate/
 * Corps aligné sur TransactionRequest + service_code (OpenAPI Gateway).
 */
export async function initiateDeposit(
  input: InitiateDepositInput,
): Promise<EasyTransactTransaction> {
  const serviceCode = process.env.EASYTRANSACT_SERVICE_CODE ?? "DEPOSIT";
  const body = initiateBodySchema.parse({
    vendor_reference: input.vendor_reference,
    amount: String(Math.round(input.amount)),
    currency_code: input.currency_code ?? "XAF",
    service_code: input.service_code ?? serviceCode,
    description: input.description.slice(0, 255),
    sender_number: input.sender_number.replace(/\s/g, ""),
    operator_id: input.operator_id,
  });

  const raw = await easyTransactFetch<unknown>("/api/v1/partner/transactions/initiate/", {
    method: "POST",
    body,
  });
  return easyTransactTransactionSchema.parse(raw);
}

/**
 * GET /api/v1/partner/transactions/status/?vendor_reference=...
 */
export async function getTransactionStatus(
  vendorReference: string,
): Promise<EasyTransactTransaction> {
  const raw = await easyTransactFetch<unknown>("/api/v1/partner/transactions/status/", {
    searchParams: { vendor_reference: vendorReference },
  });
  return easyTransactTransactionSchema.parse(raw);
}

export type CheckoutLinkInput = {
  vendor_reference: string;
  description: string;
  amount?: number;
  currency_code?: string;
  service_code?: string;
  success_url?: string;
  cancel_url?: string;
  expires_in_minutes?: number;
};

/** POST /api/v1/partner/transactions/checkout-link/ */
export async function createCheckoutLink(input: CheckoutLinkInput): Promise<{ checkout_url?: string }> {
  const serviceCode = process.env.EASYTRANSACT_SERVICE_CODE ?? "DEPOSIT";
  const body: Record<string, unknown> = {
    vendor_reference: input.vendor_reference,
    description: input.description.slice(0, 255),
    currency_code: input.currency_code ?? "XAF",
    service_code: input.service_code ?? serviceCode,
  };
  if (input.amount != null) body.amount = String(Math.round(input.amount));
  if (input.success_url) body.success_url = input.success_url;
  if (input.cancel_url) body.cancel_url = input.cancel_url;
  if (input.expires_in_minutes != null) body.expires_in_minutes = input.expires_in_minutes;

  const raw = await easyTransactFetch<Record<string, unknown>>(
    "/api/v1/partner/transactions/checkout-link/",
    { method: "POST", body },
  );
  return {
    checkout_url:
      (typeof raw.checkout_url === "string" && raw.checkout_url) ||
      (typeof raw.url === "string" && raw.url) ||
      undefined,
  };
}

export function mapEasyTransactStatusToPayment(
  status: string,
): "paid" | "failed" | "pending" | null {
  const s = status.toUpperCase();
  if (["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(s)) return "paid";
  if (["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "REJECTED", "TIMEOUT", "REVERSED", "REFUNDED"].includes(s))
    return "failed";
  if (["INITIATED", "PENDING", "PROCESSING"].includes(s)) return "pending";
  return null;
}

/** Mappe les événements webhook (ex. TRANSACTION_SUCCESS) vers un statut transaction */
export function mapWebhookEventToStatus(payload: Record<string, unknown>): string | undefined {
  const event =
    (payload.event_type as string) ??
    (payload.event as string) ??
    (payload.type as string);

  if (event) {
    const e = event.toUpperCase();
    if (e === "TRANSACTION_SUCCESS") return "SUCCESS";
    if (e === "TRANSACTION_FAILED") return "FAILED";
    if (e === "TRANSACTION_CREATE") return "PENDING";
  }

  return (
    (payload.status as string) ??
    (typeof payload.data === "object" &&
    payload.data !== null &&
    "status" in payload.data
      ? String((payload.data as { status: unknown }).status)
      : undefined)
  );
}
