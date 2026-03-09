import { Resend } from "resend";

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_FROM
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const SITE_NAME = process.env.SITE_NAME ?? "Yerba Mate";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] Resend not configured (RESEND_API_KEY / RESEND_FROM)");
    return { ok: false, error: "Email not configured" };
  }
  const to = Array.isArray(options.to) ? options.to : [options.to];
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });
    if (error) {
      console.error("[email] send failed", error);
      return { ok: false, error: String(error) };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send threw", err);
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

/** Add contact to Resend (for Broadcasts). Optional RESEND_SEGMENT_ID to add to a segment. */
export async function addContactToResend(options: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: "Email not configured" };
  try {
    const { error: createErr } = await resend.contacts.create({
      email: options.email,
      firstName: options.firstName,
      lastName: options.lastName,
    });
    if (createErr) {
      console.error("[email] addContact failed", createErr);
      return { ok: false, error: String(createErr) };
    }
    const segmentId = process.env.RESEND_SEGMENT_ID;
    if (segmentId) {
      const { error: segmentErr } = await resend.contacts.segments.add({
        email: options.email,
        segmentId,
      });
      if (segmentErr) {
        console.error("[email] addContactToSegment failed", segmentErr);
        return { ok: false, error: String(segmentErr) };
      }
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] addContact threw", err);
    return { ok: false, error: err instanceof Error ? err.message : "Add contact failed" };
  }
}

type OrderItemForEmail = {
  quantity: number;
  unitPrice: { toString(): string };
  total: { toString(): string };
  product?: { name: string } | null;
};

export function renderOrderConfirmationHtml(options: {
  orderNumber: string;
  email: string;
  total: string;
  currency: string;
  items: OrderItemForEmail[];
  siteOrigin: string;
}): string {
  const { orderNumber, total, currency, items, siteOrigin } = options;
  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.product?.name ?? "Item")}</td><td>${i.quantity}</td><td style="text-align:right">${formatMoney(Number(i.unitPrice.toString()), currency)}</td><td style="text-align:right">${formatMoney(Number(i.total.toString()), currency)}</td></tr>`,
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order ${escapeHtml(orderNumber)}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:1.25rem;margin:0 0 8px">Thanks for your order</h1>
  <p style="color:#71717a;margin:0 0 24px">Order <strong>${escapeHtml(orderNumber)}</strong></p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="border-bottom:1px solid #e4e4e7"><th style="text-align:left">Product</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="font-weight:600;text-align:right;margin:0 0 24px">Total: ${escapeHtml(formatMoney(Number(total), currency))}</p>
  <p style="color:#71717a;font-size:0.875rem"><a href="${escapeHtml(siteOrigin)}" style="color:#059669">Back to store</a></p>
</body>
</html>`;
}

export function renderAbandonedCartHtml(options: {
  items: { productName: string; quantity: number; lineTotal: string }[];
  cartTotal: string;
  currency: string;
  cartUrl: string;
}): string {
  const { items, cartTotal, currency, cartUrl } = options;
  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.productName)}</td><td>${i.quantity}</td><td style="text-align:right">${i.lineTotal}</td></tr>`,
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your cart is waiting</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:1.25rem;margin:0 0 8px">You left something behind</h1>
  <p style="color:#71717a;margin:0 0 24px">Your cart is still waiting. Complete your purchase when you're ready.</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="border-bottom:1px solid #e4e4e7"><th style="text-align:left">Product</th><th>Qty</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="font-weight:600;margin:0 0 24px">Cart total: ${escapeHtml(cartTotal)}</p>
  <p><a href="${escapeHtml(cartUrl)}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600">Complete your order</a></p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
}

export { SITE_NAME, FROM };
