/**
 * Maksekeskus / Makecommerce API client.
 * Docs: https://developer.maksekeskus.ee/
 * - Create transaction: POST /v1/transactions (amount, currency, ip required)
 * - Redirect customer to payment_methods.other[redirect].url
 */

const BASE_URL_TEST = "https://api.test.maksekeskus.ee";
const BASE_URL_LIVE = "https://api.maksekeskus.ee";

export function isMaksekeskusConfigured(): boolean {
  return Boolean(
    process.env.MAKSEKESKUS_SHOP_ID && process.env.MAKSEKESKUS_SECRET_KEY
  );
}

function getBaseUrl(): string {
  const raw = process.env.MAKSEKESKUS_BASE_URL?.trim();
  if (!raw) {
    return process.env.NODE_ENV === "production" ? BASE_URL_LIVE : BASE_URL_TEST;
  }
  const base = raw.replace(/\s+/g, "").replace(/\/+$/, "");
  if (!base) return process.env.NODE_ENV === "production" ? BASE_URL_LIVE : BASE_URL_TEST;
  // Ensure scheme so URL is valid
  if (!/^https?:\/\//i.test(base)) return `https://${base}`;
  return base;
}

function buildTransactionUrl(): string {
  const base = getBaseUrl();
  const path = "/v1/transactions";
  return base.endsWith("/") ? `${base.slice(0, -1)}${path}` : `${base}${path}`;
}

export type CreateTransactionParams = {
  amount: number; // in major units, e.g. 90.95
  currency: string;
  ip: string;
  return_url: string;
  cancel_url: string;
  notification_url: string;
  reference: string;
  merchant_data: string;
  customer?: { country?: string; locale?: string };
};

export type CreateTransactionResponse = {
  id: string;
  payment_methods?: {
    other?: Array<{ name: string; url?: string }>;
  };
};

export async function createTransaction(
  params: CreateTransactionParams
): Promise<{ ok: true; transaction: CreateTransactionResponse } | { ok: false; error: string }> {
  const shopId = process.env.MAKSEKESKUS_SHOP_ID;
  const secretKey = process.env.MAKSEKESKUS_SECRET_KEY;
  if (!shopId || !secretKey) {
    return { ok: false, error: "Maksekeskus is not configured" };
  }

  const amountStr = typeof params.amount === "number"
    ? params.amount.toFixed(2)
    : String(params.amount);

  // MakeCommerce SDKs serialize CreateTransactionRequest(transaction, customer).
  // In practice, some deployments validate `customer` at the top-level, others expect it under `transaction`.
  // To be robust, we include BOTH. (Duplicate customer payload is small and avoids 400 missing customer.)
  const customerPayload = {
    ip: params.ip,
    ...(params.customer ?? {}),
  };
  const body = {
    transaction: {
      amount: amountStr,
      currency: params.currency,
      return_url: params.return_url,
      cancel_url: params.cancel_url,
      notification_url: params.notification_url,
      reference: params.reference,
      merchant_data: params.merchant_data,
      customer: customerPayload,
    },
    customer: customerPayload,
  };

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const transactionUrl = buildTransactionUrl();

  try {
    const res = await fetch(transactionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const d = (data ?? {}) as any;
      const parts: string[] = [];
      const baseMsg =
        (typeof d.message === "string" && d.message) ||
        (typeof d.error === "string" && d.error) ||
        res.statusText ||
        "Maksekeskus request failed";
      parts.push(baseMsg);
      if (d.errors) parts.push(`errors=${JSON.stringify(d.errors)}`);
      if (d.details) parts.push(`details=${JSON.stringify(d.details)}`);
      // Include minimal request shape for debugging (no secrets).
      parts.push(
        `sentKeys=${JSON.stringify(Object.keys(body))}`,
      );
      return { ok: false, error: `Maksekeskus ${res.status}: ${parts.join(" | ")}` };
    }

    const transaction = data as CreateTransactionResponse;
    if (!transaction.id) {
      return { ok: false, error: "Invalid response from Maksekeskus" };
    }

    return { ok: true, transaction };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return { ok: false, error: message };
  }
}

/**
 * Get redirect URL for the customer to complete payment.
 * Use payment_methods.other redirect URL (Makecommerce selection page).
 */
export function getRedirectUrl(transaction: CreateTransactionResponse): string | null {
  const other = transaction.payment_methods?.other;
  if (!Array.isArray(other)) return null;
  const redirect = other.find((o) => o.name === "redirect");
  return redirect?.url ?? null;
}

/**
 * Validate payment_return notification MAC.
 * mac = UPPERCASE(HEX(SHA-512(jsonString + secretKey)))
 */
export async function validatePaymentReturnMac(
  jsonString: string,
  receivedMac: string
): Promise<boolean> {
  const secretKey = process.env.MAKSEKESKUS_SECRET_KEY;
  if (!secretKey) return false;
  const crypto = await import("crypto");
  const hash = crypto
    .createHash("sha512")
    .update(jsonString + secretKey)
    .digest("hex")
    .toUpperCase();
  return hash === receivedMac.toUpperCase();
}
