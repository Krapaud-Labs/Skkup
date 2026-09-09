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
  metadataBase: new URL("https://skkup.fr"),
  alternates: { canonical: "/" },
  description:
    "Récompense les viewers de streams pour leur visionnage et leur fidélité.",
  icons: {
    icon: [
      { url: "/branding/skkup-s-favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/branding/skkup-s-favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://skkup.fr/",
    siteName: "Skkup",
    title: "Skkup | Regarder, accumuler, gagner",
    description:
      "Regarde librement tes streams, suis ton activité et découvre les tirages Skkup.",
    images: [{ url: "/images/skkup-hero-products-v3.png", width: 1024, height: 1536, alt: "Récompenses Skkup" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skkup | Regarder, accumuler, gagner",
    description:
      "Regarde librement tes streams et suis ton activité avec Skkup.",
    images: ["/images/skkup-hero-products-v3.png"],
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
