import { prisma } from "@/lib/db";
import type { Locale } from "./locale";

export type PolicySlug = "privacy" | "terms" | "shipping";

export type PolicyDefaults = {
  title: string;
  content: string;
};

export type PolicyContent = {
  title: string;
  content: string;
  updatedAt?: Date;
};

export async function getPolicyContent(
  slug: PolicySlug,
  locale: Locale,
  defaults: PolicyDefaults,
): Promise<PolicyContent> {
  const existing = await prisma.policy.findUnique({
    where: {
      slug_locale: {
        slug,
        locale,
      },
    },
  });

  if (!existing) {
    return {
      title: defaults.title,
      content: defaults.content,
    };
  }

  return {
    title: existing.title || defaults.title,
    content: existing.content || defaults.content,
    updatedAt: existing.updatedAt,
  };
}

export async function upsertPolicyContent(
  slug: PolicySlug,
  locale: Locale,
  data: PolicyDefaults,
) {
  return prisma.policy.upsert({
    where: {
      slug_locale: {
        slug,
        locale,
      },
    },
    update: {
      title: data.title,
      content: data.content,
    },
    create: {
      slug,
      locale,
      title: data.title,
      content: data.content,
    },
  });
}

