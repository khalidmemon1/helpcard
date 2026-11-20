import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// Google Analytics ID comes from .env.local (git-ignored), so the public repo never holds it. No ID = no analytics.
const GA = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "HelpCard: a free emergency QR card",
  description:
    "Make a free emergency card with a QR code: blood group, allergies, medicines and who to call. Nothing is stored. Fun themes for kids.",
};
export const viewport: Viewport = { themeColor: "#d6d8dc" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* General Sans (Indian Type Foundry, free licence incl. commercial use) */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" />
      </head>
      <body>
        {children}
        {GA && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
            {/* The card's details live after "#" in the URL: send only origin + path, never the hash */}
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('set',{page_location:location.origin+location.pathname});gtag('config','${GA}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
