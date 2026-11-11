import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("métadonnées de marque", () => {
  it("utilise le favicon compact dédié et garde l’icône Apple séparée", () => {
    expect(metadata.icons).toMatchObject({
      icon: [{ url: "/assets/brand/search/skkup-favicon.png", sizes: "512x512", type: "image/png" }],
      apple: [{ url: "/assets/brand/marks/apple-icon.png", sizes: "1254x1254", type: "image/png" }],
    });
  });
});
