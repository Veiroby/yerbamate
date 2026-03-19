import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

const SELLER_DETAILS = {
  name: "SIA YerbaTea",
  registrationNumber: "50203504501",
  address: "Ieriku iela 66-112, Riga, LV-1084, Latvia",
  phone: "+37127552577",
  iban: "LV30HABA0551057129470",
  bank: "Swedbank",
} as const;

type InvoiceItem = {
  quantity: number;
  unitPrice: { toString(): string };
  total: { toString(): string };
  product?: { name: string } | null;
};

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

export type InvoiceOrderData = {
  invoiceNumber: string;
  orderNumber: string;
  email: string;
  currency: string;
  createdAt: Date;
  subtotal: { toString(): string };
  shippingCost: { toString(): string };
  tax: { toString(): string };
  total: { toString(): string };
  shippingAddress: unknown;
  items: InvoiceItem[];
  customerType?: "INDIVIDUAL" | "BUSINESS";
  companyName?: string;
  companyAddress?: string;
  vatNumber?: string;
  phone?: string;
};

export function buildInvoiceFilename(invoiceNumber: string): string {
  return `invoice-${invoiceNumber}.pdf`;
}

export async function generateInvoicePdf(
  order: InvoiceOrderData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const regularFontPath = path.join(fontsDir, "NotoSans-Regular.ttf");
  const boldFontPath = path.join(fontsDir, "NotoSans-Bold.ttf");

  let regularFontBytes: Buffer;
  let boldFontBytes: Buffer;

  try {
    regularFontBytes = await readFile(regularFontPath);
    boldFontBytes = await readFile(boldFontPath);
  } catch (err) {
    console.error(
      `[invoice] Failed to load fonts from ${fontsDir}:`,
      err instanceof Error ? err.message : err,
    );
    console.error(`[invoice] process.cwd() = ${process.cwd()}`);
    throw new Error(
      `Font files not found. Expected at: ${regularFontPath} and ${boldFontPath}`,
    );
  }

  const font = await pdf.embedFont(regularFontBytes, { subset: true });
  const boldFont = await pdf.embedFont(boldFontBytes, { subset: true });
  const page = pdf.addPage([595.28, 841.89]); // A4

  const left = 48;
  const right = 547;
  let y = 792;

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    options?: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
    },
  ) => {
    page.drawText(text, {
      x,
      y: yPos,
      size: options?.size ?? 11,
      font: options?.bold ? boldFont : font,
      color: options?.color ?? rgb(0.11, 0.11, 0.12),
    });
  };

  const drawRule = (yPos: number) => {
    page.drawLine({
      start: { x: left, y: yPos },
      end: { x: right, y: yPos },
      thickness: 1,
      color: rgb(0.89, 0.89, 0.91),
    });
  };

  drawText("Invoice", left, y, { size: 22, bold: true });
  y -= 28;
  drawText(`Invoice No.: ${order.invoiceNumber}`, left, y, {
    size: 11,
    bold: true,
  });
  y -= 18;
  drawText(`Order No.: ${order.orderNumber}`, left, y);
  y -= 18;
  drawText(`Issue date: ${formatDate(order.createdAt)}`, left, y);

  drawText(SELLER_DETAILS.name, 330, 792, { size: 12, bold: true });
  drawText(
    `Reg. No. ${SELLER_DETAILS.registrationNumber}`,
    330,
    774,
    { size: 10 },
  );
  drawText(SELLER_DETAILS.address, 330, 758, { size: 10 });
  drawText(`Phone: ${SELLER_DETAILS.phone}`, 330, 742, { size: 10 });
  drawText(`Bank: ${SELLER_DETAILS.bank}`, 330, 726, { size: 10 });
  drawText(`IBAN: ${SELLER_DETAILS.iban}`, 330, 710, { size: 10 });

  y -= 32;
  drawRule(y);
  y -= 22;

  drawText("Bill to", left, y, { size: 12, bold: true });
  const shipping = normalizeShippingAddress(order.shippingAddress);
  const isBusiness = order.customerType === "BUSINESS";
  const buyerLines: string[] = [];

  if (isBusiness && order.companyName) {
    buyerLines.push(order.companyName);
    if (order.companyAddress) buyerLines.push(order.companyAddress);
    if (order.vatNumber) buyerLines.push(`VAT: ${order.vatNumber}`);
  }

  buyerLines.push(
    ...[
      shipping.name || (isBusiness ? undefined : "Customer"),
      order.email,
      order.phone,
      shipping.line1,
      shipping.line2,
      [shipping.postalCode, shipping.city].filter(Boolean).join(" "),
      shipping.country,
    ].filter(Boolean) as string[],
  );

  let buyerY = y - 18;
  for (const line of buyerLines) {
    drawText(line, left, buyerY, { size: 10 });
    buyerY -= 14;
  }

  y = buyerY - 12;
  drawRule(y);
  y -= 20;

  drawText("Item", left, y, { size: 10, bold: true });
  drawText("Qty", 330, y, { size: 10, bold: true });
  drawText("Unit", 400, y, { size: 10, bold: true });
  drawText("Total", 485, y, { size: 10, bold: true });
  y -= 12;
  drawRule(y);
  y -= 18;

  for (const item of order.items) {
    drawText(item.product?.name ?? "Product", left, y, { size: 10 });
    drawText(String(item.quantity), 330, y, { size: 10 });
    drawText(formatMoney(Number(item.unitPrice.toString()), order.currency), 400, y, {
      size: 10,
    });
    drawText(formatMoney(Number(item.total.toString()), order.currency), 485, y, {
      size: 10,
    });
    y -= 18;
  }

  y -= 6;
  drawRule(y);
  y -= 22;

  const totalsX = 370;
  drawText("Subtotal", totalsX, y, { size: 10 });
  drawText(formatMoney(Number(order.subtotal.toString()), order.currency), 485, y, {
    size: 10,
  });
  y -= 16;
  drawText("Shipping", totalsX, y, { size: 10 });
  drawText(
    formatMoney(Number(order.shippingCost.toString()), order.currency),
    485,
    y,
    { size: 10 },
  );
  y -= 16;
  drawText("Tax", totalsX, y, { size: 10 });
  drawText(formatMoney(Number(order.tax.toString()), order.currency), 485, y, {
    size: 10,
  });
  y -= 20;
  drawRule(y);
  y -= 18;
  drawText("Total", totalsX, y, { size: 11, bold: true });
  drawText(formatMoney(Number(order.total.toString()), order.currency), 485, y, {
    size: 11,
    bold: true,
  });

  y -= 40;
  drawText(
    "Thank you for your order. This invoice was generated automatically.",
    left,
    y,
    { size: 10, color: rgb(0.4, 0.4, 0.44) },
  );

  return pdf.save();
}

function normalizeShippingAddress(value: unknown): ShippingAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const address = value as Record<string, unknown>;
  return {
    name: toOptionalString(address.name),
    line1: toOptionalString(address.line1),
    line2: toOptionalString(address.line2),
    city: toOptionalString(address.city),
    postalCode: toOptionalString(address.postalCode),
    country: toOptionalString(address.country),
  };
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

