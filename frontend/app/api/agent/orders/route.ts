import { NextResponse } from "next/server";
import { agentApiGuard } from "@/lib/agent-api-guard";
import { listOrdersForAgent } from "@/lib/agent-orders";
import type { OrderStatus } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<OrderStatus>([
  "PENDING",
  "REQUIRES_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "CANCELLED",
  "REFUNDED",
]);

export async function GET(request: Request) {
  const denied = agentApiGuard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
  const archived = url.searchParams.get("archived") === "true";
  const sinceRaw = url.searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : undefined;

  let status: OrderStatus | OrderStatus[] | undefined;
  const statusParam = url.searchParams.get("status");
  if (statusParam) {
    const parts = statusParam.split(",").map((s) => s.trim().toUpperCase()) as OrderStatus[];
    const valid = parts.filter((s) => VALID_STATUSES.has(s));
    status = valid.length === 1 ? valid[0] : valid.length > 1 ? valid : undefined;
  }

  const orders = await listOrdersForAgent({
    status,
    since: since && !Number.isNaN(since.getTime()) ? since : undefined,
    limit: Number.isFinite(limit) ? limit : 20,
    archived,
  });

  return NextResponse.json({ orders, count: orders.length });
}
