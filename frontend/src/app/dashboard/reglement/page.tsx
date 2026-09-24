"use client";

import { reglementMarkdown } from "@/content/reglement";
import { useLanguage } from "@/components/i18n/LanguageProvider";

function nettoyerMarkdown(texte: string) {
  return texte
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function RenduReglement({ markdown }: { markdown: string }) {
  const lignes = markdown.split("\n");
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];
  let ordonnee = false;

  function viderListe() {
    if (!liste.length) return;
    const Tag = ordonnee ? "ol" : "ul";
    blocs.push(<Tag key={`liste-${blocs.length}`} className="skuup-reglement-list">{liste.map((item) => <li key={item}>{nettoyerMarkdown(item)}</li>)}</Tag>);
    liste = [];
    ordonnee = false;
  }

  lignes.forEach((ligne, index) => {
    const texte = ligne.trim();
    if (!texte) { viderListe(); return; }
    if (texte.startsWith("- ")) { if (ordonnee) viderListe(); liste.push(texte.slice(2)); return; }
    if (/^\d+\. /.test(texte)) { if (!ordonnee) viderListe(); ordonnee = true; liste.push(texte.replace(/^\d+\. /, "")); return; }
    viderListe();
    if (texte.startsWith("> ")) { blocs.push(<aside key={index} className="skuup-reglement-notice">{nettoyerMarkdown(texte.slice(2))}</aside>); return; }
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

export default function ReglementPage() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Transparency and rules" : "Transparence et règles"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "Game rules" : "Règlement du jeu"}</h1>
        <p>{anglais ? "Review the rules that apply to entries, tickets and Skkup draws." : "Retrouve ici les règles applicables aux participations, aux tickets et aux tirages Skkup."}</p>
      </header>
      <section className="skuup-reglement-card" aria-label="Projet de règlement Skkup">
        <div className="skuup-reglement-status"><strong>{anglais ? "Version updated September 23, 2026" : "Version mise à jour le 23 septembre 2026"}</strong><span>{anglais ? "These rules describe the game, points, tickets and draws. Legal review is required before official launch." : "Le règlement présente les modalités du jeu, des points, des tickets et des tirages. Il doit être relu juridiquement avant ouverture officielle."}</span></div>
        <RenduReglement markdown={reglementMarkdown} />
      </section>
    </div>
  );
}
