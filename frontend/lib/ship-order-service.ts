import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/admin-audit";
import { getOrCreateDpdLabelForOrder, type DpdLabelResult } from "@/lib/dpd-label-service";
import { isEmailConfigured, sendOrderShippedEmail } from "@/lib/email";

export type ShipOrderResult =
  | (Extract<DpdLabelResult, { ok: true }> & { status: string; alreadyShipped: boolean })
  | DpdLabelResult;

export async function shipOrderWithDpdLabel(
  orderId: string,
  actorId: string | null,
): Promise<ShipOrderResult> {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, shippedEmailSentAt: true },
  });
  if (!existing) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  const labelResult = await getOrCreateDpdLabelForOrder(orderId, actorId);
  if (!labelResult.ok) {
    return labelResult;
  }

  const alreadyShipped = existing.status === "SHIPPED";
  if (!alreadyShipped) {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED", archived: true },
      include: {
        items: { include: { product: true } },
      },
    });

    if (actorId) {
      await writeAuditLog(actorId, "order.status_changed", "Order", orderId, {
        from: existing.status,
        to: "SHIPPED",
        via: "agent",
      });
    }

    if (
      isEmailConfigured() &&
      updated.customerType !== "BUSINESS" &&
      !existing.shippedEmailSentAt
    ) {
      const result = await sendOrderShippedEmail({
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        email: updated.email,
        total: Number(updated.total),
        currency: updated.currency,
        subtotal: updated.subtotal,
        shippingCost: updated.shippingCost,
        tax: updated.tax,
        shippingAddress: updated.shippingAddress,
        items: updated.items,
        dpdTrackingNumber: updated.dpdTrackingNumber,
        companyName: updated.companyName ?? undefined,
      });

      if (result.ok) {
        await prisma.order.update({
          where: { id: updated.id },
          data: { shippedEmailSentAt: new Date() },
        });
      }
    }
  }

  return {
    ...labelResult,
    status: "SHIPPED",
    alreadyShipped,
  };
}
