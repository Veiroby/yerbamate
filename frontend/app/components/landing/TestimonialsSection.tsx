"use client";

import { useTranslation } from "@/lib/translation-context";
import { useMemo, useRef } from "react";

export type Testimonial = {
  id: string;
  rating: number;
  body: string | null;
  title: string | null;
  authorName: string | null;
};

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

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const slides = useMemo(() => {
    if (testimonials.length > 0) return testimonials;

    // Fallback: keep the old “fake” testimonials only if DB has none,
    // so the homepage doesn’t look empty during setup.
    return [
      {
        id: "fallback-1",
        rating: 5,
        title: null,
        body: t("testimonials.quote1"),
        authorName: "Sarah M.",
      },
      {
        id: "fallback-2",
        rating: 5,
        title: null,
        body: t("testimonials.quote2"),
        authorName: "Alex K.",
      },
      {
        id: "fallback-3",
        rating: 5,
        title: null,
        body: t("testimonials.quote3"),
        authorName: "Jordan P.",
      },
    ] satisfies Testimonial[];
  }, [testimonials, t]);

  function scrollByCard(direction: "prev" | "next") {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.round(el.clientWidth * 0.9));
    el.scrollBy({ left: direction === "next" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="bg-white px-4 py-12 sm:py-16" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row">
          <h2
            id="testimonials-heading"
            className="text-center text-3xl font-bold uppercase tracking-wide text-black sm:text-left sm:text-4xl"
          >
            {t("testimonials.heading")}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard("prev")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
              aria-label="Previous reviews"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByCard("next")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
              aria-label="Next reviews"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((r) => (
            <div
              key={r.id}
              className="snap-start rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm w-[85%] sm:w-[45%] lg:w-[30%] shrink-0"
            >
              <StarRating count={Math.max(1, Math.min(5, r.rating || 5))} />
              {r.title && (
                <p className="mt-4 text-sm font-semibold text-gray-900">{r.title}</p>
              )}
              <p className="mt-3 text-sm text-gray-700">
                {r.body || ""}
              </p>
              <p className="mt-4 font-semibold text-gray-900">
                {r.authorName || "Verified customer"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
