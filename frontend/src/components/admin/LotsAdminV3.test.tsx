import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { imagesForSource } from "@/test-utils/next-image";

const state = vi.hoisted(() => ({ langue: "fr" as "fr" | "en", ErreurApi: class extends Error { statut: number; constructor(message: string, statut: number) { super(message); this.statut = statut; } } }));
const api = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));

vi.mock("@/lib/admin", () => ({ listerLotsAdmin: api.list, creerLotAdmin: api.create, modifierLotAdmin: api.update, supprimerLotAdmin: api.remove }));
vi.mock("@/lib/api", () => ({ ErreurApi: state.ErreurApi }));
vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: state.langue }) }));
vi.mock("@/components/admin/AdminSectionPage", () => ({ Shell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

import { LotsAdminV3 } from "./LotsAdminV3";

const lot = { id: "lot-1", raffleId: "raffle-1", nom: "Console", valeurEstimee: "499 €", quantite: 2, fournisseur: "Sponsor", imageUrl: null, raffle: { id: "raffle-1", titre: "Soirée finale", statut: "OUVERT" }, sponsor: null, _count: { winners: 0 } };

beforeEach(() => {
  state.langue = "fr";
  vi.clearAllMocks();
  api.list.mockResolvedValue([lot]);
  api.create.mockResolvedValue(lot);
  api.update.mockResolvedValue(lot);
  api.remove.mockResolvedValue(undefined);
  vi.stubGlobal("confirm", vi.fn(() => true));
});

test("localise l’inventaire et le formulaire en anglais", async () => {
  state.langue = "en";
  render(<LotsAdminV3 />);
  expect(await screen.findByRole("heading", { name: "Prizes and stock" })).toBeTruthy();
  expect(screen.getByLabelText("Search prizes")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Add a prize" })).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: "Add a prize" }));
  const dialog = screen.getByRole("dialog", { name: "Create prize" });
  expect(dialog).toBeTruthy();
  expect(imagesForSource(dialog, "/assets/icons/ui/close.png")).not.toHaveLength(0);
  expect(screen.getByLabelText("Quantity")).toBeTruthy();
});

test("filtre localement la recherche et le stock", async () => {
  const user = userEvent.setup();
  api.list.mockResolvedValue([lot, { ...lot, id: "lot-2", nom: "Carte cadeau", quantite: 0 }]);
  render(<LotsAdminV3 />);
  await screen.findByText("Console");
  await user.type(screen.getByLabelText("Rechercher un lot"), "Carte");
  expect(screen.queryByText("Console")).toBeNull();
  expect(screen.getByText("Carte cadeau")).toBeTruthy();
  await user.selectOptions(screen.getByLabelText("Stock"), "RUPTURE");
  expect(screen.getByText("Rupture · 0")).toBeTruthy();
});

test("conserve le fallback média accessible et l’état de chargement", async () => {
  api.list.mockReturnValue(new Promise(() => undefined));
  render(<LotsAdminV3 />);
  expect(screen.getByText("Chargement de l’inventaire…")).toBeTruthy();
  expect(screen.queryByText("Aucun lot renvoyé par le contrat.")).toBeNull();
});

test("crée un lot avec le contrat existant", async () => {
  const user = userEvent.setup();
  render(<LotsAdminV3 />);
  await screen.findByText("Console");
  await user.click(screen.getByRole("button", { name: "Ajouter un lot" }));
  await user.type(screen.getByLabelText("Identifiant du tirage"), "raffle-2");
  await user.type(screen.getByLabelText("Nom"), "Carte");
  await user.type(screen.getByLabelText("Valeur estimée"), "20 €");
  await user.type(screen.getByLabelText("Fournisseur"), "Sponsor");
  await user.click(screen.getByRole("button", { name: "Créer un lot" }));
  await waitFor(() => expect(api.create).toHaveBeenCalled());
  expect(screen.getByRole("status").textContent).toContain("Lot créé");
});

test("annonce un refus 403 sur une mutation", async () => {
  api.update.mockRejectedValue(new state.ErreurApi("Forbidden", 403));
  const user = userEvent.setup();
  render(<LotsAdminV3 />);
  await screen.findByText("Console");
  await user.click(screen.getByRole("button", { name: "Modifier" }));
  await user.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));
  expect((await screen.findByRole("alert")).textContent).toContain("comptes administrateurs");
});
