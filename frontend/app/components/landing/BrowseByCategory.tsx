"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";

const categories: { path: string; labelKey: string }[] = [
  { path: "products?category=yerba-mate", labelKey: "landing.yerbaMate" },
  { path: "products?category=mate-gourds", labelKey: "landing.mateGourds" },
  { path: "products", labelKey: "landing.blends" },
  { path: "products", labelKey: "landing.accessories" },
];

export function BrowseByCategory({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const prefix = `/${locale}/`;
  return (
    <section className="bg-white px-3 py-12 sm:px-4 sm:py-16" aria-labelledby="browse-heading">
      <div className="mx-auto w-full max-w-6xl max-lg:max-w-none">
        <h2
          id="browse-heading"
          className="mb-8 text-center text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl"
        >
          {t("landing.browseByCategory")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ path, labelKey }) => (
            <Link
              key={labelKey}
              href={prefix + path}
              className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/5] flex items-end p-6 transition hover:bg-gray-200"
            >
              <span className="text-lg font-semibold text-gray-900 group-hover:underline">
                {t(labelKey)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
