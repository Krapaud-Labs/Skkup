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

  it("lets hero artwork overflow into the following section and aligns the lower curve root", () => {
    expect(css).toContain(".skuup-home-intro > .skuup-home-hero-artwork { position: absolute; inset: 0 0 auto; z-index: 0; width: 100%; height: 100svh; overflow: visible; pointer-events: none; }");
    expect(css).toContain(".skuup-home-hero-treasure { left: calc(48.05% + 40px); top: -2.2%; z-index: 2; width: 78.74%; height: auto;");
    expect(css).toContain(".skuup-home-hero-curve-lower { left: calc(19% + 40px); top: 46.6%; width: 50.3%; height: 60.4% !important; transform: none;");
    expect(css).toContain(".skuup-home-hero-treasure { left: calc(48.05% - 37.42vw + 2.299vw); top: -2.2%; width: 78.74%; }");
    expect(css).toContain(".skuup-home-hero-curve-lower { left: calc(15.9% - 37.42vw + 2.299vw); }");
    expect(css).not.toContain("mask-image: linear-gradient(to bottom");
    expect(css).not.toContain("-webkit-mask-image: linear-gradient(to bottom");
  });

  it("adds restrained violet and warm edge glows to the existing hero PNGs", () => {
    expect(css).toContain(".skuup-home-hero-curve-upper { left: 50.3%; top: -.3%; width: 40%; height: 80% !important; filter: brightness(1.12) saturate(1.15) hue-rotate(8deg) drop-shadow(0 0 2px rgb(255 210 255 / .62)) drop-shadow(0 0 7px rgb(255 70 238 / .24)); }");
    expect(css).toContain(".skuup-home-hero-curve-lower { left: calc(19% + 40px); top: 46.6%; width: 50.3%; height: 60.4% !important; transform: none; filter: brightness(1.15) saturate(1.22) hue-rotate(8deg) drop-shadow(0 0 2px rgb(255 200 255 / .7)) drop-shadow(0 0 8px rgb(255 70 232 / .28)); }");
    expect(css).toContain(".skuup-home-hero-treasure { left: calc(48.05% + 40px); top: -2.2%; z-index: 2; width: 78.74%; height: auto; transform: scaleX(1.18) scaleY(1.02); transform-origin: 41.7% 55.2%; filter: brightness(1.04) saturate(1.06) drop-shadow(0 0 2px rgb(255 205 118 / .18)); }");
  });
});
