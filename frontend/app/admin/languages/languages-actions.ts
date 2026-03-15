"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function saveTranslationOverride(
  key: string,
  locale: string,
  value: string,
) {
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
  await prisma.translation.deleteMany({
    where: { key, locale },
  });
  revalidatePath("/admin/languages");
}
