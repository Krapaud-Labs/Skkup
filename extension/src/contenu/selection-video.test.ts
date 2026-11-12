import { describe, expect, it } from "vitest";
import { selectionnerVideo } from "./selection-video";

describe("selectionnerVideo", () => {
  it("préfère une vidéo en lecture à la première vidéo du document", () => {
    const videos = [
      { paused: true, ended: false, id: "aperçu" },
      { paused: false, ended: false, id: "live" },
    ];

    expect(selectionnerVideo(videos)?.id).toBe("live");
  });

  it("priorise une vidéo visible et non muette parmi les lecteurs actifs", () => {
    const video = (id: string, muted: boolean, visible: boolean) => ({
      paused: false,
      ended: false,
      muted,
      id,
      getClientRects: () => ({ length: visible ? 1 : 0 }),
    });
    const videos = [
      video("aperçu muet", true, true),
      video("live visible", false, true),
      video("live caché", false, false),
    ];

    expect(selectionnerVideo(videos)?.id).toBe("live visible");
  });

  it("retombe sur une vidéo active visible si toutes les actives sont muettes", () => {
    const cachée = {
      paused: false,
      ended: false,
      muted: false,
      id: "active cachée",
      getClientRects: () => ({ length: 0 }),
    };
    const visible = {
      paused: false,
      ended: false,
      muted: true,
      id: "active visible muette",
      getClientRects: () => ({ length: 1 }),
    };

    expect(selectionnerVideo([cachée, visible])?.id).toBe("active visible muette");
  });

  it("ignore une vidéo terminée au profit d'une vidéo active suivante", () => {
    const videos = [
      { paused: false, ended: true, id: "terminée" },
      { paused: false, ended: false, id: "live" },
    ];

    expect(selectionnerVideo(videos)?.id).toBe("live");
  });

  it("retombe sur le premier lecteur si aucune vidéo n'est en lecture", () => {
    const premiere = { paused: true, ended: false, id: "première" };
    const seconde = { paused: true, ended: false, id: "seconde" };

    expect(selectionnerVideo([premiere, seconde])).toBe(premiere);
  });

  it("retourne null si le document ne contient pas de vidéo", () => {
    expect(selectionnerVideo([])).toBeNull();
  });
});
