import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MenuViz: your menu, in pictures",
  description:
    "A QR code on the table opens your menu as photographs. Every dish pictured, priced, and up to date. No app, no reprints.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
