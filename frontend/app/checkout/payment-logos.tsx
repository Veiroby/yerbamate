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

export function ApplePayMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 20" fill="none" aria-hidden="true">
      <path
        d="M14.83 10.28c0-2.56 2.09-3.78 2.18-3.83-1.19-1.74-3.04-1.98-3.7-2.01-1.57-.16-3.07.92-3.86.92-.79 0-2.01-.9-3.3-.88-1.7.03-3.27.99-4.14 2.51-1.77 3.07-.45 7.61 1.27 10.1.84 1.22 1.85 2.58 3.17 2.53 1.28-.05 1.76-.83 3.3-.83 1.54 0 1.97.83 3.32.81 1.37-.03 2.24-1.24 3.08-2.46.97-1.41 1.37-2.77 1.39-2.84-.03-.01-2.67-1.03-2.7-4.02z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M12.21 3.1c.7-.85 1.17-2.03 1.04-3.2-1.01.04-2.24.67-2.96 1.52-.65.75-1.22 1.95-1.06 3.1 1.12.09 2.28-.57 2.98-1.42z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M28.1 5.35c2.35 0 3.95 1.6 3.95 3.93 0 2.34-1.64 3.95-4.03 3.95h-2.55v3.9h-1.85V5.35h4.48zm-2.63 6.27h2.05c1.63 0 2.56-.88 2.56-2.34 0-1.46-.93-2.33-2.55-2.33h-2.06v4.67z"
        fill="currentColor"
      />
      <path
        d="M32.85 14.49c0-1.55 1.19-2.5 3.29-2.62l2.41-.14v-.68c0-.99-.67-1.58-1.79-1.58-1.03 0-1.73.5-1.87 1.24h-1.66c.09-1.54 1.52-2.67 3.6-2.67 2.14 0 3.42 1.14 3.42 3.02v5.98h-1.72v-1.43h-.04c-.5.96-1.58 1.57-2.8 1.57-1.72 0-2.84-1.07-2.84-2.69zm5.7-.79v-.69l-2.17.14c-1.08.07-1.68.53-1.68 1.29 0 .79.65 1.29 1.64 1.29 1.28 0 2.2-.88 2.2-2.02z"
        fill="currentColor"
      />
      <path
        d="M42.13 20h-1.75l2.03-5.75-3.23-8.68h1.93l2.2 6.82h.04l2.2-6.82h1.87L43.93 20z"
        fill="currentColor"
      />
      <path
        d="M47.85 5.35h1.85v11.68h-1.85V5.35z"
        fill="currentColor"
      />
      <path
        d="M60.66 13.98c-.23 1.8-1.85 3.18-3.86 3.18-2.49 0-4.06-1.7-4.06-4.41 0-2.71 1.58-4.44 4.04-4.44 2.4 0 3.93 1.66 3.93 4.26v.63h-6.08v.11c0 1.53.92 2.53 2.2 2.53 1.01 0 1.73-.52 1.96-1.45h1.87zm-6.02-2.53h4.21c-.04-1.33-.86-2.22-2.05-2.22-1.21 0-2.05.9-2.16 2.22z"
        fill="currentColor"
      />
      <path
        d="M62 17.03V5.35h1.85v11.68H62z"
        fill="currentColor"
        opacity="0"
      />
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

