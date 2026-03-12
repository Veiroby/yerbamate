import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { getAuthRedirectUrl } from "@/lib/oauth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain an uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain a lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain a number" };
  }
  return { valid: true };
}

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "register");
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { 
        status: 429, 
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } 
      }
    );
  }

  const formData = await request.formData();

  const email = formData.get("email")?.toString().toLowerCase().trim();
  const name = formData.get("name")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return NextResponse.json(
      { error: passwordCheck.error },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing && existing.passwordHash) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: name || existing?.name,
      passwordHash,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });

  await prisma.order.updateMany({
    where: {
      email: user.email,
      userId: null,
    },
    data: {
      userId: user.id,
    },
  });

  await createSession(user.id);

  return NextResponse.redirect(getAuthRedirectUrl("/account/profile", request), {
    status: 303,
  });
}

