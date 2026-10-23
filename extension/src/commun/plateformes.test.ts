import { describe, expect, it } from "vitest";
import { analyserPage, memePage } from "./plateformes";

describe("analyserPage", () => {
  it("reconnaît une page de chaîne Twitch", () => {
    expect(analyserPage("https://www.twitch.tv/MaChaine")).toEqual({
      plateforme: "TWITCH",
      identifiantChaine: "machaine",
    });
  });

  it("ignore les sections Twitch qui ne sont pas des chaînes", () => {
    expect(analyserPage("https://www.twitch.tv/directory/game/Chess")).toBeNull();
    expect(analyserPage("https://www.twitch.tv/videos/123456")).toBeNull();
    expect(analyserPage("https://www.twitch.tv/machaine/about")).toBeNull();
    expect(analyserPage("https://www.twitch.tv/")).toBeNull();
  });

  it("lit l'identifiant de chaîne dans l'URL YouTube quand il y figure", () => {
    expect(
      analyserPage("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv"),
    ).toEqual({
      plateforme: "YOUTUBE",
      identifiantChaine: "UCabcdefghijklmnopqrstuv",
    });
  });

  it("s'appuie sur le document pour une page de lecture YouTube", () => {
    const url = "https://www.youtube.com/watch?v=abcdefghijk";
    expect(analyserPage(url)).toBeNull();
    expect(
      analyserPage(url, { identifiantChaineDom: "UCabcdefghijklmnopqrstuv" }),
    ).toEqual({
      plateforme: "YOUTUBE",
      identifiantChaine: "UCabcdefghijklmnopqrstuv",
    });
  });

  it("reconnaît une chaîne Kick et normalise son identifiant", () => {
    expect(analyserPage("https://www.kick.com/MaChaine")).toEqual({
      plateforme: "KICK",
      identifiantChaine: "machaine",
    });
  });

  it("ignore les routes Kick qui ne sont pas des pages de chaîne", () => {
    expect(analyserPage("https://kick.com/category/just-chatting")).toBeNull();
    expect(analyserPage("https://kick.com/videos/123456")).toBeNull();
    expect(analyserPage("https://kick.com/machaine/about")).toBeNull();
    expect(analyserPage("https://kick.com/")).toBeNull();
  });

  it("ne traite plus Facebook comme plateforme de visionnage", () => {
    expect(analyserPage("https://www.facebook.com/MaPage/videos/987654321")).toBeNull();
  });

  it("écarte tout ce qui n'est pas une page de visionnage en HTTPS", () => {
    expect(analyserPage("http://www.twitch.tv/machaine")).toBeNull();
    expect(analyserPage("http://kick.com/machaine")).toBeNull();
    expect(analyserPage("https://exemple.test/machaine")).toBeNull();
    expect(analyserPage("pas une url")).toBeNull();
  });
});

describe("memePage", () => {
  const page = { plateforme: "TWITCH", identifiantChaine: "a" } as const;

  it("compare la plateforme et la chaîne", () => {
    expect(memePage(page, { ...page })).toBe(true);
    expect(memePage(page, { ...page, identifiantChaine: "b" })).toBe(false);
    expect(memePage(page, { ...page, plateforme: "YOUTUBE" })).toBe(false);
  });

  it("traite l'absence de page comme une valeur comparable", () => {
    expect(memePage(null, null)).toBe(true);
    expect(memePage(page, null)).toBe(false);
  });
});
