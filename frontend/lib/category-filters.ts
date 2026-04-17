import type { Prisma } from "@/app/generated/prisma/client";
import { slugify } from "@/lib/slugify";

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

/** LV category "Mate trauciņi" slugifies to `mate-traucii`, not `mate-gourds`. */
const MATE_GOURD_CATEGORY_NAME_VARIANTS = ["Mate Gourds", "Mate trauciņi"];

export function mateGourdsCategoryWhere(): Prisma.CategoryWhereInput {
  const bases = new Set<string>(["mate-gourds"]);
  for (const name of MATE_GOURD_CATEGORY_NAME_VARIANTS) {
    const s = slugify(name);
    if (s) bases.add(s);
  }
  return {
    OR: [...bases].flatMap((base) => [
      { slug: base },
      { slug: { startsWith: `${base}-` } },
    ]),
  };
}
