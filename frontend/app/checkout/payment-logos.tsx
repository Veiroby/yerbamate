"use client";

import Image from "next/image";
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

export function VisaMastercardMarks() {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-2">
      <span className="inline-flex h-6 items-center justify-center rounded-md border border-black/10 bg-white px-2">
        <Image src="/payments/cards/visa.png" alt="Visa" width={28} height={12} />
      </span>
      <span className="inline-flex h-6 items-center justify-center rounded-md border border-black/10 bg-white px-2">
        <Image src="/payments/cards/mastercard.png" alt="Mastercard" width={20} height={14} />
      </span>
    </span>
  );
}

function BankBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center justify-center rounded-md border border-black/10 bg-white px-2 text-[11px] font-bold text-gray-900">
      {label}
    </span>
  );
}

type BankLogoType = "swedbank" | "seb" | "luminor" | "citadele" | "revolut";

function BankLogoPng({ bank }: { bank: BankLogoType }) {
  const src = `/payments/banks/${bank}.png`;
  const alt = bank === "seb" ? "SEB" : bank.charAt(0).toUpperCase() + bank.slice(1);
  return (
    <span className="inline-flex h-6 items-center justify-center rounded-md border border-black/10 bg-white px-2">
      <Image src={src} alt={alt} width={56} height={14} />
    </span>
  );
}

export type MaksekeskusMethod = {
  name: string;
  code?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  url?: string | null;
  category?: string | null;
  country?: string | null;
};

function mapMethodToBadgeLabel(name: string): "SWED" | "SEB" | "LUM" | "CITA" | "REV" | null {
  const n = name.toLowerCase();
  if (n.includes("swed")) return "SWED";
  if (n.includes("seb")) return "SEB";
  if (n.includes("luminor")) return "LUM";
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
    const fallback = ["SWED", "SEB", "LUM", "CITA", "REV"] as const;
    const src = failed || methods === null ? [] : methods;

    const picked: Array<"SWED" | "SEB" | "LUM" | "CITA" | "REV"> = [];
    for (const m of src) {
      const mapped = mapMethodToBadgeLabel(m.name);
      if (mapped && !picked.includes(mapped)) picked.push(mapped);
    }

    const base = picked.length > 0 ? picked : [...fallback];
    return base.slice(0, 5);
  }, [failed, methods]);

  const showPlus = useMemo(() => {
    if (failed || methods === null) return true;
    const mappedCount = new Set(
      methods.map((m) => mapMethodToBadgeLabel(m.name)).filter(Boolean),
    ).size;
    return mappedCount > 5;
  }, [failed, methods]);

  return (
    <span className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {badges.includes("SWED") ? <BankLogoPng bank="swedbank" /> : null}
      {badges.includes("SEB") ? <BankLogoPng bank="seb" /> : null}
      {badges.includes("LUM") ? <BankLogoPng bank="luminor" /> : null}
      {badges.includes("CITA") ? <BankLogoPng bank="citadele" /> : null}
      {badges.includes("REV") ? <BankLogoPng bank="revolut" /> : null}
      {showPlus ? <BankBadge label="+" /> : null}
    </span>
  );
}

