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

  it("softens only the desktop viewport clip without changing chest or curve geometry", () => {
    expect(css).toContain(".skuup-home-intro > .skuup-home-hero-artwork { position: absolute; inset: 0 0 auto; z-index: 0; width: 100%; height: 100svh; overflow: hidden; pointer-events: none; }");
    expect(css).toContain("@media (min-width: 768px) {");
    expect(css).toContain("overflow: clip;");
    expect(css).toContain("mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - clamp(2.5rem, 6.5svh, 4rem)), transparent 100%);");
    expect(css).toContain("-webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - clamp(2.5rem, 6.5svh, 4rem)), transparent 100%);");
    expect(css).toContain(".skuup-home-hero-treasure { left: 48.05%; top: -2.2%; z-index: 2; width: 78.74%; height: auto; }");
    expect(css).toContain(".skuup-home-hero-curve-lower { left: 4.4%; top: 38.3%; width: 50.3%; height: 60.4% !important; transform: rotate(-24deg); transform-origin: 91.1% 33.5%; }");
  });
});
