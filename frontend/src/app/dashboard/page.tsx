import type { Metadata } from "next";
import { TableauDeBord } from "@/components/dashboard/TableauDeBord";

export const metadata: Metadata = {
  title: "Tableau de bord | Skuup",
  description:
    "Ton solde de points, ta série de visites, tes cartes à gratter et tes tickets de tirage.",
};

export default function PageDashboard() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <h1 className="text-4xl font-extrabold text-foreground">
          Tableau de bord
        </h1>
        <p className="mt-2 text-foreground-muted">
          Ton solde de points, ta série de visites et tes gains, mis à jour en
          direct.
        </p>
      </header>

      <TableauDeBord />
      </div>
    </main>
  );
}
