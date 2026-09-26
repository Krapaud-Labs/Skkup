import { describe, expect, test } from "vitest";
import { ErreurApi, messageErreurInterface } from "./api";

describe("messageErreurInterface", () => {
  test("traduit une erreur API francophone pour une interface anglaise", () => {
    expect(messageErreurInterface(
      new ErreurApi("Service indisponible.", 503),
      "en",
      "Unable to load the dashboard right now.",
    )).toBe("The service is temporarily unavailable. Please try again later.");
  });

  test("conserve le message de repli dans la langue de l’interface", () => {
    expect(messageErreurInterface(
      new Error("network failure"),
      "fr",
      "Impossible de charger le tableau de bord pour le moment.",
    )).toBe("Impossible de charger le tableau de bord pour le moment.");
  });
});
