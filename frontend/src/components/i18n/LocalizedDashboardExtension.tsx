"use client";

import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedDashboardExtension() {
  const { langue } = useLanguage();
  const t = traductions[langue].extension;
  return <header className="skuup-dashboard-page-header"><p className="skuup-kicker">{t.kicker}</p><h2 id="extension-title" className="skuup-dashboard-page-title">{t.dashboardHeading}</h2><p>{t.dashboardDescription}</p></header>;
}
