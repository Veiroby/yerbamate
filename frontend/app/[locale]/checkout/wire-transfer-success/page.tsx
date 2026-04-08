import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { getCurrentUser } from "@/lib/auth";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderNumber?: string }>;
};

export default async function WireTransferSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const { orderNumber } = await searchParams;
  const prefix = `/${locale}`;
  const translations = await getTranslations(locale);
  const t = createT(translations);

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto w-full max-w-2xl px-3 py-16 max-lg:max-w-none sm:px-4">
        <div className="rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-8 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#606C38]/20">
            <svg
              className="h-8 w-8 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="heading-page mb-2">{t("checkout.orderReceived")}</h1>

          {orderNumber && (
            <p className="mb-6 text-black">
              {t("checkout.orderNumber")}: <strong className="text-black">{orderNumber}</strong>
            </p>
          )}

          <div className="mb-6 rounded-xl bg-[#606C38]/10 p-6 text-left">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-black">
              {t("checkout.wireTransferInstructions")}
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-black">{t("checkout.bank")}</dt>
                <dd className="font-medium text-black">Swedbank</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black">{t("checkout.iban")}</dt>
                <dd className="font-mono font-medium text-black">
                  LV30HABA0551057129470
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black">{t("checkout.beneficiary")}</dt>
                <dd className="font-medium text-black">SIA YerbaTea</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black">{t("checkout.reference")}</dt>
                <dd className="font-mono font-medium text-black">
                  {orderNumber || t("checkout.yourOrderNumber")}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mb-6 rounded-xl border border-[#DDA15E]/50 bg-[#DDA15E]/15 p-4">
            <p className="text-sm text-black">
              {t("checkout.wireTransferImportant")}
            </p>
          </div>

          <p className="mb-6 text-sm text-black">
            {t("checkout.wireTransferReference", { orderNumber: orderNumber || t("checkout.wireTransferReferenceFallback") })}
          </p>

          <Link
            href={`${prefix}/products`}
            className="inline-flex items-center justify-center rounded-full bg-[#283618] px-6 py-2 text-sm font-medium uppercase tracking-wide text-[#FEFAE0] hover:bg-[#283618]/90"
          >
            {t("checkout.continueShoppingButton")}
          </Link>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
