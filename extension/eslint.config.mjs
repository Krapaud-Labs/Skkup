import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { process: "readonly", Buffer: "readonly" },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        // Les fichiers d'outillage (.mjs) restent hors du projet
        // TypeScript : ils sont analysés sans informations de type.
        projectService: { allowDefaultProject: ["*.mjs", "scripts/*.mjs"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Le service worker et les content scripts n'ont pas d'autre canal de
      // diagnostic que la console du navigateur : on autorise l'alerte et
      // l'erreur, mais pas les traces de débogage laissées par mégarde.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
);
