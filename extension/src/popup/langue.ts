/** Langues d'interface actuellement traduites dans la popup. */
export type LangueInterface = "fr" | "en";

/**
 * Choisit la première langue prise en charge dans les préférences ordonnées
 * du navigateur. Si aucune préférence n'est fournie ou prise en charge,
 * l'anglais sert de repli déterministe.
 */
export function choisirLangueInterface(
  preferences: readonly string[] | null | undefined,
): LangueInterface {
  for (const preference of preferences ?? []) {
    const langue = preference.trim().toLowerCase().split(/[-_]/, 1)[0];
    if (langue === "fr" || langue === "en") return langue;
  }
  return "en";
}
