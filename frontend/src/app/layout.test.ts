import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("métadonnées de marque", () => {
  it("utilise le mark Skkup exact pour le favicon et garde l’icône Apple déclarée séparément", () => {
    expect(metadata.icons).toMatchObject({
      icon: [{ url: "/assets/brand/search/skkup-favicon.png", sizes: "1254x1254", type: "image/png" }],
      apple: [{ url: "/assets/brand/marks/apple-icon.png", sizes: "1254x1254", type: "image/png" }],
    });
  });
});
