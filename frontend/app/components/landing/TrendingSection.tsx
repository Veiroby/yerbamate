"use client";

import { useTranslation } from "@/lib/translation-context";
import { BenefitsAccordion } from "./BenefitsAccordion";

export function TrendingSection() {
  const { t } = useTranslation();
  const benefits = [
    { title: t("trending.benefit1Title"), body: t("trending.benefit1Body") },
    { title: t("trending.benefit2Title"), body: t("trending.benefit2Body") },
    { title: t("trending.benefit3Title"), body: t("trending.benefit3Body") },
  ];

  return (
    <section
      className="bg-white px-4 py-12 sm:py-16"
      aria-labelledby="why-yerba-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="why-yerba-heading"
          className="text-center text-xl font-bold uppercase tracking-wide text-black sm:text-2xl"
        >
          {t("trending.heading")}
        </h2>
        <div className="mt-8">
          <BenefitsAccordion benefits={benefits} />
        </div>
      </div>
    </section>
  );
}
