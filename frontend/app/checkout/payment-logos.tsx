"use client";

import { useEffect, useMemo, useState } from "react";

export function CardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 7.5h17A2.5 2.5 0 0123 10v8a2.5 2.5 0 01-2.5 2.5h-17A2.5 2.5 0 011 18v-8A2.5 2.5 0 013.5 7.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M1 11h22" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 16.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BankBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center justify-center rounded-md border border-black/10 bg-white px-2 text-[11px] font-bold text-gray-900">
      {label}
    </span>
  );
}

type BankLogoType = "CITA" | "SWED" | "REV";

function BankLogo({ type }: { type: BankLogoType }) {
  if (type === "CITA") {
    // Simple Citadele-style mark: red circle + C
    return (
      <span
        className="inline-flex h-6 w-9 items-center justify-center rounded-md border border-black/10 bg-white"
        aria-label="Citadele"
        title="Citadele"
      >
        <svg className="h-4 w-6" viewBox="0 0 48 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="#e11d48" />
          <path
            d="M15.2 8.2c-1-1-2.2-1.5-3.6-1.5-2.8 0-5 2.2-5 5.3 0 3.1 2.2 5.3 5 5.3 1.4 0 2.6-.5 3.6-1.5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (type === "SWED") {
    // Simple Swedbank-style mark: orange circle + white S
    return (
      <span
        className="inline-flex h-6 w-9 items-center justify-center rounded-md border border-black/10 bg-white"
        aria-label="Swedbank"
        title="Swedbank"
      >
        <svg className="h-4 w-6" viewBox="0 0 48 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="#f97316" />
          <path
            d="M15.8 8.7c-1-1.3-2.9-2-4.7-1.4-1.4.4-2.4 1.4-2.2 2.5.3 1.6 2.7 1.7 4.6 2.3 1.6.5 2.9 1.3 2.8 2.9-.1 1.7-1.9 3.1-4.5 3.1-1.9 0-3.7-.7-4.8-1.9"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  // REV
  return (
    <span
      className="inline-flex h-6 items-center justify-center rounded-md border border-black/10 bg-white px-2"
      aria-label="Revolut"
      title="Revolut"
    >
      <svg className="h-3 w-[44px]" viewBox="0 0 88 24" fill="none" aria-hidden="true">
        <path
          d="M8 18V6h6.8c3.7 0 6 2.3 6 5.4 0 2.6-1.6 4.6-4.1 5.2l4.3 1.4H17l-4-1.3H12V18H8zm4-4.7h2.8c1.6 0 2.5-.9 2.5-2.1 0-1.2-.9-2.2-2.5-2.2H12v4.3z"
          fill="#111827"
        />
        <path
          d="M27 18c-3.4 0-5.7-2.3-5.7-5.6 0-3.3 2.3-5.6 5.6-5.6 3.4 0 5.6 2.2 5.6 5.4v1H25c.3 1.2 1.2 1.9 2.6 1.9 1 0 1.7-.3 2.3-.9l2.3 1.5C31.2 17.4 29.4 18 27 18zm-2-7h4c-.2-1.1-1-1.8-2-1.8-1.1 0-1.8.6-2 1.8z"
          fill="#111827"
        />
        <path
          d="M41.2 18c-3.3 0-5.7-2.3-5.7-5.6 0-3.3 2.4-5.6 5.7-5.6 3.2 0 5.5 2.2 5.5 5.6S44.4 18 41.2 18zm0-3c1.3 0 2.2-1.1 2.2-2.6 0-1.6-.9-2.6-2.2-2.6-1.4 0-2.3 1-2.3 2.6 0 1.5.9 2.6 2.3 2.6z"
          fill="#111827"
        />
        <path
          d="M48.6 18V7h3.4v1.6c.7-1.2 1.9-1.8 3.5-1.8 2.6 0 4.3 1.9 4.3 4.6V18H56v-5.8c0-1.3-.7-2.1-1.9-2.1s-2 .9-2 2.2V18h-3.5z"
          fill="#111827"
        />
        <path
          d="M63.2 18V6h3.5v12h-3.5z"
          fill="#111827"
        />
        <path
          d="M74 18c-3.3 0-5.7-2.3-5.7-5.6 0-3.3 2.4-5.6 5.7-5.6 3.2 0 5.5 2.2 5.5 5.6S77.2 18 74 18zm0-3c1.3 0 2.2-1.1 2.2-2.6 0-1.6-.9-2.6-2.2-2.6-1.4 0-2.3 1-2.3 2.6 0 1.5.9 2.6 2.3 2.6z"
          fill="#111827"
        />
      </svg>
    </span>
  );
}

export type MaksekeskusMethod = { name: string; code?: string | null };

function mapMethodToBadgeLabel(name: string): "SWED" | "CITA" | "REV" | null {
  const n = name.toLowerCase();
  if (n.includes("swed")) return "SWED";
  if (n.includes("citadele")) return "CITA";
  if (n.includes("revolut")) return "REV";
  return null;
}

export function MaksekeskusBadges({
  enabled,
}: {
  enabled: boolean;
}) {
  const [methods, setMethods] = useState<MaksekeskusMethod[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setFailed(false);
    fetch("/api/payments/maksekeskus/methods", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d?.methods) ? (d.methods as MaksekeskusMethod[]) : [];
        setMethods(list);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setMethods([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const badges = useMemo(() => {
    const fallback = ["CITA", "SWED", "REV"] as const;
    const src = failed || methods === null ? [] : methods;

    const picked: Array<"CITA" | "SWED" | "REV"> = [];
    for (const m of src) {
      const mapped = mapMethodToBadgeLabel(m.name);
      if (mapped && !picked.includes(mapped)) picked.push(mapped);
    }

    const base = picked.length > 0 ? picked : [...fallback];
    return base.slice(0, 3);
  }, [failed, methods]);

  const showPlus = useMemo(() => {
    if (failed || methods === null) return true;
    const mappedCount = new Set(
      methods.map((m) => mapMethodToBadgeLabel(m.name)).filter(Boolean),
    ).size;
    return mappedCount > 3;
  }, [failed, methods]);

  return (
    <span className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {badges.includes("CITA") ? <BankLogo type="CITA" /> : null}
      {badges.includes("SWED") ? <BankLogo type="SWED" /> : null}
      {badges.includes("REV") ? <BankLogo type="REV" /> : null}
      {showPlus ? <BankBadge label="+" /> : null}
    </span>
  );
}

