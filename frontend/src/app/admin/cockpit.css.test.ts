import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cockpitCss = readFileSync(resolve(process.cwd(), "src/app/admin/cockpit.css"), "utf8");
const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
const announcementsAdminSource = readFileSync(resolve(process.cwd(), "src/components/admin/AnnouncementsAdminV3.tsx"), "utf8");
const usersAdminSource = readFileSync(resolve(process.cwd(), "src/components/admin/UsersAdminV3.tsx"), "utf8");
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
    const tabletStart = cockpitCss.indexOf("@media (max-width: 1100px)");

    expect(desktopStart).toBeGreaterThanOrEqual(0);
    expect(tabletStart).toBeGreaterThan(desktopStart);
    expect(cockpitCss.slice(desktopStart, tabletStart)).toContain("grid-template-columns: repeat(4");

    const tablet = mediaBody("@media (max-width: 1100px)");
    const mobile = mediaBody("@media (max-width: 850px)");

    expect(tablet).toContain(cockpitKpiSelector);
    expect(tablet).toContain("grid-template-columns: repeat(2");
    expect(mobile).toContain(cockpitKpiSelector);
    expect(mobile).toContain("grid-template-columns: 1fr");
  });

  it("reflows the shared rail below 900px and collapses cockpit KPIs at 850px", () => {
    const mobileKpis = mediaBody("@media (max-width: 850px)");

    expect(globalsCss).toContain(
      "@media (max-width: 900px) {\n  .skuup-premium-dashboard-shell.skuup-dashboard-shared-frame > .skuup-premium-dashboard-nav {\n    position: static;",
    );
    expect(mobileKpis).toContain(cockpitKpiSelector);
    expect(mobileKpis).toContain("grid-template-columns: 1fr");
  });

  it("keeps the admin hero, KPI hierarchy and empty panels composed", () => {
    expect(cockpitCss).toContain(".skuup-premium-admin-shell .skuup-admin-hero-copy");
    expect(cockpitCss).toContain(".skuup-admin-empty-state");
    expect(cockpitCss).toContain("grid-template-columns: minmax(0, 1fr) auto");
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
    expect(cockpitCss).toContain(".skuup-premium-admin-shell .skuup-admin-main-cockpit .skuup-admin-overview-surface .skuup-admin-hero-copy");
    expect(cockpitCss).toContain(".skuup-premium-admin-shell .skuup-admin-main-cockpit .skuup-admin-kpi-grid");
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-lot-cell img");
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-activity-list li");
  });

  it("uses shared Viewer surfaces for Admin headers, filters and detail panels", () => {
    expect(cockpitCss).toContain("background:var(--dashboard-surface-raised);");
    expect(cockpitCss).toContain("background:var(--dashboard-surface-panel);");
    expect(globalsCss).toContain(".skuup-premium-admin-shell .skuup-dashboard-page-header { display:flex;");
    expect(globalsCss).toContain("background:var(--dashboard-surface-hero);");
    expect(globalsCss).toContain(".skuup-admin-input { box-sizing:border-box; width:100%; min-height:var(--control-min-size);");
    expect(globalsCss).toContain(".skuup-moderation-record.is-selected { border-color:var(--dashboard-border-selected);");
  });

  it("uses the shared KPI surface on secondary Admin routes", () => {
    expect(globalsCss).toContain(
      ".skuup-premium-admin-shell .skuup-admin-kpi { min-height: 8.5rem; align-content: start; background: var(--dashboard-surface-kpi);",
    );
    expect(globalsCss).not.toContain(
      "background: linear-gradient(145deg, rgb(31 17 84 / .7), rgb(20 10 59 / .5))",
    );

    const backgroundRules = Array.from(
      globalsCss.matchAll(/\.skuup-premium-admin-shell \.skuup-admin-kpi\s*\{([^}]*)\}/g),
      (match) => match[1],
    ).filter((body) => /\bbackground\s*:/.test(body));
    const winningBackgroundRule = backgroundRules.at(-1);
    expect(winningBackgroundRule).toContain("background:var(--dashboard-surface-kpi);");
    expect(backgroundRules.join("\n")).not.toContain("linear-gradient");
  });

  it("styles real announcement tabs transparently and user KPIs with shared tokens", () => {
    expect(announcementsAdminSource).toContain('className="skuup-announcement-tabs"');
    expect(globalsCss).toContain(".skuup-announcement-tabs button,.skuup-announcement-editor-tabs button { border:0; border-bottom:2px solid transparent; background:transparent;");
    expect(usersAdminSource).toContain('className="skuup-users-kpis"');
    expect(globalsCss).toContain(".skuup-premium-admin-shell:not(:has(.skuup-admin-main-cockpit)) .skuup-users-kpis article");
    expect(globalsCss).toContain("border-color: var(--dashboard-border-kpi);\n  background: var(--dashboard-surface-kpi);");
    expect(globalsCss).toContain(".skuup-users-kpis article::after { content: \"\"; position: absolute;");
    expect(globalsCss).toContain("background: transparent; filter: none;");
  });
});
