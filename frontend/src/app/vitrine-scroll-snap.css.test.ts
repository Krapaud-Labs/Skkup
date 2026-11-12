import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("home page scroll snapping", () => {
  it("snaps the root viewport only when the homepage is rendered", () => {
    expect(css).toContain("html:has(main.skuup-homepage) { scroll-snap-type: y mandatory; scroll-behavior: smooth; scroll-padding-block: 0; }");
    expect(css).toContain(".skuup-vitrine.skuup-homepage { overflow-x: clip; overflow-y: visible; }");
    expect(css).toContain("@media (prefers-reduced-motion: reduce) { html:has(main.skuup-homepage) { scroll-behavior: auto; } }");
  });

  it("uses full viewport stops while allowing tall sections to grow naturally", () => {
    expect(css).toContain("min-block-size: 100svh; scroll-snap-align: start; scroll-snap-stop: always;");
    expect(css).not.toContain(".skuup-homepage .skuup-home-snap-section { height: 100vh;");
    expect(css).toContain(".skuup-homepage #lots { padding-block-start: clamp(.5rem, 1svh, .75rem); }");
    expect(css).toContain(".skuup-homepage #fonctionnement { padding-block-end: 0; }");
    expect(css).toContain(".skuup-homepage #fonctionnement > .skuup-reveal { align-content: stretch; grid-template-rows: minmax(0, 1fr) auto minmax(0, .75fr) auto auto; }");
    expect(css).toContain(".skuup-homepage #fonctionnement > .skuup-reveal > :first-child { grid-row: 2; }");
    expect(css).toContain(".skuup-homepage #fonctionnement > .skuup-reveal > #engagement { grid-row: 4; }");
    expect(css).toContain(".skuup-homepage #fonctionnement > .skuup-reveal > footer { grid-row: 5; }");
  });

  it("uses more vertical space for the lots and steps sections on desktop", () => {
    expect(css).toContain(".skuup-homepage #lots .skuup-home-trust-content { display: flex; flex-direction: column; justify-content: space-between; }");
    expect(css).toContain(".skuup-homepage #lots .skuup-home-trust-grid > .skuup-lot { min-block-size: clamp(17rem, 30svh, 22rem); }");
    expect(css).toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid { align-items: stretch; margin-block: clamp(2.25rem, 3.6svh, 3rem) clamp(2.25rem, 3svh, 3rem); }");
    expect(css).toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid .skuup-step-media { flex: 0 0 clamp(11rem, 18svh, 15rem); aspect-ratio: auto; }");
    expect(css).toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid .skuup-step-content { flex: 1; min-block-size: 8.75rem; }");
  });
});
