import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/app/components/cookie-consent";
import { NewsletterPopup } from "@/app/components/newsletter-popup";
import { Toaster } from "sonner";
import { Providers } from "./providers";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YerbaTea – Premium Yerba Mate & Mate Gourds",
  description: "Premium yerba mate and mate gourds, delivered to your door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${dmSans.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <Providers>
          {children}
        </Providers>
        <CookieConsent />
        <NewsletterPopup />
        <Toaster 
          position="top-right"
          toastOptions={{
            className: "font-sans",
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
