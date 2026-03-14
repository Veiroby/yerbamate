"use client";

import { useState } from "react";

type Benefit = { title: string; body: string };

export function BenefitsAccordion({ benefits }: { benefits: Benefit[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {/* Mobile: accordion – heading only, tap to expand paragraph */}
      <div className="space-y-2 md:hidden">
        {benefits.map(({ title, body }, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={title}
              className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                aria-expanded={isOpen}
              >
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <span
                  className={`ml-2 shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-600">
                    {body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: same as before – heading + paragraph visible */}
      <div className="hidden grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8 md:grid">
        {benefits.map(({ title, body }) => (
          <div
            key={title}
            className="flex max-w-3xl flex-col gap-3 sm:mx-0 sm:max-w-none"
          >
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="leading-relaxed text-gray-600">{body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
