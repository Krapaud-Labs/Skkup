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
      if (niveau[1].length === 1) blocs.push(<h1 key={index} className="skuup-dashboard-page-title">{contenu}</h1>);
      else if (niveau[1].length === 2) blocs.push(<h2 key={index} className="skuup-reglement-heading">{contenu}</h2>);
      else blocs.push(<h3 key={index} className="skuup-reglement-subheading">{contenu}</h3>);
      return;
    }
    blocs.push(<p key={index} className="skuup-reglement-paragraph">{rendreMarkdown(texte)}</p>);
  });
  viderListe();
  return <>{blocs}</>;
}
