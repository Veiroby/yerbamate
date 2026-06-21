import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { listProductsForAgent } from "@/lib/agent-products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  let limit: number | undefined;
  if (limitRaw) {
    const n = parseInt(limitRaw, 10);
    if (!Number.isNaN(n) && n > 0) limit = n;
  }

  const products = await listProductsForAgent({ limit });
  return NextResponse.json({ products });
}
