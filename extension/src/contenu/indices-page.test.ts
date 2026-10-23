import { describe, expect, it } from "vitest";
import { lireIndicesPage } from "./indices-page";

/** Document réduit à ses balises utiles, sous forme de table. */
function documentFactice(balises: Record<string, string>) {
  return (selecteur: string, attribut: string) =>
    balises[`${selecteur}|${attribut}`] ?? null;
}

describe("lireIndicesPage", () => {
  it("lit l'identifiant de chaîne YouTube dans les microdonnées", () => {
    const lire = documentFactice({
      'meta[itemprop="channelId"]|content': "UCabcdefghijklmnopqrstuv",
    });

    expect(lireIndicesPage("www.youtube.com", lire)).toEqual({
      identifiantChaineDom: "UCabcdefghijklmnopqrstuv",
    });
  });

  it("retombe sur le lien canonique quand les microdonnées manquent", () => {
    const lire = documentFactice({
      'link[itemprop="url"]|href':
        "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv",
    });

    expect(lireIndicesPage("www.youtube.com", lire)).toEqual({
      identifiantChaineDom: "UCabcdefghijklmnopqrstuv",
    });
  });

  it("ignore un lien canonique YouTube sans identifiant de chaîne", () => {
    const lire = documentFactice({
      'link[rel="canonical"]|href': "https://www.youtube.com/watch?v=abcdefghijk",
    });

    expect(lireIndicesPage("www.youtube.com", lire)).toEqual({
      identifiantChaineDom: null,
    });
  });

  it("ignore les indices de pages Facebook hors périmètre", () => {
    const lire = documentFactice({
      'link[rel="canonical"]|href':
        "https://www.facebook.com/MaPage/videos/987654321/",
    });

    expect(lireIndicesPage("www.facebook.com", lire)).toEqual({
      identifiantChaineDom: null,
    });
  });

  it("ne relève rien sur un hôte non couvert", () => {
    const lire = documentFactice({
      'meta[itemprop="channelId"]|content': "UCabcdefghijklmnopqrstuv",
    });

    expect(lireIndicesPage("www.twitch.tv", lire)).toEqual({
      identifiantChaineDom: null,
    });
  });
});
