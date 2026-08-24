import type { Metadata } from "next";
import { ListeTirages } from "@/components/raffles/ListeTirages";

export const metadata: Metadata = {
  title: "Tirages | Skkup",
  description: "Découvre les tirages en cours, les lots et les résultats publiés.",
};

export default function PageTirages() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <p className="skuup-kicker">Résultats transparents</p>
        <h1 className="mt-2 text-4xl font-extrabold text-foreground">Tirages et gagnants</h1>
        <p className="mt-3 max-w-2xl text-foreground-muted">Retrouve les lots en jeu, les dates prévues et les résultats déjà publiés.</p>
      </header>
      <ListeTirages />
      </div>
    </main>
  );
}
