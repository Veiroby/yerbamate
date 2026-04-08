"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";
import { useEffect, useMemo, useRef, useState } from "react";

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

  const statCards = useMemo(
    () => [
      { value: formatStat(brandCount), label: t("hero.internationalBrands"), emoji: "🌍" },
      { value: formatStat(productCount), label: t("hero.highQualityProducts"), emoji: "❤️" },
      { value: formatStat(customerCount), label: t("hero.happyCustomers"), emoji: "🔥" },
    ],
    [brandCount, customerCount, productCount, t],
  );

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const tick = () => {
      const width = el.clientWidth;
      if (!width) return;
      const next = (activeIdx + 1) % statCards.length;
      el.scrollTo({ left: next * width, behavior: "smooth" });
      setActiveIdx(next);
    };

    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [activeIdx, statCards.length]);

  return (
    <section
      className="relative overflow-hidden bg-white px-3 pt-0 pb-10 max-lg:pb-8 sm:px-4 sm:pt-2 sm:pb-16 md:pb-20 lg:pb-24"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-0 max-lg:max-w-none md:flex-row md:items-center md:justify-between md:gap-12">
        <div className="flex-1">
          <h1
            id="hero-heading"
            className="hidden text-3xl font-bold leading-tight tracking-tight text-black sm:block sm:text-5xl md:text-6xl lg:text-[3.5rem]"
          >
            {t("hero.heading")}
          </h1>
          <p className="mt-3 hidden max-w-lg text-[15px] leading-relaxed text-gray-600 sm:block sm:mt-4 sm:text-lg">
            {t("hero.subheading")}
          </p>
          <Link
            href={localePrefix ? `${localePrefix}/products` : "/products"}
            className="mt-6 hidden w-full items-center justify-center rounded-full bg-[var(--mobile-cta)] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[var(--mobile-cta-hover)] lg:inline-flex lg:w-auto lg:rounded-md lg:bg-black lg:px-8 lg:hover:bg-gray-800"
          >
            {t("hero.shopNow")}
          </Link>
          {/* Mobile: full-width swipeable carousel */}
          <div className="sm:hidden" aria-label="Hero statistics">
            <div
              ref={carouselRef}
              className="mt-0 flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth pb-0"
              style={{ scrollbarWidth: "none" } as any}
            >
              {statCards.map((c, idx) => (
                <div key={idx} className="w-full shrink-0 snap-center px-0">
                  <div className="w-full rounded-3xl border border-black/5 bg-white px-7 py-6 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-3xl font-bold leading-none text-black">{c.value}</p>
                      <span className="text-2xl leading-none" aria-hidden="true">
                        {c.emoji}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-medium text-gray-700">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: keep existing 3-column stats */}
          <div className="hidden sm:mt-12 sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="min-w-0 text-left">
              <p className="text-2xl font-bold text-black">{formatStat(brandCount)}</p>
              <p className="mt-1 whitespace-nowrap text-sm text-gray-600">{t("hero.internationalBrands")}</p>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-2xl font-bold text-black">{formatStat(productCount)}</p>
              <p className="mt-1 whitespace-nowrap text-sm text-gray-600">{t("hero.highQualityProducts")}</p>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-2xl font-bold text-black">{formatStat(customerCount)}</p>
              <p className="mt-1 whitespace-nowrap text-sm text-gray-600">{t("hero.happyCustomers")}</p>
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
