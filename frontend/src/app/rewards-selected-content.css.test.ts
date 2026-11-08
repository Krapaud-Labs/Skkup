import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("Dashboard selected reward sizing", () => {
  it("lets the summary grid grow with the selected reward instead of fixing its height", () => {
    expect(css).toContain(".skuup-rewards-side-grid { display:grid; grid-template-rows:7.5rem auto; align-self:start; gap:.85rem; min-width:0; block-size:auto; }");
    expect(css).toContain(".skuup-rewards-side-grid > .skuup-rewards-selected { display:flex; flex-direction:column; box-sizing:border-box; min-width:0; }");
    expect(css).toContain(".skuup-rewards-selected-content { flex:0 0 auto; min-width:0; padding:0 .35rem .2rem 0; }");
    expect(css).not.toContain(".skuup-rewards-selected-scroll");
  });

  it("keeps the selected reward row naturally sized at tablet and mobile breakpoints", () => {
    expect(css).toContain(".skuup-rewards-side-grid { grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:auto auto; block-size:auto; }");
    expect(css).toContain(".skuup-rewards-side-grid { grid-template-columns:minmax(0,1fr); grid-template-rows:auto auto; gap:.75rem; }");
  });
});
