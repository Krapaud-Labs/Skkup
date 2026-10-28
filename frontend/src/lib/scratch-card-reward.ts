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
  /** Emprise du masque de feuille grise, mesurée dans le PNG source. */
  zone: ZoneGrattage;
  /** Centroïde du masque PNG, exprimé dans l'image complète. */
  reveal: { left: number; top: number; fontSize: string };
};

const dispositionsIllustrations: Record<string, DispositionIllustrationCarte> = {
  "03": { fichier: "03", largeur: 1671, hauteur: 941, decalageAlphaBasPct: 79 / 1671 * 100, zone: { left: 269 / 1671 * 100, top: 361 / 941 * 100, width: 1266 / 1671 * 100, height: 411 / 941 * 100 }, reveal: { left: 56.2035, top: 61.7419, fontSize: "clamp(1.15rem, 4.7vw, 2.1rem)" } },
  "07": { fichier: "07", largeur: 1671, hauteur: 941, decalageAlphaBasPct: 57 / 1671 * 100, zone: { left: 253 / 1671 * 100, top: 359 / 941 * 100, width: 1302 / 1671 * 100, height: 426 / 941 * 100 }, reveal: { left: 54.0990, top: 62.6615, fontSize: "clamp(1.15rem, 4.8vw, 2.15rem)" } },
  "14": { fichier: "14", largeur: 1672, hauteur: 941, decalageAlphaBasPct: 66 / 1672 * 100, zone: { left: 271 / 1672 * 100, top: 360 / 941 * 100, width: 1285 / 1672 * 100, height: 413 / 941 * 100 }, reveal: { left: 56.1271, top: 61.9292, fontSize: "clamp(1.15rem, 4.7vw, 2.1rem)" } },
  platinum: { fichier: "platinum", largeur: 1672, hauteur: 941, decalageAlphaBasPct: 54 / 1672 * 100, zone: { left: 268 / 1672 * 100, top: 358 / 941 * 100, width: 1270 / 1672 * 100, height: 414 / 941 * 100 }, reveal: { left: 54.9285, top: 61.6627, fontSize: "clamp(1.1rem, 4.6vw, 2.05rem)" } },
  emerald: { fichier: "emerald", largeur: 1672, hauteur: 941, decalageAlphaBasPct: 75 / 1672 * 100, zone: { left: 269 / 1672 * 100, top: 360 / 941 * 100, width: 1057 / 1672 * 100, height: 400 / 941 * 100 }, reveal: { left: 48.2107, top: 60.6024, fontSize: "clamp(1.05rem, 4.3vw, 1.95rem)" } },
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

export function masqueGrattageCarteParPalier(palier: number): string {
  const { fichier } = dispositionIllustrationCarteParPalier(palier);
  return `/assets/dashboard/rewards/scratch-tier-${fichier}-foil-mask.png?v=20261028-pixel-mask`;
}

/** Formate uniquement le résultat reçu du backend, jamais un gain inventé côté client. */
export function libelleGainCarte(carte: CarteAGratter, english: boolean): string {
  const type = carte.gainType?.toLowerCase();
  if (type === "ticket") return english ? "Draw ticket" : "Ticket de tirage";
  if (type === "rien") return english ? "No reward this time" : "Pas de gain cette fois";
  if (carte.gainMontant !== null) return `${carte.gainMontant > 0 ? "+" : ""}${carte.gainMontant} ${english ? "points" : "points"}`;
  return english ? "Reward validated" : "Gain validé";
}
