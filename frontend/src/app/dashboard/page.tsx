import type { Metadata } from "next";
import { TableauDeBord } from "@/components/dashboard/TableauDeBord";

export const metadata: Metadata = {
  title: "Tableau de bord | Skkup",
  description: "Ton solde de points, ta série de visites, tes cartes à gratter et tes tickets de tirage.",
};

export default function PageDashboard() {
  return (
    <div className="skuup-dashboard-page">
      <TableauDeBord />
    </div>
  );
}
