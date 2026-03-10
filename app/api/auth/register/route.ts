import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { getAuthRedirectUrl } from "@/lib/oauth";

export async function POST(request: Request) {
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

