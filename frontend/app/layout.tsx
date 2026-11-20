import type { Metadata } from "next";
import { bodoni, manrope, plexMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pagani Atelier — concept study",
  description: "From the first sketch to the owner's chapter. A concept study, not affiliated with Pagani Automobili S.p.A.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
