"use client";

import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { LocalizedDashboardExtension } from "./LocalizedDashboardExtension";
import { useLanguage } from "./LanguageProvider";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { CHROME_WEB_STORE_URL } from "@/lib/extension";

const copy = {
  fr: {
    benefitsLabel: "Fonctionnalités de l’extension", benefits: [["Détection automatique du visionnage", "Les signaux utiles sont suivis sur les plateformes compatibles."], ["Validation des points côté serveur", "Le serveur reste la source de vérité de ton activité."], ["Sûre et respectueuse de ta vie privée", "Aucune collecte au-delà du fonctionnement du service."]],
    installation: "Installation", browsers: "Navigateurs compatibles", browsersDescription: "L’extension Skkup est disponible sur les principaux navigateurs.", official: "Navigateur officiellement pris en charge", compatible: "Compatible", install: "Installer depuis le Chrome Web Store",
    secure: "Appariement sécurisé", pair: "Associer ton extension", pairDescription: "Génère un code temporaire, installe l’extension, puis associe ton navigateur.", steps: [["Générer un code", "Crée un code unique et temporaire."], ["Installer", "Installe l’extension sur ton navigateur."], ["Associer", "Saisis le code dans l’extension."]],
    verification: "Vérification", verify: "Vérifie que tout fonctionne", verifyDescription: "Ouvre un direct authentifié sur l’une de ces plateformes après l’association.", active: "Détection active après association.",
    status: "État de l’extension", account: "Appariement du compte", statusDescription: "L’état réel de ton navigateur associé et de tes sessions est affiché dans le panneau ci-dessous.", viewPairing: "Voir l’appariement", trust: "Confiance", privacy: "Confidentialité & autorisations", privacyDescription: "L’extension est conçue pour être minimale, sécurisée et transparente.", checks: ["Aucun accès à ton historique de navigation", "Aucune collecte de données personnelles", "Détection limitée aux lectures compatibles", "Validation des points effectuée côté serveur"],
  },
  en: {
    benefitsLabel: "Extension features", benefits: [["Automatic viewing detection", "Useful signals are tracked on supported platforms."], ["Server-side point validation", "The server remains the source of truth for your activity."], ["Safe and privacy-friendly", "No collection beyond what the service needs."]],
    installation: "Installation", browsers: "Supported browsers", browsersDescription: "The Skkup extension is available on the main browsers.", official: "Officially supported browser", compatible: "Compatible", install: "Install from the Chrome Web Store",
    secure: "Secure pairing", pair: "Pair your extension", pairDescription: "Generate a temporary code, install the extension, then pair your browser.", steps: [["Generate a code", "Create a unique temporary code."], ["Install", "Install the extension in your browser."], ["Pair", "Enter the code in the extension."]],
    verification: "Verification", verify: "Make sure everything works", verifyDescription: "Open an authenticated stream on one of these platforms after pairing.", active: "Detection active after pairing.",
    status: "Extension status", account: "Account pairing", statusDescription: "The actual state of your paired browser and sessions is shown below.", viewPairing: "View pairing", trust: "Trust", privacy: "Privacy & permissions", privacyDescription: "The extension is designed to be minimal, secure and transparent.", checks: ["No access to your browsing history", "No personal data collection", "Detection limited to supported playback", "Points validated server-side"],
  },
} as const;

export function LocalizedDashboardExtensionPage() {
  const { langue } = useLanguage();
  const t = copy[langue];
  return <div className="skuup-dashboard-page skuup-extension-page">
    <LocalizedDashboardExtension />
    <section className="skuup-extension-benefits" aria-label={t.benefitsLabel}>
      {t.benefits.map(([title, description], index) => <div key={title}><SkkupIcon name={(["streams", "points", "shield"] as const)[index]} size={28} /><strong>{title}</strong><span>{description}</span></div>)}
    </section>
    <div className="skuup-extension-layout">
      <div className="skuup-extension-main">
        <section className="skuup-premium-panel" aria-labelledby="extension-browsers-title">
          <div className="skuup-extension-section-heading"><div><p className="skuup-kicker">{t.installation}</p><h2 id="extension-browsers-title">{t.browsers}</h2><p>{t.browsersDescription}</p></div><SkkupIcon name="extension" size={30} /></div>
          <div className="skuup-browser-grid"><article className="skuup-browser-card"><span className="skuup-browser-logo skuup-browser-chrome" aria-hidden="true"><SkkupIcon name="extension" size={25} /></span><div><strong>Chrome</strong><small>{t.official}</small></div><span className="skuup-status-badge skuup-status-success"><SkkupIcon name="check" size={14} />{t.compatible}</span><a className="skuup-button skuup-button-primary" href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer">{t.install} <span aria-hidden="true">↗</span></a></article></div>
        </section>
        <section className="skuup-premium-panel skuup-extension-steps" aria-labelledby="extension-steps-title">
          <div className="skuup-extension-section-heading"><div><p className="skuup-kicker">{t.secure}</p><h2 id="extension-steps-title">{t.pair}</h2><p>{t.pairDescription}</p></div><SkkupIcon name="arrow" size={30} /></div>
          <div className="skuup-extension-step-row">{t.steps.map(([title, description], index) => <div key={title}><b>{index + 1}</b><strong>{title}</strong><span>{description}</span></div>)}</div>
          <CodeAppariement />
        </section>
        <section className="skuup-premium-panel" aria-labelledby="extension-platforms-title"><div className="skuup-extension-section-heading"><div><p className="skuup-kicker">{t.verification}</p><h2 id="extension-platforms-title">{t.verify}</h2><p>{t.verifyDescription}</p></div></div><div className="skuup-platform-grid">{[["Twitch", "streams"], ["YouTube Live", "play"], ["Kick", "play"]].map(([name, icon]) => <article key={name}><SkkupIcon name={icon as "streams" | "play"} size={26} /><strong>{name}</strong><span>{t.active}</span></article>)}</div></section>
      </div>
      <aside className="skuup-extension-aside">
        <section className="skuup-premium-panel skuup-extension-status-card" aria-labelledby="extension-status-title"><div className="skuup-extension-section-heading"><div><p className="skuup-kicker">{t.status}</p><h2 id="extension-status-title"><span className="skuup-status-dot" />{t.account}</h2></div><SkkupIcon name="shield" size={34} /></div><p>{t.statusDescription}</p><a href="#extension-steps-title" className="skuup-button skuup-button-outline">{t.viewPairing} <span aria-hidden="true">↓</span></a></section>
        <section className="skuup-premium-panel" aria-labelledby="extension-privacy-title"><div className="skuup-extension-section-heading"><div><p className="skuup-kicker">{t.trust}</p><h2 id="extension-privacy-title">{t.privacy}</h2></div><SkkupIcon name="lock" size={30} /></div><p>{t.privacyDescription}</p><ul className="skuup-extension-check-list">{t.checks.map((check) => <li key={check}><SkkupIcon name="check" size={16} />{check}</li>)}</ul></section>
      </aside>
    </div>
  </div>;
}
