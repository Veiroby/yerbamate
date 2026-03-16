import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale";

type PolicyLayoutProps = {
  locale: Locale;
  title: string;
  intro?: string;
  breadcrumbLabel?: string;
  lastUpdatedLabel?: string;
  lastUpdatedDate?: string;
  children: ReactNode;
};

export function PolicyLayout({
  locale,
  title,
  intro,
  breadcrumbLabel,
  lastUpdatedLabel,
  lastUpdatedDate,
  children,
}: PolicyLayoutProps) {
  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white text-[#283618]">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <div className="mb-6 text-xs uppercase tracking-wide text-[#606C38]">
          <Link href={prefix} className="opacity-70 hover:text-[#283618]">
            Home
          </Link>
          {breadcrumbLabel && (
            <>
              <span className="mx-1.5 opacity-50">/</span>
              <span className="font-semibold">{breadcrumbLabel}</span>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-[#283618] sm:text-3xl">
            {title}
          </h1>
          {intro && <p className="mb-6 text-sm text-[#606C38]">{intro}</p>}
          <div className="prose max-w-none text-sm prose-p:text-[#606C38] prose-headings:text-[#283618]">
            {children}
          </div>
          {lastUpdatedLabel && lastUpdatedDate && (
            <p className="mt-8 text-xs uppercase tracking-wide text-stone-500">
              {lastUpdatedLabel}: {lastUpdatedDate}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

