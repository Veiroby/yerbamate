import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { getAgentActorId } from "@/lib/agent-actor";
import { findProductForAgent } from "@/lib/agent-inventory";
import {
  getProductTotalStock,
  setProductQuantityWithLocation,
} from "@/app/admin/products/product-quantity";
import { writeAuditLog } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

type AdjustBody = {
  productId?: string;
  query?: string;
  quantity?: number;
  reason?: string;
};

export async function POST(request: Request) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  let body: AdjustBody;
  try {
    body = (await request.json()) as AdjustBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const quantity = body.quantity;
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }

  const product =
    body.productId
      ? await findProductForAgent(body.productId)
      : body.query
        ? await findProductForAgent(body.query)
        : null;

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const actorId = await getAgentActorId();
  const before = await getProductTotalStock(product.id);
  const qty = Math.max(0, Math.floor(quantity));

  await setProductQuantityWithLocation(
    product.id,
    qty,
    null,
    actorId
      ? {
          actorId,
          reason: body.reason ?? "agent_inventory_adjust",
        }
      : undefined,
  );

  if (actorId) {
    await writeAuditLog(actorId, "inventory.adjusted", "Product", product.id, {
      quantity: qty,
      before,
      via: "agent",
      reason: body.reason ?? null,
    });
  }

  return NextResponse.json({
    success: true,
    product: {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
    },
    before,
    after: qty,
  });
}
