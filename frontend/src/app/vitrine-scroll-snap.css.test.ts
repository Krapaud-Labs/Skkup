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

  it("adds vertical spacing between lots and steps groups without resizing their cards", () => {
    expect(css).toContain(".skuup-homepage #lots .skuup-home-trust-grid { margin-block: clamp(2.5rem, 5svh, 4rem) clamp(2rem, 3svh, 3rem); }");
    expect(css).toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid { margin-block: clamp(2.25rem, 3.6svh, 3rem) clamp(2.25rem, 3svh, 3rem); }");
    expect(css).not.toContain(".skuup-homepage #lots .skuup-home-trust-grid > .skuup-lot { min-block-size:");
    expect(css).not.toContain(".skuup-homepage #lots .skuup-stats .skuup-stat { min-block-size:");
    expect(css).not.toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid > .skuup-step { display: flex;");
    expect(css).not.toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid .skuup-step-media { flex:");
    expect(css).not.toContain(".skuup-homepage #fonctionnement .skuup-home-steps-grid .skuup-step-content { flex:");
  });

  it("reduces the two hero halos without changing artwork position or scale", () => {
    expect(css).toContain("radial-gradient(circle at 66% 55%, rgb(117 30 255 / .18), transparent 24rem)");
    expect(css).toContain("radial-gradient(circle at 50% 72%, rgb(117 30 255 / .18), transparent 20rem)");
    expect(css).toContain("width:min(72%,27rem); aspect-ratio:1.55; transform:translate(-50%,-50%) scale(.88)");
    expect(css).toContain("rgb(217 70 239 / .3) 0%, rgb(139 92 246 / .18) 38%, rgb(139 92 246 / .06) 58%");
    expect(css).toContain("0%, 100% { opacity:.08; transform:translate(-50%,-50%) scale(.88); }");
    expect(css).toContain("30%, 48% { opacity:.3; transform:translate(-50%,-50%) scale(1.08); }");
    expect(css).toContain("76% { opacity:.12; transform:translate(-50%,-50%) scale(1.18); }");
    expect(css).toContain(".skuup-hero .skuup-prize-orbit > img { position:relative; z-index:1; transform-origin:center bottom; scale:1.04; }");
    expect(css).toContain(".skuup-hero .skuup-prize-orbit::before { animation:none; opacity:.12; transform:translate(-50%,-50%) scale(1); }");
  });
});
