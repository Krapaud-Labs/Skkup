import { CarteGlow } from "./CarteGlow";
import { SkkupIcon, type SkkupIconName } from "./SkkupIcon";
import Image from "next/image";

export interface ProgressionStatistique {
  valeur: number;
  objectif: number;
  libelle: string;
}

export interface Statistique {
  valeur: string;
  libelle: string;
  icone?: SkkupIconName;
  imageSrc?: string;
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
        <div key={stat.libelle} className="skuup-stat-card min-w-0 px-3 text-left">
          {embedded && <SkkupIcon name="sparkle" size={16} className="skuup-stat-sparkle" />}
          {(stat.icone || stat.imageSrc) && <span className={`skuup-stat-icon${stat.imageSrc || stat.icone === "points" || stat.icone === "ticket" ? " skuup-stat-icon-image" : ""}`} aria-hidden="true">
            {stat.imageSrc ? <Image src={stat.imageSrc} alt="" width={48} height={48} priority /> : stat.icone ? <SkkupIcon name={stat.icone} size={stat.icone === "points" || stat.icone === "ticket" ? 48 : 22} /> : null}
          </span>}
          <div className="skuup-stat-content">
            <p className="text-sm leading-5 text-foreground-muted">{stat.libelle}</p>
            <p className="text-3xl font-extrabold text-foreground">{stat.valeur}</p>
          </div>
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
