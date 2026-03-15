import { Resend } from "resend";
import {
  buildInvoiceFilename,
  generateInvoicePdf,
  type InvoiceOrderData,
} from "@/lib/invoice";

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_FROM
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const SITE_NAME = process.env.SITE_NAME ?? "Yerba Mate";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

type EmailAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
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
      attachments: options.attachments,
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

type BusinessFields = {
  customerType?: "INDIVIDUAL" | "BUSINESS";
  companyName?: string;
  companyAddress?: string;
  vatNumber?: string;
  phone?: string;
};

export async function sendOrderConfirmationEmail(options: {
  orderNumber: string;
  email: string;
  total: number | string;
  currency: string;
  createdAt: Date;
  subtotal: { toString(): string };
  shippingCost: { toString(): string };
  tax: { toString(): string };
  shippingAddress: unknown;
  items: OrderItemForEmail[];
  siteOriginOverride?: string;
} & BusinessFields): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }

  const siteOrigin =
    options.siteOriginOverride ??
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    "http://localhost:3000";

  const html = renderOrderConfirmationHtml({
    orderNumber: options.orderNumber,
    email: options.email,
    total: String(options.total),
    currency: options.currency,
    items: options.items,
    siteOrigin,
  });

  const invoicePdf = await generateInvoicePdf({
    orderNumber: options.orderNumber,
    email: options.email,
    currency: options.currency,
    createdAt: options.createdAt,
    subtotal: options.subtotal,
    shippingCost: options.shippingCost,
    tax: options.tax,
    total: { toString: () => String(options.total) },
    shippingAddress: options.shippingAddress,
    items: options.items,
    customerType: options.customerType,
    companyName: options.companyName,
    companyAddress: options.companyAddress,
    vatNumber: options.vatNumber,
    phone: options.phone,
  } satisfies InvoiceOrderData);

  return sendEmail({
    to: options.email,
    subject: `Order ${options.orderNumber} confirmed`,
    html,
    attachments: [
      {
        filename: buildInvoiceFilename(options.orderNumber),
        content: Buffer.from(invoicePdf).toString("base64"),
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendWireTransferInvoiceEmail(options: {
  orderNumber: string;
  email: string;
  total: number | string;
  currency: string;
  createdAt: Date;
  subtotal: { toString(): string };
  shippingCost: { toString(): string };
  tax: { toString(): string };
  shippingAddress: unknown;
  items: OrderItemForEmail[];
  siteOriginOverride?: string;
} & BusinessFields): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }

  const siteOrigin =
    options.siteOriginOverride ??
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    "http://localhost:3000";

  const html = renderWireTransferInvoiceHtml({
    orderNumber: options.orderNumber,
    total: String(options.total),
    currency: options.currency,
    siteOrigin,
  });

  const invoicePdf = await generateInvoicePdf({
    orderNumber: options.orderNumber,
    email: options.email,
    currency: options.currency,
    createdAt: options.createdAt,
    subtotal: options.subtotal,
    shippingCost: options.shippingCost,
    tax: options.tax,
    total: { toString: () => String(options.total) },
    shippingAddress: options.shippingAddress,
    items: options.items,
    customerType: options.customerType,
    companyName: options.companyName,
    companyAddress: options.companyAddress,
    vatNumber: options.vatNumber,
    phone: options.phone,
  } satisfies InvoiceOrderData);

  return sendEmail({
    to: options.email,
    subject: `Invoice for Order ${options.orderNumber} - Payment Required`,
    html,
    attachments: [
      {
        filename: buildInvoiceFilename(options.orderNumber),
        content: Buffer.from(invoicePdf).toString("base64"),
        contentType: "application/pdf",
      },
    ],
  });
}

function renderWireTransferInvoiceHtml(options: {
  orderNumber: string;
  total: string;
  currency: string;
  siteOrigin: string;
}): string {
  const { orderNumber, total, currency, siteOrigin } = options;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice for Order ${escapeHtml(orderNumber)}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:1.25rem;margin:0 0 8px">Invoice for Order ${escapeHtml(orderNumber)}</h1>
  <p style="margin:0 0 24px;line-height:1.6">Dear customer,</p>
  <p style="margin:0 0 24px;line-height:1.6">Please find invoice attached. We will ship goods after invoice will be paid.</p>
  <p style="margin:0 0 8px;line-height:1.6"><strong>Payment details:</strong></p>
  <p style="margin:0 0 8px;line-height:1.6">Bank: Swedbank</p>
  <p style="margin:0 0 8px;line-height:1.6">IBAN: LV30HABA0551057129470</p>
  <p style="margin:0 0 8px;line-height:1.6">Reference: ${escapeHtml(orderNumber)}</p>
  <p style="margin:0 0 24px;line-height:1.6">Amount: ${escapeHtml(formatMoney(Number(total), currency))}</p>
  <p style="color:#71717a;font-size:0.875rem"><a href="${escapeHtml(siteOrigin)}" style="color:#059669">Back to store</a></p>
</body>
</html>`;
}

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

export async function sendPasswordResetEmail(options: {
  email: string;
  resetUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:1.25rem;margin:0 0 16px">Reset your password</h1>
  <p style="margin:0 0 16px;line-height:1.6">We received a request to reset your password. Click the button below to choose a new password:</p>
  <p style="margin:0 0 24px">
    <a href="${escapeHtml(options.resetUrl)}" style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600">Reset Password</a>
  </p>
  <p style="margin:0 0 16px;line-height:1.6;color:#71717a;font-size:0.875rem">This link will expire in 1 hour.</p>
  <p style="margin:0;line-height:1.6;color:#71717a;font-size:0.875rem">If you didn't request this, you can safely ignore this email.</p>
</body>
</html>`;

  return sendEmail({
    to: options.email,
    subject: `Reset your ${SITE_NAME} password`,
    html,
  });
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

/** Options for the "leave a review" email sent 4 days after order */
export async function sendReviewRequestEmail(options: {
  email: string;
  customerName?: string | null;
  productLinks: { name: string; url: string }[];
  siteOrigin?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }
  if (options.productLinks.length === 0) {
    return { ok: false, error: "No products to review" };
  }

  const siteOrigin =
    options.siteOrigin ??
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    "http://localhost:3000";

  const html = renderReviewRequestHtml({
    customerName: options.customerName,
    productLinks: options.productLinks.map((p) => ({
      name: p.name,
      url: p.url.startsWith("http") ? p.url : `${siteOrigin}${p.url.startsWith("/") ? "" : "/"}${p.url}`,
    })),
    siteOrigin,
  });

  return sendEmail({
    to: options.email,
    subject: `How was your order? Leave a review (1–5 stars)`,
    html,
  });
}

function renderReviewRequestHtml(options: {
  customerName?: string | null;
  productLinks: { name: string; url: string }[];
  siteOrigin: string;
}): string {
  const greeting = options.customerName
    ? `Hi ${escapeHtml(options.customerName)},`
    : "Hi,";
  const productList = options.productLinks
    .map(
      (p) =>
        `<li style="margin:6px 0"><a href="${escapeHtml(p.url)}" style="color:#059669;text-decoration:none">${escapeHtml(p.name)}</a> – leave a review (1–5 stars)</li>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Leave a review</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">
  <h1 style="font-size:1.25rem;margin:0 0 8px">How was your order?</h1>
  <p style="margin:0 0 16px;line-height:1.6">${greeting}</p>
  <p style="margin:0 0 16px;line-height:1.6">You placed an order with us a few days ago. We’d love to hear what you thought – leave a review and choose a star rating (1 to 5) for the products you received.</p>
  <ul style="margin:0 0 24px;padding-left:20px;line-height:1.6">
    ${productList}
  </ul>
  <p style="margin:0 0 16px;line-height:1.6">Thank you for shopping with us!</p>
  <p style="color:#71717a;font-size:0.875rem"><a href="${escapeHtml(options.siteOrigin)}" style="color:#059669">Back to store</a></p>
</body>
</html>`;
}

export { SITE_NAME, FROM };
