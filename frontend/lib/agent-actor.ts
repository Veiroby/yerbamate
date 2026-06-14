import { prisma } from "@/lib/db";

let cachedActorId: string | null = null;

/** Admin user id used for agent-driven audit log entries. */
export async function getAgentActorId(): Promise<string | null> {
  if (cachedActorId) return cachedActorId;

  const email = process.env.ADMIN_EMAIL?.trim();
  if (!email) return null;

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  if (user) cachedActorId = user.id;
  return user?.id ?? null;
}
