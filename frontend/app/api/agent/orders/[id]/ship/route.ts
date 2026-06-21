import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { getAgentActorId } from "@/lib/agent-actor";
import { resolveOrderId } from "@/lib/agent-orders";
import { shipOrderWithDpdLabel } from "@/lib/ship-order-service";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const { id: idOrNumber } = await params;
  const orderId = await resolveOrderId(idOrNumber);
  if (!orderId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const actorId = await getAgentActorId();
  const result = await shipOrderWithDpdLabel(orderId, actorId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    status: "status" in result ? result.status : "SHIPPED",
    alreadyShipped: "alreadyShipped" in result ? result.alreadyShipped : false,
    shipmentId: result.shipmentId,
    trackingNumber: result.trackingNumber,
    labelPdf: result.labelPdf,
  });
}
