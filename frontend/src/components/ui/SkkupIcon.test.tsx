import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SkkupIcon, type SkkupVisualName } from "./SkkupIcon";

const pngIcons: SkkupVisualName[] = [
  "analytics", "streams", "draws", "extension", "rules", "audit", "arrow",
  "users", "gift", "megaphone", "flag", "trophy", "shield",
  "check", "eye", "points", "chevronDown", "timer", "bell", "scratchCard",
  "ticket", "flame", "close", "favoriteHeart", "favoriteHeartActive",
  "statusPending", "warning", "sparkle", "arrowUpRight",
  "extensionIllustration", "ticketIllustration",
];

describe("registre PNG des pictogrammes Skkup", () => {
  it("rend chaque entrée du registre depuis un PNG local, sans SVG ni marque superposée", () => {
    for (const name of pngIcons) {
      const { container, unmount } = render(<SkkupIcon name={name} />);
      const image = container.querySelector("img.skuup-generated-icon");

      expect(image, name).not.toBeNull();
      expect(container.querySelector("svg"), name).toBeNull();
      const optimizedImageUrl = new URL(
        image?.getAttribute("src") ?? "",
        "http://localhost",
      );
      expect(optimizedImageUrl.pathname, name).toBe("/_next/image");
      expect(optimizedImageUrl.searchParams.get("url"), name).toMatch(
        /^\/assets\/.+\.png(?:#.*)?$/,
      );
      expect(image?.getAttribute("aria-hidden"), name).toBe("true");
      expect(image?.getAttribute("alt"), name).toBe("");
      expect(container.querySelector("[data-brand-mark]"), name).toBeNull();
      const source = optimizedImageUrl.searchParams.get("url") ?? "";
      const relativeAsset = source.replace(/^\/assets\//, "").replace(/#.*$/, "");
      const assetPath = resolve(process.cwd(), "assets", relativeAsset);
      expect(existsSync(assetPath), name).toBe(true);
      if (name !== "extensionIllustration") {
        const hash = createHash("sha256").update(readFileSync(assetPath)).digest("hex").slice(0, 8);
        expect(source, name).toBe(`${source.split("#")[0]}#v=${hash}`);
      }
      unmount();
    }
  });

  it.each([
    ["draws", "/assets/icons/ui/draws-v2.png#v=" + createHash("sha256").update(readFileSync(resolve(process.cwd(), "assets/icons/ui/draws-v2.png"))).digest("hex").slice(0, 8)],
    ["ticket", "/assets/icons/ui/ticket.png#v=" + createHash("sha256").update(readFileSync(resolve(process.cwd(), "assets/icons/ui/ticket.png"))).digest("hex").slice(0, 8)],
    ["points", "/assets/icons/ui/points.png#v=00b2ef94"],
    ["ticketIllustration", "/assets/icons/ui/ticket.png#v=86d8d0bb"],
  ] as const)("rend %s comme un PNG autonome sans calque de marque", (name, source) => {
    const { container } = render(<SkkupIcon name={name} />);

    const imageUrl = new URL(
      container.querySelector("img.skuup-generated-icon")?.getAttribute("src") ?? "",
      "http://localhost",
    );
    expect(imageUrl.pathname).toBe("/_next/image");
    expect(imageUrl.searchParams.get("url")).toBe(source);
    expect(container.querySelector(".skuup-generated-icon-composite")).toBeNull();
    expect(container.querySelector("[data-brand-mark='official-s']")).toBeNull();
  });

  it("ne conserve pas les PNG métier retirés du registre partagé", () => {
    for (const filename of ["skkup-icon-daily-visit.png", "skkup-icon-scratch-card.png", "skkup-icon-ticket-s.png", "skkup-icon-points.png", "skkup-icon-streak.png"]) {
      expect(
        existsSync(resolve(process.cwd(), "assets/dashboard/illustrations", filename)),
        filename,
      ).toBe(false);
    }
  });
});
