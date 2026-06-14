import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { resolveOrderId, serializeOrderForAgent } from "@/lib/agent-orders";

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
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, barcode: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrderForAgent(order) });
}
