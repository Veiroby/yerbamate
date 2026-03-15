import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewsletterPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/account/profile`);

  const [subscribed, translations] = await Promise.all([
    prisma.newsletterSubscriber.findUnique({
      where: { email: user.email },
    }),
    getTranslations(locale),
  ]);
  const t = createT(translations);
  const prefix = `/${locale}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          {t("account.newsletterSubscriptions")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("account.manageEmailPreferences")}
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-black">{t("account.newsletter")}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {subscribed
            ? t("account.subscribedWith", { email: user.email })
            : t("account.notSubscribed")}
        </p>
        <Link
          href={prefix}
          className="mt-4 inline-block text-sm font-medium text-black underline hover:no-underline"
        >
          {t("account.backToHome")}
        </Link>
      </div>
    </div>
  );
}
