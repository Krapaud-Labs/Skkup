"use client";

import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LocalizedReglementDocument } from "./LocalizedReglementDocument";
import { lireContenuPublic, type ContenuPublic } from "@/lib/api";
import { useEffect, useState } from "react";

export function ReglementPublicContent() {
  const { langue } = useLanguage();
  const [managed, setManaged] = useState<ContenuPublic | null>(null);
  useEffect(() => { void lireContenuPublic("LEGAL", "reglement", langue).then(setManaged); }, [langue]);
  return <main className="skuup-vitrine min-h-screen"><header className="mx-auto max-w-6xl px-6 pb-8 pt-14"><LocalizedPageIntro page="rules" /></header><section className="skuup-reglement-card mx-auto max-w-5xl"><div className="skuup-reglement-status"><strong>{langue === "en" ? "English technical translation pending legal review" : "Version française publiée, à vérifier juridiquement"}</strong><span>{langue === "en" ? "This English version is a technical translation for user experience. Both language versions require human legal review before official publication." : "La version française et sa traduction anglaise doivent être relues juridiquement avant publication officielle."}</span></div>{managed?.sections ? managed.sections.map((section, index) => <article key={`${section.heading}-${index}`} className="mt-8 first:mt-0"><h2 className="skuup-reglement-heading mt-0">{section.heading}</h2><p className="skuup-reglement-paragraph whitespace-pre-wrap">{section.body}</p></article>) : <LocalizedReglementDocument />}</section></main>;
}
