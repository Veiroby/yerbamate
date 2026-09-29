import { prisma } from "@/lib/db";
import type { OrderStatus, Prisma } from "@/app/generated/prisma/client";
import type { AdminSerializedOrder } from "./orders-list";

export type AdminOrderView = "all" | "unpaid" | "open" | "archived";

const UNPAID_STATUSES: OrderStatus[] = ["PENDING", "REQUIRES_PAYMENT"];
const OPEN_STATUSES: OrderStatus[] = ["PAID", "PROCESSING"];

export function parseOrderView(value: string | null | undefined): AdminOrderView {
  if (value === "unpaid" || value === "open" || value === "archived") return value;
  return "all";
}

function viewWhere(view: AdminOrderView): Prisma.OrderWhereInput {
  if (view === "archived") return { archived: true };
  const base = { archived: false };
  if (view === "unpaid") return { ...base, status: { in: UNPAID_STATUSES } };
  if (view === "open") return { ...base, status: { in: OPEN_STATUSES } };
  return base;
}

export async function loadAdminOrders(view: AdminOrderView, q: string) {
  const query = q.trim();
  const where: Prisma.OrderWhereInput = {
    ...viewWhere(view),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, allCount, unpaidCount, openCount, archivedCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.order.count({ where: { archived: false } }),
    prisma.order.count({ where: { archived: false, status: { in: UNPAID_STATUSES } } }),
    prisma.order.count({ where: { archived: false, status: { in: OPEN_STATUSES } } }),
    prisma.order.count({ where: { archived: true } }),
  ]);

  const serialized: AdminSerializedOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    userId: order.userId,
    accountEmail: order.user?.email ?? null,
    accountName: order.user?.name ?? null,
    phone: order.phone,
    companyAddress: order.companyAddress,
    vatNumber: order.vatNumber,
    billingAddress: order.billingAddress,
    sessionId: order.sessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    maksekeskusTransactionId: order.maksekeskusTransactionId,
    status: order.status,
    archived: order.archived,
    createdAt: order.createdAt.toISOString(),
    customerType: order.customerType,
    paymentMethod: order.paymentMethod,
    companyName: order.companyName,
    discountCode: order.discountCode,
    subtotal: Number(order.subtotal),
    discountAmount: order.discountAmount != null ? Number(order.discountAmount) : null,
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shippingAddress: order.shippingAddress as AdminSerializedOrder["shippingAddress"],
    dpdLabelPdf: !!order.dpdLabelPdf,
    dpdTrackingNumber: order.dpdTrackingNumber,
    dpdShipmentId: order.dpdShipmentId,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product?.name ?? "Product",
      quantity: item.quantity,
      total: Number(item.total),
    })),
  }));

  return {
    view,
    query,
    orders: serialized,
    counts: {
      all: allCount,
      unpaid: unpaidCount,
      open: openCount,
      archived: archivedCount,
    },
  };
}
