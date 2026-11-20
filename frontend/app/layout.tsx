import type { Metadata } from "next";
import { bodoni, manrope, plexMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "Pagani AI Atelier | Bespoke Customization Studio",
  description: "AI-Powered Hypercar Customization & 3D Atelier for Pagani Utopia",
=======
  title: "Pagani Atelier — concept study",
  description: "From the first sketch to the owner's chapter. A concept study, not affiliated with Pagani Automobili S.p.A.",
>>>>>>> 9f45a4c8bd271f203581d0247c76bb578fbaf5fd
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
<<<<<<< HEAD
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
=======
      className={`${bodoni.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
>>>>>>> 9f45a4c8bd271f203581d0247c76bb578fbaf5fd
    >
      <body className="min-h-full flex flex-col bg-[#08090B] text-zinc-100">{children}</body>
    </html>
  );
}
