import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addContactToResend } from "@/lib/email";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "newsletter");
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000);
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many subscription attempts. Please try again later." },
      { 
        status: 429, 
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } 
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "You're already subscribed.",
      });
    }

    try {
      await prisma.newsletterSubscriber.create({
        data: { email },
      });
    } catch (dbErr: unknown) {
      const isDuplicate = dbErr && typeof dbErr === "object" && "code" in dbErr && (dbErr as { code?: string }).code === "P2002";
      if (isDuplicate) {
        return NextResponse.json({ ok: true, message: "You're already subscribed." });
      }
      throw dbErr;
    }

    try {
      await addContactToResend({ email });
    } catch (e) {
      console.error("[newsletter] Resend threw", e);
    }

    return NextResponse.json({
      ok: true,
      message: "Thanks for subscribing!",
    });
  } catch (err) {
    console.error("[newsletter] subscribe failed", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 },
    );
  }
}
