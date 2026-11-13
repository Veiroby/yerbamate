import type { Metadata } from "next";
import { Syne, Outfit } from "next/font/google";
import { CartProvider } from "./components/CartProvider";
import { TelegramProvider } from "./components/TelegramProvider";
import { TgHeader } from "./components/Header";
import "./tg.css";

const tgDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-tg-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

const tgBody = Outfit({
  subsets: ["latin"],
  variable: "--font-tg-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YerbaTea — Telegram order",
  description: "Order yerba mate from YerbaTea via Telegram",
  robots: { index: false, follow: false },
};

export default function TgLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <CartProvider>
        <div className={`tg-app ${tgDisplay.variable} ${tgBody.variable}`}>
          <div className="tg-shell">
            <TgHeader />
            {children}
          </div>
        </div>
      </CartProvider>
    </TelegramProvider>
  );
}
