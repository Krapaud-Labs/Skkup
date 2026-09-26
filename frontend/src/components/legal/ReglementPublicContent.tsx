"use client";

import { reglementMarkdown } from "@/content/reglement";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";
import { useLanguage } from "@/components/i18n/LanguageProvider";

function renderMarkdown(markdown: string) {
  return markdown.split("\n").map((line, index) => {
    const text = line.trim();
    if (!text) return null;
    if (text.startsWith("## ")) return <h2 key={index} className="skuup-reglement-heading">{text.slice(3)}</h2>;
    if (text.startsWith("# ")) return <h1 key={index} className="skuup-dashboard-page-title">{text.slice(2)}</h1>;
    if (text.startsWith("- ")) return <li key={index} className="skuup-reglement-paragraph">{text.slice(2)}</li>;
    return <p key={index} className="skuup-reglement-paragraph">{text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")}</p>;
  });
}

export function ReglementPublicContent() {
  const { langue } = useLanguage();
  return <main className="skuup-vitrine min-h-screen"><header className="mx-auto max-w-6xl px-6 pb-8 pt-14"><LocalizedPageIntro page="rules" /></header><section className="skuup-reglement-card mx-auto max-w-5xl"><div className="skuup-reglement-status"><strong>{langue === "en" ? "Published draft pending legal review" : "Version publiée à vérifier juridiquement"}</strong><span>{langue === "en" ? "The published rules are currently available in French only. A future English translation requires human legal review before publication." : "Le règlement publié est disponible en français. Toute traduction anglaise devra être relue juridiquement avant publication."}</span></div>{renderMarkdown(reglementMarkdown)}</section></main>;
}
