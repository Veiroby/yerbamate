import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthForms } from "@/app/account/auth-forms";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
};

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a8.7 8.7 0 00.1-2l2-1.5-2-3.5-2.4 1a8.8 8.8 0 00-1.7-1L15 5h-6l-.4 3a8.8 8.8 0 00-1.7 1l-2.4-1-2 3.5 2 1.5a8.7 8.7 0 000 2l-2 1.5 2 3.5 2.4-1a8.8 8.8 0 001.7 1l.4 3h6l.4-3a8.8 8.8 0 001.7-1l2.4 1 2-3.5-2-1.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const [user, translations] = await Promise.all([
    getCurrentUser(),
    getTranslations(locale),
  ]);
  const t = createT(translations);
  const { error, status } = await searchParams;
  const prefix = `/${locale}`;

  if (!user) {
    return (
      <>
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-black">
          {t("account.signInOrCreate")}
        </h1>
        <div className="mobile-sheet rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:rounded-2xl lg:border-gray-200">
          <AuthForms error={error} />
        </div>
      </>
    );
  }

  const showPasswordResetSuccess = status === "password_reset";

  const [ordersCount, recentProducts] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.product.findMany({
      where: { active: true, archived: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
  ]);

  const quickLinks = [
    {
      href: `${prefix}/account/information`,
      title: t("account.navInformation"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 12a4 4 0 100-8 4 4 0 000 8z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M4 21a8 8 0 0116 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: `${prefix}/account/addresses`,
      title: t("account.navAddresses"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21s6-5 6-10a6 6 0 10-12 0c0 5 6 10 6 10z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      href: `${prefix}/account/orders`,
      title: t("account.navOrders"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 7h14v14H7V7z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M3 3h14v14H3V3z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: `${prefix}/account/wishlist`,
      title: t("account.navWishlist"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21s-7-4.4-9.2-8.4C1.1 9.1 3 6.5 6.1 6.1c1.7-.2 3.2.6 3.9 1.7.7-1.1 2.2-1.9 3.9-1.7 3.1.4 5 3 3.3 6.5C19 16.6 12 21 12 21z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: `${prefix}/account/newsletter`,
      title: t("account.navNewsletter"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6h16v12H4V6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M4 7l8 6 8-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: `${prefix}/account/settings`,
      title: t("account.settings"),
      icon: <SettingsIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6 max-lg:pb-2">
      {showPasswordResetSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">{t("account.passwordResetSuccess")}</p>
          <p className="mt-1 text-green-700">
            {t("account.passwordUpdated")}
          </p>
        </div>
      )}

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--mobile-cta)]/10 text-[var(--mobile-cta)]">
            <span className="text-sm font-semibold">
              {(user.email?.[0] ?? "U").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-black">
              {user.email}
            </p>
            <Link
              href={`${prefix}/account/information`}
              className="text-xs text-gray-500 underline underline-offset-2 hover:text-black"
            >
              {t("account.viewProfile")}
            </Link>
          </div>
        </div>
        <Link
          href={`${prefix}/account/settings`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200"
          aria-label={t("account.settings")}
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`${prefix}/account/wishlist`}
          className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:bg-gray-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s-7-4.4-9.2-8.4C1.1 9.1 3 6.5 6.1 6.1c1.7-.2 3.2.6 3.9 1.7.7-1.1 2.2-1.9 3.9-1.7 3.1.4 5 3 3.3 6.5C19 16.6 12 21 12 21z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-black">{t("account.saved")}</p>
        </Link>
        <Link
          href={`${prefix}/account/newsletter`}
          className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:bg-gray-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16v12H4V6z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M4 7l8 6 8-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-black">{t("account.following")}</p>
        </Link>
      </div>

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
                {l.icon}
              </div>
              <p className="mt-3 text-sm font-semibold text-black">{l.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <Link href={`${prefix}/account/orders`} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-black">{t("account.orderHistory")}</p>
            <p className="mt-1 text-xs text-gray-500">
              {ordersCount === 1
                ? t("account.ordersCount", { count: ordersCount })
                : t("account.ordersCountPlural", { count: ordersCount })}
            </p>
          </div>
          <span className="text-gray-400" aria-hidden>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-black">{t("account.recentlyViewed")}</p>
          <span className="text-gray-400" aria-hidden>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {recentProducts.map((p) => {
            const img = p.images[0];
            return (
              <Link
                key={p.id}
                href={`${prefix}/products/${encodeURIComponent(p.slug)}`}
                className="shrink-0"
                aria-label={p.name}
              >
                <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
                  {img ? (
                    <Image
                      src={img.url}
                      alt={img.altText ?? p.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized
                    />
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-black">{t("account.paymentMethods")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800">
            Stripe
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800">
            Maksekeskus
          </span>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {t("mobile.paymentSecure")}
        </p>
      </section>

      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          {t("account.logout")}
        </button>
      </form>
    </div>
  );
}
