export const STOREFRONT_CATEGORY_OPTIONS = [
  { slug: "yerba-mate", label: "Yerba Mate" },
  { slug: "mate-gourd", label: "Mate Gourds" },
  { slug: "accessories", label: "Accessories" },
  { slug: "drinks", label: "Drinks" },
] as const;

export function storefrontCategoryChoices<
  T extends { id: string; slug: string },
>(categories: T[]): { id: string; label: string }[] {
  return STOREFRONT_CATEGORY_OPTIONS.flatMap((choice) => {
    const match = categories.find((category) => category.slug === choice.slug);
    return match ? [{ id: match.id, label: choice.label }] : [];
  });
}
