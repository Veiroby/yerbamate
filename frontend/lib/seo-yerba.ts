/** DB category slug for yerba mate leaf products */
export const YERBA_MATE_CATEGORY_SLUG = "yerba-mate";

/** Latvian SEO keyword phrase (user-requested) */
export const LV_YERBA_MATE_TEA = "Yerba Mate tēja";

export function isYerbaMateCategory(slug: string | null | undefined): boolean {
  return slug === YERBA_MATE_CATEGORY_SLUG;
}

/** Image alt: ensure LV keyword for yerba category without awkward duplication */
export function lvYerbaImageAlt(productName: string, existingAlt: string | null | undefined): string {
  const base = (existingAlt ?? productName).trim();
  if (base.toLowerCase().includes("yerba mate tēja")) return base;
  return `${base} – ${LV_YERBA_MATE_TEA}`;
}

export function enYerbaImageAlt(productName: string, existingAlt: string | null | undefined): string {
  const base = (existingAlt ?? productName).trim();
  if (base.toLowerCase().includes("yerba mate tea")) return base;
  return `${base} – Yerba Mate Tea`;
}

/** Listings & carousels: apply yerba keyword to alt when category matches */
export function productListingImageAlt(
  locale: "lv" | "en",
  categorySlug: string | null | undefined,
  productName: string,
  existingAlt: string | null | undefined,
): string {
  if (isYerbaMateCategory(categorySlug)) {
    return locale === "lv"
      ? lvYerbaImageAlt(productName, existingAlt)
      : enYerbaImageAlt(productName, existingAlt);
  }
  return (existingAlt ?? productName).trim();
}

export function productSeoTitle(
  locale: "lv" | "en",
  productName: string,
  categorySlug: string | null | undefined,
): string {
  if (locale === "lv" && isYerbaMateCategory(categorySlug)) {
    return `${productName} – ${LV_YERBA_MATE_TEA} | YerbaTea`;
  }
  if (locale === "en" && isYerbaMateCategory(categorySlug)) {
    return `${productName} – Yerba Mate Tea | YerbaTea`;
  }
  return `${productName} | YerbaTea`;
}

export function productSeoDescription(
  locale: "lv" | "en",
  body: string | null | undefined,
  productName: string,
  categorySlug: string | null | undefined,
  priceLabel?: string,
): string {
  const compact = (body ?? "").replace(/\s+/g, " ").trim();
  const max = 165;

  if (locale === "lv" && isYerbaMateCategory(categorySlug)) {
    const priceBit = priceLabel ? ` ${priceLabel}.` : "";
    if (compact.length > 0) {
      const head = compact.slice(0, 115);
      const ell = compact.length > 115 ? "…" : "";
      const out = `${head}${ell} ${LV_YERBA_MATE_TEA}: ${productName}.${priceBit} Piegāde Latvijā – YerbaTea.`;
      return out.length <= max ? out : out.slice(0, max - 1) + "…";
    }
    const fallback = `${LV_YERBA_MATE_TEA} ${productName} – premium kvalitāte, ātra piegāde Latvijā.${priceBit} YerbaTea.`;
    return fallback.slice(0, max);
  }

  if (locale === "en" && isYerbaMateCategory(categorySlug)) {
    const priceBit = priceLabel ? ` ${priceLabel}.` : "";
    if (compact.length > 0) {
      const head = compact.slice(0, 115);
      const ell = compact.length > 115 ? "…" : "";
      const out = `${head}${ell} Premium yerba mate: ${productName}.${priceBit} Fast EU shipping – YerbaTea.`;
      return out.length <= max ? out : out.slice(0, max - 1) + "…";
    }
    return `Premium yerba mate ${productName}.${priceBit} Shop YerbaTea.`.slice(0, max);
  }

  if (compact.length > 0) return compact.slice(0, max);
  return `${productName} | YerbaTea`.slice(0, max);
}

/** Lead line for product detail body (LV yerba only) */
export function lvYerbaDescriptionLead(
  productName: string,
  existingBody: string | null | undefined,
): string | null {
  const b = (existingBody ?? "").toLowerCase();
  if (b.includes("yerba mate tēja")) return null;
  return `${LV_YERBA_MATE_TEA}: ${productName}.`;
}
