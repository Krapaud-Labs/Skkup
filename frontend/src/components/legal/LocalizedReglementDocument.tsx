"use client";

import { reglementMarkdown } from "@/content/reglement";
import { reglementMarkdownEn } from "@/content/reglement-en";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import Link from "next/link";

function nettoyerMarkdown(texte: string) {
  return texte.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

function rendreMarkdown(texte: string) {
  const morceaux = texte.split(/(\[[^\]]+\]\([^\)]+\))/g);
  return morceaux.map((morceau, index) => {
    const lien = morceau.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (!lien) return <span key={index}>{nettoyerMarkdown(morceau)}</span>;
    const label = lien[1];
    const href = lien[2];
    return href.startsWith("/") ? <Link key={index} href={href} className="underline decoration-accent-fuchsia/70 underline-offset-4">{label}</Link> : <a key={index} href={href} target="_blank" rel="noreferrer" className="underline decoration-accent-fuchsia/70 underline-offset-4">{label}</a>;
  });
}

export const clauseExtension = {
  fr: "En version 1.0, seuls les visionnages actifs reconnus sur Twitch, YouTube Gaming ou Kick via l'extension officielle Skkup dans Chrome de bureau peuvent générer des points de visionnage. Les applications natives, sur mobile ou ordinateur, les téléphones, tablettes, téléviseurs connectés et navigateurs sans l'extension ne sont pas éligibles. Les autres plateformes de streaming sont hors périmètre. Firefox et Opera ne sont pas pris en charge pour les points de visionnage en version 1.0; leur prise en charge est prévue en version 1.1.",
  en: "In version 1.0, only active viewing recognised on Twitch, YouTube Gaming or Kick through the official Skkup extension in desktop Google Chrome can earn viewing points. Native apps on mobile or desktop, phones, tablets, connected TVs, and browsers without the extension are not eligible. Other streaming platforms are out of scope. Firefox and Opera are not supported for viewing points in version 1.0; support is planned for version 1.1.",
} as const;

export function LocalizedReglementDocument() {
  const { langue } = useLanguage();
  const lignes = (langue === "en" ? reglementMarkdownEn : reglementMarkdown).split("\n");
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];
  const viderListe = () => {
    if (!liste.length) return;
    blocs.push(<ul key={`liste-${blocs.length}`} className="skuup-reglement-list">{liste.map((item) => <li key={item}>{rendreMarkdown(item)}</li>)}</ul>);
    liste = [];
  };
  lignes.forEach((ligne, index) => {
    const texte = ligne.trim();
    if (!texte) { viderListe(); return; }
    if (texte.startsWith("- ")) { liste.push(texte.slice(2)); return; }
    viderListe();
    const niveau = texte.match(/^(#{1,3})\s+(.*)$/);
    if (niveau) {
      const contenu = rendreMarkdown(niveau[2]);
      if (niveau[1].length === 1) return;
      else if (niveau[1].length === 2) {
        blocs.push(<h2 key={index} className="skuup-reglement-heading">{contenu}</h2>);
        if (/^Article 3\b|^Article 3\./.test(niveau[2])) {
          blocs.push(<p key={`extension-clause-${index}`} className="skuup-reglement-paragraph">{clauseExtension[langue]}</p>);
        }
      }
      else blocs.push(<h3 key={index} className="skuup-reglement-subheading">{contenu}</h3>);
      return;
    }
    blocs.push(<p key={index} className="skuup-reglement-paragraph">{rendreMarkdown(texte)}</p>);
  });
  viderListe();
  return <>{blocs}</>;
}
