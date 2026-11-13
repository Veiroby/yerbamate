"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessBody() {
  const params = useSearchParams();
  const orderNumber = params.get("orderNumber");
  const provider = params.get("provider");

  return (
    <div className="tg-center" style={{ display: "grid", gap: "0.9rem", justifyItems: "center" }}>
      <p className="tg-brand" style={{ fontSize: "1.1rem", margin: 0 }}>
        YerbaTea
      </p>
      <h1 className="tg-title">Thank you</h1>
      <p className="tg-sub" style={{ maxWidth: "18rem" }}>
        {orderNumber ? (
          <>
            Order <strong>{orderNumber}</strong> is confirmed
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
      <Link href="/tg" className="tg-btn" style={{ maxWidth: "14rem" }}>
        Back to catalog
      </Link>
    </div>
  );
}

export default function TgSuccessPage() {
  return (
    <Suspense fallback={<p className="tg-center tg-muted">Loading…</p>}>
      <SuccessBody />
    </Suspense>
  );
}
