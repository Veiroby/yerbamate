import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { getAuthRedirectUrl } from "@/lib/oauth";

export async function POST(request: Request) {
  const formData = await request.formData();

  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

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

  const redirectTo = user.isAdmin ? "/admin" : "/account/orders";
  return NextResponse.redirect(getAuthRedirectUrl(redirectTo, request), {
    status: 303,
  });
}

