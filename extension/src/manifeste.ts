/**
 * Manifeste MV3 de l'extension, construit au moment du build.
 *
 * Le manifeste n'est pas un fichier statique parce que l'origine de
 * l'API varie d'un environnement à l'autre (localhost en développement,
 * domaine `api.*` en production) et qu'une permission d'hôte ne peut pas
 * être calculée à l'exécution : elle doit figurer en clair dans le
 * paquet publié. La construire ici garantit que la permission demandée
 * est exactement l'origine réellement appelée, ni plus large ni
 * désynchronisée.
 *
 * Périmètre des permissions (docs/05-security.md) : voir le commentaire
 * de `permissionsHote` plus bas.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OptionsManifeste {
  urlApi: string;
  version: string;
}

export interface Manifeste {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  content_security_policy: { extension_pages: string };
  background: { service_worker: string };
  content_scripts: {
    matches: string[];
    js: string[];
    run_at: string;
    all_frames: boolean;
  }[];
  action: { default_popup: string; default_title: string };
  icons: Record<string, string>;
}

// ─── Pages de visionnage couvertes ───────────────────────────────────────────

/**
 * Motifs des pages sur lesquelles le script de contenu est injecté.
 *
 * Ces motifs ne sont volontairement pas repris dans `host_permissions` :
 * en MV3, `content_scripts.matches` suffit à injecter le script, alors
 * qu'une permission d'hôte accorderait en plus la lecture des cookies et
 * les requêtes réseau dans l'origine visée. L'extension n'a besoin de
 * rien de tout cela sur les plateformes, seulement d'observer un
 * élément vidéo dans la page.
 */
export const MOTIFS_PAGES_VISIONNAGE = [
  "https://www.twitch.tv/*",
  "https://www.youtube.com/*",
  "https://www.facebook.com/*",
] as const;

// ─── Construction ────────────────────────────────────────────────────────────

/** Origine seule (schéma + hôte + port) d'une URL d'API complète. */
export function originePermise(urlApi: string): string {
  return new URL(urlApi).origin;
}

export function construireManifeste({
  urlApi,
  version,
}: OptionsManifeste): Manifeste {
  return {
    manifest_version: 3,
    name: "Viewer Rewards",
    version,
    description:
      "Mesure ton temps de visionnage sur Twitch, YouTube et Facebook Live pour gagner des points Viewer Rewards.",
    // `storage` conserve le jeton d'appariement, `alarms` réveille le
    // service worker pour les heartbeats. Ni `tabs` ni `webNavigation` :
    // l'extension n'a pas à connaître l'historique de navigation, la
    // présence au premier plan est observée dans la page elle-même.
    permissions: ["storage", "alarms"],
    // Seule l'API du site est appelée par l'extension.
    host_permissions: [`${originePermise(urlApi)}/*`],
    // Reprise explicite de la politique par défaut de MV3. La déclarer
    // n'ajoute rien au comportement de Chrome, mais rend tout
    // assouplissement futur (script distant, `wasm-unsafe-eval`) visible
    // en revue et détectable par un test, au lieu d'être une ligne
    // ajoutée en silence dans un manifeste.
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    background: { service_worker: "arriere-plan.js" },
    content_scripts: [
      {
        matches: [...MOTIFS_PAGES_VISIONNAGE],
        js: ["contenu.js"],
        run_at: "document_idle",
        // Le lecteur des trois plateformes vit dans le document principal :
        // injecter dans les cadres (publicités, widgets) n'apporterait rien
        // et élargirait la surface d'exécution.
        all_frames: false,
      },
    ],
    action: {
      default_popup: "popup.html",
      default_title: "Viewer Rewards",
    },
    icons: {
      "16": "icones/icone-16.png",
      "48": "icones/icone-48.png",
      "128": "icones/icone-128.png",
    },
  };
}
