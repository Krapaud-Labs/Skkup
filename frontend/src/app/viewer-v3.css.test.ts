import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("viewer DASH-V3 visual composition", () => {
  it("defines a dedicated hero using the existing dashboard asset", () => {
    expect(css).toContain(".skuup-viewer-v3-hero");
    expect(css).toContain(".skuup-viewer-v3-hero-mark");
    expect(css).toContain("filter:drop-shadow(0 0 1rem rgb(168 85 247 / .42))");
    expect(css).toContain(".skuup-viewer-topbar-actions { display:flex; align-items:center; gap:.75rem; margin-left:auto; }");
    expect(css).toContain(".skuup-account-label { max-width:5.5rem; }");
  });

  it("keeps KPI hierarchy and empty panels visible at narrow widths", () => {
    expect(css).toContain(".skuup-viewer-v3-empty-panel");
    expect(css).toContain("grid-template-columns:auto minmax(0,1fr)");
    expect(css).toContain("@media (max-width: 700px)");
  });

  it("defines the secondary viewer fidelity rhythm without adding data fields", () => {
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-stream-card");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-history-detail");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-rewards-selected-art");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-extension-step-row > div");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-viewer-loading");
  });
});
