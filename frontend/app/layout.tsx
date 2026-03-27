import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/app/components/cookie-consent";
import { Toaster } from "sonner";
import { Providers } from "./providers";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

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
  metadataBase: new URL("https://www.yerbatea.lv"),
  icons: {
    icon: "/images/yerbatea-favicon-32.png",
    apple: "/images/yerbatea-apple-touch-icon-180.png",
  },
  openGraph: {
    title: "YerbaTea – Premium Yerba Mate & Mate Gourds",
    description: "Premium yerba mate and mate gourds, delivered to your door.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YerbaTea – Premium Yerba Mate & Mate Gourds",
    description: "Premium yerba mate and mate gourds, delivered to your door.",
  },
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
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`}
              strategy="afterInteractive"
            />
            <Script id="ga-gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}

        <Providers>
          {children}
          <CookieConsent />
        </Providers>
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
