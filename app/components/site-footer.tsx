import Link from "next/link";

const quickLinks = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms and conditions" },
  { href: "/shipping-policy", label: "Shipping policy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-100/50 text-stone-700">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Quick links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-stone-700 underline decoration-stone-300 underline-offset-2 transition hover:decoration-teal-500 hover:text-stone-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:text-right">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              SIA YerbaTea
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
          © {new Date().getFullYear()} YerbaTea. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
