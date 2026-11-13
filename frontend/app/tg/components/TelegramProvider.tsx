"use client";

import { useEffect } from "react";
import { useTelegramWebApp } from "../lib/telegram";

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const webApp = useTelegramWebApp();

  useEffect(() => {
    if (!webApp) return;
    try {
      webApp.ready();
      webApp.expand();
      webApp.setHeaderColor("secondary_bg_color");
      webApp.setBackgroundColor("bg_color");
    } catch {
      // Outside Telegram — ignore SDK errors.
    }
  }, [webApp]);

  return <>{children}</>;
}
