import { NextResponse } from "next/server";
import { getAvailableShippingMethods } from "@/lib/shipping/service";
import { DPD_PARCEL_MACHINE_METHOD_ID } from "@/lib/shipping/dpd-constants";
import { LOCAL_PICKUP_METHOD_ID } from "@/lib/shipping/local-pickup";

/**
 * Telegram Mini App shipping options (reuses store shipping service).
 * V1 exposes DPD parcel locker + local pickup only.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = (url.searchParams.get("country") ?? "LV").toUpperCase();
  const localeRaw = url.searchParams.get("locale");
  const locale = localeRaw === "lv" || localeRaw === "en" ? localeRaw : "en";
  const subtotalParam = url.searchParams.get("subtotal");
  const orderSubtotal =
    subtotalParam != null && subtotalParam !== "" ? Number(subtotalParam) : null;

  const methods = await getAvailableShippingMethods(
    { country },
    null,
    Number.isFinite(orderSubtotal as number) ? orderSubtotal : undefined,
    locale,
  );

  const allowed = new Set([DPD_PARCEL_MACHINE_METHOD_ID, LOCAL_PICKUP_METHOD_ID]);
  const filtered = methods.filter((m) => allowed.has(m.id));

  return NextResponse.json({
    methods: filtered,
    country,
  });
}
