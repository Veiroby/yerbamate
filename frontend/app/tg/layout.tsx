import type { Metadata } from "next";
import { CartProvider } from "./components/CartProvider";
import { TelegramProvider } from "./components/TelegramProvider";
import { TgHeader } from "./components/Header";

export const metadata: Metadata = {
  title: "YerbaTea — Telegram order",
  description: "Order yerba mate from YerbaTea via Telegram",
  robots: { index: false, follow: false },
};

export default function TgLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <CartProvider>
        <div className="mx-auto min-h-dvh max-w-lg px-4 pb-10 pt-1 text-[var(--tg-theme-text-color,var(--foreground))]">
          <TgHeader />
          {children}
        </div>
      </CartProvider>
    </TelegramProvider>
  );
}
