import type { Metadata } from "next";
import Image from "next/image";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
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
        logo: "https://skkup.fr/assets/brand/search/skkup-organization-logo.png",
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
      <div aria-hidden="true" className="skuup-home-hero-artwork">
        <div className="skuup-home-hero-artboard">
          <Image className="skuup-home-hero-curve skuup-home-hero-curve-upper" src="/assets/marketing/hero/hero-light-loop-upper.png" alt="" width={2494} height={2728} sizes="100vw" priority />
          <Image className="skuup-home-hero-curve skuup-home-hero-curve-lower" src="/assets/marketing/hero/hero-light-trail-lower.png" alt="" width={2496} height={1721} sizes="100vw" priority />
          <Image className="skuup-home-hero-treasure" src="/assets/marketing/hero/treasure-base.png" alt="" width={1371} height={1148} sizes="100vw" priority />
        </div>
      </div>
      <EnteteVitrine variant="home" actionHref="/connexion" actionLabel="Se connecter" />
      <LocalizedHomeHero />
      <HomepageScrollIndicator />
    </section>
    <LocalizedHomeTrust />
    <LocalizedHomeSteps />
  </main>;
}
