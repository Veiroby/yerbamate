import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { PolicyLayout } from "@/app/components/PolicyLayout";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { getPolicyContent } from "@/lib/policies";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Terms and conditions – YerbaTea",
  description: "Terms and conditions for YerbaTea.",
};

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const translations = await getTranslations(locale);
  const t = createT(translations);

  const policy = await getPolicyContent(
    "terms",
    locale as Locale,
    {
      title: t("terms.title"),
      content: "",
    },
  );

  return (
    <div className="min-h-screen bg-white text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <PolicyLayout
        locale={locale as Locale}
        title={policy.title}
        breadcrumbLabel={policy.title}
        intro={undefined}
        lastUpdatedLabel={t("terms.lastUpdated")}
        lastUpdatedDate={new Date().toLocaleDateString(locale === "lv" ? "lv-LV" : "en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      >
          <div className="mt-2 whitespace-pre-line text-sm text-[#606C38]">
            {policy.content}
          </div>
      </PolicyLayout>
      <Footer locale={locale} />
    </div>
  );
}
