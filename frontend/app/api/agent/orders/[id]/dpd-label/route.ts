import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { getAgentActorId } from "@/lib/agent-actor";
import { resolveOrderId } from "@/lib/agent-orders";
import { getOrCreateDpdLabelForOrder } from "@/lib/dpd-label-service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const { id: idOrNumber } = await params;
  const orderId = await resolveOrderId(idOrNumber);
  if (!orderId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      dpdLabelPdf: true,
      dpdShipmentId: true,
      dpdTrackingNumber: true,
      dpdLabelCreatedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    hasLabel: !!order.dpdLabelPdf,
    shipmentId: order.dpdShipmentId,
    trackingNumber: order.dpdTrackingNumber,
    labelPdf: order.dpdLabelPdf,
    createdAt: order.dpdLabelCreatedAt,
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const { id: idOrNumber } = await params;
  const orderId = await resolveOrderId(idOrNumber);
  if (!orderId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const refetch = url.searchParams.get("refetch") === "true";
  const force = url.searchParams.get("force") === "true";
  const actorId = await getAgentActorId();
  const result = await getOrCreateDpdLabelForOrder(orderId, actorId, {
    refetch,
    force,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    shipmentId: result.shipmentId,
    trackingNumber: result.trackingNumber,
    labelPdf: result.labelPdf,
  });
}
