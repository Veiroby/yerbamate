import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

function SettingsTile({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mobile-sheet flex items-center gap-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:bg-gray-50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-black">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      <span className="ml-auto text-gray-300" aria-hidden>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

export default async function AccountSettingsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const [user, translations] = await Promise.all([
    getCurrentUser(),
    getTranslations(locale),
  ]);
  if (!user) redirect(`/${locale}/account/profile`);
  const t = createT(translations);
  const prefix = `/${locale}`;

  return (
    <div className="space-y-5 max-lg:pb-2">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-black">
          {t("account.settings")}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <SettingsTile
          href={`${prefix}/account/profile`}
          title={t("account.settingsAccountLogin")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <SettingsTile
          href={`${prefix}/account/wishlist`}
          title={t("account.settingsPersonalization")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s-7-4.4-9.2-8.4C1.1 9.1 3 6.5 6.1 6.1c1.7-.2 3.2.6 3.9 1.7.7-1.1 2.2-1.9 3.9-1.7 3.1.4 5 3 3.3 6.5C19 16.6 12 21 12 21z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <SettingsTile
          href={`${prefix}/account/addresses`}
          title={t("account.settingsAddresses")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s6-5 6-10a6 6 0 10-12 0c0 5 6 10 6 10z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        />
        <SettingsTile
          href={`${prefix}/account/newsletter`}
          title={t("account.settingsNotifications")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 01-3.46 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <SettingsTile
          href={`${prefix}/account/information`}
          title={t("account.settingsConnections")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M10 13a5 5 0 010-7l1-1a5 5 0 017 7l-1 1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 11a5 5 0 010 7l-1 1a5 5 0 01-7-7l1-1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <SettingsTile
          href={`${prefix}/privacy`}
          title={t("account.settingsDataPrivacy")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 22s8-3 8-10V6l-8-3-8 3v6c0 7 8 10 8 10z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12l1.8 1.8L15 10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <SettingsTile
          href={prefix}
          title={t("account.settingsLanguage")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21a9 9 0 100-18 9 9 0 000 18z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M3.6 9h16.8M3.6 15h16.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <SettingsTile
          href={`${prefix}/account/profile`}
          title={t("account.settingsAppearance")}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3v18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M4 7h8a4 4 0 010 8H4z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M12 7h8v8h-8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          {t("account.logout")}
        </button>
      </form>

      <p className="pt-2 text-center text-[11px] text-gray-400">
        {t("footer.terms")} • {t("footer.privacy")}
      </p>
    </div>
  );
}

