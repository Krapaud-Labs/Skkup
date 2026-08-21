import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { NavigationGlobale } from "@/components/navigation/NavigationGlobale";

// ─── Police (docs/06-frontend-design-system.md : sans-serif bold) ────────────
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

// ─── Métadonnées de la page (titre d'onglet, SEO) ────────────────────────────
export const metadata: Metadata = {
  title: "Skkup",
  description:
    "Récompense les viewers de streams pour leur visionnage et leur fidélité.",
  icons: {
    icon: [
      { url: "/branding/skkup-s-favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/branding/skkup-s-favicon.png",
  },
};

// ─── Layout racine ───────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavigationGlobale />
        {children}
      </body>
    </html>
  );
}
