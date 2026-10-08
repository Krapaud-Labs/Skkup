import type { Metadata } from "next";
import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { LocalizedDashboardExtension } from "@/components/i18n/LocalizedDashboardExtension";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { CHROME_WEB_STORE_URL } from "@/lib/extension";

export const metadata: Metadata = { title: "Extension | Dashboard | Skkup" };

export default function DashboardExtensionPage() {
  return <div className="skuup-dashboard-page skuup-extension-page">
    <LocalizedDashboardExtension />
    <section className="skuup-extension-benefits" aria-label="Fonctionnalités de l’extension">
      <div><SkkupIcon name="streams" size={28} /><strong>Détection automatique du visionnage</strong><span>Les signaux utiles sont suivis sur les plateformes compatibles.</span></div>
      <div><SkkupIcon name="points" size={28} /><strong>Validation des points côté serveur</strong><span>Le serveur reste la source de vérité de ton activité.</span></div>
      <div><SkkupIcon name="shield" size={28} /><strong>Sûre et respectueuse de ta vie privée</strong><span>Aucune collecte au-delà du fonctionnement du service.</span></div>
    </section>
    <div className="skuup-extension-layout">
      <div className="skuup-extension-main">
        <section className="skuup-premium-panel" aria-labelledby="extension-browsers-title">
          <div className="skuup-extension-section-heading"><div><p className="skuup-kicker">Installation</p><h2 id="extension-browsers-title">Navigateurs compatibles</h2><p>L’extension Skkup est disponible sur les principaux navigateurs.</p></div><SkkupIcon name="extension" size={30} /></div>
          <div className="skuup-browser-grid">
            {[["Chrome", "Navigateur officiellement pris en charge", "chrome"]].map(([nom, note, icone]) => <article className="skuup-browser-card" key={nom}><span className={`skuup-browser-logo skuup-browser-${icone}`} aria-hidden="true"><SkkupIcon name="extension" size={25} /></span><div><strong>{nom}</strong><small>{note}</small></div><span className="skuup-status-badge skuup-status-success"><SkkupIcon name="check" size={14} />Compatible</span><a className="skuup-button skuup-button-primary" href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer">Installer depuis le Chrome Web Store <span aria-hidden="true">↗</span></a></article>)}
          </div>
        </section>
        <section className="skuup-premium-panel skuup-extension-steps" aria-labelledby="extension-steps-title">
          <div className="skuup-extension-section-heading"><div><p className="skuup-kicker">Appariement sécurisé</p><h2 id="extension-steps-title">Associer ton extension</h2><p>Génère un code temporaire, installe l’extension, puis associe ton navigateur.</p></div><SkkupIcon name="arrow" size={30} /></div>
          <div className="skuup-extension-step-row"><div><b>1</b><strong>Générer un code</strong><span>Crée un code unique et temporaire.</span></div><div><b>2</b><strong>Installer</strong><span>Installe l’extension sur ton navigateur.</span></div><div><b>3</b><strong>Associer</strong><span>Saisis le code dans l’extension.</span></div></div>
          <CodeAppariement />
        </section>
        <section className="skuup-premium-panel" aria-labelledby="extension-platforms-title"><div className="skuup-extension-section-heading"><div><p className="skuup-kicker">Vérification</p><h2 id="extension-platforms-title">Vérifie que tout fonctionne</h2><p>Ouvre un direct authentifié sur l’une de ces plateformes après l’association.</p></div></div><div className="skuup-platform-grid">{[["Twitch", "streams"], ["YouTube Live", "play"], ["Kick", "play"]].map(([nom, icon]) => <article key={nom}><SkkupIcon name={icon as "streams" | "play"} size={26} /><strong>{nom}</strong><span>Détection active après association.</span></article>)}</div></section>
      </div>
      <aside className="skuup-extension-aside">
        <section className="skuup-premium-panel skuup-extension-status-card" aria-labelledby="extension-status-title"><div className="skuup-extension-section-heading"><div><p className="skuup-kicker">État de l’extension</p><h2 id="extension-status-title"><span className="skuup-status-dot" />Appariement du compte</h2></div><SkkupIcon name="shield" size={34} /></div><p>L’état réel de ton navigateur associé et de tes sessions est affiché dans le panneau ci-dessous.</p><a href="#extension-steps-title" className="skuup-button skuup-button-outline">Voir l’appariement <span aria-hidden="true">↓</span></a></section>
        <section className="skuup-premium-panel" aria-labelledby="extension-privacy-title"><div className="skuup-extension-section-heading"><div><p className="skuup-kicker">Confiance</p><h2 id="extension-privacy-title">Confidentialité &amp; autorisations</h2></div><SkkupIcon name="lock" size={30} /></div><p>L’extension est conçue pour être minimale, sécurisée et transparente.</p><ul className="skuup-extension-check-list"><li><SkkupIcon name="check" size={16} />Aucun accès à ton historique de navigation</li><li><SkkupIcon name="check" size={16} />Aucune collecte de données personnelles</li><li><SkkupIcon name="check" size={16} />Détection limitée aux lectures compatibles</li><li><SkkupIcon name="check" size={16} />Validation des points effectuée côté serveur</li></ul></section>
      </aside>
    </div>
  </div>;
}
