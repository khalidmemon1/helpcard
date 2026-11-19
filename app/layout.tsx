import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
