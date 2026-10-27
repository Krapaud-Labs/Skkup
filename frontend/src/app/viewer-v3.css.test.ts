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
    expect(css).toContain(".skuup-balance-coin { display:block; height:1.25rem; width:1.25rem; object-fit:contain; }");
  });

  it("does not reserve a decorative icon slot before dashboard block titles", () => {
    expect(css).not.toContain(".skuup-viewer-v3-title-icon");
  });

  it("keeps KPI hierarchy and empty panels visible at narrow widths", () => {
    expect(css).toContain(".skuup-viewer-v3-empty-panel");
    expect(css).toContain("grid-template-columns:auto minmax(0,1fr)");
    expect(css).toContain("@media (max-width: 700px)");
  });

  it("keeps the rewards card at its natural baseline and confines the draw to that row", () => {
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-viewer-v3-scratch-panel { height: auto; min-height: 0; align-self: start; }");
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-viewer-v3-rewards-grid {\n  grid-template-columns: minmax(0, 1.55fr) minmax(22rem, .9fr);\n  position: relative;\n}");
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-viewer-v3-draws-panel { position: absolute; grid-area: 1 / 2 / 2 / 3; inset: 0; min-height: 0; overflow-y: auto;");
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-viewer-v3-draws-panel { overflow: hidden; }");
    expect(css).not.toContain(".skuup-viewer-v3-rewards-grid {\n  grid-template-columns: minmax(0, 1.55fr) minmax(22rem, .9fr);\n  align-items: stretch;");
    const mobileStacking = css.slice(css.lastIndexOf("@media (max-width: 850px)"));
    expect(mobileStacking).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-viewer-v3-rewards-grid { position: static; }");
    expect(mobileStacking).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-viewer-v3-draws-panel { position: static; grid-area: auto; inset: auto; height: auto; min-height: 0; align-self: start; overflow: visible; }");
  });

  it("shows a compact preview of lots without nested scrolling", () => {
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-raffle-lots-compact { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem; margin-top: .65rem; min-block-size: 0; max-block-size: none; overflow: visible; }");
    expect(css.lastIndexOf(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-raffle-lots-compact {")).toBeGreaterThan(css.lastIndexOf(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-raffle-lots {"));
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-draw-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto;");
    expect(css).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-raffle-more");
    const mobileStacking = css.slice(css.lastIndexOf("@media (max-width: 850px)"));
    expect(mobileStacking).toContain(".skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell) .skuup-dashboard-raffle-lots { min-block-size: 0; }");
  });

  it("defines the secondary viewer fidelity rhythm without adding data fields", () => {
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-stream-card");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-history-detail");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-rewards-selected-art");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-extension-step-row > div");
    expect(css).toContain(".skuup-premium-dashboard-shell .skuup-viewer-loading");
  });
});
