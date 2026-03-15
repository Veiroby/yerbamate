import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthForms } from "@/app/account/auth-forms";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
};

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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <AuthForms error={error} />
        </div>
      </>
    );
  }

  const showPasswordResetSuccess = status === "password_reset";

  const ordersCount = await prisma.order.count({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      {showPasswordResetSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">{t("account.passwordResetSuccess")}</p>
          <p className="mt-1 text-green-700">
            {t("account.passwordUpdated")}
          </p>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          {t("account.dashboard")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("account.signedInAs")} {user.email}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-black">{t("account.information")}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {user.name ? (
              <>{t("common.name")}: <span className="font-medium text-black">{user.name}</span></>
            ) : (
              t("account.addNameHint")
            )}
          </p>
          <Link
            href={`${prefix}/account/information`}
            className="mt-3 inline-block text-sm font-medium text-black underline hover:no-underline"
          >
            {t("account.editDetails")}
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-black">{t("account.ordersOverview")}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {ordersCount === 1
              ? t("account.ordersCount", { count: ordersCount })
              : t("account.ordersCountPlural", { count: ordersCount })}
          </p>
          <Link
            href={`${prefix}/account/orders`}
            className="mt-3 inline-block text-sm font-medium text-black underline hover:no-underline"
          >
            {t("account.viewOrderHistory")}
          </Link>
        </section>
      </div>
    </div>
  );
}
