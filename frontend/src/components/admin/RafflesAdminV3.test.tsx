/* eslint-disable @next/next/no-img-element */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({ langue: "fr" as "fr" | "en", ErreurApi: class extends Error { statut: number; constructor(message: string, statut: number) { super(message); this.statut = statut; } } }));
const api = vi.hoisted(() => ({ lister: vi.fn(), history: vi.fn(), draw: vi.fn() }));

vi.mock("@/lib/admin", () => ({ listerTiragesAdmin: api.lister, historiqueTirage: api.history, executerTirage: api.draw }));
vi.mock("@/lib/api", () => ({ ErreurApi: state.ErreurApi }));
vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: state.langue }) }));
vi.mock("@/components/admin/AdminSectionPage", () => ({ Shell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => { const { unoptimized, ...imageProps } = props; void unoptimized; return <img alt={imageProps.alt ?? ""} {...imageProps} />; } }));

import { RafflesAdminV3 } from "./RafflesAdminV3";

const raffle = {
  id: "raffle-1", titre: "Soirée finale", description: "Tirage partenaire", dateOuverture: "2026-01-01T10:00:00.000Z", dateTirage: "2026-01-02T20:00:00.000Z", statut: "OUVERT",
  lots: [{ id: "lot-1", nom: "Console", valeurEstimee: "499 €", quantite: 1, fournisseur: "Sponsor", imageUrl: null }], audits: [], _count: { tickets: 12, winners: 0 },
};

beforeEach(() => {
  state.langue = "fr";
  vi.clearAllMocks();
  api.lister.mockResolvedValue([raffle]);
  api.history.mockResolvedValue([]);
  api.draw.mockResolvedValue({ resultHash: "hash-real" });
  vi.stubGlobal("confirm", vi.fn(() => true));
});

test("localise le cockpit tirages et formate les dates en anglais", async () => {
  state.langue = "en";
  render(<RafflesAdminV3 />);

  expect(await screen.findByRole("heading", { name: "Draws to manage" })).toBeTruthy();
  expect(screen.getByLabelText("Search draws")).toBeTruthy();
  expect(screen.getByText("Entry period")).toBeTruthy();
  expect(screen.getAllByText(/Jan 2, 2026/).length).toBeGreaterThan(0);
});

test("rend les PNG de validation et d’alerte selon l’état des prérequis", async () => {
  api.lister.mockResolvedValue([{ ...raffle, statut: "CLOTURE", lots: [] }]);
  const { container } = render(<RafflesAdminV3 />);

  await screen.findByRole("heading", { name: "Soirée finale" });
  expect(container.querySelector('img[src="/assets/icons/ui/check.png"]')).not.toBeNull();
  expect(container.querySelectorAll('img[src="/assets/icons/ui/warning.png"]')).toHaveLength(2);
  expect(screen.getByRole("button", { name: /Voir l’annonce/ }).querySelector("img")?.getAttribute("src")).toBe("/assets/icons/ui/arrow-up-right.png");
  expect(screen.getByRole("button", { name: /Plus d’actions/ }).querySelector("img")?.getAttribute("src")).toBe("/assets/icons/ui/chevronDown.png");
});

test("filtre les tirages et conserve un état vide explicite", async () => {
  api.lister.mockResolvedValue([raffle, { ...raffle, id: "raffle-2", titre: "Autre tirage" }]);
  const user = userEvent.setup();
  render(<RafflesAdminV3 />);
  const search = await screen.findByLabelText("Rechercher un tirage");
  await user.type(search, "inconnu");
  expect(screen.getByText("Aucun tirage ne correspond à la recherche.")).toBeTruthy();
});

test("exécute un tirage ouvert avec les entrées contractuelles", async () => {
  const user = userEvent.setup();
  render(<RafflesAdminV3 />);
  await screen.findByRole("heading", { name: "Soirée finale" });
  await user.type(screen.getByLabelText("Graine exploitant"), "seed");
  await user.type(screen.getByLabelText("Entropie publique"), "entropy");
  await user.click(screen.getByRole("button", { name: "Exécuter le tirage" }));
  await waitFor(() => expect(api.draw).toHaveBeenCalledWith("raffle-1", "seed", "entropy"));
  expect((await screen.findByRole("status")).textContent).toContain("Tirage exécuté");
});

test("annonce explicitement une permission refusée par l’API", async () => {
  api.draw.mockRejectedValue(new state.ErreurApi("Forbidden", 403));
  const user = userEvent.setup();
  render(<RafflesAdminV3 />);
  await screen.findByRole("heading", { name: "Soirée finale" });
  await user.type(screen.getByLabelText("Graine exploitant"), "seed");
  await user.type(screen.getByLabelText("Entropie publique"), "entropy");
  await user.click(screen.getByRole("button", { name: "Exécuter le tirage" }));
  expect((await screen.findByRole("alert")).textContent).toContain("comptes autorisés");
});

test("expose le chargement API avant la liste", () => {
  api.lister.mockReturnValue(new Promise(() => undefined));
  render(<RafflesAdminV3 />);
  expect(screen.getByRole("status", { name: "Chargement des tirages" })).toBeTruthy();
  expect(screen.queryByText("Aucun tirage à piloter")).toBeNull();
});
