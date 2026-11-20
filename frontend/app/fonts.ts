import { Bodoni_Moda, Manrope, IBM_Plex_Mono } from "next/font/google";

export const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400"], variable: "--font-bodoni" });
export const manrope = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-manrope" });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });
