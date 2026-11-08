import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { imagesForSource } from "@/test-utils/next-image";
import { LocalizedPageIntro } from "./LocalizedPageIntro";

vi.mock("./LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
  traductions: {
    fr: {
      pages: {
        raffles: { kicker: "Résultats", title: "Tirages", description: "Liste" },
        dashboardRaffles: { kicker: "Résultats", title: "Tirages Viewer", description: "Liste" },
        rules: { kicker: "Règles", title: "Règlement", description: "Règles du jeu" },
        streams: { kicker: "Visionnage", title: "Streams", description: "Streams actifs" },
      },
    },
  },
}));

describe("LocalizedPageIntro icon mapping", () => {
  it.each([
    ["raffles", "/assets/icons/ui/draws-v2.png"],
    ["dashboardRaffles", "/assets/icons/ui/draws-v2.png"],
    ["rules", "/assets/icons/ui/rules.png"],
    ["streams", "/assets/icons/ui/streams.png"],
  ] as const)("uses the route pictogram for %s", (page, source) => {
    const { container } = render(<LocalizedPageIntro page={page} />);
    expect(imagesForSource(container, source)).toHaveLength(1);
  });
});
