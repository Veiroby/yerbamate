"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * When the URL has ?saved=1, shows a success toast and replaces the URL to remove the param.
 * Add to layouts (admin, account) so any page that redirects with ?saved=1 after save gets a confirmation.
 */
export function SaveNotification() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef(false);

  useEffect(() => {
    const saved = searchParams.get("saved");
    if (saved !== "1") {
      shown.current = false;
      return;
    }
    if (shown.current) return;
    shown.current = true;
    toast.success("Saved successfully");
    const params = new URLSearchParams(searchParams);
    params.delete("saved");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams, router]);

  return null;
}
