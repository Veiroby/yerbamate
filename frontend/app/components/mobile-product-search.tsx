"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  images?: { url: string; altText?: string | null }[];
};

type Props = {
  locale: Locale;
};

const MIN_CHARS = 2;
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 300;

export function MobileProductSearch({ locale }: Props) {
  const { t } = useTranslation();
  const localePrefix = `/${locale}`;
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

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

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const showPanel = open && query.trim().length >= MIN_CHARS;

  const goToFullSearch = useCallback(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) return;
    setOpen(false);
    window.location.href = `${localePrefix}/products?q=${encodeURIComponent(q)}`;
  }, [localePrefix, query]);

  return (
    <div ref={containerRef} className="relative z-[35]">
      <label htmlFor="mobile-header-search" className="sr-only">
        {t("nav.searchPlaceholder")}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="mobile-header-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
            if (e.key === "Enter") {
              e.preventDefault();
              goToFullSearch();
            }
          }}
          placeholder={t("nav.searchPlaceholder")}
          className="w-full rounded-full border border-gray-300 bg-white py-3 pl-11 pr-4 text-base text-black placeholder:text-gray-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/15"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-[min(70vh,22rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-xl ring-1 ring-black/5"
        >
          {loading && (
            <p className="px-4 py-3 text-sm text-gray-600">{t("nav.searchLoading")}</p>
          )}
          {!loading && error && (
            <p className="px-4 py-3 text-sm text-red-600">{t("nav.searchError")}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-600">{t("nav.searchNoResults")}</p>
          )}
          {!loading &&
            !error &&
            results.map((product) => {
              const thumb = product.images?.[0]?.url;
              const href = `${localePrefix}/products/${encodeURIComponent(product.slug)}`;
              return (
                <Link
                  key={product.id}
                  href={href}
                  role="option"
                  className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary product image URLs
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                        —
                      </span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 text-left text-base font-medium leading-snug text-black">
                    {product.name}
                  </span>
                </Link>
              );
            })}
          {!loading && !error && results.length > 0 && (
            <div className="border-t border-gray-100 px-2 pt-2">
              <button
                type="button"
                className="w-full rounded-xl py-3 text-center text-sm font-semibold text-black underline-offset-2 hover:underline"
                onClick={goToFullSearch}
              >
                {t("nav.searchViewAll")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
