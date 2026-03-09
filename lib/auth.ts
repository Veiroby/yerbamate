import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { OAuthProfile } from "@/lib/oauth";

const SESSION_COOKIE_NAME = "auth_session_id";

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;

  await prisma.session.deleteMany({
    where: { sessionToken: token },
  });

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Find or create User and Account from OAuth profile; link orders by email. Returns user id. */
export async function findOrCreateUserFromOAuth(profile: OAuthProfile): Promise<string> {
  const email = profile.email?.toLowerCase().trim();
  if (!email) throw new Error("OAuth profile has no email");

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    await prisma.order.updateMany({
      where: { email: existingAccount.user.email, userId: null },
      data: { userId: existingAccount.userId },
    });
    return existingAccount.userId;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    });
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: profile.name ?? existingUser.name,
        image: profile.image ?? existingUser.image,
      },
    });
    await prisma.order.updateMany({
      where: { email: existingUser.email, userId: null },
      data: { userId: existingUser.id },
    });
    return existingUser.id;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: profile.name,
      image: profile.image,
      accounts: {
        create: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    },
  });

  await prisma.order.updateMany({
    where: { email: user.email, userId: null },
    data: { userId: user.id },
  });

  return user.id;
}

