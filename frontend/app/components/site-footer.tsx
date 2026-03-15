"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { useTranslation } from "@/lib/translation-context";
import { EU_COUNTRIES, CURRENCIES, CountryCode, CurrencyCode } from "@/lib/locale-data";
import type { Locale } from "@/lib/locale";

const quickLinkKeys = [
  { path: "privacy", labelKey: "footer.privacy" },
  { path: "terms", labelKey: "footer.terms" },
  { path: "shipping-policy", labelKey: "footer.shippingPolicy" },
] as const;

export function SiteFooter({ locale }: { locale: Locale }) {
  const { country, currency, setCountry, setCurrency } = useLocale();
  const { t } = useTranslation();
  const localePrefix = `/${locale}`;

  return (
    <footer className="border-t border-stone-200 bg-stone-100/50 text-stone-700">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2">
              {quickLinkKeys.map(({ path, labelKey }) => (
                <li key={labelKey}>
                  <Link
                    href={`${localePrefix}/${path}`}
                    className="text-sm text-stone-700 underline decoration-stone-300 underline-offset-2 transition hover:decoration-teal-500 hover:text-stone-900"
                  >
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t("footer.regionCurrency")}
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="footer-country" className="mb-1 block text-xs text-stone-500">
                  {t("footer.country")}
                </label>
                <select
                  id="footer-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryCode)}
                  className="w-full max-w-[200px] rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {EU_COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="footer-currency" className="mb-1 block text-xs text-stone-500">
                  {t("footer.currency")}
                </label>
                <select
                  id="footer-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full max-w-[200px] rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="sm:text-right">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t("footer.companyName")}
            </h3>
            <p className="text-sm text-stone-600">
              Reg. no. 50203504501
              <br />
              Ieriķu iela 66-112, Rīga, LV-1084
              <br />
              <span className="text-stone-500">Registered 29 August 2023</span>
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-stone-200 pt-6 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} YerbaTea. {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
