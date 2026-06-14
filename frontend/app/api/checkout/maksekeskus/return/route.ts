import { NextResponse } from "next/server";
import {
  parseMaksekeskusReturnRequest,
  processMaksekeskusReturnPayload,
} from "@/lib/maksekeskus-return";
import { verifyAndCompleteMaksekeskusOrderByNumber } from "@/lib/maksekeskus-order";

export const dynamic = "force-dynamic";

function successRedirect(request: Request, orderNumber: string, locale: string): NextResponse {
  const url = new URL(request.url);
  const prefix = locale === "lv" || locale === "en" ? `/${locale}` : "";
  const target = new URL(`${prefix}/checkout/success`, `${url.protocol}//${url.host}`);
  target.searchParams.set("provider", "maksekeskus");
  target.searchParams.set("orderNumber", orderNumber);
  return NextResponse.redirect(target, { status: 303 });
}

async function handleReturn(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim() ?? "";
  const locale = url.searchParams.get("locale")?.trim() ?? "";

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order number" }, { status: 400 });
  }

  const parsed = await parseMaksekeskusReturnRequest(request);
  if (parsed) {
    await processMaksekeskusReturnPayload(parsed);
  } else {
    await verifyAndCompleteMaksekeskusOrderByNumber(orderNumber);
  }

  return successRedirect(request, orderNumber, locale);
}

export async function GET(request: Request) {
  return handleReturn(request);
}

export async function POST(request: Request) {
  return handleReturn(request);
}
