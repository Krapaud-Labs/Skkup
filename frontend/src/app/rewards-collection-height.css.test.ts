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

  it("brings the card title and duration closer without changing card height or artwork", () => {
    const cardSelector = ".skuup-rewards-collection .skuup-rewards-grid .skuup-scratch-card";
    const cardSelectorIndex = css.indexOf(cardSelector);
    const cardRuleStart = css.indexOf("{", cardSelectorIndex);
    const cardRuleEnd = css.indexOf("}", cardRuleStart);
    const cardDeclarations = css.slice(cardRuleStart + 1, cardRuleEnd);

    expect(cardDeclarations).toContain(
      "grid-template-rows: auto minmax(2.75rem, auto) minmax(2.3em, auto) 2.75rem;",
    );
    expect(cardDeclarations).toContain("padding-block-end: 1.2rem;");
    expect(css).toContain(".skuup-rewards-collection .skuup-rewards-grid .skuup-scratch-art {");
    expect(css).toContain("aspect-ratio: 1672 / 941;");
  });

  it("removes the action row only from used cards while keeping a focus ring", () => {
    expect(css).toContain(
      ".skuup-rewards-collection .skuup-rewards-grid .skuup-scratch-card.is-used {\n  grid-template-rows: auto minmax(2.75rem, auto) minmax(2.3em, auto);\n}",
    );
    expect(css).toContain(".skuup-scratch-card.is-used.is-selected:not(:focus-visible) {\n  outline:none;");
    expect(css).toContain(".skuup-scratch-card.is-used.is-selected:focus-visible {\n  outline:2px solid");
  });
});
