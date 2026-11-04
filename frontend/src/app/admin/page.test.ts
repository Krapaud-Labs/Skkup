import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { priorities } from "./priorities";

const adminPage = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
const cockpitCss = readFileSync(resolve(process.cwd(), "src/app/admin/cockpit.css"), "utf8");

describe("cockpit admin", () => {
  it("expose les indicateurs alimentés par le résumé API", () => {
    expect(priorities.map(({ key }) => key)).toEqual([
      "openRaffles",
      "availableLots",
      "activeAnnouncements",
      "openFraudFlags",
    ]);
    expect(priorities.map(({ icon }) => icon)).toEqual([
      "draws",
      "gift",
      "megaphone",
      "flag",
    ]);
  });

  it("ne propose plus la gestion éditoriale depuis le cockpit", () => {
    expect(adminPage).not.toContain("/admin/content");
    expect(adminPage).not.toContain("resume.contents");
    expect(adminPage).toContain("announcementsTitle");
  });

  it("prépare le cockpit pour les deux langues et des dates localisées", () => {
    expect(adminPage).toContain('const t = copy[langue]');
    expect(adminPage).toContain('langue === "en" ? "en-US" : "fr-FR"');
    expect(adminPage).toContain('role="table"');
    expect(adminPage).toContain('role="columnheader"');
    expect(adminPage).toContain('Skkup administration');
    expect(adminPage).toContain('No active announcements were returned by the contract.');
  });

  it("garde l’état vide de modération lisible et le tableau Tirages défilable au clavier", () => {
    expect(cockpitCss).toContain('section[aria-labelledby="moderation-title"] .skuup-admin-empty-state');
    expect(cockpitCss).toContain("grid-column: 1 / -1;");
    expect(cockpitCss).toContain(".skuup-admin-main-cockpit .skuup-admin-table-raffles {\n    min-width: 0;\n    overflow-x: auto;");
    expect(cockpitCss).toContain("width: max(100%, 36rem);");
    expect(adminPage).toContain('aria-label={t.rafflesTitle}\n                  tabIndex={0}');
  });
});
