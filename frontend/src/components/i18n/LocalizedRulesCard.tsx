"use client";

import type { ReactNode } from "react";
import { useLanguage } from "./LanguageProvider";
import { LocalizedRulesStatus } from "./LocalizedRulesStatus";

export function LocalizedRulesCard({ children }: { children: ReactNode }) {
  const { langue } = useLanguage();
  return <section className="skuup-reglement-card" aria-label={langue === "en" ? "Skkup game rules draft" : "Projet de règlement Skkup"}><LocalizedRulesStatus />{children}</section>;
}
