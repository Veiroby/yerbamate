import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { addContactToResend, sendEmail, isEmailConfigured } from "@/lib/email";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function generateDiscountCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function createUniqueDiscountCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateDiscountCode();
    try {
      await prisma.discountCode.create({
        data: {
          code,
          type: "PERCENTAGE",
          value: 10,
          maxUses: 1,
          active: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return code;
    } catch (err: unknown) {
      const isDuplicate = err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002";
      if (!isDuplicate) throw err;
    }
  }
  throw new Error("Failed to generate unique discount code");
}

function sendWelcomeEmail(email: string, discountCode: string): Promise<{ ok: boolean; error?: string }> {
  const siteOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://yerbatea.lv";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to YerbaTea!</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
  <h1 style="font-size: 1.5rem; margin: 0 0 16px; color: #0d9488;">Welcome to YerbaTea!</h1>
  <p style="margin: 0 0 16px; line-height: 1.6;">Thank you for joining our community! As promised, here's your exclusive discount code:</p>
  
  <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #5b7a78;">Your 10% discount code:</p>
    <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; color: #0d9488; letter-spacing: 2px;">${discountCode}</p>
  </div>
  
  <p style="margin: 0 0 16px; line-height: 1.6;">Use this code at checkout to get <strong>10% off</strong> your first order. This code is valid for 30 days and can be used once.</p>
  
  <p style="margin: 24px 0;">
    <a href="${siteOrigin}/products" style="display: inline-block; background: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Shop Now</a>
  </p>
  
  <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
    You'll be the first to know about new products, special offers, and yerba mate tips.<br><br>
    Cheers,<br>
    The YerbaTea Team
  </p>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: "Welcome to YerbaTea! Here's your 10% discount 🎉",
    html,
  });
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

    let discountCode: string | null = null;

    try {
      await prisma.newsletterSubscriber.create({
        data: { email },
      });

      discountCode = await createUniqueDiscountCode();

      if (isEmailConfigured()) {
        await sendWelcomeEmail(email, discountCode);
      }
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
      discountCode,
      discountPercent: 10,
    });
  } catch (err) {
    console.error("[newsletter] subscribe failed", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 },
    );
  }
}
