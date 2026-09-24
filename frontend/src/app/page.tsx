"use client";

import Link from "next/link";
import Image from "next/image";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { AnimationAuScroll } from "@/components/ui/AnimationAuScroll";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

const statistiques: [string, string, SkkupIconName][] = [["Temps", "visionnage validé", "eye"], ["Points", "gagnés au fil des streams", "points"], ["Tirages", "résultats vérifiables", "trophy"], ["Gratuit", "sans achat obligatoire", "shield"]];
const etapes = [
  { numero: "1", titre: "Tu regardes", description: "Choisis un stream et regarde-le à ton rythme.", image: "/images/skkup-step-watch.png", alt: "Une gameuse regarde le direct d'un streamer depuis son bureau" },
  { numero: "2", titre: "Tu accumules", description: "Chaque visionnage éligible te rapporte des points selon les règles affichées.", image: "/images/skkup-step-points-v2.png", alt: "Un viewer regarde le direct d'un streamer depuis son bureau", progression: true },
  { numero: "3", titre: "Tu gagnes", description: "Tes points te donnent des chances de gagner. Tirages réguliers, cadeaux réels.", image: "/images/skkup-step-reward.png", alt: "Un gamer découvre un casque et une manette dans un coffret cadeau" },
];

export default function Home() {
  const { langue } = useLanguage();
  const t = traductions[langue];
  const etapesTraduites = [
    { ...etapes[0], titre: t.watch, description: t.watchDescription },
    { ...etapes[1], titre: t.collect, description: t.collectDescription },
    { ...etapes[2], titre: t.win, description: t.winDescription },
  ];
  const lotsTraduits = [
    ["gift", t.partnerPrizes, t.partnerPrizesDescription, t.seeStreams],
    ["draws", t.upcomingDraws, t.upcomingDrawsDescription, t.seeDraws],
    ["check", t.publicResults, t.publicResultsDescription, t.transparency],
  ] as [SkkupIconName, string, string, string][];
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
    <AnimationAuScroll variante="zoom"><section className="skuup-hero mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-2"><div><p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-fuchsia-300">{t.heroKicker}</p><h1 aria-label={t.heroTitle} className="max-w-xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl">{t.heroTitle.split(" ").slice(0, -2).join(" ")}<br /><span className="skuup-gradient-text">{t.heroTitle.split(" ").slice(-2).join(" ")}</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">{t.heroDescription}</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/inscription" className="skuup-button">{t.start} <SkkupIcon name="arrow" size={18} /></Link><a href="#fonctionnement" className="skuup-button skuup-button-outline"><SkkupIcon name="play" size={17} /> {t.watchHow}</a></div></div><div className="skuup-prize-orbit" aria-label={t.partnerPrizes}><Image src="/images/skkup-hero-products-v3.png" alt={t.partnerPrizes} width={1024} height={1536} priority className="mx-auto h-auto max-h-[620px] w-full object-contain" /></div></section></AnimationAuScroll>
    <AnimationAuScroll variante="montee" delay={80} className="skuup-reveal-stagger"><section className="skuup-stats mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4">{statistiques.map(([valeur, libelle, icone]) => <div key={libelle} className="skuup-stat"><span className="skuup-stat-icon"><SkkupIcon name={icone} size={28} /></span><strong>{valeur}</strong><span>{libelle}</span></div>)}</section></AnimationAuScroll>
    <AnimationAuScroll variante="gauche" className="skuup-reveal-stagger"><section id="fonctionnement" className="mx-auto max-w-6xl px-6 py-20 text-center"><p className="skuup-kicker">{t.simple}</p><h2 className="skuup-section-title">{t.how} ?</h2><p className="mt-2 text-white/55">{t.threeSteps}</p><div className="mt-10 grid gap-5 md:grid-cols-3">{etapesTraduites.map(({ numero, titre, description, image, alt, progression }) => <article key={numero} className="skuup-step"><div className="skuup-step-media"><Image src={image} alt={alt} fill sizes="(min-width: 768px) 33vw, 100vw" /><span className="skuup-step-number">{numero}</span>{progression && <span className="skuup-step-progress" aria-hidden="true"><span>{t.collect}</span><i /></span>}</div><div className="skuup-step-content"><h3>{titre}</h3><p>{description}</p></div></article>)}</div><p className="mt-8 text-sm font-semibold text-fuchsia-300">{t.moreWatch}</p></section></AnimationAuScroll>
    <AnimationAuScroll variante="droite" className="skuup-reveal-stagger"><section id="lots" className="mx-auto max-w-6xl px-6 pb-16 text-center"><p className="skuup-kicker">{t.visible}</p><h2 className="skuup-section-title">{t.realSystem}</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{lotsTraduits.map(([visuel, titre, valeur, badge]) => <article key={titre} className="skuup-lot"><div className="skuup-lot-visual"><SkkupIcon name={visuel} size={42} /></div><h3>{titre}</h3><p>{valeur}</p><span className="skuup-badge"><SkkupIcon name="spark" size={12} /> {badge}</span></article>)}</div></section></AnimationAuScroll>
    <section id="engagement" className="mx-6 rounded-3xl border border-fuchsia-400/30 bg-gradient-to-r from-violet-700/70 to-fuchsia-600/70 px-6 py-8 sm:px-12"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">Prêt à commencer ?</h2><p className="mt-2 text-white/70">Crée ton compte, découvre les streams disponibles et suis tes points depuis ton tableau de bord.</p></div><Link href="/inscription" className="skuup-button whitespace-nowrap">Créer mon compte <SkkupIcon name="arrow" size={18} /></Link></div></section>
    <footer className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 px-6 py-8 text-sm text-white/55"><span><SkkupIcon name="shield" size={15} /> Gratuit</span><span><SkkupIcon name="eye" size={15} /> Visionnage vérifié</span><span><SkkupIcon name="trophy" size={15} /> Tirages transparents</span><span><SkkupIcon name="check" size={15} /> Données publiques</span></footer>
  </main>;
}
