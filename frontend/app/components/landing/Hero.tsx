"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";

type HeroProps = {
  productCount: number;
  brandCount: number;
  customerCount: number;
};

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

export function Hero({ productCount, brandCount, customerCount }: HeroProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";

  return (
    <section
      className="relative overflow-hidden bg-white px-4 py-12 sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        <div className="flex-1">
          <div className="hidden sm:block">
            <h1
              id="hero-heading"
              className="text-4xl font-bold leading-tight text-black sm:text-5xl md:text-6xl lg:text-[3.5rem]"
            >
              {t("hero.heading")}
            </h1>
            <p className="mt-4 max-w-lg text-base text-gray-600 sm:text-lg">
              {t("hero.subheading")}
            </p>
            <Link
              href={localePrefix ? `${localePrefix}/products` : "/products"}
              className="mt-6 inline-flex rounded-md bg-black px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {t("hero.shopNow")}
            </Link>
          </div>
          <div className="flex flex-row flex-nowrap items-start justify-between gap-2 sm:mt-12 sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="min-w-0 basis-1/3 shrink-0 text-center sm:text-left">
              <p className="text-base font-bold text-black sm:text-2xl">
                {formatStat(brandCount)}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] text-gray-600 sm:mt-1 sm:text-sm">
                {t("hero.internationalBrands")}
              </p>
            </div>
            <div className="min-w-0 basis-1/3 shrink-0 text-center sm:text-left">
              <p className="text-base font-bold text-black sm:text-2xl">
                {formatStat(productCount)}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] text-gray-600 sm:mt-1 sm:text-sm">
                {t("hero.highQualityProducts")}
              </p>
            </div>
            <div className="min-w-0 basis-1/3 shrink-0 text-center sm:text-left">
              <p className="text-base font-bold text-black sm:text-2xl">
                {formatStat(customerCount)}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] text-gray-600 sm:mt-1 sm:text-sm">
                {t("hero.happyCustomers")}
              </p>
            </div>
          </div>
        </div>
        <div className="relative hidden flex-1 md:block">
          <div className="relative aspect-square max-w-md overflow-hidden rounded-2xl">
            <Image
              src="/hero-mate.png"
              alt={t("hero.imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 28rem"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
