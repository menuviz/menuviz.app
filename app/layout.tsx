import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://menuviz.app"),
  title: "MenuViz: your menu, in 3D",
  description:
    "A QR code on the table opens your menu in 3D. Every dish modeled, priced, and up to date. No app, no reprints.",
  alternates: { canonical: "https://menuviz.app" },
  openGraph: {
    title: "MenuViz: your menu, in 3D",
    description:
      "A QR code on the table opens your menu in 3D. Every dish modeled, priced, and up to date. No app, no reprints.",
    url: "https://menuviz.app",
    siteName: "MenuViz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuViz: your menu, in 3D",
    description:
      "A QR code on the table opens your menu in 3D. Every dish modeled, priced, and up to date. No app, no reprints.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
