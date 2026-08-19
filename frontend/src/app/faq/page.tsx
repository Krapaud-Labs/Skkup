import Link from "next/link";

const questions = [
  ["Qu’est-ce que Skuup ?", "Skuup permet de découvrir des streams partenaires et de gagner des points grâce au visionnage validé."],
  ["Comment sont validés les points ?", "La validation repose sur le visionnage du stream partenaire dans le lecteur prévu par Skuup. Les règles détaillées sont affichées dans les conditions du service."],
  ["Dois-je acheter quelque chose ?", "Non. La participation est gratuite et aucun achat n’est nécessaire pour utiliser le service."],
  ["Où voir les lots et les tirages ?", "Les streams partenaires, les lots actifs et les résultats publiés sont regroupés dans les espaces dédiés de Skuup."],
];

export default function FaqPage() {
  return <main className="skuup-vitrine min-h-screen"><header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/" className="skuup-logo" aria-label="Accueil Skuup"><span className="skuup-logo-wordmark">SKUUP</span></Link><Link href="/inscription" className="skuup-button skuup-button-small">S&apos;inscrire</Link></header><section className="mx-auto max-w-4xl px-6 pb-20 pt-14"><p className="skuup-kicker">Besoin d&apos;un repère ?</p><h1 className="skuup-section-title mt-3 text-4xl sm:text-6xl">Questions fréquentes</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">Tout ce qu&apos;il faut savoir pour regarder, suivre ses points et comprendre les tirages Skuup.</p><div className="mt-12 grid gap-4">{questions.map(([question, answer]) => <article key={question} className="skuup-faq-card"><h2>{question}</h2><p>{answer}</p></article>)}</div><Link href="/" className="skuup-button skuup-button-outline mt-10">Retour à l&apos;accueil</Link></section></main>;
}
