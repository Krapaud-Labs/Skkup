import type { Metadata } from "next";
import "./globals.css";
import { NavigationGlobale } from "@/components/navigation/NavigationGlobale";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { publicMetadata } from "./public-metadata";

// ─── Métadonnées de la page (titre d'onglet, SEO) ────────────────────────────
export const metadata: Metadata = {
  ...publicMetadata({
    path: "/",
    title: "Skkup | Regarder, accumuler, gagner",
    description:
      "Regarde librement tes streams, suis ton activité et découvre les tirages Skkup.",
  }),
  metadataBase: new URL("https://skkup.fr"),
  icons: {
    icon: [
      { url: "/branding/skkup-s-favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/branding/skkup-s-favicon.png",
  },
  openGraph: {
    ...publicMetadata({
      path: "/",
      title: "Skkup | Regarder, accumuler, gagner",
      description:
        "Regarde librement tes streams, suis ton activité et découvre les tirages Skkup.",
    }).openGraph,
    url: "https://skkup.fr/",
    images: [{ url: "/images/skkup-hero-products-v3.png", width: 1024, height: 1536, alt: "Récompenses Skkup" }],
  },
  twitter: {
    ...publicMetadata({
      path: "/",
      title: "Skkup | Regarder, accumuler, gagner",
      description:
        "Regarde librement tes streams, suis ton activité et découvre les tirages Skkup.",
    }).twitter,
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
