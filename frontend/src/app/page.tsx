import type { Metadata } from "next";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { AnimationAuScroll } from "@/components/ui/AnimationAuScroll";
import { LocalizedHomeHero } from "@/components/i18n/LocalizedHomeHero";
import { LocalizedHomeSteps } from "@/components/i18n/LocalizedHomeSteps";
import { LocalizedHomeTrust } from "@/components/i18n/LocalizedHomeTrust";
import { LocalizedHomeCta } from "@/components/i18n/LocalizedHomeCta";

export const metadata: Metadata = {
  title: "Skkup | Regarder, accumuler, gagner",
  description:
    "Regarde librement tes streams, suis ton activité et découvre les tirages Skkup.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};


export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Skkup",
        url: "https://skkup.fr",
        logo: "https://skkup.fr/assets/brand/marks/skkup-s-favicon.png",
      },
      {
        "@type": "WebSite",
        name: "Skkup",
        url: "https://skkup.fr",
        inLanguage: "fr-FR",
      },
    ],
  };
  return <main className="skuup-shell skuup-vitrine">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <div aria-hidden="true" className="skuup-scroll-progress" />
    <EnteteVitrine actionHref="/connexion" actionLabel="Se connecter" />
    <AnimationAuScroll variante="zoom"><LocalizedHomeHero /></AnimationAuScroll>
    <AnimationAuScroll variante="montee" delay={80} className="skuup-reveal-stagger"><LocalizedHomeTrust /></AnimationAuScroll>
    <AnimationAuScroll variante="gauche" className="skuup-reveal-stagger"><LocalizedHomeSteps /></AnimationAuScroll>
    <LocalizedHomeCta />
  </main>;
}
