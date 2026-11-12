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

  it("lit channelId depuis le texte inline sans exécuter le script", () => {
    const lire = documentFactice({});

    expect(
      lireIndicesPage("www.youtube.com", lire, () => [
        'var ytInitialPlayerResponse = {"videoDetails":{"videoId":"abcdefghijk","channelId":"UCabcdefghijklmnopqrstuv"}};',
      ], "https://www.youtube.com/watch?v=abcdefghijk"),
    ).toEqual({ identifiantChaineDom: "UCabcdefghijklmnopqrstuv" });
  });

  it("rejette une réponse inline qui appartient à une autre vidéo", () => {
    const lire = documentFactice({});

    expect(
      lireIndicesPage("www.youtube.com", lire, () => [
        'var ytInitialPlayerResponse = {"videoDetails":{"videoId":"autre-video","channelId":"UCabcdefghijklmnopqrstuv"}};',
      ], "https://www.youtube.com/watch?v=abcdefghijk"),
    ).toEqual({ identifiantChaineDom: null });
  });

  it("associe l'identifiant au direct défini par le chemin /live/<id>", () => {
    const lire = documentFactice({});

    expect(
      lireIndicesPage("www.youtube.com", lire, () => [
        'ytInitialPlayerResponse = {"videoDetails":{"videoId":"live123","channelId":"UCabcdefghijklmnopqrstuv"}};',
      ], "https://www.youtube.com/live/live123"),
    ).toEqual({ identifiantChaineDom: "UCabcdefghijklmnopqrstuv" });
  });

  it("ignore un script inline qui ne contient pas ytInitialPlayerResponse", () => {
    const lire = documentFactice({});

    expect(
      lireIndicesPage("www.youtube.com", lire, () => [
        'window.data = {"videoDetails":{"videoId":"abcdefghijk","channelId":"UCabcdefghijklmnopqrstuv"}};',
      ], "https://www.youtube.com/watch?v=abcdefghijk"),
    ).toEqual({ identifiantChaineDom: null });
  });

  it("ne lit pas les scripts inline hors de YouTube", () => {
    const lire = documentFactice({});
    const lireTextes = () => ['{"channelId":"UCabcdefghijklmnopqrstuv"}'];

    expect(lireIndicesPage("www.twitch.tv", lire, lireTextes)).toEqual({
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
