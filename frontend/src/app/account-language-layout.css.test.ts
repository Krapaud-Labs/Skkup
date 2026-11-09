import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("account language selector alignment", () => {
  it("aligns the language selector to the left inside the account menu", () => {
    expect(css).toContain(".skuup-account-language { display:flex; justify-content:flex-start; padding:.55rem .75rem; }");
  });
});
