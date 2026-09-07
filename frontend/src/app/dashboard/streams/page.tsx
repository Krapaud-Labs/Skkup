import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";

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
    </div>
  );
}
