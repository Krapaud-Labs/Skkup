import { describe, expect, it, vi } from "vitest";
import { creerCacheIndicesPage } from "./cache-indices-page";

describe("creerCacheIndicesPage", () => {
  it("met en cache les indices trouvés pour la même URL", () => {
    const cache = creerCacheIndicesPage(5_000);
    const charger = vi.fn(() => ({ identifiantChaineDom: "UCabcdefghijklmnopqrstuv" }));

    expect(cache.lire("https://youtube.com/watch?v=a", charger, 0)).toEqual({
      identifiantChaineDom: "UCabcdefghijklmnopqrstuv",
    });
    cache.lire("https://youtube.com/watch?v=a", charger, 10_000);

    expect(charger).toHaveBeenCalledTimes(1);
  });

  it("espace les reprises si les indices DOM manquent, puis réessaie", () => {
    const cache = creerCacheIndicesPage(5_000);
    const charger = vi
      .fn()
      .mockReturnValueOnce({ identifiantChaineDom: null })
      .mockReturnValueOnce({ identifiantChaineDom: "UCabcdefghijklmnopqrstuv" });

    cache.lire("https://youtube.com/watch?v=a", charger, 0);
    cache.lire("https://youtube.com/watch?v=a", charger, 2_000);
    expect(charger).toHaveBeenCalledTimes(1);

    expect(cache.lire("https://youtube.com/watch?v=a", charger, 5_000)).toEqual({
      identifiantChaineDom: "UCabcdefghijklmnopqrstuv",
    });
    expect(charger).toHaveBeenCalledTimes(2);
  });

  it("réinitialise le cache au changement d’URL", () => {
    const cache = creerCacheIndicesPage();
    const charger = vi.fn(() => ({ identifiantChaineDom: null }));

    cache.lire("https://youtube.com/watch?v=a", charger, 0);
    cache.lire("https://youtube.com/watch?v=b", charger, 1);

    expect(charger).toHaveBeenCalledTimes(2);
  });
});
