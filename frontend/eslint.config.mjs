import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // La liste explicite conserve les exclusions de Next.js tout en permettant
  // d'ajouter ensuite des règles propres au projet au même endroit.
  globalIgnores([
    // Fichiers générés par Next.js et jamais relus comme code source.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
