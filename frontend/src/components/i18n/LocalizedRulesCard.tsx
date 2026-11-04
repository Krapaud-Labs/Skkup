"use client";

import type { ReactNode } from "react";
import { useLanguage } from "./LanguageProvider";

export function LocalizedRulesCard({
  children,
  dashboard = false,
}: {
  children: ReactNode;
  dashboard?: boolean;
}) {
  const { langue } = useLanguage();
  return (
    <section
      className={`skuup-reglement-card${dashboard ? " skuup-reglement-card-dashboard" : ""}`}
      aria-label={langue === "en" ? "Skkup game rules draft" : "Projet de règlement Skkup"}
    >
      {children}
    </section>
  );
}
