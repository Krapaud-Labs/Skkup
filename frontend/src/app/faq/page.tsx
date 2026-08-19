import Image from "next/image";
import Link from "next/link";

const questions = [
  ["Qu’est-ce que Skuup ?", "Tu peux regarder les streams que tu veux. Skuup ajoute un suivi et des points lorsque le stream fait partie du catalogue partenaire éligible."],
  ["Comment sont validés les points ?", "La validation concerne uniquement les streams du catalogue partenaire, regardés dans le lecteur prévu par Skuup. Les règles détaillées sont affichées dans les conditions du service."],
  ["Dois-je acheter quelque chose ?", "Non. La participation est gratuite et aucun achat n’est nécessaire pour utiliser le service."],
  ["Où voir les lots et les tirages ?", "Tu peux consulter les chaînes partenaires éligibles, les lots actifs et les résultats publiés dans les espaces dédiés de Skuup."],
];

export default function FaqPage() {
  return <main className="skuup-vitrine min-h-screen"><header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/" className="skuup-logo" aria-label="Accueil Skuup"><Image src="/images/skuup-logo.png" alt="SKUUP" width={164} height={42} priority /></Link><Link href="/inscription" className="skuup-button skuup-button-small">S&apos;inscrire</Link></header><section className="mx-auto max-w-4xl px-6 pb-20 pt-14"><p className="skuup-kicker">Besoin d&apos;un repère ?</p><h1 className="skuup-section-title mt-3 text-4xl sm:text-6xl">Questions fréquentes</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">Tout ce qu&apos;il faut savoir pour regarder, suivre ses points et comprendre les tirages Skuup.</p><div className="mt-12 grid gap-4">{questions.map(([question, answer]) => <article key={question} className="skuup-faq-card"><h2>{question}</h2><p>{answer}</p></article>)}</div><Link href="/" className="skuup-button skuup-button-outline mt-10">Retour à l&apos;accueil</Link></section></main>;
}
