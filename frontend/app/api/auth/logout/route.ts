import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { sameOriginRedirectUrl } from "@/lib/auth-redirect";

export async function POST(request: Request) {
  await destroySession();

  return NextResponse.redirect(sameOriginRedirectUrl(request, "/"), {
    status: 303,
  });
}
