import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { PolicyLayout } from "@/app/components/PolicyLayout";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { getPolicyContent } from "@/lib/policies";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

const baseUrl = "https://www.yerbatea.lv";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as Locale;

  const translations = await getTranslations(locale);
  const t = createT(translations);

  const title = `${t("privacy.title")} – YerbaTea`;
  const description = t("privacy.intro");
  const canonical = `${baseUrl}/${locale}/privacy`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv/privacy`,
        en: `${baseUrl}/en/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const translations = await getTranslations(locale);
  const t = createT(translations);

   const policy = await getPolicyContent(
     "privacy",
     locale as Locale,
     {
       title: t("privacy.title"),
       content: t("privacy.intro"),
     },
   );

  return (
    <div className="min-h-screen bg-white text-black">
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
          <div className="mt-2 whitespace-pre-line text-sm text-black">
            {policy.content}
          </div>
      </PolicyLayout>
      <Footer locale={locale} />
    </div>
  );
}
