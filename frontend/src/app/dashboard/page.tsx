import Image from "next/image";
import type { Metadata } from "next";
import { TableauDeBord } from "@/components/dashboard/TableauDeBord";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";

export const metadata: Metadata = {
  title: "Tableau de bord | Skkup",
  description: "Ton solde de points, ta série de visites, tes cartes à gratter et tes tickets de tirage.",
};

export default function PageDashboard() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-hero">
        <div>
          <LocalizedPageIntro page="dashboard" />
        </div>
        <div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} className="skuup-dashboard-orb-logo" priority /></div>
      </header>
      <TableauDeBord />
    </div>
  );
}
