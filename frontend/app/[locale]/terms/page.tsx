import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

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
  const prefix = `/${locale}`;
  const translations = await getTranslations(locale);
  const t = createT(translations);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <div className="mb-6 text-xs uppercase tracking-wide text-[#606C38]">
          <span className="opacity-70">{t("common.home")}</span>
          <span className="mx-1.5 opacity-50">/</span>
          <span className="font-semibold">{t("terms.title")}</span>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-[#FEFAE0] px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-[#283618] sm:text-3xl">
            {t("terms.title")}
          </h1>
          <p className="mb-6 text-sm text-[#606C38]">{t("terms.intro")}</p>
          <div className="prose max-w-none text-sm prose-p:text-[#606C38] prose-headings:text-[#283618]">

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.seller")}</h2>
          <p className="mt-2 text-[#606C38]">{t("terms.sellerContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.contractAndPrices")}</h2>
          <p className="mt-2 text-[#606C38]">{t("terms.contractAndPricesContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.delivery")}</h2>
          <p className="mt-2 text-[#606C38]">
            {t("terms.deliveryContentPrefix")}
            <Link href={`${prefix}/shipping-policy`} className="text-emerald-700 underline">{t("footer.shippingPolicy")}</Link>
            {t("terms.deliveryContentSuffix")}
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.withdrawal")}</h2>
          <p className="mt-2 text-[#606C38]">{t("terms.withdrawalContent1")}</p>
          <p className="mt-2 text-[#606C38]">{t("terms.withdrawalContent2")}</p>
          <p className="mt-2 text-[#606C38]">{t("terms.withdrawalContent3")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.legalGuarantee")}</h2>
          <p className="mt-2 text-[#606C38]">{t("terms.legalGuaranteeContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.paymentProcessing")}</h2>
          <p className="mt-2 text-[#606C38]">{t("terms.paymentProcessingContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("terms.disputes")}</h2>
          <p className="mt-2 text-[#606C38]">
            {t("terms.disputesContent")}{" "}
            <a href="https://www.ptac.gov.lv/en" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">www.ptac.gov.lv</a>
            {" "}
            <a href="https://ec.europa.eu/consumers/odr" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
          </p>

          <p className="mt-8 text-xs uppercase tracking-wide text-stone-500">
            {t("terms.lastUpdated")}:{" "}
            {new Date().toLocaleDateString(locale === "lv" ? "lv-LV" : "en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
