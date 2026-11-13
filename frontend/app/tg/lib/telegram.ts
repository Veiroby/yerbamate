"use client";

import { useEffect, useState } from "react";

export type TelegramWebApp = typeof import("@twa-dev/sdk").default;

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("@twa-dev/sdk")
      .then((mod) => {
        if (!cancelled) setWebApp(mod.default);
      })
      .catch(() => {
        // Outside Telegram / SSR — ignore
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return webApp;
}
