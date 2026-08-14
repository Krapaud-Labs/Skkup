import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

// ==================== POLICE (DOCS/06-FRONTEND-DESIGN-SYSTEM.MD : SANS-SERIF BOLD) ====================
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

// ==================== MÉTADONNÉES DE LA PAGE (TITRE D'ONGLET, SEO) ====================
export const metadata: Metadata = {
  title: "Viewer Rewards",
  description:
    "Récompense les viewers de streams pour leur visionnage et leur fidélité.",
};

// ==================== LAYOUT RACINE ====================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
