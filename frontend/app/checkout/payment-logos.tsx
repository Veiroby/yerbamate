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
    <span className="ml-auto flex items-center gap-1.5">
      {badges.includes("CITA") ? <BankBadge label="Citadele" /> : null}
      {badges.includes("SWED") ? <BankBadge label="Swedbank" /> : null}
      {badges.includes("REV") ? <BankBadge label="Revolut" /> : null}
      {showPlus ? <BankBadge label="+" /> : null}
    </span>
  );
}

