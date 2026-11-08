import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("Dashboard Viewer rules card top inset", () => {
  it("reduces only the Dashboard Viewer card padding and first direct heading spacing", () => {
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-page > .skuup-reglement-card-dashboard {\n  padding-block-start:1.25rem;\n}");
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-page > .skuup-reglement-card-dashboard > .skuup-reglement-heading:first-child {\n  margin-block-start:0;\n  border-block-start:0;\n  padding-block-start:0;\n}");
  });

  it("keeps the public rules card padding unchanged", () => {
    expect(css).toContain(".skuup-reglement-card:not(.skuup-reglement-card-dashboard) { max-width: 66rem; border: 1px solid rgb(168 85 247 / .28); border-radius: 1.25rem; background: linear-gradient(145deg, rgb(31 17 84 / .84), rgb(9 5 45 / .76)); padding: clamp(1.25rem, 3vw, 2.5rem);");
  });
});
