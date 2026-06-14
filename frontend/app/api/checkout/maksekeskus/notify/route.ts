import { NextResponse } from "next/server";
import {
  parseMaksekeskusReturnRequest,
  processMaksekeskusReturnPayload,
} from "@/lib/maksekeskus-return";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await parseMaksekeskusReturnRequest(request);
  if (!parsed) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  await processMaksekeskusReturnPayload(parsed);
  return NextResponse.json({ received: true }, { status: 200 });
}
