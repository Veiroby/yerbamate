import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chargedUnitPrice } from "@/lib/product-price";
import { exceedsShelfStock } from "@/lib/shelf-stock";
import { allocateNextInvoiceOrderNumber } from "@/lib/invoice-number";
import { fireTelegramOrderNotify } from "@/lib/telegram-order-notify-fire";
import { syncOrderToAdmin } from "@/lib/sync-admin-order";
import {
  LOCAL_PICKUP_LOCATION,
  LOCAL_PICKUP_METHOD_ID,
} from "@/lib/shipping/local-pickup";
import {
  DPD_PARCEL_MACHINE_METHOD_ID,
  resolveDpdPickupPointById,
} from "@/lib/shipping/dpd";
import { calculateShippingForOrder } from "@/lib/shipping/service";
import { stripe } from "@/lib/stripe";
import {
  createTransaction,
  getRedirectUrl,
  isMaksekeskusConfigured,
} from "@/lib/maksekeskus";
import { makseCustomerLocaleForCountry } from "@/lib/maksekeskus-baltic";

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
  country?: unknown;
  shippingOptionId?: unknown;
  dpdPickupPointId?: unknown;
  dpdPickupPointName?: unknown;
  paymentMethod?: unknown;
  maksekeskusMethodUrl?: unknown;
};

type PaymentChoice = "stripe" | "maksekeskus";

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

function getSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "https://yerbatea.lv";
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

function buildDirectMethodUrl(template: string, transactionId: string): string | null {
  const raw = (template ?? "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    u.searchParams.set("trx", transactionId);
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Telegram Mini App checkout.
 * Reuses store shipping (DPD / local pickup) + Stripe / Maksekeskus / pay-later.
 * Does not modify storefront checkout routes.
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
  const country = (asTrimmedString(body.country) || "LV").toUpperCase();
  const shippingOptionId =
    asTrimmedString(body.shippingOptionId) || LOCAL_PICKUP_METHOD_ID;
  const dpdPickupPointId = asTrimmedString(body.dpdPickupPointId);
  const dpdPickupPointName = asTrimmedString(body.dpdPickupPointName);
  const paymentRaw = asTrimmedString(body.paymentMethod) || "stripe";
  const paymentMethod: PaymentChoice =
    paymentRaw === "maksekeskus" ? "maksekeskus" : "stripe";
  const maksekeskusMethodUrl = asTrimmedString(body.maksekeskusMethodUrl);
  const parsedItems = parseItems(body.items);

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }
  if (!parsedItems) {
    return NextResponse.json({ error: "At least one valid item is required" }, { status: 400 });
  }
  if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    return NextResponse.json(
      { error: "A valid email is required for payment" },
      { status: 400 },
    );
  }

  const isDpd = shippingOptionId === DPD_PARCEL_MACHINE_METHOD_ID;
  const isLocalPickup = shippingOptionId === LOCAL_PICKUP_METHOD_ID;
  if (!isDpd && !isLocalPickup) {
    return NextResponse.json(
      { error: "Choose DPD parcel locker or local pickup" },
      { status: 400 },
    );
  }
  if (isDpd && !dpdPickupPointId) {
    return NextResponse.json({ error: "Please select a DPD parcel locker" }, { status: 400 });
  }

  if (paymentMethod === "stripe" && !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }
  if (
    paymentMethod === "stripe" &&
    !process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }
  if (paymentMethod === "maksekeskus" && !isMaksekeskusConfigured()) {
    return NextResponse.json({ error: "Maksekeskus is not configured" }, { status: 500 });
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

  const subtotal =
    Math.round(
      validated.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100,
    ) / 100;
  const currency = validated[0]?.currency ?? "EUR";
  const email = emailInput;

  const shipping = await calculateShippingForOrder(
    { country },
    null,
    shippingOptionId,
    subtotal,
    "en",
  );
  if (shipping.invalidSelection || !shipping.option) {
    return NextResponse.json({ error: "Invalid shipping option" }, { status: 400 });
  }
  const shippingCost = shipping.amount;
  const tax = 0;
  const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;

  const shippingAddress = isDpd
    ? await (async () => {
        const point = await resolveDpdPickupPointById(country, dpdPickupPointId);
        if (!point) return null;
        return {
          name,
          line1: `${point.name} — ${point.address}`,
          city: point.city,
          postalCode: point.postalCode,
          country: point.country,
          dpdPickupPointId: point.id,
          dpdPickupPointName: dpdPickupPointName || point.name,
          channel: "telegram_miniapp" as const,
          notes: notes || undefined,
        };
      })()
    : {
        name,
        line1: `Local pick-up — ${LOCAL_PICKUP_LOCATION.line1}`,
        city: LOCAL_PICKUP_LOCATION.city,
        postalCode: LOCAL_PICKUP_LOCATION.postalCode,
        country: LOCAL_PICKUP_LOCATION.country,
        channel: "telegram_miniapp" as const,
        notes: notes || undefined,
      };

  if (!shippingAddress) {
    return NextResponse.json({ error: "Invalid DPD pickup point" }, { status: 400 });
  }

  const status = "REQUIRES_PAYMENT";
  const dbPaymentMethod =
    paymentMethod === "maksekeskus" ? "MAKSEKESKUS" : "STRIPE";

  const order = await prisma.order.create({
    data: {
      orderNumber: await allocateNextInvoiceOrderNumber(),
      email,
      status,
      customerType: "INDIVIDUAL",
      paymentMethod: dbPaymentMethod,
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

  const origin = getSiteOrigin(request);

  if (paymentMethod === "stripe") {
    const lineItems = validated.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: { name: item.name },
      },
    }));
    if (shippingCost > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(shippingCost * 100),
          product_data: {
            name: shipping.option?.name ?? "Shipping",
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      metadata: { orderId: order.id },
      success_url: `${origin}/tg/success?orderNumber=${encodeURIComponent(order.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tg/checkout`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create Stripe checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      currency: order.currency,
      payment: "stripe",
      redirectUrl: session.url,
      openExternal: true,
    });
  }

  // Maksekeskus / Makecommerce — redirect out of WebView when possible
  const makseEnabled = process.env.MAKSEKESKUS_ENABLED === "true";
  if (!makseEnabled) {
    return NextResponse.json({ error: "Maksekeskus is disabled" }, { status: 400 });
  }

  const result = await createTransaction({
    amount: total,
    currency,
    ip: getClientIp(request),
    return_url: `${origin}/api/checkout/maksekeskus/return?orderNumber=${encodeURIComponent(order.orderNumber)}&locale=en&channel=tg`,
    cancel_url: `${origin}/tg/checkout`,
    notification_url: `${origin}/api/checkout/maksekeskus/notify`,
    reference: order.orderNumber,
    merchant_data: order.id,
    customer: {
      country,
      locale: makseCustomerLocaleForCountry(country, "en"),
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Payment provider error" },
      { status: 500 },
    );
  }

  const redirectUrl =
    (maksekeskusMethodUrl
      ? buildDirectMethodUrl(maksekeskusMethodUrl, result.transaction.id)
      : null) ?? getRedirectUrl(result.transaction);

  if (!redirectUrl) {
    return NextResponse.json(
      { error: "Invalid response from payment provider" },
      { status: 500 },
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { maksekeskusTransactionId: result.transaction.id },
  });

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    total: Number(order.total),
    currency: order.currency,
    payment: "maksekeskus",
    redirectUrl,
    openExternal: true,
  });
}
