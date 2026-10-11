import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { priorities } from "./priorities";
import { readFileSync as readAdminContent } from "node:fs";

const adminPage = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
const adminContent = readAdminContent(resolve(process.cwd(), "src/components/admin/GestionContenu.tsx"), "utf8");

describe("cockpit admin", () => {
  it("expose les indicateurs alimentés par le résumé API", () => {
    expect(priorities.map(({ key }) => key)).toEqual([
      "openRaffles",
      "availableLots",
      "activeAnnouncements",
      "openFraudFlags",
    ]);
  });

  it("rend les contenus réels du résumé sans fabriquer de donnée", () => {
    expect(adminPage).toContain("resume.contents.slice(0, 2)");
    expect(adminPage).toContain("content.slug");
    expect(adminPage).toContain("content.locale");
    expect(adminPage).toContain("content.status");
    expect(adminPage).toContain("content.version");
    expect(adminPage).toContain("/admin/content?content=${content.id}");
  });

  it("respecte le contenu demandé depuis le cockpit", () => {
    expect(adminContent).toContain("new URLSearchParams(window.location.search).get(\"content\")");
    expect(adminContent).toContain("items.find((item) => item.id === requestedId)");
  });
});
