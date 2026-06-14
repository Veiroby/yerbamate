import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/admin-audit";
import { createDpdShipment, getDpdShipmentLabel, DPD_SENDER_DETAILS } from "@/lib/shipping/dpd";

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  dpdPickupPointId?: string;
  dpdPickupPointName?: string;
};

export type DpdLabelResult =
  | {
      ok: true;
      message: string;
      shipmentId: string | null;
      trackingNumber: string | null;
      labelPdf: string;
    }
  | { ok: false; error: string; status: number };

export function isPlaceholderLabel(labelPdf: string | null | undefined): boolean {
  if (!labelPdf) return false;
  try {
    let sample = labelPdf;
    if (sample.includes("base64,")) {
      sample = sample.split("base64,")[1] || sample;
    }
    sample = sample.replace(/[\s\r\n]/g, "").substring(0, 120);
    const decoded = Buffer.from(sample, "base64").toString("utf-8");
    return decoded.startsWith("DPD SHIPPING LABEL");
  } catch {
    return false;
  }
}

export async function getOrCreateDpdLabelForOrder(
  orderId: string,
  actorId: string | null,
  options?: { refetch?: boolean; force?: boolean },
): Promise<DpdLabelResult> {
  let order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  const cachedIsPlaceholder = isPlaceholderLabel(order.dpdLabelPdf);
  const localShipment = String(order.dpdShipmentId || "").startsWith("LOCAL-");

  // Only discard invalid cached labels — never wipe a real DPD PDF.
  if (cachedIsPlaceholder || localShipment) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        dpdLabelPdf: null,
        dpdLabelCreatedAt: null,
        ...(localShipment || cachedIsPlaceholder
          ? { dpdShipmentId: null, dpdTrackingNumber: null }
          : {}),
      },
    });
    order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!order) {
      return { ok: false, error: "Order not found", status: 404 };
    }
  }

  if (order.dpdLabelPdf && !isPlaceholderLabel(order.dpdLabelPdf)) {
    if (actorId) {
      await writeAuditLog(actorId, "order.dpd_label_viewed", "Order", orderId, {
        cached: true,
        via: "agent",
      });
    }
    return {
      ok: true,
      message: "Label already exists",
      shipmentId: order.dpdShipmentId,
      trackingNumber: order.dpdTrackingNumber,
      labelPdf: order.dpdLabelPdf,
    };
  }

  if (
    order.dpdShipmentId &&
    !order.dpdShipmentId.startsWith("LOCAL-") &&
    (!order.dpdLabelPdf || options?.refetch)
  ) {
    const labelResult = await getDpdShipmentLabel(order.dpdShipmentId);
    if (labelResult.success && labelResult.labelPdf) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          dpdLabelPdf: labelResult.labelPdf,
          dpdLabelCreatedAt: new Date(),
        },
      });
      if (actorId) {
        await writeAuditLog(actorId, "order.dpd_label_fetched", "Order", orderId, {
          via: "agent",
        });
      }
      return {
        ok: true,
        message: "Label fetched from DPD",
        shipmentId: order.dpdShipmentId,
        trackingNumber: order.dpdTrackingNumber,
        labelPdf: labelResult.labelPdf,
      };
    }
    if (options?.refetch) {
      return {
        ok: false,
        error: labelResult.error || "Failed to fetch label from DPD",
        status: 400,
      };
    }
  }

  const shippingAddress = order.shippingAddress as ShippingAddress | null;
  if (!shippingAddress) {
    return { ok: false, error: "Order has no shipping address", status: 400 };
  }

  const totalWeight = order.items.reduce((sum, item) => sum + item.quantity * 0.5, 0);
  const recipientPhone =
    order.phone || shippingAddress.phone || DPD_SENDER_DETAILS.phone;

  const result = await createDpdShipment({
    senderName: DPD_SENDER_DETAILS.name,
    senderStreet: DPD_SENDER_DETAILS.street,
    senderStreetNo: DPD_SENDER_DETAILS.streetNo,
    senderCity: DPD_SENDER_DETAILS.city,
    senderPostalCode: DPD_SENDER_DETAILS.postalCode,
    senderCountry: DPD_SENDER_DETAILS.country,
    senderPhone: DPD_SENDER_DETAILS.phone,
    senderEmail: DPD_SENDER_DETAILS.email,
    recipientName: shippingAddress.name || "Customer",
    recipientStreet: shippingAddress.line1 || "",
    recipientCity: shippingAddress.city || "",
    recipientPostalCode: shippingAddress.postalCode || "",
    recipientCountry: shippingAddress.country || "LV",
    recipientPhone,
    recipientEmail: order.email,
    pudoId: shippingAddress.dpdPickupPointId,
    weight: Math.max(totalWeight, 0.5),
    reference: order.orderNumber,
  });

  if (!result.success) {
    return {
      ok: false,
      error: result.error || "DPD API failed to create shipment",
      status: 400,
    };
  }

  if (!result.labelPdf) {
    return {
      ok: false,
      error: "DPD created shipment but returned no label PDF",
      status: 400,
    };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      dpdShipmentId: result.shipmentId,
      dpdTrackingNumber: result.trackingNumber,
      dpdLabelPdf: result.labelPdf,
      dpdLabelCreatedAt: new Date(),
    },
  });

  if (actorId) {
    await writeAuditLog(actorId, "order.dpd_label_created", "Order", orderId, {
      shipmentId: result.shipmentId,
      via: "agent",
    });
  }

  return {
    ok: true,
    message: "Label created",
    shipmentId: result.shipmentId ?? null,
    trackingNumber: result.trackingNumber ?? null,
    labelPdf: result.labelPdf ?? "",
  };
}
