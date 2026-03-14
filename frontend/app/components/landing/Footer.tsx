import Link from "next/link";

const customerService = [
  { href: "/contact", label: "Contact" },
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/privacy", label: "Returns" },
];

const myAccount = [
  { href: "/account/profile", label: "My account" },
  { href: "/account/orders", label: "Orders" },
  { href: "/cart", label: "Cart" },
];

const company = [
  { href: "/about", label: "About us" },
  { href: "/products", label: "Products" },
];

const legal = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold uppercase tracking-tight text-black">
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
              {company.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 hover:text-black">
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
              {customerService.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 hover:text-black">
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
              {myAccount.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 hover:text-black">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              {legal.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-700 hover:text-black">
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
