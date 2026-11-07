import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
const viewerScope = ".skuup-premium-dashboard-shell.skuup-dashboard-shared-frame:not(.skuup-premium-admin-shell)";

describe("shared Dashboard Viewer top spacing", () => {
  it("reduces the shared topbar and secondary page gaps within Viewer only", () => {
    expect(css).toContain(`${viewerScope} .skuup-viewer-topbar {\n  margin-block-end:.4rem;\n}`);
    expect(css).toContain(`${viewerScope} .skuup-dashboard-page {\n  gap:1.25rem;\n}`);
    expect(css).toContain(`${viewerScope} .skuup-viewer-page {\n  gap:1rem;\n}`);
    expect(css).toContain(`${viewerScope} :is(.skuup-dashboard-page,.skuup-viewer-page) > .skuup-dashboard-page-header {\n  margin-block-end:0;\n  padding-block-end:.85rem;\n}`);
  });

  it("keeps the Admin shell outside the spacing override", () => {
    expect(viewerScope).toContain(":not(.skuup-premium-admin-shell)");
    expect(css).not.toContain(".skuup-premium-admin-shell.skuup-dashboard-shared-frame .skuup-dashboard-page {\n  gap:1.25rem;");
  });
});
