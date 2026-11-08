import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("Dashboard rewards collection alignment", () => {
  it("lets the collection stretch with the natural height of the side column on desktop", () => {
    expect(css).toContain(".skuup-rewards-main-grid { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(18rem,.85fr); align-items:stretch; gap:1rem; min-width:0; }");
    expect(css).toContain(".skuup-rewards-collection { display:flex; flex-direction:column; box-sizing:border-box; block-size:auto; min-block-size:clamp(30rem,66vh,40rem); max-block-size:none; contain:size; overflow:hidden; padding:1.25rem; }");
    expect(css).toContain(".skuup-rewards-collection-scroll { display:flex; flex:1 1 auto; flex-direction:column; min-block-size:0; overflow-x:hidden; overflow-y:auto;");
  });

  it("keeps the collection's responsive height when the rewards panels stack", () => {
    expect(css).toContain(".skuup-rewards-collection { block-size:min(60vh,36rem); min-block-size:22rem; }");
    expect(css).toContain(".skuup-rewards-collection { block-size:min(58vh,34rem); min-block-size:20rem; padding:1rem; }");
  });
});
