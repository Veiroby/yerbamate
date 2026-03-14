"use client";

import { NewsletterSignup } from "@/app/components/newsletter-signup";

export function FollowSubscribe() {
  return (
    <section
      className="bg-black px-4 py-12 sm:py-14"
      aria-labelledby="newsletter-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row sm:gap-12">
        <h2
          id="newsletter-heading"
          className="text-center text-xl font-bold uppercase tracking-wide text-white sm:text-left sm:text-2xl"
        >
          Stay up to date about our latest offers
        </h2>
        <div className="w-full shrink-0 sm:max-w-md">
          <NewsletterSignup variant="dark" />
        </div>
      </div>
    </section>
  );
}
