import Link from "next/link";
import { ForgotPasswordForm } from "@/app/account/forgot-password/forgot-password-form";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const prefix = `/${locale}`;
  const translations = await getTranslations(locale);
  const t = createT(translations);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-black">
        {t("account.forgotPassword")}
      </h1>

      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-gray-600">
          {t("account.forgotPasswordHint")}
        </p>

        <ForgotPasswordForm />

        <p className="text-center text-sm text-gray-500">
          {t("account.rememberPassword")}{" "}
          <Link
            href={`${prefix}/account/profile`}
            className="font-medium text-black underline hover:no-underline"
          >
            {t("account.signIn")}
          </Link>
        </p>
      </div>
    </>
  );
}
