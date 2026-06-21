import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { getAgentActorId } from "@/lib/agent-actor";
import { getProductForAgent, updateProductForAgent } from "@/lib/agent-products";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const { id } = await params;
  const product = await getProductForAgent(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Parameters<typeof updateProductForAgent>[1] = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.slug === "string") patch.slug = body.slug;
  if (body.descriptionEn === null || typeof body.descriptionEn === "string") {
    patch.descriptionEn = body.descriptionEn;
  }
  if (body.descriptionLv === null || typeof body.descriptionLv === "string") {
    patch.descriptionLv = body.descriptionLv;
  }
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.isBestseller === "boolean") patch.isBestseller = body.isBestseller;
  if (body.bestsellerRank === null || typeof body.bestsellerRank === "number") {
    patch.bestsellerRank = body.bestsellerRank;
  }
  if (typeof body.catalogSortOrder === "number") {
    patch.catalogSortOrder = body.catalogSortOrder;
  }

  const actorId = await getAgentActorId();
  const result = await updateProductForAgent(id, patch, actorId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, product: result.product });
}
