import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { getAgentActorId } from "@/lib/agent-actor";
import { refreshBestsellersFromSales } from "@/lib/agent-products";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const topN = parseInt(url.searchParams.get("top") ?? "12", 10);
  const days = parseInt(url.searchParams.get("days") ?? "90", 10);

  const actorId = await getAgentActorId();
  const result = await refreshBestsellersFromSales(actorId, {
    topN: Number.isFinite(topN) ? topN : 12,
    days: Number.isFinite(days) ? days : 90,
  });

  return NextResponse.json({ success: true, ...result });
}
