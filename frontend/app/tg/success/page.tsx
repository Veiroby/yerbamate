"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessBody() {
  const params = useSearchParams();
  const orderNumber = params.get("orderNumber");
  const provider = params.get("provider");

  return (
    <div className="space-y-4 py-10 text-center">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--black-forest,#283618)]">
        Thank you
      </h1>
      <p className="text-sm text-black/55">
        {orderNumber ? (
          <>
            Order{" "}
            <span className="font-semibold text-[var(--black-forest,#283618)]">
              {orderNumber}
            </span>{" "}
            is confirmed
            {provider === "maksekeskus"
              ? " (bank payment)."
              : provider
                ? "."
                : " — if you paid by card, Stripe will finalize shortly."}
          </>
        ) : (
          "Your payment was submitted. You can close this window and return to Telegram."
        )}
      </p>
      <Link
        href="/tg"
        className="inline-block rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Back to catalog
      </Link>
    </div>
  );
}

export default function TgSuccessPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-sm text-black/50">Loading…</p>}>
      <SuccessBody />
    </Suspense>
  );
}
