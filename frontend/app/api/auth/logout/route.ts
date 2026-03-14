import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { getAuthRedirectUrl } from "@/lib/oauth";

export async function POST(request: Request) {
  await destroySession();

  return NextResponse.redirect(getAuthRedirectUrl("/", request), {
    status: 303,
  });
}

