import type { Metadata } from "next";
import "./globals.css";
import { NavigationGlobale } from "@/components/navigation/NavigationGlobale";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

// ─── Métadonnées de la page (titre d'onglet, SEO) ────────────────────────────
export const metadata: Metadata = {
  title: "Skkup | Regarder, accumuler, gagner",
  metadataBase: new URL("https://skkup.fr"),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  description:
    "Récompense les viewers de streams pour leur visionnage et leur fidélité.",
  icons: {
    icon: [
      { url: "/assets/brand/search/skkup-favicon.png", sizes: "1254x1254", type: "image/png" },
    ],
    apple: [
      { url: "/assets/brand/marks/apple-icon.png", sizes: "1254x1254", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://skkup.fr/",
    siteName: "Skkup",
    title: "Skkup | Regarder, accumuler, gagner",
    description:
      "Regarde librement tes streams, suis ton activité et découvre les tirages Skkup.",
    images: [{ url: "/assets/marketing/hero/skkup-hero-products.png", width: 1536, height: 1024, alt: "Récompenses Skkup" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skkup | Regarder, accumuler, gagner",
    description:
      "Regarde librement tes streams et suis ton activité avec Skkup.",
    images: ["/assets/marketing/hero/skkup-hero-products.png"],
  },
};

// ─── Layout racine ───────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <NavigationGlobale />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
