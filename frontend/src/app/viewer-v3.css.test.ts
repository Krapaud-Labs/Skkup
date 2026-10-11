import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("viewer DASH-V3 visual composition", () => {
  it("defines a dedicated hero using the existing dashboard asset", () => {
    expect(css).toContain(".skuup-viewer-v3-hero");
    expect(css).toContain(".skuup-viewer-v3-hero-mark");
  });

  it("keeps KPI hierarchy and empty panels visible at narrow widths", () => {
    expect(css).toContain(".skuup-viewer-v3-empty-panel");
    expect(css).toContain("grid-template-columns:auto minmax(0,1fr)");
    expect(css).toContain("@media (max-width: 700px)");
  });
});
