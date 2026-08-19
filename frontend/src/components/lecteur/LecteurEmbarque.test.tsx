import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LecteurEmbarque } from "./LecteurEmbarque";

// ─── Doubles du suivi et du lecteur YouTube ──────────────────────────────────

vi.mock("@/hooks/useSessionVisionnage", () => ({
  useSessionVisionnage: vi.fn(() => ({
    etat: "inactive",
    messageErreur: null,
    pointsCredites: 0,
  })),
}));

vi.mock("./LecteurYouTube", () => ({
  LecteurYouTube: ({
    onEtat,
  }: {
    onEtat: (etat: { enLecture: boolean; positionSecondes: number }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onEtat({ enLecture: true, positionSecondes: 42 })}
    >
      Simuler la lecture
    </button>
  ),
}));

const { useSessionVisionnage } = await import("@/hooks/useSessionVisionnage");

/**
 * JSDOM expose `visibilityState` en lecture seule. Le descripteur initial est
 * conservé pour simuler un onglet masqué sans contaminer les autres tests.
 */
const descriptionVisibilite = Object.getOwnPropertyDescriptor(
  document,
  "visibilityState",
);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  if (descriptionVisibilite) {
    Object.defineProperty(document, "visibilityState", descriptionVisibilite);
  }
});

// ─── Suspension lorsque l'onglet est masqué ──────────────────────────────────

test("suspend le comptage quand l'onglet n'est plus visible", async () => {
  const utilisateur = userEvent.setup();
  render(
    <LecteurEmbarque
      stream={{
        id: "stream-1",
        plateforme: "YOUTUBE",
        identifiantChaine: "UC123",
        nomAffiche: "Chaîne Alpha",
      }}
    />,
  );

  await utilisateur.click(
    screen.getByRole("button", { name: "Simuler la lecture" }),
  );
  expect(vi.mocked(useSessionVisionnage).mock.lastCall?.[0].enLecture).toBe(
    true,
  );

  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  act(() => document.dispatchEvent(new Event("visibilitychange")));

  expect(vi.mocked(useSessionVisionnage).mock.lastCall?.[0].enLecture).toBe(
    false,
  );
});
