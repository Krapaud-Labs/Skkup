"use client";

import { traductions, useLanguage } from "./LanguageProvider";
import { CHROME_WEB_STORE_URL } from "@/lib/extension";

export function LocalizedDashboardExtension() {
  const { langue } = useLanguage();
  const t = traductions[langue].extension;
  return <header className="skuup-dashboard-page-header skuup-extension-page-header"><div className="skuup-extension-page-heading"><img src="/branding/generated/skkup-icon-extension-dashboard.png" alt="" aria-hidden="true" /><div><p className="skuup-kicker">{t.kicker}</p><h1 id="extension-title" className="skuup-dashboard-page-title">{t.dashboardHeading}</h1><p>{t.dashboardDescription}</p></div></div><a className="skuup-button skuup-button-primary skuup-extension-install-button" data-testid="extension-install-link" href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label={t.installExtensionAria}>{t.installExtension}</a></header>;
}
