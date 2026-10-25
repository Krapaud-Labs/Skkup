import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { SkkupIcon, type SkkupVisualName } from "./SkkupIcon";

const pngIcons: SkkupVisualName[] = [
  "analytics", "streams", "draws", "extension", "rules", "audit", "arrow",
  "users", "gift", "megaphone", "flag", "trophy", "shield",
  "check", "eye", "points", "chevronDown", "timer", "bell", "scratchCard",
  "ticket", "flame", "close", "favoriteHeart", "favoriteHeartActive",
  "statusPending", "warning", "sparkle", "arrowUpRight", "rewardIllustration", "streakIllustration",
  "extensionIllustration", "ticketIllustration",
];

describe("registre PNG des pictogrammes Skkup", () => {
  it("rend chaque pictogramme avec des PNG transparents, sans SVG inline", () => {
    for (const name of pngIcons) {
      const { container, unmount } = render(<SkkupIcon name={name} />);
      const image = container.querySelector("img.skuup-generated-icon");

      expect(image, name).not.toBeNull();
      expect(container.querySelector("svg"), name).toBeNull();
      expect(image?.getAttribute("src"), name).toMatch(/\.png(?:\?|$)/);
      expect(image?.getAttribute("aria-hidden"), name).toBe("true");
      expect(image?.getAttribute("alt"), name).toBe("");
      const source = image?.getAttribute("src") ?? "";
      expect(
        existsSync(resolve(process.cwd(), "../asset", source.replace(/^\/assets\//, ""))),
        name,
      ).toBe(true);
      unmount();
    }
  });

  it.each(["ticket", "points", "ticketIllustration"] as const)("superpose le S officiel sur le PNG %s restylé", (name) => {
    const { container } = render(<SkkupIcon name={name} />);

    expect(container.querySelector("img.skuup-generated-icon-base")?.getAttribute("src")).toBe(
      name === "points" ? "/assets/icons/ui/points.png" : "/assets/icons/ui/ticket.png",
    );
    expect(container.querySelector("img[data-brand-mark='official-s']")?.getAttribute("src")).toBe(
      "/assets/brand/marks/skkup-s-favicon.png",
    );
  });

  it("ne conserve pas les PNG métier retirés du registre partagé", () => {
    for (const filename of ["skkup-icon-daily-visit.png", "skkup-icon-scratch-card.png", "skkup-icon-ticket-s.png", "skkup-icon-points.png"]) {
      expect(
        existsSync(resolve(process.cwd(), "../asset/dashboard/illustrations", filename)),
        filename,
      ).toBe(false);
    }
  });
});
