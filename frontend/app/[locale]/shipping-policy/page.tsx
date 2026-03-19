import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { PolicyLayout } from "@/app/components/PolicyLayout";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

const baseUrl = "https://www.yerbatea.lv";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as "lv" | "en";

  const translations = await getTranslations(locale);
  const t = createT(translations);

  const title = `${t("shipping.title")} – YerbaTea`;
  const description = t("shipping.intro");
  const canonical = `${baseUrl}/${locale}/shipping-policy`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv/shipping-policy`,
        en: `${baseUrl}/en/shipping-policy`,
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

export default async function ShippingPolicyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const translations = await getTranslations(locale);
  const t = createT(translations);
  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <PolicyLayout
        locale={locale}
        title={t("shipping.title")}
        breadcrumbLabel={t("shipping.title")}
        intro={t("shipping.intro")}
        lastUpdatedLabel={t("terms.lastUpdated")}
        lastUpdatedDate={new Date().toLocaleDateString(locale === "lv" ? "lv-LV" : "en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      >
          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-black">{t("shipping.areasAndMethods")}</h2>
          <p className="mt-2 text-black">{t("shipping.areasAndMethodsContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-black">{t("shipping.dispatchTimes")}</h2>
          <p className="mt-2 text-black">{t("shipping.dispatchTimesContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-black">{t("shipping.deliveryAddress")}</h2>
          <p className="mt-2 text-black">{t("shipping.deliveryAddressContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-black">{t("shipping.riskAndOwnership")}</h2>
          <p className="mt-2 text-black">{t("shipping.riskAndOwnershipContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-black">{t("shipping.lostOrDamaged")}</h2>
          <p className="mt-2 text-black">
            {t("shipping.lostOrDamagedContentPrefix")}
            <Link href={`${prefix}/terms`} className="text-black underline">{t("footer.terms")}</Link>
            {t("shipping.lostOrDamagedContentSuffix")}
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-black">{t("shipping.returnsAndRefunds")}</h2>
          <p className="mt-2 text-black">{t("shipping.returnsAndRefundsContent")}</p>
      </PolicyLayout>
      <Footer locale={locale} />
    </div>
  );
}
