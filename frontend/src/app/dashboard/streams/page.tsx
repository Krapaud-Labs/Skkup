import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";
import { CodeAppariement } from "@/components/extension/CodeAppariement";

export const metadata: Metadata = { title: "Streams | Dashboard | Skkup" };

export default function DashboardStreamsPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">Visionnage libre</p>
        <h1 className="skuup-dashboard-page-title">Regarde ce que tu veux</h1>
        <p>Choisis ton direct sur Twitch, YouTube ou Facebook Live. L&apos;extension Skkup suit ton visionnage depuis l&apos;onglet choisi.</p>
      </header>
      <ListeStreams />
      <section className="skuup-dashboard-narrow-content mt-10" aria-labelledby="extension-title">
        <header className="skuup-dashboard-page-header">
          <p className="skuup-kicker">Ton extension Skkup</p>
          <h2 id="extension-title" className="skuup-dashboard-page-title">Associe ton navigateur</h2>
          <p>Génère un code temporaire pour relier l&apos;extension à ton compte sans exposer ton mot de passe.</p>
        </header>
        <CodeAppariement />
      </section>
    </div>
  );
}
