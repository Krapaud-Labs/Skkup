"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

const contenu = {
  fr: { kicker: "Besoin d’un repère ?", title: "Questions fréquentes", intro: "Tout ce qu’il faut savoir pour regarder, suivre ses points et comprendre les tirages Skkup.", back: "Retour à l’accueil", questions: [["Qu’est-ce que Skkup ?", "Skkup permet de découvrir des streams et de gagner des points grâce au visionnage validé, selon les règles affichées."], ["Comment sont validés les points ?", "L’extension Skkup observe ton visionnage actif sur Twitch, YouTube ou Facebook Live et transmet uniquement les signaux nécessaires."], ["Dois-je acheter quelque chose ?", "Non. La participation est gratuite et aucun achat n’est nécessaire pour utiliser le service."], ["Où voir les lots et les tirages ?", "Les streams disponibles, les lots actifs et les résultats publiés sont regroupés dans les espaces dédiés de Skkup."]] },
  en: { kicker: "Need a quick answer?", title: "Frequently asked questions", intro: "Everything you need to know about watching, tracking points and understanding Skkup draws.", back: "Back to home", questions: [["What is Skkup?", "Skkup helps you discover streams and earn points through validated viewing, according to the displayed rules."], ["How are points validated?", "The Skkup extension observes active viewing on Twitch, YouTube or Facebook Live and sends only the signals required."], ["Do I need to buy anything?", "No. Participation is free and no purchase is required to use the service."], ["Where can I see prizes and draws?", "Available streams, active prizes and published results are grouped in Skkup’s dedicated spaces."]] },
} as const;

export function FaqContent() {
  const { langue } = useLanguage();
  const t = contenu[langue];
  return <section className="mx-auto max-w-4xl px-6 pb-20 pt-14"><p className="skuup-kicker">{t.kicker}</p><h1 className="skuup-section-title mt-3 text-4xl sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">{t.intro}</p><div className="mt-12 grid gap-4">{t.questions.map(([question, answer]) => <article key={question} className="skuup-faq-card"><h2>{question}</h2><p>{answer}</p></article>)}</div><Link href="/" className="skuup-button skuup-button-outline mt-10">{t.back}</Link></section>;
}
