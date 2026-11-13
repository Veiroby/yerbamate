import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chargedUnitPrice } from "@/lib/product-price";
import { exceedsShelfStock } from "@/lib/shelf-stock";
import { allocateNextInvoiceOrderNumber } from "@/lib/invoice-number";
import { fireTelegramOrderNotify } from "@/lib/telegram-order-notify-fire";
import { syncOrderToAdmin } from "@/lib/sync-admin-order";
import { LOCAL_PICKUP_LOCATION } from "@/lib/shipping/local-pickup";

type TgOrderItemInput = {
  productId?: unknown;
  quantity?: unknown;
};

type TgOrderBody = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  notes?: unknown;
  items?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseItems(raw: unknown): Array<{ productId: string; quantity: number }> | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items: Array<{ productId: string; quantity: number }> = [];
  for (const row of raw as TgOrderItemInput[]) {
    const productId = asTrimmedString(row?.productId);
    const quantity = Number(row?.quantity);
    if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return null;
    }
    items.push({ productId, quantity: Math.floor(quantity) });
  }
  return items.length ? items : null;
}

function syntheticTelegramEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-12) || "unknown";
  return `tg-${digits}@telegram.yerbatea.lv`;
}

/**
 * Telegram Mini App checkout (v1): name + phone → PENDING order.
 * Does not touch Stripe / Maksekeskus / wire-transfer routes.
 */
export async function POST(request: Request) {
  let body: TgOrderBody;
  try {
    body = (await request.json()) as TgOrderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = asTrimmedString(body.name);
  const phone = asTrimmedString(body.phone);
  const notes = asTrimmedString(body.notes);
  const emailInput = asTrimmedString(body.email).toLowerCase();
  const parsedItems = parseItems(body.items);

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }
  if (!parsedItems) {
    return NextResponse.json({ error: "At least one valid item is required" }, { status: 400 });
  }
  if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const productIds = [...new Set(parsedItems.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      active: true,
      archived: false,
      isDraft: false,
    },
    include: {
      variants: { include: { inventoryItems: true } },
    },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products are unavailable" },
      { status: 400 },
    );
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const validated: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    name: string;
    currency: string;
  }> = [];

  for (const item of parsedItems) {
    const product = byId.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }
    if (await exceedsShelfStock(product, item.quantity)) {
      return NextResponse.json(
        { error: `Not enough stock for ${product.name}` },
        { status: 400 },
      );
    }
    validated.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: chargedUnitPrice(product.price, product.bottleDeposit),
      name: product.name,
      currency: product.currency || "EUR",
    });
  }

  const subtotal = validated.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingCost = 0;
  const tax = 0;
  const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;
  const currency = validated[0]?.currency ?? "EUR";
  const email = emailInput || syntheticTelegramEmail(phone);

  const shippingAddress = {
    name,
    line1: `Telegram Mini App — ${LOCAL_PICKUP_LOCATION.line1}`,
    city: LOCAL_PICKUP_LOCATION.city,
    postalCode: LOCAL_PICKUP_LOCATION.postalCode,
    country: LOCAL_PICKUP_LOCATION.country,
    channel: "telegram_miniapp",
    notes: notes || undefined,
  };

  const order = await prisma.order.create({
    data: {
      orderNumber: await allocateNextInvoiceOrderNumber(),
      email,
      status: "PENDING",
      customerType: "INDIVIDUAL",
      // Closest existing “pay later” method; Mini App does not charge card here.
      paymentMethod: "WIRE_TRANSFER",
      phone,
      subtotal,
      shippingCost,
      tax,
      total,
      currency,
      shippingAddress,
      items: {
        create: validated.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Math.round(item.unitPrice * item.quantity * 100) / 100,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  fireTelegramOrderNotify(order, {
    headline: "🛒 New Telegram Mini App order",
  });
  void syncOrderToAdmin(order.id);

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    total: Number(order.total),
    currency: order.currency,
  });
}
