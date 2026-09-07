import type { Metadata } from "next";
import { ListeTirages } from "@/components/raffles/ListeTirages";

export const metadata: Metadata = { title: "Tirages | Dashboard | Skkup" };

export default function DashboardTiragesPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">Résultats transparents</p>
        <h1 className="skuup-dashboard-page-title">Tirages et gagnants</h1>
        <p>Retrouve les lots en jeu, les dates prévues et les résultats déjà publiés.</p>
      </header>
      <ListeTirages />
    </div>
  );
}
