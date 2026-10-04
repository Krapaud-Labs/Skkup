import { CarteGlow } from "./CarteGlow";
import { SkkupIcon, type SkkupIconName } from "./SkkupIcon";

export interface ProgressionStatistique {
  valeur: number;
  objectif: number;
  libelle: string;
}

export interface Statistique {
  valeur: string;
  libelle: string;
  icone?: SkkupIconName;
  progression?: ProgressionStatistique;
  activite?: boolean;
}

interface BandeauStatsProps {
  statistiques: Statistique[];
  embedded?: boolean;
}

// Bandeau de statistiques sociales (nombre de membres, tirages
// réalisés, cadeaux gagnés), pattern repris de la référence SKUP.
export function BandeauStats({ statistiques, embedded = false }: BandeauStatsProps) {
  const contenu = (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">
      {statistiques.map((stat) => (
        <div key={stat.libelle} className="skuup-stat-card min-w-0 px-3 text-center">
          {stat.icone && <span className="skuup-stat-icon" aria-hidden="true"><SkkupIcon name={stat.icone} size={22} /></span>}
          <p className="text-3xl font-extrabold text-foreground">
            {stat.valeur}
          </p>
          <p className="text-sm leading-5 text-foreground-muted">
            {stat.libelle}
          </p>
          {(stat.progression || stat.activite) && (
            <div
              className={`skuup-stat-meter${stat.activite ? " skuup-stat-meter-pulse" : ""}`}
              role={stat.progression ? "progressbar" : undefined}
              aria-valuemin={stat.progression ? 0 : undefined}
              aria-valuemax={stat.progression?.objectif}
              aria-valuenow={stat.progression ? Math.min(stat.progression.valeur, stat.progression.objectif) : undefined}
              aria-label={stat.progression?.libelle ?? "Activité disponible"}
            >
              {stat.progression && (
                <span style={{ width: `${Math.min(100, Math.max(0, (stat.progression.valeur / stat.progression.objectif) * 100))}%` }} />
              )}
            </div>
          )}
          {stat.progression && (
            <p className="skuup-stat-progress-label">{stat.progression.libelle}</p>
          )}
        </div>
      ))}
    </div>
  );
  return embedded ? contenu : <CarteGlow className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">{contenu.props.children}</CarteGlow>;
}
