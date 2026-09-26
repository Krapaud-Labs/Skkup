import { describe, expect, it } from "vitest";
import { construireManifeste } from "./manifeste";

describe("construireManifeste", () => {
  const manifeste = construireManifeste({
    urlApi: "https://api.exemple.test/base",
    version: "1.2.3",
  });

  it("ne demande la permission d'hôte que pour l'origine de l'API", () => {
    expect(manifeste.host_permissions).toEqual([
      "https://api.exemple.test/*",
    ]);
  });

  // Garde-fou explicite : élargir les permissions doit être un choix
  // conscient, discuté avec la revue de sécurité, pas un effet de bord.
  it("se limite au stockage et aux alarmes, sans accès à la navigation", () => {
    expect(manifeste.permissions).toEqual(["storage", "alarms"]);
    expect(manifeste.permissions).not.toContain("tabs");
    expect(manifeste.permissions).not.toContain("webNavigation");
    expect(manifeste.permissions).not.toContain("history");
  });

  it("n'injecte le script de contenu que sur les trois plateformes, en HTTPS", () => {
    const motifs = manifeste.content_scripts[0]?.matches ?? [];
    expect(motifs).toEqual([
      "https://www.twitch.tv/*",
      "https://www.youtube.com/*",
      "https://www.facebook.com/*",
    ]);
    expect(manifeste.content_scripts[0]?.all_frames).toBe(false);
  });

  // Un script distant ou un `wasm-unsafe-eval` ajouté ici rendrait le code
  // exécuté par l'extension modifiable hors du paquet publié.
  it("n'autorise que les scripts du paquet dans les pages d'extension", () => {
    expect(manifeste.content_security_policy.extension_pages).toBe(
      "script-src 'self'; object-src 'self'",
    );
  });

  it("reprend la version du paquet", () => {
    expect(manifeste.manifest_version).toBe(3);
    expect(manifeste.version).toBe("1.2.3");
  });

  it("délègue les libellés visibles du manifeste aux catalogues de Chrome", () => {
    expect(manifeste.default_locale).toBe("fr");
    expect(manifeste.name).toBe("__MSG_extensionName__");
    expect(manifeste.description).toBe("__MSG_extensionDescription__");
    expect(manifeste.action.default_title).toBe("__MSG_actionTitle__");
  });
});
