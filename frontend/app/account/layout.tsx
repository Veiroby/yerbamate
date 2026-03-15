import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { AccountSidebar } from "./account-sidebar";
import { SaveNotification } from "@/app/components/save-notification";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] text-[#1a1a1a]">
        <SiteHeader user={null} />
        <main className="mx-auto max-w-md px-4 py-8">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1a1a1a]">
      <SaveNotification />
      <SiteHeader user={{ isAdmin: user.isAdmin }} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex gap-8">
          <AccountSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
