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
    <CarteGlow className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">
      {statistiques.map((stat) => (
        <div key={stat.libelle} className="min-w-0 px-3 text-center">
          <p className="text-3xl font-extrabold text-foreground">
            {stat.valeur}
          </p>
          <p className="text-sm leading-5 text-foreground-muted">
            {stat.libelle}
          </p>
        </div>
      ))}
    </CarteGlow>
  );
}
