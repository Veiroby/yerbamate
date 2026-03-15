"use client";

import { useTranslation } from "@/lib/translation-context";

const brandLabelKeys = [
  "landing.yerbaMate",
  "landing.mateGourds",
  "landing.bombillas",
  "landing.accessories",
  "landing.blends",
] as const;

export function BrandPartners() {
  const { t } = useTranslation();

  return (
    <section className="bg-black py-8 sm:py-10" aria-label={t("landing.featuredBrands")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {brandLabelKeys.map((key) => (
            <span
              key={key}
              className="text-sm font-medium uppercase tracking-wider text-white"
            >
              {t(key)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
