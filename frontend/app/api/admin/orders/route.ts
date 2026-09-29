import { NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { loadAdminOrders, parseOrderView } from "@/app/admin/orders/load-orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await adminApiGuard(false);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const data = await loadAdminOrders(
    parseOrderView(url.searchParams.get("view")),
    url.searchParams.get("q") ?? "",
  );

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
