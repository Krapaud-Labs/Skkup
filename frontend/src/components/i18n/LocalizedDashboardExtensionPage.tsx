"use client";

import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { LocalizedDashboardExtension } from "./LocalizedDashboardExtension";
import { useLanguage } from "./LanguageProvider";

const copy = {
  fr: {
    secure: "Appariement sécurisé", pair: "Associer ton extension", pairDescription: "Installe l’extension, génère un code temporaire, puis associe ton navigateur.", steps: [["Installer", "Installe l’extension depuis le Chrome Web Store."], ["Générer un code", "Crée un code unique et temporaire."], ["Associer", "Saisis le code dans l’extension."]], supported: "Plateformes compatibles", supportedDescription: "La détection fonctionne après l’association sur ces plateformes.", active: "Détection active après association.", trust: "À retenir", privacy: "Un suivi simple et transparent", privacyDescription: "Les points sont validés côté serveur et l’extension reste limitée à son fonctionnement.", checks: ["Aucun accès à ton historique de navigation", "Aucune collecte de données personnelles", "Détection limitée aux lectures compatibles", "Validation des points effectuée côté serveur"],
  },
  en: {
    secure: "Secure pairing", pair: "Pair your extension", pairDescription: "Install the extension, generate a temporary code, then pair your browser.", steps: [["Install", "Install the extension from the Chrome Web Store."], ["Generate a code", "Create a unique temporary code."], ["Pair", "Enter the code in the extension."]], supported: "Supported platforms", supportedDescription: "Detection works after pairing on these platforms.", active: "Detection active after pairing.", trust: "Good to know", privacy: "Simple and transparent tracking", privacyDescription: "Points are validated server-side and the extension stays limited to what it needs.", checks: ["No access to your browsing history", "No personal data collection", "Detection limited to supported playback", "Points validated server-side"],
  },
} as const;

export function LocalizedDashboardExtensionPage() {
  const { langue } = useLanguage();
  const t = copy[langue];

  return <div className="skuup-dashboard-page skuup-extension-page">
    <LocalizedDashboardExtension />
    <section className="skuup-extension-unified-panel" aria-labelledby="extension-steps-title">
      <div className="skuup-extension-unified-intro"><div><p className="skuup-kicker">{t.secure}</p><h2 id="extension-steps-title">{t.pair}</h2><p>{t.pairDescription}</p></div><SkkupIcon name="extension" size={32} /></div>
      <div className="skuup-extension-step-row">{t.steps.map(([title, description], index) => <div key={title}><b>{index + 1}</b><strong>{title}</strong><span>{description}</span></div>)}</div>
      <CodeAppariement />
      <div className="skuup-extension-unified-info">
        <section aria-labelledby="extension-platforms-title"><p className="skuup-kicker">{t.supported}</p><h3 id="extension-platforms-title">{t.supportedDescription}</h3><div className="skuup-platform-grid">{[["Twitch", "streams"], ["YouTube Live", "play"], ["Kick", "play"]].map(([name, icon]) => <article key={name}><SkkupIcon name={icon as "streams" | "play"} size={24} /><strong>{name}</strong><span>{t.active}</span></article>)}</div></section>
        <section aria-labelledby="extension-privacy-title"><p className="skuup-kicker">{t.trust}</p><h3 id="extension-privacy-title">{t.privacy}</h3><p className="skuup-extension-unified-description">{t.privacyDescription}</p><ul className="skuup-extension-check-list">{t.checks.map((check) => <li key={check}><SkkupIcon name="check" size={16} />{check}</li>)}</ul></section>
      </div>
    </section>
  </div>;
}
