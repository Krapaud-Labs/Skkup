import { CarteGlow } from "./CarteGlow";

export interface Statistique {
  valeur: string;
  libelle: string;
}

interface BandeauStatsProps {
  statistiques: Statistique[];
}

// Bandeau de statistiques sociales (nombre de membres, tirages
// réalisés, cadeaux gagnés), pattern repris de la référence SKUP.
export function BandeauStats({ statistiques }: BandeauStatsProps) {
  return (
    <CarteGlow className="flex flex-col gap-4 sm:flex-row sm:justify-around sm:gap-0">
      {statistiques.map((stat) => (
        <div key={stat.libelle} className="text-center">
          <p className="text-3xl font-extrabold text-foreground">
            {stat.valeur}
          </p>
          <p className="text-sm text-foreground-muted">{stat.libelle}</p>
        </div>
      ))}
    </CarteGlow>
  );
}
