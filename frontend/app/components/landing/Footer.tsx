import Link from "next/link";

const footerBg = "bg-[#0f172a]";
const footerText = "text-white";
const footerMuted = "text-gray-400";

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

const aboutUs = [
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
    <footer className={footerBg}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className={`text-lg font-semibold ${footerText}`}>
              YerbaTea
            </Link>
            <p className={`mt-3 max-w-xs text-sm ${footerMuted}`}>
              Premium yerba mate and mate gourds. Quality you can taste.
            </p>
          </div>
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${footerMuted}`}>
              Customer service
            </h3>
            <ul className="mt-4 space-y-2">
              {customerService.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={`text-sm ${footerText} hover:underline`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${footerMuted}`}>
              My account
            </h3>
            <ul className="mt-4 space-y-2">
              {myAccount.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={`text-sm ${footerText} hover:underline`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${footerMuted}`}>
              About us
            </h3>
            <ul className="mt-4 space-y-2">
              {aboutUs.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={`text-sm ${footerText} hover:underline`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className={`mt-6 text-xs font-semibold uppercase tracking-wider ${footerMuted}`}>
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              {legal.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={`text-sm ${footerText} hover:underline`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className={`mt-12 border-t border-white/10 pt-8 text-center text-xs ${footerMuted}`}>
          © {year} YerbaTea. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
