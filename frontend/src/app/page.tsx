import Link from "next/link";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { AnimationAuScroll } from "@/components/ui/AnimationAuScroll";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { LocalizedHomeHero } from "@/components/i18n/LocalizedHomeHero";
import { LocalizedHomeSteps } from "@/components/i18n/LocalizedHomeSteps";
import { LocalizedHomeTrust } from "@/components/i18n/LocalizedHomeTrust";


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
        name: "Skkup",
        url: "https://skkup.fr",
        inLanguage: "fr-FR",
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
    <section id="engagement" className="mx-6 rounded-3xl border border-fuchsia-400/30 bg-gradient-to-r from-violet-700/70 to-fuchsia-600/70 px-6 py-8 sm:px-12"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">Prêt à commencer ?</h2><p className="mt-2 text-white/70">Crée ton compte, découvre les streams disponibles et suis tes points depuis ton tableau de bord.</p></div><Link href="/inscription" className="skuup-button whitespace-nowrap">Créer mon compte <SkkupIcon name="arrow" size={18} /></Link></div></section>
    <footer className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 px-6 py-8 text-sm text-white/55"><span><SkkupIcon name="shield" size={15} /> Gratuit</span><span><SkkupIcon name="eye" size={15} /> Visionnage vérifié</span><span><SkkupIcon name="trophy" size={15} /> Tirages transparents</span><span><SkkupIcon name="check" size={15} /> Données publiques</span></footer>
  </main>;
}
