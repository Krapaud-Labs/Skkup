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

  it("reprend la version du paquet", () => {
    expect(manifeste.manifest_version).toBe(3);
    expect(manifeste.version).toBe("1.2.3");
  });
});
