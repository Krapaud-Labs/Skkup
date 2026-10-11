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
  fr: "Le suivi du visionnage et l'accumulation de points sont exclusivement assurés via l'extension navigateur officielle SKKUP, disponible sur navigateur web de bureau. Tout visionnage effectué depuis un appareil mobile, une application, un téléviseur connecté ou tout autre support ne disposant pas de l'extension installée ne pourra pas être pris en compte et ne générera aucun point. L'Organisateur ne pourra être tenu responsable de l'absence de comptabilisation liée à l'utilisation d'un support non compatible.",
  en: "Viewing tracking and point accumulation are exclusively provided through the official SKKUP browser extension, available on desktop web browsers. Viewing from a mobile device, an application, a connected television or any other support without the extension installed cannot be taken into account and will not generate points. The Organiser cannot be held liable for missing crediting caused by using an unsupported device or support.",
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
        if (/^Article 4\b|^Article 4\./.test(niveau[2])) {
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
