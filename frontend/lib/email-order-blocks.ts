import { escapeHtml, formatMoney } from "@/lib/email-layout";

export type OrderItemForEmail = {
  quantity: number;
  unitPrice: { toString(): string };
  total: { toString(): string };
  product?: { name: string } | null;
};

export type OrderEmailBlockInput = {
  orderNumber: string;
  email: string;
  total: number | string;
  currency: string;
  subtotal: { toString(): string };
  shippingCost: { toString(): string };
  tax: { toString(): string };
  shippingAddress: unknown;
  items: OrderItemForEmail[];
  siteOrigin: string;
  companyName?: string;
  dpdTrackingNumber?: string | null;
};

export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(variables)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

const UNREPLACED_PLACEHOLDER = /\{\{[a-zA-Z][a-zA-Z0-9_]*\}\}/;

export function hasUnreplacedPlaceholders(html: string): boolean {
  return UNREPLACED_PLACEHOLDER.test(html);
}

export function isFullHtmlDocument(html: string): boolean {
  const trimmed = html.trim().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

export function resolveCustomerName(
  shippingAddress: unknown,
  companyName?: string,
): string {
  if (companyName?.trim()) return companyName.trim();
  if (!shippingAddress || typeof shippingAddress !== "object" || Array.isArray(shippingAddress)) {
    return "";
  }
  const name = (shippingAddress as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name.trim() : "";
}

export function buildDpdTrackingUrl(trackingNumber: string | null | undefined): string {
  if (!trackingNumber?.trim()) return "";
  const parcel = encodeURIComponent(trackingNumber.trim());
  const template =
    process.env.DPD_PUBLIC_TRACKING_URL ??
    "https://www.dpdbaltics.com/lv/m_Shipment_Show?parcelNumber={parcelNumber}";
  return template.replace("{parcelNumber}", parcel);
}

export function renderOrderItemsTableHtml(
  items: OrderItemForEmail[],
  currency: string,
  options?: { showUnitPrice?: boolean },
): string {
  const showUnitPrice = options?.showUnitPrice ?? true;
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:14px;color:#44403c;">${escapeHtml(i.product?.name ?? "Item")}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:center;font-size:14px;">${i.quantity}</td>
          ${
            showUnitPrice
              ? `<td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:14px;">${escapeHtml(formatMoney(Number(i.unitPrice.toString()), currency))}</td>`
              : ""
          }
          <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:14px;font-weight:600;">${escapeHtml(formatMoney(Number(i.total.toString()), currency))}</td>
        </tr>`,
    )
    .join("");

  const unitHeader = showUnitPrice
    ? `<th align="right" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Price</th>`
    : "";

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:8px;">
    <thead>
      <tr style="border-bottom:2px solid #e7e5e4;">
        <th align="left" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Product</th>
        <th style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Qty</th>
        ${unitHeader}
        <th align="right" style="padding:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#78716c;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function renderOrderSummaryHtml(options: {
  subtotal: { toString(): string };
  shippingCost: { toString(): string };
  tax: { toString(): string };
  total: number | string;
  currency: string;
}): string {
  const { currency } = options;
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;font-size:14px;color:#78716c;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;color:#44403c;">${escapeHtml(value)}</td>
    </tr>`;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
    ${row("Subtotal", formatMoney(Number(options.subtotal.toString()), currency))}
    ${row("Shipping", formatMoney(Number(options.shippingCost.toString()), currency))}
    ${row("Tax", formatMoney(Number(options.tax.toString()), currency))}
    <tr>
      <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:#134e4a;">Total</td>
      <td style="padding:10px 0 0;text-align:right;font-size:16px;font-weight:700;color:#134e4a;">${escapeHtml(formatMoney(Number(options.total), currency))}</td>
    </tr>
  </table>`;
}

export function renderOrderDetailsHtml(input: OrderEmailBlockInput): string {
  const itemsTable = renderOrderItemsTableHtml(input.items, input.currency);
  const summary = renderOrderSummaryHtml({
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    tax: input.tax,
    total: input.total,
    currency: input.currency,
  });
  return `${itemsTable}${summary}`;
}

export function renderShippingAddressHtml(shippingAddress: unknown): string {
  if (!shippingAddress || typeof shippingAddress !== "object" || Array.isArray(shippingAddress)) {
    return `<p style="margin:0;font-size:14px;color:#78716c;">—</p>`;
  }
  const addr = shippingAddress as Record<string, unknown>;
  const lines: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) lines.push(v.trim());
  };
  push(addr.name);
  push(addr.line1 ?? addr.address1 ?? addr.street);
  push(addr.line2 ?? addr.address2);
  const cityLine = [addr.city, addr.state, addr.postalCode ?? addr.zip]
    .filter((x) => typeof x === "string" && x.trim())
    .join(", ");
  if (cityLine) lines.push(cityLine);
  push(addr.country);
  push(addr.phone);

  if (lines.length === 0) {
    return `<p style="margin:0;font-size:14px;color:#78716c;">—</p>`;
  }

  return `<p style="margin:0;font-size:14px;line-height:1.65;color:#44403c;">${lines.map((l) => escapeHtml(l)).join("<br>")}</p>`;
}

export function renderTrackingBlockHtml(options: {
  trackingNumber?: string | null;
  trackingUrl?: string;
}): string {
  const number = options.trackingNumber?.trim();
  if (!number) {
    return `<p style="margin:0;font-size:14px;color:#78716c;">Tracking will be available once your parcel is registered with the carrier.</p>`;
  }
  const url = options.trackingUrl?.trim();
  const link = url
    ? `<a href="${escapeHtml(url)}" style="color:#0d9488;font-weight:600;text-decoration:none;">Track your parcel</a>`
    : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4;">
    <tr>
      <td style="padding:16px 18px;font-size:14px;line-height:1.65;color:#44403c;">
        <p style="margin:0 0 6px;font-weight:600;color:#134e4a;">Tracking number</p>
        <p style="margin:0;font-family:ui-monospace,monospace;font-size:15px;color:#1c1917;">${escapeHtml(number)}</p>
        ${link ? `<p style="margin:10px 0 0;">${link}</p>` : ""}
      </td>
    </tr>
  </table>`;
}

export function renderWireTransferPaymentBlockHtml(orderNumber: string, total: string, currency: string): string {
  return `
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
}

export function buildOrderEmailVariables(input: OrderEmailBlockInput): Record<string, string> {
  const trackingNumber = input.dpdTrackingNumber?.trim() ?? "";
  const trackingUrl = buildDpdTrackingUrl(trackingNumber || null);
  const customerName = resolveCustomerName(input.shippingAddress, input.companyName);
  const orderDetails = renderOrderDetailsHtml(input);
  const orderSummary = renderOrderSummaryHtml({
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    tax: input.tax,
    total: input.total,
    currency: input.currency,
  });
  const shippingAddress = renderShippingAddressHtml(input.shippingAddress);
  const trackingBlock = renderTrackingBlockHtml({ trackingNumber, trackingUrl });
  const paymentDetails = renderWireTransferPaymentBlockHtml(
    input.orderNumber,
    String(input.total),
    input.currency,
  );

  return {
    orderNumber: input.orderNumber,
    total: formatMoney(Number(input.total), input.currency),
    currency: input.currency,
    customerEmail: input.email,
    customerName,
    siteUrl: input.siteOrigin,
    orderDetails,
    orderSummary,
    shippingAddress,
    trackingNumber: trackingNumber || "—",
    trackingUrl,
    trackingBlock,
    paymentDetails,
  };
}

/** Sample merge-tag values for admin test emails. */
export function buildSampleOrderEmailVariables(siteOrigin: string, to: string): Record<string, string> {
  const sampleItems: OrderItemForEmail[] = [
    {
      quantity: 2,
      unitPrice: { toString: () => "12.99" },
      total: { toString: () => "25.98" },
      product: { name: "Organic Yerba Mate 500g" },
    },
    {
      quantity: 1,
      unitPrice: { toString: () => "8.50" },
      total: { toString: () => "8.50" },
      product: { name: "Bombilla — stainless steel" },
    },
  ];
  const input: OrderEmailBlockInput = {
    orderNumber: "INV-TEST-1234",
    email: to,
    total: 39.99,
    currency: "EUR",
    subtotal: { toString: () => "34.48" },
    shippingCost: { toString: () => "3.99" },
    tax: { toString: () => "1.52" },
    shippingAddress: {
      name: "Test Customer",
      line1: "Brīvības iela 1",
      city: "Rīga",
      postalCode: "LV-1010",
      country: "Latvia",
    },
    items: sampleItems,
    siteOrigin,
    dpdTrackingNumber: "12345678901",
  };
  return buildOrderEmailVariables(input);
}
