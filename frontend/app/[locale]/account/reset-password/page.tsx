import Link from "next/link";
import { ResetPasswordForm } from "@/app/account/reset-password/reset-password-form";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const { token, error } = await searchParams;
  const prefix = `/${locale}`;
  const translations = await getTranslations(locale);
  const t = createT(translations);

  const errorMessage =
    error === "invalid_token"
      ? t("account.errorInvalidToken")
      : error === "missing_fields"
        ? t("account.errorMissingFields")
        : error === "too_many_attempts"
          ? t("account.errorTooManyAttempts")
          : error === "password_too_short"
            ? t("account.errorPasswordTooShort")
            : error === "password_needs_uppercase"
              ? t("account.errorPasswordUppercase")
              : error === "password_needs_lowercase"
                ? t("account.errorPasswordLowercase")
                : error === "password_needs_number"
                  ? t("account.errorPasswordNumber")
                  : error
                    ? t("account.errorGeneric")
                    : null;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-black">
        {t("account.resetPassword")}
      </h1>

      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {!token ? (
          <>
            <p className="text-sm text-gray-600">
              {t("account.invalidResetLink")}
            </p>
            <Link
              href={`${prefix}/account/forgot-password`}
              className="block text-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {t("account.requestNewResetLink")}
            </Link>
          </>
        ) : (
          <>
            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                {errorMessage}
              </p>
            )}

            {error === "invalid_token" ? (
              <Link
                href={`${prefix}/account/forgot-password`}
                className="block text-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                {t("account.requestNewResetLink")}
              </Link>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  {t("account.enterNewPassword")}
                </p>
                <ResetPasswordForm token={token} />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
