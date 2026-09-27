"use client";

import { reglementMarkdown } from "@/content/reglement";
import { reglementMarkdownEn } from "@/content/reglement-en";
import { useLanguage } from "@/components/i18n/LanguageProvider";

function nettoyerMarkdown(texte: string) {
  return texte.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

export function LocalizedReglementDocument() {
  const { langue } = useLanguage();
  const lignes = (langue === "en" ? reglementMarkdownEn : reglementMarkdown).split("\n");
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];
  const viderListe = () => {
    if (!liste.length) return;
    blocs.push(<ul key={`liste-${blocs.length}`} className="skuup-reglement-list">{liste.map((item) => <li key={item}>{nettoyerMarkdown(item)}</li>)}</ul>);
    liste = [];
  };
  lignes.forEach((ligne, index) => {
    const texte = ligne.trim();
    if (!texte) { viderListe(); return; }
    if (texte.startsWith("- ")) { liste.push(texte.slice(2)); return; }
    viderListe();
    const niveau = texte.match(/^(#{1,3})\s+(.*)$/);
    if (niveau) {
      const contenu = nettoyerMarkdown(niveau[2]);
      if (niveau[1].length === 1) blocs.push(<h1 key={index} className="skuup-dashboard-page-title">{contenu}</h1>);
      else if (niveau[1].length === 2) blocs.push(<h2 key={index} className="skuup-reglement-heading">{contenu}</h2>);
      else blocs.push(<h3 key={index} className="skuup-reglement-subheading">{contenu}</h3>);
      return;
    }
    blocs.push(<p key={index} className="skuup-reglement-paragraph">{nettoyerMarkdown(texte)}</p>);
  });
  viderListe();
  return <>{blocs}</>;
}
