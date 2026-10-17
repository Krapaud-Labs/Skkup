/**
 * Construit le paquet chargeable dans Chrome (dossier `dist/`).
 *
 * Trois choses en sortent : les trois bundles JavaScript (service worker,
 * script de contenu, popup), les fichiers statiques de la popup et des
 * icônes, et le manifeste, généré plutôt que copié pour que la
 * permission d'hôte corresponde exactement à l'API réellement appelée
 * (voir src/manifeste.ts).
 *
 * L'URL de l'API vient de SKKUP_API_URL, avec compatibilité avec l'ancien nom,
 * et le même défaut de
 * développement que le frontend (http://localhost:3001).
 */

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossierSortie = join(racine, "dist");

const urlApi = process.env.SKKUP_API_URL ?? process.env.SKUUP_API_URL ?? "http://localhost:3001";
const { version } = JSON.parse(
  await readFile(join(racine, "package.json"), "utf8"),
);

// ─── Manifeste ───────────────────────────────────────────────────────────────

/**
 * Le manifeste est décrit en TypeScript (pour être typé et testé) mais
 * doit être évalué ici, en Node. On le transpile à la volée avec esbuild
 * plutôt que d'ajouter un exécuteur TypeScript à la chaîne d'outils.
 */
async function genererManifeste() {
  const { outputFiles } = await build({
    entryPoints: [join(racine, "src/manifeste.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  const source = outputFiles[0].text;
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
  return module.construireManifeste({ urlApi, version });
}

// ─── Bundles ─────────────────────────────────────────────────────────────────

const points = {
  "arriere-plan": "src/arriere-plan/index.ts",
  contenu: "src/contenu/index.ts",
  popup: "src/popup/popup.ts",
};

async function construireBundles() {
  await Promise.all(
    Object.entries(points).map(([nom, entree]) =>
      build({
        entryPoints: [join(racine, entree)],
        outfile: join(dossierSortie, `${nom}.js`),
        bundle: true,
        // Les trois contextes MV3 exécutent des scripts classiques : aucun
        // n'accepte un import ES à la racine du bundle.
        format: "iife",
        target: "chrome116",
        platform: "browser",
        sourcemap: false,
        minify: process.env.NODE_ENV === "production",
        define: { __URL_API__: JSON.stringify(urlApi) },
        legalComments: "none",
      }),
    ),
  );
}

// ─── Assemblage ──────────────────────────────────────────────────────────────

await rm(dossierSortie, { recursive: true, force: true });
await mkdir(dossierSortie, { recursive: true });

await construireBundles();
await cp(join(racine, "src/popup/popup.html"), join(dossierSortie, "popup.html"));
await cp(join(racine, "src/popup/popup.css"), join(dossierSortie, "popup.css"));
await mkdir(join(dossierSortie, "assets"), { recursive: true });
await cp(join(racine, "_locales"), join(dossierSortie, "_locales"), {
  recursive: true,
});
await cp(
  join(racine, "assets/skkup-wordmark-transparent.png"),
  join(dossierSortie, "assets/skkup-wordmark-transparent.png"),
);
await cp(join(racine, "src/icones"), join(dossierSortie, "icones"), {
  recursive: true,
});
await writeFile(
  join(dossierSortie, "manifest.json"),
  `${JSON.stringify(await genererManifeste(), null, 2)}\n`,
);

process.stdout.write(`Extension construite dans dist/ (API : ${urlApi})\n`);
