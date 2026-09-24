"use client";

import { ListeTirages } from "@/components/raffles/ListeTirages";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function DashboardTiragesPage() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Transparent results" : "Résultats transparents"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "Draws and winners" : "Tirages et gagnants"}</h1>
        <p>{anglais ? "Review active prizes, planned dates and published results." : "Retrouve les lots en jeu, les dates prévues et les résultats déjà publiés."}</p>
      </header>
      <ListeTirages />
    </div>
  );
}
