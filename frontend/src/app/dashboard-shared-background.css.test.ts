import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("shared dashboard background", () => {
  it("uses the showcase brick texture in the shared Viewer and Admin shell", () => {
    const sharedFrameStyles = [...css.matchAll(/\.skuup-dashboard-shared-frame\s*\{([^}]+)\}/g)]
      .map((match) => match[1])
      .find((styles) => styles.includes('url("/assets/marketing/backgrounds/vitrine-neon-brick.webp")'));

    expect(sharedFrameStyles).toBeDefined();
    expect(sharedFrameStyles).toContain('url("/assets/marketing/backgrounds/vitrine-neon-brick.webp")');
    expect(sharedFrameStyles).toContain("linear-gradient(rgb(8 6 26 / .4), rgb(8 6 26 / .4))");
    expect(sharedFrameStyles).toContain("background-size: auto, auto, cover;");
  });

  it("lets the shared dashboard navigation show the background through softly", () => {
    const navigationRules = [...css.matchAll(/\.skuup-premium-dashboard-shell\.skuup-dashboard-shared-frame > \.skuup-premium-dashboard-nav\s*\{([^}]+)\}/g)];
    const navigationStyles = navigationRules.at(-1)?.[1];

    expect(navigationStyles).toContain("background: rgb(7 21 43 / .62);");
  });

  it("lets the showcase texture show through the dashboard content", () => {
    const contentRules = [...css.matchAll(/\.skuup-premium-dashboard-shell\.skuup-dashboard-shared-frame > \.skuup-premium-dashboard-content\s*\{([^}]+)\}/g)];
    const contentStyles = contentRules.at(-1)?.[1];

    expect(contentStyles).toContain("background: transparent;");
  });
});
