import { describe, expect, test } from "vitest";
import { progressionPalier } from "./CentreRecompenses";

describe("progressionPalier", () => {
  test("borne la progression sur le palier contractuel", () => {
    expect(progressionPalier(3, 7)).toBe(3);
    expect(progressionPalier(9, 7)).toBe(7);
    expect(progressionPalier(-1, 7)).toBe(0);
  });
});
