import { describe, expect, it } from "vitest";
import { priorities } from "./page";

describe("cockpit admin", () => {
  it("expose les indicateurs alimentés par le résumé API", () => {
    expect(priorities.map(({ key }) => key)).toEqual([
      "openRaffles",
      "availableLots",
      "activeAnnouncements",
      "openFraudFlags",
    ]);
  });
});
