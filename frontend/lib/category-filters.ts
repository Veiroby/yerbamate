import type { Prisma } from "@/app/generated/prisma/client";

/**
 * Category filter for storefront category pages.
 * When an admin adds a category whose slug already exists, the app appends
 * `-${Date.now().toString(36)}` (see admin products page). Those products must
 * still appear on the canonical route (e.g. /mate-gourds).
 */
export function categorySlugIncludingAdminDuplicates(
  baseSlug: string,
): Prisma.CategoryWhereInput {
  return {
    OR: [{ slug: baseSlug }, { slug: { startsWith: `${baseSlug}-` } }],
  };
}
