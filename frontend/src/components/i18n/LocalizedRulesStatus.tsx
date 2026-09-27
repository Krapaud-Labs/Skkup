"use client";

import { useLanguage } from "./LanguageProvider";

export function LocalizedRulesStatus() {
  const { langue } = useLanguage();
  return <div className="skuup-reglement-status"><strong>{langue === "en" ? "Updated on September 23, 2026" : "Version mise à jour le 23 septembre 2026"}</strong><span>{langue === "en" ? "These rules describe entries, points, tickets and draws. They require legal review before the official launch." : "Le règlement présente les modalités du jeu, des points, des tickets et des tirages. Il doit être relu juridiquement avant ouverture officielle."}</span></div>;
}
