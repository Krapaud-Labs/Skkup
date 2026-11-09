import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { imagesForSource } from "@/test-utils/next-image";
import { AdminPageHeader } from "./AdminPageHeader";

const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("AdminPageHeader", () => {
  it("reprend le titre Viewer avec son pictogramme, sa description et son aside", () => {
    const { container } = render(
      <AdminPageHeader
        kicker="Gestion des tirages"
        title="Tirages"
        icon="draws"
        description="Consultez les tirages programmés."
        aside={<button type="button">Créer un tirage</button>}
      />,
    );

    const header = container.querySelector(
      "header.skuup-dashboard-page-header.skuup-admin-page-heading",
    );
    const title = screen.getByRole("heading", { level: 1, name: "Tirages" });

    expect(header).not.toBeNull();
    expect(title.parentElement).toBe(header);
    expect(title.className).toContain("skuup-dashboard-page-title");
    expect(header?.querySelector(".skuup-kicker")?.textContent).toBe("Gestion des tirages");
    expect(header?.querySelector(".skuup-admin-page-heading-description")?.textContent).toBe(
      "Consultez les tirages programmés.",
    );
    expect(imagesForSource(container, "/assets/icons/ui/draws-v2.png")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Créer un tirage" })).toBeTruthy();
  });

  it("garde kicker et titre en première colonne sans description ni aside", () => {
    const { container } = render(
      <AdminPageHeader kicker="Gestion des tirages" title="Tirages" icon="draws" />,
    );

    const header = container.querySelector(".skuup-admin-page-heading");
    const title = screen.getByRole("heading", { level: 1, name: "Tirages" });
    const firstColumnSelector =
      ".skuup-premium-admin-shell.skuup-dashboard-shared-frame .skuup-admin-page-heading > :is(.skuup-kicker,.skuup-dashboard-page-title)";
    const firstColumnSelectorIndex = globalsCss.indexOf(firstColumnSelector);
    const firstColumnRuleStart = globalsCss.indexOf("{", firstColumnSelectorIndex);
    const firstColumnRuleEnd = globalsCss.indexOf("}", firstColumnRuleStart);

    expect(header?.children).toHaveLength(2);
    expect(title.parentElement).toBe(header);
    expect(firstColumnSelectorIndex).toBeGreaterThanOrEqual(0);
    expect(globalsCss.slice(firstColumnRuleStart + 1, firstColumnRuleEnd)).toContain(
      "grid-column:1;",
    );
  });

  it("affiche le séparateur inférieur Viewer sur les six headers secondaires", () => {
    const headerSelector =
      ".skuup-premium-admin-shell.skuup-dashboard-shared-frame .skuup-admin-page-heading.skuup-dashboard-page-header";
    const selectorIndex = globalsCss.indexOf(headerSelector);
    const ruleStart = globalsCss.indexOf("{", selectorIndex);
    const ruleEnd = globalsCss.indexOf("}", ruleStart);
    const declarations = globalsCss.slice(ruleStart + 1, ruleEnd);

    expect(selectorIndex).toBeGreaterThanOrEqual(0);
    expect(declarations).toContain("border-bottom:1px solid rgb(168 85 247 / .2);");
  });
});
