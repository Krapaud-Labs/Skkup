import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("extension platform cards", () => {
  it("centers each icon and label together without changing card styling", () => {
    expect(css).toContain(".skuup-platform-grid article { display:flex; align-items:center; justify-content:center; gap:.55rem; border:1px solid var(--dashboard-line); border-radius:.75rem; background:var(--dashboard-panel-raised); padding:.8rem; }");
  });
});
