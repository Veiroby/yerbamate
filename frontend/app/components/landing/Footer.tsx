"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";

const customerServicePaths: { path: string; labelKey: string }[] = [
  { path: "contact", labelKey: "footer.contact" },
  { path: "shipping-policy", labelKey: "footer.shipping" },
  { path: "privacy", labelKey: "footer.returns" },
];

const myAccountPaths: { path: string; labelKey: string }[] = [
  { path: "account/profile", labelKey: "footer.myAccount" },
  { path: "account/orders", labelKey: "footer.orders" },
  { path: "cart", labelKey: "nav.cart" },
];

const companyPaths: { path: string; labelKey: string }[] = [
  { path: "about", labelKey: "footer.aboutUs" },
  { path: "products", labelKey: "footer.products" },
];

const legalPaths: { path: string; labelKey: string }[] = [
  { path: "privacy", labelKey: "footer.privacy" },
  { path: "terms", labelKey: "footer.termsOfService" },
];

export function Footer({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const prefix = `/${locale}/`;

  return (
    <footer className="bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href={prefix} className="text-xl font-bold uppercase tracking-tight text-black">
              {t("footer.brandName")}
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-600">
              {t("footer.tagline")}
            </p>
            <div className="mt-5 max-w-xs text-sm text-gray-700">
              <p className="font-semibold text-gray-900">SIA YerbaTea</p>
              <p className="mt-1 text-gray-600">
                IBAN:{" "}
                <span className="font-mono text-[13px] text-gray-800">
                  LV30HABA0551057129470
                </span>{" "}
                (Swedbank)
              </p>
              <p className="mt-2 text-gray-600">
                Reg. no.: <span className="font-medium text-gray-800">50203504501</span>
              </p>
              <p className="mt-1 text-gray-600">
                Address: <span className="font-medium text-gray-800">Ieriķu iela 66–112, Rīga, LV-1084</span>
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("footer.company")}
            </h3>
            <ul className="mt-4 space-y-2">
              {companyPaths.map(({ path, labelKey }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("footer.help")}
            </h3>
            <ul className="mt-4 space-y-2">
              {customerServicePaths.map(({ path, labelKey }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("footer.account")}
            </h3>
            <ul className="mt-4 space-y-2">
              {myAccountPaths.map(({ path, labelKey }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("footer.legal")}
            </h3>
            <ul className="mt-4 space-y-2">
              {legalPaths.map(({ path, labelKey }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-gray-200 pt-8 text-center text-xs text-gray-500">
          {t("footer.copyrightLine", { year })}
        </p>
      </div>
    </footer>
  );
}
