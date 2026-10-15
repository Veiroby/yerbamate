import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

type Address = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dpdPickupPointId?: string;
};

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function adminStatus(status: string): {
  status: string;
  payment_status: string;
  fulfillment_status: string;
} {
  switch (status) {
    case "SHIPPED":
      return { status: "shipped", payment_status: "paid", fulfillment_status: "shipped" };
    case "PAID":
      return { status: "paid", payment_status: "paid", fulfillment_status: "pending" };
    case "PROCESSING":
      return { status: "processing", payment_status: "paid", fulfillment_status: "processing" };
    case "CANCELLED":
      return { status: "cancelled", payment_status: "cancelled", fulfillment_status: "cancelled" };
    case "REFUNDED":
      return { status: "refunded", payment_status: "refunded", fulfillment_status: "cancelled" };
    default:
      return { status: "requires_payment", payment_status: "pending", fulfillment_status: "pending" };
  }
}

function paymentMethod(method: string): string {
  if (method === "STRIPE") return "stripe";
  if (method === "MAKSEKESKUS") return "maksekeskus";
  if (method === "WIRE_TRANSFER") return "wire";
  return method.toLowerCase();
}

function shippingMethod(address: Address | null): string {
  if (address?.dpdPickupPointId) return "DPD parcel machine";
  const line = address?.line1 ?? "";
  if (line.includes("Saņemšana") || line.includes("Local pick-up")) return "Local pickup";
  return "Delivery";
}

/** Copy a website order into the admin orders list. */
export async function syncOrderToAdmin(orderId: string): Promise<void> {
  const config = supabaseConfig();
  if (!config) return;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });
    if (!order) return;

    const address = (order.shippingAddress ?? null) as Address | null;
    const status = adminStatus(order.status);
    const provider = paymentMethod(order.paymentMethod);
    const body = {
      order_number: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.product?.name ?? "Product",
        price: Number(item.unitPrice),
        quantity: item.quantity,
      })),
      subtotal: Number(order.subtotal),
      discount_code: order.discountCode,
      discount_amount: order.discountAmount != null ? Number(order.discountAmount) : 0,
      shipping_cost: Number(order.shippingCost),
      shipping_method: shippingMethod(address),
      shipping_address: address ?? {},
      customer_name: address?.name?.trim() || order.email,
      customer_email: order.email.trim().toLowerCase(),
      customer_phone: order.phone,
      total: Number(order.total),
      currency: order.currency || "EUR",
      ...status,
      payment_method: provider,
      payment_provider: provider,
      locale: "lv",
      created_at: order.createdAt.toISOString(),
      dpd_tracking_number: order.dpdTrackingNumber,
      dpd_shipment_id: order.dpdShipmentId,
      shipped_at: order.status === "SHIPPED" ? order.updatedAt.toISOString() : null,
      paid_at: status.payment_status === "paid" ? order.updatedAt.toISOString() : null,
    };

    const headers = {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
    };
    const lookup = await fetch(
      `${config.url}/rest/v1/orders?order_number=eq.${encodeURIComponent(order.orderNumber)}&select=id`,
      { headers, cache: "no-store" },
    );
    if (!lookup.ok) return;
    const existing = (await lookup.json()) as { id: string }[];
    const current = existing[0];

    const response = current
      ? await fetch(`${config.url}/rest/v1/orders?id=eq.${encodeURIComponent(current.id)}`, {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify(body),
        })
      : await fetch(`${config.url}/rest/v1/orders`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({ ...body, public_access_token: randomUUID() }),
        });

    if (!response.ok) {
      console.error("Admin order sync failed", response.status);
    }
  } catch (error) {
    console.error("Admin order sync failed", error instanceof Error ? error.message : "unknown");
  }
}
