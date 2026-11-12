import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("vitrine hero image presence", () => {
  it("keeps the image stable and places a pulsing glow behind the open gift", () => {
    expect(css).toContain(".skuup-hero .skuup-prize-orbit > img { position:relative; z-index:1; transform-origin:center bottom; scale:1.04; }");
    expect(css).toContain(".skuup-hero .skuup-prize-orbit::before { position:absolute; z-index:0; top:59%; left:50%; width:min(72%,27rem);");
    expect(css).toContain("animation:skuup-gift-reveal-glow 5.5s ease-in-out infinite;");
    expect(css).toContain("30%, 48% { opacity:.48; transform:translate(-50%,-50%) scale(1.08); }");
    expect(css).toContain("76% { opacity:.2; transform:translate(-50%,-50%) scale(1.18); }");
  });

  it("stops the glow pulse for reduced-motion while retaining the resting image scale", () => {
    expect(css).toContain(".skuup-reveal-visible .skuup-section-title, .skuup-hero h1, .skuup-hero .skuup-prize-orbit > img { animation: none; }");
    expect(css).toContain(".skuup-hero .skuup-prize-orbit::before { animation:none; opacity:.18; transform:translate(-50%,-50%) scale(1); }");
    expect(css).toContain("scale:1.04");
  });

  it("preserves the previous mobile orbit scale", () => {
    expect(css).toContain(".skuup-prize-orbit { min-height: 18rem; transform: scale(.85); }");
  });
});
