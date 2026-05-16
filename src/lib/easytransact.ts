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

type MobileOperator = "orange" | "mtn";

type OperatorRecord = {
  id: string;
  name?: string;
  code?: string;
};

let operatorIdsCache: Partial<Record<MobileOperator, string>> | null = null;
let operatorIdsPromise: Promise<Partial<Record<MobileOperator, string>>> | null = null;

function readOperatorsFromJsonEnv(): Partial<Record<MobileOperator, string>> {
  const raw = process.env.EASYTRANSACT_OPERATORS?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<MobileOperator, string>> = {};
    for (const key of ["orange", "mtn"] as const) {
      const v = parsed[key];
      if (typeof v === "string" && v.trim()) out[key] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function readOperatorsFromDedicatedEnv(): Partial<Record<MobileOperator, string>> {
  const orange = process.env.EASYTRANSACT_OPERATOR_ORANGE?.trim();
  const mtn = process.env.EASYTRANSACT_OPERATOR_MTN?.trim();
  return {
    ...(orange ? { orange } : {}),
    ...(mtn ? { mtn } : {}),
  };
}

function recordFromOperatorObject(o: Record<string, unknown>): OperatorRecord | null {
  const id =
    (typeof o.id === "string" && o.id.trim()) ||
    (typeof o.operator_id === "string" && o.operator_id.trim()) ||
    (typeof o.uuid === "string" && o.uuid.trim()) ||
    (typeof o.code === "string" && o.code.trim()) ||
    (typeof o.slug === "string" && o.slug.trim());
  if (!id) return null;
  return {
    id,
    name:
      typeof o.name === "string"
        ? o.name
        : typeof o.label === "string"
          ? o.label
          : typeof o.operator_name === "string"
            ? o.operator_name
            : undefined,
    code: typeof o.code === "string" ? o.code : undefined,
  };
}

function collectOperatorsDeep(raw: unknown, out: OperatorRecord[] = []): OperatorRecord[] {
  if (Array.isArray(raw)) {
    for (const item of raw) collectOperatorsDeep(item, out);
    return out;
  }
  if (typeof raw !== "object" || raw === null) return out;

  const o = raw as Record<string, unknown>;
  const keys = Object.keys(o).join(" ").toLowerCase();
  const looksLikeOperator =
    keys.includes("operator") ||
    ("id" in o && ("name" in o || "code" in o || "label" in o));

  if (looksLikeOperator) {
    const rec = recordFromOperatorObject(o);
    if (rec) out.push(rec);
  }

  for (const value of Object.values(o)) {
    if (typeof value === "object" && value !== null) collectOperatorsDeep(value, out);
  }
  return out;
}

function normalizeOperatorsPayload(raw: unknown): OperatorRecord[] {
  const topList = Array.isArray(raw)
    ? raw
    : typeof raw === "object" && raw !== null
      ? ((raw as Record<string, unknown>).results ??
        (raw as Record<string, unknown>).data ??
        (raw as Record<string, unknown>).operators ??
        (raw as Record<string, unknown>).items ??
        [])
      : [];

  const collected =
    Array.isArray(topList) && topList.length
      ? topList
          .map((item) =>
            typeof item === "object" && item !== null
              ? recordFromOperatorObject(item as Record<string, unknown>)
              : null,
          )
          .filter((x): x is OperatorRecord => x !== null)
      : collectOperatorsDeep(raw);

  const seen = new Set<string>();
  return collected.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function matchOperatorFromApiList(
  list: OperatorRecord[],
  operator: MobileOperator,
): string | undefined {
  const needles =
    operator === "orange"
      ? ["orange", "orange money", "orange cameroon", "orm"]
      : ["mtn", "mtn momo", "mobile money", "momo"];

  const found = list.find((item) => {
    const hay = `${item.id} ${item.name ?? ""} ${item.code ?? ""}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });

  return found?.id;
}

const OPERATOR_API_PATHS = [
  "/api/v1/partner/operators/",
  "/api/v1/operators/",
  "/api/v1/partner/operator/",
  "/api/v1/partner/services/",
  "/api/v1/partner/service/",
] as const;

function mapOperatorsList(list: OperatorRecord[]): Partial<Record<MobileOperator, string>> {
  const mapped: Partial<Record<MobileOperator, string>> = {};
  for (const op of ["orange", "mtn"] as const) {
    const id = matchOperatorFromApiList(list, op);
    if (id) mapped[op] = id;
  }
  return mapped;
}

/** Liste les opérateurs disponibles sur le compte partenaire (pour config prod). */
export async function listPartnerOperators(): Promise<OperatorRecord[]> {
  if (!isEasyTransactConfigured()) {
    throw new Error(
      "EASYTRANSACT_API_URL et EASYTRANSACT_API_TOKEN sont requis. Ajoutez la clé sk_live_… du dashboard Easy Transact dans Vercel.",
    );
  }

  const merged: OperatorRecord[] = [];
  const seen = new Set<string>();

  for (const path of OPERATOR_API_PATHS) {
    try {
      const raw = await easyTransactFetch<unknown>(path);
      for (const item of normalizeOperatorsPayload(raw)) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
    } catch {
      /* endpoint optionnel */
    }
  }

  return merged;
}

async function fetchOperatorsFromApi(): Promise<Partial<Record<MobileOperator, string>>> {
  const list = await listPartnerOperators();
  if (!list.length) return {};

  const mapped = mapOperatorsList(list);
  if (mapped.orange && mapped.mtn) return mapped;

  return mapped;
}

export function clearOperatorIdsCache() {
  operatorIdsCache = null;
  operatorIdsPromise = null;
}

async function loadOperatorIds(): Promise<Partial<Record<MobileOperator, string>>> {
  const merged: Partial<Record<MobileOperator, string>> = {
    ...readOperatorsFromJsonEnv(),
    ...readOperatorsFromDedicatedEnv(),
  };

  if (merged.orange && merged.mtn) return merged;

  const fromApi = await fetchOperatorsFromApi();
  return { ...fromApi, ...merged };
}

async function getOperatorIdMap(): Promise<Partial<Record<MobileOperator, string>>> {
  if (operatorIdsCache?.orange && operatorIdsCache?.mtn) return operatorIdsCache;
  if (!operatorIdsPromise) {
    operatorIdsPromise = loadOperatorIds().then((map) => {
      operatorIdsCache = map;
      return map;
    });
  }
  return operatorIdsPromise;
}

/** @deprecated Préférer resolveOperatorId (async) */
export function getOperatorId(operator: MobileOperator): string {
  const fromEnv = readOperatorsFromDedicatedEnv()[operator] ?? readOperatorsFromJsonEnv()[operator];
  if (fromEnv) return fromEnv;
  throw new Error(
    `Opérateur ${operator} non configuré. Définissez EASYTRANSACT_OPERATOR_${operator === "orange" ? "ORANGE" : "MTN"} (ou EASYTRANSACT_OPERATORS) dans Vercel, ou vérifiez l’accès API aux opérateurs.`,
  );
}

export async function resolveOperatorId(operator: MobileOperator): Promise<string> {
  if (!process.env.EASYTRANSACT_API_TOKEN?.trim()) {
    throw new Error(
      "EASYTRANSACT_API_TOKEN manquant. Dashboard Easy Transact → Clés API → copiez sk_live_… dans Vercel (Environment Variables), puis redéployez.",
    );
  }

  const map = await getOperatorIdMap();
  const id = map[operator];
  if (id) return id;

  let hint = "";
  try {
    const available = await listPartnerOperators();
    if (available.length) {
      hint = ` Opérateurs API : ${available.map((o) => `${o.name ?? o.code ?? "?"}=${o.id}`).join(", ")}.`;
    }
  } catch {
    /* ignore */
  }

  throw new Error(
    `Opérateur ${operator} non configuré. Exécutez « npm run et:operators » (ou ajoutez EASYTRANSACT_OPERATOR_${operator === "orange" ? "ORANGE" : "MTN"} sur Vercel).${hint}`,
  );
}

export function isEasyTransactConfigured(): boolean {
  return Boolean(process.env.EASYTRANSACT_API_URL && process.env.EASYTRANSACT_API_TOKEN);
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
