import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { AnimationAuScroll } from "@/components/ui/AnimationAuScroll";
import { LocalizedHomeHero } from "@/components/i18n/LocalizedHomeHero";
import { LocalizedHomeSteps } from "@/components/i18n/LocalizedHomeSteps";
import { LocalizedHomeTrust } from "@/components/i18n/LocalizedHomeTrust";
import { LocalizedHomeCta } from "@/components/i18n/LocalizedHomeCta";


export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Skkup",
        url: "https://skkup.fr",
        logo: "https://skkup.fr/branding/skkup-s-favicon.png",
      },
      {
        "@type": "WebSite",
        "@id": "https://skkup.fr/#website",
        name: "Skkup",
        url: "https://skkup.fr",
        inLanguage: ["fr-FR", "en-US"],
      },
    ],
  };
  return <main className="skuup-vitrine">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <div aria-hidden="true" className="skuup-scroll-progress" />
    <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
    <AnimationAuScroll variante="zoom"><LocalizedHomeHero /></AnimationAuScroll>
    <AnimationAuScroll variante="montee" delay={80} className="skuup-reveal-stagger"><LocalizedHomeTrust /></AnimationAuScroll>
    <AnimationAuScroll variante="gauche" className="skuup-reveal-stagger"><LocalizedHomeSteps /></AnimationAuScroll>
    <LocalizedHomeCta />
  </main>;
}
