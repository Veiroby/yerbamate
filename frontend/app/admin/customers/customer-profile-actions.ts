"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

const customerProfileFormSchema = z.object({
  email: z.string().trim().min(1).email(),
  userId: z.string().trim().optional().nullable(),
  internalNotes: z.string().optional().default(""),
  tagsRaw: z.string().optional().default(""),
});

export async function saveCustomerProfileForm(formData: FormData) {
  const user = await requireAdminWrite();
  const parsed = customerProfileFormSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    userId: formData.get("userId")?.toString() ?? null,
    internalNotes: formData.get("internalNotes")?.toString() ?? "",
    tagsRaw: formData.get("tags")?.toString() ?? "",
  });
  if (!parsed.success) return;

  const { email: emailRaw, userId: userIdRaw, internalNotes, tagsRaw } = parsed.data;
  const email = normalizeEmail(emailRaw);
  const userIdClean = userIdRaw && userIdRaw.length > 0 ? userIdRaw : null;
  const tags = tagsRaw
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  await prisma.customerProfile.upsert({
    where: { email },
    create: {
      email,
      userId: userIdClean,
      internalNotes: internalNotes || null,
      tags,
    },
    update: {
      userId: userIdClean,
      internalNotes: internalNotes || null,
      tags,
    },
  });

  await writeAuditLog(user.id, "customer.profile_saved", "CustomerProfile", email, { tagsCount: tags.length });
  revalidatePath("/admin/customers");
  if (userIdClean) revalidatePath(`/admin/customers/user/${userIdClean}`);
  revalidatePath(`/admin/customers/email/${Buffer.from(email, "utf8").toString("base64url")}`);
}
