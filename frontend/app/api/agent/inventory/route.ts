import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { listInventoryForAgent } from "@/lib/agent-inventory";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const lowThreshold = Number.parseInt(url.searchParams.get("low") ?? "3", 10);
  const data = await listInventoryForAgent({
    lowThreshold: Number.isFinite(lowThreshold) ? lowThreshold : 3,
  });

  return NextResponse.json(data);
}
