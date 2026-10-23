import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlateformeBadge } from "./PlateformeBadge";

describe("PlateformeBadge", () => {
  it.each([
    ["TWITCH", "Twitch", "/assets/shared/platforms/twitch.png"],
    ["YOUTUBE", "YouTube", "/assets/shared/platforms/youtube.png"],
  ] as const)("conserve la marque %s en PNG officiel et son libellé", (platform, label, src) => {
    const { container } = render(<PlateformeBadge plateforme={platform} />);

    expect(screen.getByText(label)).toBeTruthy();
    expect(decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "")).toContain(src);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("garde Kick textuel tant qu’aucun asset de marque validé n’est fourni", () => {
    const { container } = render(<PlateformeBadge plateforme="KICK" />);

    expect(screen.getByText("Kick")).toBeTruthy();
    expect(container.querySelector("img, svg")).toBeNull();
  });
});
