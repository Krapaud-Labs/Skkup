import type { Metadata } from "next";
import { TableauDeBord } from "@/components/dashboard/TableauDeBord";
import { ChangerMotDePasse } from "@/components/auth/ChangerMotDePasse";

export const metadata: Metadata = {
  title: "Tableau de bord | Skkup",
  description:
    "Ton solde de points, ta série de visites, tes cartes à gratter et tes tickets de tirage.",
};

export default function PageDashboard() {
  return (
    <main className="skuup-app-shell min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
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
          <div className="skuup-dashboard-orb" aria-hidden="true">S</div>
        </header>

        <TableauDeBord />
        <ChangerMotDePasse />
      </div>
    </main>
  );
}
