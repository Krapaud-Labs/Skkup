import type { CarteAGratter } from "@/lib/dashboard";

export type ZoneGrattage = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DispositionIllustrationCarte = {
  fichier: string;
  largeur: number;
  hauteur: number;
  decalageAlphaBasPct: number;
  zone: ZoneGrattage;
  /** Contour du papier à gratter, en pourcentages locaux de la zone rectangulaire. */
  contour: Array<[number, number]>;
  /** Centre typographique calculé sur la feuille grise, en pourcentages locaux. */
  reveal: { left: number; top: number; fontSize: string };
};

const dispositionsIllustrations: Record<string, DispositionIllustrationCarte> = {
  "03": { fichier: "03", largeur: 1671, hauteur: 941, decalageAlphaBasPct: 79 / 1671 * 100, zone: { left: 268 / 1671 * 100, top: 362 / 941 * 100, width: 1267 / 1671 * 100, height: 410 / 941 * 100 }, contour: [[25.7, 2.7], [93.5, 8], [98.5, 15], [99.1, 24], [99.1, 78], [96.5, 90], [3.7, 90], [.6, 82], [.5, 43], [2.4, 41], [5.5, 39], [9.5, 37], [13.5, 34], [17.7, 30], [20.8, 25], [22.6, 19], [24.1, 12]], reveal: { left: 52.7, top: 50.1, fontSize: "clamp(1.15rem, 4.7vw, 2.1rem)" } },
  "07": { fichier: "07", largeur: 1671, hauteur: 941, decalageAlphaBasPct: 57 / 1671 * 100, zone: { left: 253 / 1671 * 100, top: 361 / 941 * 100, width: 1302 / 1671 * 100, height: 423 / 941 * 100 }, contour: [[23, 1], [95, 5], [99, 11], [100, 20], [100, 59], [89, 95], [86, 96], [3, 95], [.5, 84], [0, 42], [2.5, 40], [6, 38], [10, 36], [14, 33], [18, 29], [20.5, 23], [22, 16]], reveal: { left: 52, top: 50.9, fontSize: "clamp(1.15rem, 4.8vw, 2.15rem)" } },
  "14": { fichier: "14", largeur: 1672, hauteur: 941, decalageAlphaBasPct: 66 / 1672 * 100, zone: { left: 271 / 1672 * 100, top: 361 / 941 * 100, width: 1285 / 1672 * 100, height: 411 / 941 * 100 }, contour: [[24.8, 1], [95.5, 8], [99.3, 16], [100, 25], [99.5, 79], [88, 94], [3, 93], [.5, 83], [0, 42], [3, 40], [7, 38], [11, 35], [15, 32], [19, 28], [22, 22], [23.5, 14]], reveal: { left: 52.4, top: 51.1, fontSize: "clamp(1.15rem, 4.7vw, 2.1rem)" } },
  platinum: { fichier: "platinum", largeur: 1672, hauteur: 941, decalageAlphaBasPct: 54 / 1672 * 100, zone: { left: 267 / 1672 * 100, top: 359 / 941 * 100, width: 1271 / 1672 * 100, height: 413 / 941 * 100 }, contour: [[24.5, 1], [95, 3], [99, 11], [100, 22], [99, 69], [86, 96], [3.5, 95], [.5, 83], [0, 42], [2.5, 40], [6, 38], [10, 35], [14.5, 32], [18.5, 28], [21.5, 22], [23.5, 13]], reveal: { left: 52.2, top: 50.6, fontSize: "clamp(1.1rem, 4.6vw, 2.05rem)" } },
  emerald: { fichier: "emerald", largeur: 1672, hauteur: 941, decalageAlphaBasPct: 75 / 1672 * 100, zone: { left: 268 / 1672 * 100, top: 361 / 941 * 100, width: 1063 / 1672 * 100, height: 398 / 941 * 100 }, contour: [[29.5, 1], [94, 1], [99, 8], [100, 16], [100, 48], [79, 95], [75, 96], [4, 95], [.5, 84], [0, 43], [3, 40], [7, 37], [12, 34], [17, 30], [21, 25], [25, 18], [28, 10]], reveal: { left: 51.4, top: 49.5, fontSize: "clamp(1.05rem, 4.3vw, 1.95rem)" } },
};

function cleIllustrationPalier(palier: number): string {
  return palier > 50 ? "emerald" : palier >= 30 ? "platinum" : palier >= 14 ? "14" : palier >= 7 ? "07" : "03";
}

export function dispositionIllustrationCarteParPalier(palier: number): DispositionIllustrationCarte {
  return dispositionsIllustrations[cleIllustrationPalier(palier)];
}

export function illustrationCarteParPalier(palier: number): string {
  const { fichier } = dispositionIllustrationCarteParPalier(palier);
  return `/assets/dashboard/rewards/scratch-tier-${fichier}.png?v=20261027-ticket-art`;
}

/** Formate uniquement le résultat reçu du backend, jamais un gain inventé côté client. */
export function libelleGainCarte(carte: CarteAGratter, english: boolean): string {
  const type = carte.gainType?.toLowerCase();
  if (type === "ticket") return english ? "Draw ticket" : "Ticket de tirage";
  if (type === "rien") return english ? "No reward this time" : "Pas de gain cette fois";
  if (carte.gainMontant !== null) return `${carte.gainMontant > 0 ? "+" : ""}${carte.gainMontant} ${english ? "points" : "points"}`;
  return english ? "Reward validated" : "Gain validé";
}
