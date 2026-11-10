import type { Metadata } from "next";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { AnimationAuScroll } from "@/components/ui/AnimationAuScroll";
import { HomepageWheelSnapController } from "@/components/ui/HomepageWheelSnapController";
import { HomepageScrollIndicator } from "@/components/ui/HomepageScrollIndicator";
import { LocalizedHomeHero } from "@/components/i18n/LocalizedHomeHero";
import { LocalizedHomeSteps } from "@/components/i18n/LocalizedHomeSteps";
import { LocalizedHomeTrust } from "@/components/i18n/LocalizedHomeTrust";

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
  return <main className="skuup-shell skuup-vitrine skuup-homepage">
    <HomepageWheelSnapController />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <div aria-hidden="true" className="skuup-scroll-progress" />
    <section className="skuup-home-snap-section skuup-home-intro">
      <EnteteVitrine actionHref="/connexion" actionLabel="Se connecter" />
      <AnimationAuScroll variante="zoom"><LocalizedHomeHero /></AnimationAuScroll>
      <HomepageScrollIndicator />
    </section>
    <LocalizedHomeTrust />
    <LocalizedHomeSteps />
  </main>;
}
