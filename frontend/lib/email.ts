import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  buildInvoiceFilename,
  generateInvoicePdf,
  type InvoiceOrderData,
} from "@/lib/invoice";
import {
  brandedEmailLayout,
  escapeHtml,
  formatMoney,
} from "@/lib/email-layout";
import type { EmailTemplateKey } from "@/lib/email-template-registry";

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_FROM
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const SITE_NAME = process.env.SITE_NAME ?? "Yerba Mate";

function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(variables)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

async function resolveTemplateOverride(options: {
  key: EmailTemplateKey;
  fallbackSubject: string;
  fallbackHtml: string;
  variables?: Record<string, string>;
}) {
  const template = await prisma.emailTemplate.findUnique({
    where: { key: options.key },
    select: { subject: true, html: true },
  });
  if (!template?.html) {
    return {
      subject: applyTemplateVariables(options.fallbackSubject, options.variables ?? {}),
      html: applyTemplateVariables(options.fallbackHtml, options.variables ?? {}),
    };
  }
  return {
    subject: applyTemplateVariables(template.subject || options.fallbackSubject, options.variables ?? {}),
    html: applyTemplateVariables(template.html, options.variables ?? {}),
  };
}

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
  orderId: string;
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
  const resolved = await resolveTemplateOverride({
    key: "order_confirmation",
    fallbackSubject: `Order ${options.orderNumber} confirmed`,
    fallbackHtml: html,
    variables: {
      orderNumber: options.orderNumber,
      total: formatMoney(Number(options.total), options.currency),
      currency: options.currency,
      customerEmail: options.email,
      siteUrl: siteOrigin,
    },
  });

  const invoice = await getOrCreateStoredInvoice({
    orderId: options.orderId,
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
  });

  const NOTIFY_EMAIL = "yerbatealatvia@gmail.com";

  return sendEmail({
    to: Array.from(new Set([options.email, NOTIFY_EMAIL])),
    subject: resolved.subject,
    html: resolved.html,
    attachments: [
      {
        filename: buildInvoiceFilename(invoice.invoiceNumber),
        content: invoice.pdfBase64,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendWireTransferInvoiceEmail(options: {
  orderId: string;
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
  const resolved = await resolveTemplateOverride({
    key: "wire_transfer_invoice",
    fallbackSubject: `Invoice for Order ${options.orderNumber} - Payment Required`,
    fallbackHtml: html,
    variables: {
      orderNumber: options.orderNumber,
      total: formatMoney(Number(options.total), options.currency),
      currency: options.currency,
      customerEmail: options.email,
      siteUrl: siteOrigin,
    },
  });

  const invoice = await getOrCreateStoredInvoice({
    orderId: options.orderId,
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
  });

  return sendEmail({
    to: options.email,
    subject: resolved.subject,
    html: resolved.html,
    attachments: [
      {
        filename: buildInvoiceFilename(invoice.invoiceNumber),
        content: invoice.pdfBase64,
        contentType: "application/pdf",
      },
    ],
  });
}

async function getOrCreateStoredInvoice(
  order: Omit<InvoiceOrderData, "invoiceNumber"> & { orderId: string },
): Promise<{ invoiceNumber: string; pdfBase64: string }> {
  const existing = await prisma.invoice.findUnique({
    where: { orderId: order.orderId },
    select: { invoiceNumber: true, pdfBase64: true },
  });
  if (existing) return existing;

  // `Order.orderNumber` is the source of truth for invoice numbering.
  // Allocation happens only in checkout create endpoints for new orders.
  const invoiceNumber = order.orderNumber;
  const invoicePdf = await generateInvoicePdf({
    ...order,
    invoiceNumber,
  });
  const pdfBase64 = Buffer.from(invoicePdf).toString("base64");

  try {
    const created = await prisma.invoice.create({
      data: {
        orderId: order.orderId,
        invoiceNumber,
        customerEmail: order.email,
        customerName: resolveCustomerName(order.shippingAddress, order.companyName),
        phone: order.phone ?? null,
        pdfBase64,
      },
      select: { invoiceNumber: true, pdfBase64: true },
    });
    return created;
  } catch {
    const raceExisting = await prisma.invoice.findUnique({
      where: { orderId: order.orderId },
      select: { invoiceNumber: true, pdfBase64: true },
    });
    if (raceExisting) return raceExisting;
    throw new Error("Failed to create invoice record");
  }
}

function resolveCustomerName(shippingAddress: unknown, companyName?: string): string | null {
  if (companyName?.trim()) return companyName.trim();
  if (!shippingAddress || typeof shippingAddress !== "object" || Array.isArray(shippingAddress)) {
    return null;
  }
  const name = (shippingAddress as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function renderWireTransferInvoiceHtml(options: {
  orderNumber: string;
  total: string;
  currency: string;
  siteOrigin: string;
}): string {
  const { orderNumber, total, currency, siteOrigin } = options;
  const inner = `
  <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#44403c;">
    Please find your invoice attached. We ship after payment is received.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:12px;background:#fafaf9;border:1px solid #e7e5e4;">
    <tr>
      <td style="padding:18px 20px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.7;color:#44403c;">
        <p style="margin:0 0 8px;font-weight:600;color:#1c1917;">Payment details</p>
        <p style="margin:0;">Bank: Swedbank</p>
        <p style="margin:4px 0 0;">IBAN: LV30HABA0551057129470</p>
        <p style="margin:4px 0 0;">Reference: <span style="font-family:ui-monospace,monospace;">${escapeHtml(orderNumber)}</span></p>
        <p style="margin:12px 0 0;font-weight:600;color:#0d9488;">Amount: ${escapeHtml(formatMoney(Number(total), currency))}</p>
      </td>
    </tr>
  </table>`;

  return brandedEmailLayout({
    siteOrigin,
    previewText: `Invoice ${orderNumber} — payment required`,
    title: `Invoice for order ${orderNumber}`,
    innerHtml: inner,
    showSubscriptionFooter: false,
  });
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
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:14px;color:#44403c;">${escapeHtml(i.product?.name ?? "Item")}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:center;font-size:14px;">${i.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:14px;">${escapeHtml(formatMoney(Number(i.unitPrice.toString()), currency))}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:14px;font-weight:600;">${escapeHtml(formatMoney(Number(i.total.toString()), currency))}</td>
        </tr>`,
    )
    .join("");

  const inner = `
  <p style="margin:0 0 8px;font-size:14px;color:#78716c;">
    Order <strong style="color:#1c1917;font-family:ui-monospace,monospace;">${escapeHtml(orderNumber)}</strong>
  </p>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#44403c;">
    We have received your payment. Your invoice is attached to this message.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:8px;">
    <thead>
      <tr style="border-bottom:2px solid #e7e5e4;">
        <th align="left" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Product</th>
        <th style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Qty</th>
        <th align="right" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Price</th>
        <th align="right" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin:16px 0 0;text-align:right;font-size:16px;font-weight:700;color:#134e4a;">
    Total: ${escapeHtml(formatMoney(Number(total), currency))}
  </p>`;

  return brandedEmailLayout({
    siteOrigin,
    previewText: `Order ${orderNumber} confirmed — thank you`,
    title: "Thanks for your order",
    innerHtml: inner,
    primaryCta: { label: "View store", href: siteOrigin },
    showSubscriptionFooter: false,
  });
}

export function renderAbandonedCartHtml(options: {
  items: { productName: string; quantity: number; lineTotal: string }[];
  cartTotal: string;
  currency: string;
  cartUrl: string;
  siteOrigin: string;
}): string {
  const { items, cartTotal, cartUrl, siteOrigin } = options;
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:14px;">${escapeHtml(i.productName)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:center;">${i.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:14px;">${escapeHtml(i.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const inner = `
  <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#44403c;">
    Your cart still has items waiting. Complete your order whenever you are ready.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px;">
    <thead>
      <tr style="border-bottom:2px solid #e7e5e4;">
        <th align="left" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Product</th>
        <th style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Qty</th>
        <th align="right" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1c1917;">Cart total: ${escapeHtml(cartTotal)}</p>`;

  return brandedEmailLayout({
    siteOrigin,
    previewText: "Your cart is waiting — complete your order",
    title: "You left something behind",
    innerHtml: inner,
    primaryCta: { label: "Complete your order", href: cartUrl },
    showSubscriptionFooter: false,
  });
}

export async function sendAbandonedCartTemplateEmail(options: {
  to: string;
  items: { productName: string; quantity: number; lineTotal: string }[];
  cartTotal: string;
  currency: string;
  cartUrl: string;
  siteOrigin: string;
}): Promise<{ ok: boolean; error?: string }> {
  const fallbackHtml = renderAbandonedCartHtml({
    items: options.items,
    cartTotal: options.cartTotal,
    currency: options.currency,
    cartUrl: options.cartUrl,
    siteOrigin: options.siteOrigin,
  });
  const resolved = await resolveTemplateOverride({
    key: "abandoned_cart",
    fallbackSubject: "You left something in your cart",
    fallbackHtml,
    variables: {
      cartTotal: options.cartTotal,
      currency: options.currency,
      cartUrl: options.cartUrl,
      siteUrl: options.siteOrigin,
    },
  });
  return sendEmail({
    to: options.to,
    subject: resolved.subject,
    html: resolved.html,
  });
}

export async function sendPasswordResetEmail(options: {
  email: string;
  resetUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }

  const siteOrigin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";

  const inner = `
  <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#44403c;">
    We received a request to reset your password. Use the button below to choose a new one.
  </p>
  <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#78716c;">
    This link expires in one hour. If you did not request a reset, you can ignore this email.
  </p>`;

  const fallbackHtml = brandedEmailLayout({
    siteOrigin,
    previewText: "Reset your YerbaTea password",
    title: "Reset your password",
    innerHtml: inner,
    primaryCta: { label: "Choose a new password", href: options.resetUrl },
    showSubscriptionFooter: false,
  });

  const resolved = await resolveTemplateOverride({
    key: "password_reset",
    fallbackSubject: `Reset your ${SITE_NAME} password`,
    fallbackHtml,
    variables: {
      resetUrl: options.resetUrl,
      customerEmail: options.email,
      siteUrl: siteOrigin,
    },
  });

  return sendEmail({
    to: options.email,
    subject: resolved.subject,
    html: resolved.html,
  });
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

  const fallbackHtml = renderReviewRequestHtml({
    customerName: options.customerName,
    productLinks: options.productLinks.map((p) => ({
      name: p.name,
      url: p.url.startsWith("http") ? p.url : `${siteOrigin}${p.url.startsWith("/") ? "" : "/"}${p.url}`,
    })),
    siteOrigin,
  });

  const resolved = await resolveTemplateOverride({
    key: "review_request",
    fallbackSubject: `How was your order? Leave a review (1–5 stars)`,
    fallbackHtml,
    variables: {
      customerName: options.customerName ?? "",
      siteUrl: siteOrigin,
    },
  });

  return sendEmail({
    to: options.email,
    subject: resolved.subject,
    html: resolved.html,
  });
}

export async function sendUnpaidOrderReminderEmail(options: {
  orderNumber: string;
  email: string;
  total: number | string;
  currency: string;
  paymentMethod: "STRIPE" | "WIRE_TRANSFER" | "MAKSEKESKUS";
  siteOriginOverride?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }
  const siteOrigin =
    options.siteOriginOverride ??
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    "http://localhost:3000";

  const paymentHint =
    options.paymentMethod === "WIRE_TRANSFER"
      ? "Please complete the bank transfer using your invoice details."
      : options.paymentMethod === "MAKSEKESKUS"
        ? "Your payment has not been completed yet. You can return to checkout and finish payment."
        : "Your Stripe payment is still pending. You can return to checkout and complete payment.";

  const fallbackHtml = brandedEmailLayout({
    siteOrigin,
    previewText: `Payment reminder for order ${options.orderNumber}`,
    title: "Complete your order payment",
    innerHtml: `
      <p style="margin:0 0 10px;font-size:14px;color:#78716c;">
        Order <strong style="color:#1c1917;font-family:ui-monospace,monospace;">${escapeHtml(options.orderNumber)}</strong>
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#44403c;">
        We noticed this order is still unpaid.
      </p>
      <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1c1917;">
        Total due: ${escapeHtml(formatMoney(Number(options.total), options.currency))}
      </p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#44403c;">
        ${escapeHtml(paymentHint)}
      </p>
    `,
    primaryCta: { label: "Return to store", href: siteOrigin },
    showSubscriptionFooter: false,
  });

  const resolved = await resolveTemplateOverride({
    key: "unpaid_order_reminder",
    fallbackSubject: `Payment reminder for order ${options.orderNumber}`,
    fallbackHtml,
    variables: {
      orderNumber: options.orderNumber,
      total: formatMoney(Number(options.total), options.currency),
      currency: options.currency,
      customerEmail: options.email,
      siteUrl: siteOrigin,
    },
  });

  return sendEmail({
    to: options.email,
    subject: resolved.subject,
    html: resolved.html,
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
        `<li style="margin:8px 0;line-height:1.5;">
          <a href="${escapeHtml(p.url)}" style="color:#0d9488;font-weight:600;text-decoration:none;">${escapeHtml(p.name)}</a>
          <span style="color:#78716c;"> — tap to leave a review (1–5 stars)</span>
        </li>`,
    )
    .join("");

  const inner = `
  <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#44403c;">${greeting}</p>
  <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#44403c;">
    You ordered from us a few days ago. We would love a quick star rating and a few words on the products below.
  </p>
  <ul style="margin:0 0 22px;padding-left:18px;color:#44403c;">
    ${productList}
  </ul>
  <p style="margin:0;font-size:15px;line-height:1.65;color:#44403c;">Thank you for supporting YerbaTea.</p>`;

  return brandedEmailLayout({
    siteOrigin: options.siteOrigin,
    previewText: "How was your order? Leave a quick review",
    title: "How was your order?",
    innerHtml: inner,
    primaryCta: { label: "Back to the shop", href: options.siteOrigin },
    showSubscriptionFooter: false,
  });
}

export { SITE_NAME, FROM, escapeHtml, formatMoney };
