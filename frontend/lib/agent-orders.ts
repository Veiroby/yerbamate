import { prisma } from "@/lib/db";
import type { OrderStatus, Prisma } from "@/app/generated/prisma/client";

export async function resolveOrderId(idOrNumber: string): Promise<string | null> {
  const byId = await prisma.order.findUnique({
    where: { id: idOrNumber },
    select: { id: true },
  });
  if (byId) return byId.id;

  const byNumber = await prisma.order.findFirst({
    where: { orderNumber: idOrNumber },
    select: { id: true },
  });
  return byNumber?.id ?? null;
}

export function serializeOrderForAgent(
  order: Prisma.OrderGetPayload<{
    include: {
      items: { include: { product: { select: { id: true; name: true; barcode: true } } } };
    };
  }>,
) {
  const shippingAddress = order.shippingAddress as {
    name?: string;
    city?: string;
    country?: string;
    dpdPickupPointId?: string;
    dpdPickupPointName?: string;
  } | null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    email: order.email,
    phone: order.phone,
    total: Number(order.total),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    archived: order.archived,
    createdAt: order.createdAt.toISOString(),
    hasDpdLabel: !!order.dpdLabelPdf,
    dpdTrackingNumber: order.dpdTrackingNumber,
    dpdShipmentId: order.dpdShipmentId,
    shipping: shippingAddress
      ? {
          name: shippingAddress.name ?? null,
          city: shippingAddress.city ?? null,
          country: shippingAddress.country ?? null,
          dpdPickupPointId: shippingAddress.dpdPickupPointId ?? null,
          dpdPickupPointName: shippingAddress.dpdPickupPointName ?? null,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? "Product",
      barcode: item.product?.barcode ?? null,
      quantity: item.quantity,
      total: Number(item.total),
    })),
  };
}

export async function listOrdersForAgent(options: {
  status?: OrderStatus | OrderStatus[];
  since?: Date;
  limit?: number;
  archived?: boolean;
}) {
  const where: Prisma.OrderWhereInput = {
    archived: options.archived ?? false,
  };

  if (options.status) {
    where.status = Array.isArray(options.status)
      ? { in: options.status }
      : options.status;
  }

  if (options.since) {
    where.createdAt = { gt: options.since };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(options.limit ?? 20, 50),
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, barcode: true } },
        },
      },
    },
  });

  return orders.map(serializeOrderForAgent);
}
