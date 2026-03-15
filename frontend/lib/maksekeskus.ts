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
  const url = process.env.MAKSEKESKUS_BASE_URL?.trim();
  if (url) return url.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? BASE_URL_LIVE : BASE_URL_TEST;
}

export type CreateTransactionParams = {
  amount: number; // in major units, e.g. 90.95
  currency: string;
  ip: string;
  return_url: string;
  cancel_url: string;
  notifications_url: string;
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

  const body = {
    amount: amountStr,
    currency: params.currency,
    ip: params.ip,
    return_url: params.return_url,
    cancel_url: params.cancel_url,
    notifications_url: params.notifications_url,
    reference: params.reference,
    merchant_data: params.merchant_data,
    ...(params.customer && { customer: params.customer }),
  };

  const baseUrl = getBaseUrl();
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  try {
    const res = await fetch(`${baseUrl}/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || res.statusText;
      return { ok: false, error: String(msg) };
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
