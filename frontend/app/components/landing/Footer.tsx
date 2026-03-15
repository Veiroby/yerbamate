import Link from "next/link";
import type { Locale } from "@/lib/locale";

const customerService = [
  { path: "contact", label: "Contact" },
  { path: "shipping-policy", label: "Shipping" },
  { path: "privacy", label: "Returns" },
];

const myAccount = [
  { path: "account/profile", label: "My account" },
  { path: "account/orders", label: "Orders" },
  { path: "cart", label: "Cart" },
];

const company = [
  { path: "about", label: "About us" },
  { path: "products", label: "Products" },
];

const legal = [
  { path: "privacy", label: "Privacy policy" },
  { path: "terms", label: "Terms of service" },
];

export function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();
  const prefix = `/${locale}/`;

  return (
    <footer className="bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href={prefix} className="text-xl font-bold uppercase tracking-tight text-black">
              YerbaTea
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-600">
              Premium yerba mate and mate gourds. Quality you can taste.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              {company.map(({ path, label }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Help
            </h3>
            <ul className="mt-4 space-y-2">
              {customerService.map(({ path, label }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Account
            </h3>
            <ul className="mt-4 space-y-2">
              {myAccount.map(({ path, label }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              {legal.map(({ path, label }) => (
                <li key={path}>
                  <Link href={prefix + path} className="text-sm text-gray-700 hover:text-black">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-gray-200 pt-8 text-center text-xs text-gray-500">
          © {year} YerbaTea. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
