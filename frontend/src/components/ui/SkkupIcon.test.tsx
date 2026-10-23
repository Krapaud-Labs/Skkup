import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { SkkupIcon, type SkkupIconName } from "./SkkupIcon";

const pngIcons: SkkupIconName[] = [
  "analytics", "streams", "draws", "extension", "rules", "audit", "arrow",
  "users", "gift", "cube", "megaphone", "flag", "trophy", "shield",
  "check", "eye", "points", "chevronDown", "timer", "bell", "scratchCard",
  "ticket", "flame",
];

describe("registre PNG des pictogrammes Skkup", () => {
  it("rend chaque pictogramme par un unique PNG transparent, sans SVG inline", () => {
    for (const name of pngIcons) {
      const { container, unmount } = render(<SkkupIcon name={name} />);
      const image = container.querySelector("img.skuup-generated-icon");

      expect(image, name).not.toBeNull();
      expect(container.querySelector("svg"), name).toBeNull();
      expect(image?.getAttribute("src"), name).toMatch(/\.png(?:\?|$)/);
      expect(image?.getAttribute("aria-hidden"), name).toBe("true");
      expect(image?.getAttribute("alt"), name).toBe("");
      const source = image?.getAttribute("src") ?? "";
      expect(existsSync(resolve(process.cwd(), "public", source.slice(1))), name).toBe(true);
      unmount();
    }
  });

  it("conserve le S-coin officiel pour les points", () => {
    const { container } = render(<SkkupIcon name="points" />);

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/assets/dashboard/shared/icons/skkup-icon-points.png",
    );
  });
});
