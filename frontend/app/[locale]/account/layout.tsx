import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { AccountSidebar } from "@/app/account/account-sidebar";
import { SaveNotification } from "@/app/components/save-notification";
import { isValidLocale } from "@/lib/i18n";

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <SiteHeader user={null} locale={locale} />
        <main className="mx-auto max-w-md px-4 py-8">{children}</main>
        <Footer locale={locale} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <SaveNotification />
      <SiteHeader user={{ isAdmin: user.isAdmin }} locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <AccountSidebar variant="tabs" />
          <AccountSidebar variant="sidebar" />
          <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
