import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
const page = readFileSync(resolve(process.cwd(), "src/app/dashboard/tirages/page.tsx"), "utf8");
const tiragesRoute = ".skuup-dashboard-raffles-page";

describe("Tirages Viewer scroll confinement", () => {
  it("disables vertical edge bounce at the global document root", () => {
    expect(css).toContain("html {\n  overscroll-behavior-y: none;\n}");
  });

  it("marks the Tirages route and locks only its document scroll-root", () => {
    expect(page).toContain('className="skuup-dashboard-page skuup-dashboard-raffles-page"');
    expect(css).toContain(`html:has(${tiragesRoute}) {\n  block-size:100%;\n  overflow:hidden;\n  overscroll-behavior-y:none;\n}`);
    expect(css).toContain(`body:has(${tiragesRoute}) {\n  block-size:100dvh;\n  min-block-size:0;\n  overflow:hidden;\n}`);
  });

  it("keeps the content as the desktop scrollport and confines edge chaining", () => {
    expect(css).toContain(`.skuup-dashboard-host:has(${tiragesRoute}) > .skuup-premium-dashboard-shell > .skuup-premium-dashboard-content {\n  box-sizing:border-box;\n  block-size:100%;\n  min-block-size:0;\n  overflow-x:clip;\n  overflow-y:auto;\n  overscroll-behavior-y:contain;\n}`);
  });

  it("preserves usable navigation and a remaining-height content scroller on mobile", () => {
    const mobileRules = css.slice(css.lastIndexOf("@media (max-width:900px)"));
    expect(mobileRules).toContain(`.skuup-dashboard-host:has(${tiragesRoute}) > .skuup-premium-dashboard-shell {\n    display:flex;\n    flex-direction:column;\n  }`);
    expect(mobileRules).toContain(`.skuup-dashboard-host:has(${tiragesRoute}) > .skuup-premium-dashboard-shell > .skuup-premium-dashboard-nav {\n    flex:0 0 auto;\n    max-block-size:40dvh;\n  }`);
    expect(mobileRules).toContain(`.skuup-dashboard-host:has(${tiragesRoute}) > .skuup-premium-dashboard-shell > .skuup-premium-dashboard-content {\n    flex:1 1 0;\n    block-size:auto;\n  }`);
  });
});
