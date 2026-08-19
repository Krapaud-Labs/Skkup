import Link from "next/link";
import { BandeauStats } from "@/components/ui/BandeauStats";
import { BarreProgressionStreak } from "@/components/ui/BarreProgressionStreak";
import { classesBoutonCTA } from "@/components/ui/BoutonCTA";
import { CarteGlow } from "@/components/ui/CarteGlow";

// Page d'accueil temporaire : sert de vitrine au design system (thème
// gamer néon) le temps que la vraie page vitrine soit implémentée.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-extrabold text-foreground">
        Skuup
      </h1>
      <p className="text-center text-foreground-muted">
        Projet en cours d&apos;initialisation, design system en place.
      </p>

      <BandeauStats
        statistiques={[
          { valeur: "0", libelle: "membres inscrits" },
          { valeur: "0", libelle: "tirages réalisés" },
          { valeur: "0", libelle: "cadeaux gagnés" },
        ]}
      />

      <CarteGlow className="w-full">
        <BarreProgressionStreak streakActuel={3} prochainPalier={7} />
      </CarteGlow>

      <Link href="/inscription" className={classesBoutonCTA("primaire")}>
        Je commence gratuitement
      </Link>
    </main>
  );
}
