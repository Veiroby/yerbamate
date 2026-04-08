"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  images?: { url: string; altText?: string | null }[];
};

const MIN_CHARS = 2;
const SUGGESTION_LIMIT = 12;
const DEBOUNCE_MS = 300;

const TRENDING_BY_LOCALE: Record<Locale, string[]> = {
  en: ["Yerba mate", "Mate gourd", "Bombilla", "Organic", "Brazil", "Argentina", "Starter kit"],
  lv: ["Yerba mate", "Kalebas", "Bombilja", "Bio", "Brazīlija", "Argentīna", "Komplekts"],
};

type Props = {
  locale: Locale;
};

export function FullSearchPage({ locale }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const localePrefix = `/${locale}`;
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);

  const trending = TRENDING_BY_LOCALE[locale];

  useEffect(() => {
    const tmr = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(tmr);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (debounced.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    const url = `/api/products?q=${encodeURIComponent(debounced)}&limit=${SUGGESTION_LIMIT}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("search failed");
        return res.json() as Promise<{ products?: SearchProduct[] }>;
      })
      .then((data) => {
        if (!cancelled) setResults(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const onCancel = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(localePrefix);
    }
  }, [router, localePrefix]);

  const goToFullProductList = useCallback(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) return;
    router.push(`${localePrefix}/products?q=${encodeURIComponent(q)}`);
  }, [localePrefix, query, router]);

  const showResultsPanel = debounced.length >= MIN_CHARS;

  return (
    <div className="flex min-h-screen flex-col bg-white lg:min-h-0">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="full-search-input" className="sr-only">
            {t("nav.searchPlaceholder")}
          </label>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            id="full-search-input"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
              if (e.key === "Enter") {
                e.preventDefault();
                goToFullProductList();
              }
            }}
            placeholder={t("nav.searchPlaceholder")}
            className="mobile-pill w-full border-0 bg-[#F2F2F7] py-3.5 pl-12 pr-4 text-base text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)]/25"
            role="combobox"
            aria-controls={listId}
            aria-autocomplete="list"
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 px-1 py-2 text-base font-normal text-black"
        >
          {t("common.cancel")}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-[var(--mobile-floating-chrome-inset)] pt-4">
        {query.trim().length < MIN_CHARS && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-black">{t("mobile.trendingSearches")}</h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="mobile-pill border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-black active:scale-[0.98]"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {showResultsPanel && (
          <div id={listId} role="listbox" className="space-y-1">
            {loading && <p className="py-4 text-sm text-gray-600">{t("nav.searchLoading")}</p>}
            {!loading && error && <p className="py-4 text-sm text-red-600">{t("nav.searchError")}</p>}
            {!loading && !error && results.length === 0 && (
              <p className="py-4 text-sm text-gray-600">{t("nav.searchNoResults")}</p>
            )}
            {!loading &&
              !error &&
              results.map((product) => {
                const thumb = product.images?.[0];
                const href = `${localePrefix}/products/${encodeURIComponent(product.slug)}`;
                return (
                  <Link
                    key={product.id}
                    href={href}
                    role="option"
                    className="flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-gray-50"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {thumb?.url ? (
                        <Image src={thumb.url} alt={thumb.altText ?? ""} fill className="object-cover" sizes="56px" />
                      ) : null}
                    </div>
                    <span className="min-w-0 flex-1 text-left text-base font-medium text-black">{product.name}</span>
                  </Link>
                );
              })}
            {!loading && !error && results.length > 0 && (
              <button
                type="button"
                className="mt-4 w-full rounded-2xl border border-gray-200 py-3 text-center text-sm font-semibold text-[var(--mobile-cta)]"
                onClick={goToFullProductList}
              >
                {t("nav.searchViewAll")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
