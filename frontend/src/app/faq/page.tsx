import type { Metadata } from "next";
import Link from "next/link";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";

export const metadata: Metadata = {
  title: "FAQ | Skkup",
  description: "Les réponses aux questions fréquentes sur Skkup, le visionnage libre et les tirages.",
  alternates: { canonical: "/faq" },
};

const questions = [
  ["Qu’est-ce que Skkup ?", "Skkup permet de découvrir des streams et de gagner des points grâce au visionnage validé, selon les règles affichées."],
  ["Comment sont validés les points ?", "L’extension Skkup observe ton visionnage actif sur Twitch, YouTube ou Facebook Live et transmet uniquement les signaux nécessaires. Les règles détaillées sont affichées dans les conditions du service."],
  ["Dois-je acheter quelque chose ?", "Non. La participation est gratuite et aucun achat n’est nécessaire pour utiliser le service."],
  ["Où voir les lots et les tirages ?", "Les streams disponibles, les lots actifs et les résultats publiés sont regroupés dans les espaces dédiés de Skkup."],
];

export default function FaqPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return <main className="skuup-vitrine min-h-screen"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" /><section className="mx-auto max-w-4xl px-6 pb-20 pt-14"><p className="skuup-kicker">Besoin d&apos;un repère ?</p><h1 className="skuup-section-title mt-3 text-4xl sm:text-6xl">Questions fréquentes</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">Tout ce qu&apos;il faut savoir pour regarder, suivre ses points et comprendre les tirages Skkup.</p><div className="mt-12 grid gap-4">{questions.map(([question, answer]) => <article key={question} className="skuup-faq-card"><h2>{question}</h2><p>{answer}</p></article>)}</div><Link href="/" className="skuup-button skuup-button-outline mt-10">Retour à l&apos;accueil</Link></section></main>;
}
