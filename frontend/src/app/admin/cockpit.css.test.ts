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
});
