"use client";

import { ListeStreams } from "@/components/streams/ListeStreams";
import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function DashboardStreamsPage() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Free viewing" : "Visionnage libre"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "Watch what you want" : "Regarde ce que tu veux"}</h1>
        <p>{anglais ? "Choose any live stream on Twitch, YouTube or Facebook Live. The Skkup extension tracks your viewing in the selected tab." : "Choisis ton direct sur Twitch, YouTube ou Facebook Live. L'extension Skkup suit ton visionnage depuis l'onglet choisi."}</p>
      </header>
      <ListeStreams />
      <section className="skuup-dashboard-narrow-content mt-10" aria-labelledby="extension-title">
        <header className="skuup-dashboard-page-header">
          <p className="skuup-kicker">{anglais ? "Your Skkup extension" : "Ton extension Skkup"}</p>
          <h2 id="extension-title" className="skuup-dashboard-page-title">{anglais ? "Pair your browser" : "Associe ton navigateur"}</h2>
          <p>{anglais ? "Generate a temporary code to link the extension to your account without exposing your password." : "Génère un code temporaire pour relier l'extension à ton compte sans exposer ton mot de passe."}</p>
        </header>
        <CodeAppariement />
      </section>
    </div>
  );
}
