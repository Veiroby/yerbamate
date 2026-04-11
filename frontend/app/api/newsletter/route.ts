import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { addContactToResend, sendEmail, isEmailConfigured } from "@/lib/email";
import { renderNewsletterWelcomeHtml } from "@/lib/email-layout";
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

async function createUniqueDiscountCodeTx(tx: typeof prisma): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateDiscountCode();
    try {
      await tx.discountCode.create({
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
      const isDuplicate =
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";
      if (!isDuplicate) throw err;
    }
  }
  throw new Error("Failed to generate unique discount code");
}

function sendWelcomeEmail(email: string, discountCode: string): Promise<{ ok: boolean; error?: string }> {
  const siteOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://yerbatea.lv";
  const html = renderNewsletterWelcomeHtml({ discountCode, siteOrigin });

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

    let discountCode: string | null = null;

    if (existing) {
      // Already subscribed users may request a fresh code from popup/account flows.
      discountCode = await createUniqueDiscountCode();
    } else {
      try {
        discountCode = await prisma.$transaction(async (tx) => {
          await tx.newsletterSubscriber.create({
            data: { email },
          });
          return createUniqueDiscountCodeTx(tx as typeof prisma);
        });
      } catch (dbErr: unknown) {
        const isDuplicate =
          dbErr &&
          typeof dbErr === "object" &&
          "code" in dbErr &&
          (dbErr as { code?: string }).code === "P2002";
        if (isDuplicate) {
          // Race condition: subscriber was created in parallel; still issue a code.
          discountCode = await createUniqueDiscountCode();
        } else {
          throw dbErr;
        }
      }
    }

    let emailSent = false;
    if (discountCode && isEmailConfigured()) {
      const emailResult = await sendWelcomeEmail(email, discountCode);
      emailSent = emailResult.ok;
      if (!emailResult.ok) {
        console.error("[newsletter] welcome email failed:", emailResult.error);
      }
    }

    try {
      await addContactToResend({ email });
    } catch (e) {
      console.error("[newsletter] Resend threw", e);
    }

    return NextResponse.json({
      ok: true,
      message: existing ? "You're already subscribed. New code generated." : "Thanks for subscribing!",
      discountCode,
      discountPercent: 10,
      emailSent,
    });
  } catch (err) {
    console.error("[newsletter] subscribe failed", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 },
    );
  }
}
