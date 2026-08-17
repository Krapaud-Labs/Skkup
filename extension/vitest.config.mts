import { defineConfig } from "vitest/config";

export default defineConfig({
  // Même substitution qu'au build (scripts/build.mjs) : sans elle, le
  // module de configuration ne pourrait pas être importé hors bundle.
  define: { __URL_API__: JSON.stringify("http://localhost:3001") },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
