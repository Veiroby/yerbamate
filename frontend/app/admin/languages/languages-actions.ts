"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";

export async function saveTranslationOverride(
  key: string,
  locale: string,
  value: string,
) {
  const user = await requireAdminWrite();
  if (locale !== "en" && locale !== "lv") return;
  const trimmed = value.trim();
  await prisma.translation.upsert({
    where: {
      key_locale: { key, locale },
    },
    create: { key, locale, value: trimmed },
    update: { value: trimmed },
  });
  revalidatePath("/admin/languages");
}

export async function resetTranslationOverride(key: string, locale: string) {
  if (locale !== "en" && locale !== "lv") return;
  const user = await requireAdminWrite();
  await prisma.translation.deleteMany({
    where: { key, locale },
  });
  await writeAuditLog(user.id, "translation.override_reset", "Translation", `${key}:${locale}`, {
    key,
    locale,
  });
  revalidatePath("/admin/languages");
}
