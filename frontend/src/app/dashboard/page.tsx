import Image from "next/image";
import type { Metadata } from "next";
import { TableauDeBord } from "@/components/dashboard/TableauDeBord";

export const metadata: Metadata = {
  title: "Tableau de bord | Skkup",
  description: "Ton solde de points, ta série de visites, tes cartes à gratter et tes tickets de tirage.",
};

export default function PageDashboard() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-hero">
        <div>
          <p className="skuup-kicker">Espace viewer</p>
          <h1 className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
            Ton aventure <span className="skuup-gradient-text">Skkup</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
            Suis tes points, garde ta série active et retrouve tous tes parcours depuis un seul espace.
          </p>
        </div>
        <div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} className="skuup-dashboard-orb-logo" priority /></div>
      </header>
      <TableauDeBord />
    </div>
  );
}
