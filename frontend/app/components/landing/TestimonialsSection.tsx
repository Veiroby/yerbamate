"use client";

import { useTranslation } from "@/lib/translation-context";

const testimonialKeys = ["testimonials.quote1", "testimonials.quote2", "testimonials.quote3"] as const;
const names = ["Sarah M.", "Alex K.", "Jordan P."];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-white px-4 py-12 sm:py-16" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-6xl">
        <h2
          id="testimonials-heading"
          className="mb-8 text-center text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl"
        >
          {t("testimonials.heading")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonialKeys.map((key, i) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6"
            >
              <StarRating count={5} />
              <p className="mt-4 text-sm text-gray-700">{t(key)}</p>
              <p className="mt-3 font-semibold text-gray-900">{names[i]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
