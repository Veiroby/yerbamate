"use client";

import { NewsletterSignup } from "@/app/components/newsletter-signup";

export function FollowSubscribe() {
  return (
    <section
      className="bg-[#DDA15E] px-4 py-12 sm:py-16"
      aria-labelledby="follow-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="follow-heading"
          className="text-xl font-bold text-gray-900 sm:text-2xl"
        >
          Follow &amp; Subscribe
        </h2>
        <div className="mt-6 flex justify-center gap-4" aria-label="Social links">
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#283618]/20 text-[#283618] hover:bg-[#283618]/30"
            aria-label="Facebook"
          >
            <span className="text-sm font-bold">f</span>
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#283618]/20 text-[#283618] hover:bg-[#283618]/30"
            aria-label="Instagram"
          >
            <span className="text-sm font-bold">ig</span>
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#283618]/20 text-[#283618] hover:bg-[#283618]/30"
            aria-label="Twitter"
          >
            <span className="text-sm font-bold">X</span>
          </a>
        </div>
        <div className="mt-8">
          <NewsletterSignup />
        </div>
      </div>
    </section>
  );
}
