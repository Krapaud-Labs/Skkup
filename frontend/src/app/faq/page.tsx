import type { Metadata } from "next";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { FaqContent } from "@/components/i18n/FaqContent";
import { publicMetadata } from "../public-metadata";

export const metadata: Metadata = publicMetadata({
  path: "/faq",
  title: "FAQ | Skkup",
  description: "Les réponses aux questions fréquentes sur Skkup, le visionnage libre et les tirages.",
});

const questions = [
  ["Qu’est-ce que Skkup ?", "Skkup permet de découvrir des streams et de gagner des points grâce au visionnage validé, selon les règles affichées."],
  ["Comment sont validés les points ?", "L’extension Skkup observe ton visionnage actif sur Twitch, YouTube ou Facebook Live et transmet uniquement les signaux nécessaires."],
  ["Dois-je acheter quelque chose ?", "Non. La participation est gratuite et aucun achat n’est nécessaire pour utiliser le service."],
  ["Où voir les lots et les tirages ?", "Les streams disponibles, les lots actifs et les résultats publiés sont regroupés dans les espaces dédiés de Skkup."],
];

export default function FaqPage() {
  // This JSON-LD matches the static French HTML delivered by Next.js. The
  // client-side language preference is not a stable crawler-visible locale.
  const structuredData = { "@context": "https://schema.org", "@type": "FAQPage", "@id": "https://skkup.fr/faq#faq", url: "https://skkup.fr/faq", inLanguage: "fr-FR", mainEntity: questions.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  return <main className="skuup-vitrine min-h-screen"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" /><FaqContent /></main>;
}
