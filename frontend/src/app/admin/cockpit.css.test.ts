import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cockpitCss = readFileSync(resolve(process.cwd(), "src/app/admin/cockpit.css"), "utf8");
const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
const cockpitKpiSelector = ".skuup-premium-admin-shell .skuup-admin-main-cockpit .skuup-admin-kpi-grid";

function mediaBody(query: string) {
  const start = cockpitCss.indexOf(query);
  expect(start, `Missing media query: ${query}`).toBeGreaterThanOrEqual(0);
  const openingBrace = cockpitCss.indexOf("{", start);
  const closingBrace = cockpitCss.indexOf("\n}", openingBrace);
  expect(openingBrace).toBeGreaterThan(start);
  expect(closingBrace).toBeGreaterThan(openingBrace);
  return cockpitCss.slice(openingBrace, closingBrace);
}

describe("principal admin cockpit responsive contract", () => {
  it("keeps shared admin KPI breakpoints away from the principal cockpit", () => {
    expect(globalsCss).not.toContain(".skuup-premium-admin-shell .skuup-admin-kpi-grid");
    expect(globalsCss).toContain(
      ".skuup-premium-admin-shell:not(:has(.skuup-admin-main-cockpit)) .skuup-admin-kpi-grid",
    );
  });

  it("keeps the desktop grid independent from the sidebar content width", () => {
    const desktopStart = cockpitCss.indexOf(`${cockpitKpiSelector} {`);
    const tabletStart = cockpitCss.indexOf("@media (max-width: 1180px)");

    expect(desktopStart).toBeGreaterThanOrEqual(0);
    expect(tabletStart).toBeGreaterThan(desktopStart);
    expect(cockpitCss.slice(desktopStart, tabletStart)).toContain("grid-template-columns: repeat(4");

    const tablet = mediaBody("@media (max-width: 1180px)");
    const mobile = mediaBody("@media (max-width: 767px)");
    const legacy = mediaBody("@media(max-width:1100px)");

    expect(tablet).toContain(cockpitKpiSelector);
    expect(tablet).toContain("grid-template-columns: repeat(2");
    expect(mobile).toContain(cockpitKpiSelector);
    expect(mobile).toContain("grid-template-columns: 1fr");
    expect(legacy).not.toContain(".skuup-admin-main-cockpit .skuup-admin-kpi-grid");
  });

  it("reflows the shared rail below 900px and collapses cockpit KPIs at 767px", () => {
    const mobileKpis = mediaBody("@media (max-width: 767px)");

    expect(globalsCss).toContain(
      "@media (max-width: 900px) {\n  .skuup-dashboard-shared-frame {",
    );
    expect(globalsCss).toContain(
      ".skuup-dashboard-shared-frame > .skuup-premium-dashboard-nav {\n    position: static;",
    );
    expect(mobileKpis).toContain(cockpitKpiSelector);
    expect(mobileKpis).toContain("grid-template-columns: 1fr");
  });

  it("keeps the admin hero, KPI hierarchy and empty panels composed", () => {
    expect(cockpitCss).toContain(".skuup-admin-hero");
    expect(cockpitCss).toContain(".skuup-admin-hero-mark");
    expect(cockpitCss).toContain(".skuup-admin-empty-state");
    expect(cockpitCss).toContain("grid-template-columns: auto minmax(0, 1fr) auto");
  });

  it("keeps lot media prominent, removes the repeated ticket detail and marks the audit timeline", () => {
    expect(cockpitCss).toContain(".skuup-admin-lot-cell img");
    expect(cockpitCss).not.toContain(".skuup-admin-table-raffles .skuup-admin-table-row > span:nth-child(2) small");
    expect(cockpitCss).toContain(".skuup-admin-activity-list::before");
    expect(cockpitCss).toContain(".skuup-admin-activity-list li > span:last-child time");
  });

  it("provides a visual fallback for unavailable lot media", () => {
    expect(cockpitCss).toContain(".skuup-admin-lot-placeholder");
  });

  it("keeps the final reference rhythm scoped to the principal cockpit", () => {
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-hero");
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-kpi { min-height: 8.4rem");
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-lot-cell img");
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-activity-list li");
  });
});
