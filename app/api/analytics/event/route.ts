import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordEvent } from "@/lib/analytics";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "view_item",
  "view_cart",
  "add_to_cart",
  "begin_checkout",
  "purchase",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventName = typeof body.eventName === "string" ? body.eventName : "";
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json(
        { error: "Invalid or missing eventName" },
        { status: 400 },
      );
    }
    const payload =
      body.payload && typeof body.payload === "object" ? body.payload : undefined;
    const sessionId = (await cookies()).get("cart_session_id")?.value ?? null;
    const user = await getCurrentUser();
    await recordEvent(eventName, {
      sessionId,
      userId: user?.id ?? null,
      payload: payload ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[analytics] POST /api/analytics/event", err);
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 },
    );
  }
}
