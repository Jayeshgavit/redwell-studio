import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/public-site";
import "./globals.css";

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  title: "Redwell Studio",
  description: "Create photo collages in your browser with layouts, text, and simple design tools.",
  ...(siteOrigin ? { metadataBase: new URL(siteOrigin) } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
