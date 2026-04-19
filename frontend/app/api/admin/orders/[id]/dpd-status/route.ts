import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOrderFromDpdTracking } from "@/lib/dpd-tracking";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      dpdTrackingNumber: true,
      dpdSentAt: true,
      dpdDeliveredAt: true,
      dpdLastStatus: true,
      dpdLastStatusAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.dpdTrackingNumber) {
    return NextResponse.json(
      { error: "Order has no DPD tracking number" },
      { status: 400 },
    );
  }

  await updateOrderFromDpdTracking(order.id);

  const updated = await prisma.order.findUnique({
    where: { id },
    select: {
      dpdSentAt: true,
      dpdDeliveredAt: true,
      dpdLastStatus: true,
      dpdLastStatusAt: true,
    },
  });

  await writeAuditLog(g.user.id, "order.dpd_status_refreshed", "Order", id, {});

  return NextResponse.json({
    ok: true,
    tracking: updated,
  });
}
