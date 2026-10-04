import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const { creerLotAdmin, detailSignalement, executerTirage, historiqueTirage, listerLotsAdmin, listerSignalements, listerTiragesAdmin, listerUtilisateursAdmin, modifierLotAdmin, modifierSignalement, modifierStatutUtilisateurAdmin, supprimerLotAdmin } = vi.hoisted(() => ({ creerLotAdmin: vi.fn(), detailSignalement: vi.fn(), executerTirage: vi.fn(), historiqueTirage: vi.fn(), listerLotsAdmin: vi.fn(), listerSignalements: vi.fn(), listerTiragesAdmin: vi.fn(), listerUtilisateursAdmin: vi.fn(), modifierLotAdmin: vi.fn(), modifierSignalement: vi.fn(), modifierStatutUtilisateurAdmin: vi.fn(), supprimerLotAdmin: vi.fn() }));
vi.mock("@/lib/admin", () => ({
  detailSignalement,
  executerTirage,
  historiqueTirage,
  listerLotsAdmin,
  listerSignalements,
  listerTiragesAdmin,
  listerUtilisateursAdmin,
  modifierLotAdmin,
  modifierSignalement,
  modifierStatutUtilisateurAdmin,
  creerLotAdmin,
  supprimerLotAdmin,
}));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import { AdminSectionPage } from "./AdminSectionPage";

beforeEach(() => {
  listerTiragesAdmin.mockResolvedValue([]);
  historiqueTirage.mockResolvedValue([]);
  listerSignalements.mockResolvedValue([{ id: "flag-1", type: "FRAUDE", details: "", statut: "OUVERTE", createdAt: "2026-01-01", user: { id: "user-1", pseudo: "Ada", email: "ada@example.test" }, watchSession: null }]);
  detailSignalement.mockResolvedValue({ id: "flag-1", type: "FRAUDE", details: "Preuve contractuelle", statut: "OUVERTE", createdAt: "2026-01-01", user: { id: "user-1", pseudo: "Ada", email: "ada@example.test", role: "VIEWER", actif: true }, watchSession: null, audit: [] });
  listerUtilisateursAdmin.mockResolvedValue([]);
  listerLotsAdmin.mockResolvedValue([]);
  modifierSignalement.mockImplementation(async (_id: string, statut: string) => ({ ...(await listerSignalements.mock.results[0].value)[0], statut }));
});

test("affiche un état vide honnête quand aucun tirage ne revient du contrat", async () => {
  render(<AdminSectionPage section="raffles" />);
  expect(await screen.findByText("Aucun tirage à piloter")).toBeTruthy();
  expect(screen.getByText(/Aucun lot, compteur ou statut n’est simulé/)).toBeTruthy();
});

test("utilise une seule navigation latérale sur les pages administrateur", async () => {
  render(<AdminSectionPage section="moderation" />);

  expect(await screen.findByRole("navigation", { name: "Navigation administration" })).toBeTruthy();
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
});

test("compose le détail réel et permet l’exécution d’un tirage ouvert", async () => {
  const user = userEvent.setup();
  listerTiragesAdmin.mockResolvedValueOnce([{
    id: "raffle-1", titre: "Soirée finale", description: "Tirage partenaire", dateOuverture: "2026-01-01T10:00:00.000Z", dateTirage: "2026-01-02T20:00:00.000Z", statut: "OUVERT",
    lots: [{ id: "lot-1", nom: "Console", valeurEstimee: "499 €", quantite: 1, fournisseur: "Sponsor" }], audits: [], _count: { tickets: 12, winners: 0 },
  }]);
  historiqueTirage.mockResolvedValue([]);
  executerTirage.mockResolvedValue({ resultHash: "hash-real" });
  vi.stubGlobal("confirm", vi.fn(() => true));
  render(<AdminSectionPage section="raffles" />);
  expect((await screen.findAllByText("Soirée finale")).length).toBe(2);
  expect((screen.getAllByText("Tirage partenaire")).length).toBe(2);
  expect(screen.getByText("Console")).toBeTruthy();
  expect(screen.getByText(/12 participations/)).toBeTruthy();
  await user.type(screen.getByLabelText("Graine exploitant"), "seed");
  await user.type(screen.getByLabelText("Entropie publique"), "entropy");
  await user.click(screen.getByRole("button", { name: "Exécuter le tirage" }));
  await waitFor(() => expect(executerTirage).toHaveBeenCalledWith("raffle-1", "seed", "entropy"));
  expect(await screen.findByText(/Tirage exécuté · hash hash-real/)).toBeTruthy();
});

test("affiche l’inventaire des lots avec filtres et état de stock contractuel", async () => {
  listerLotsAdmin.mockResolvedValueOnce([{
    id: "lot-1", raffleId: "raffle-1", nom: "Console", valeurEstimee: "499 €", quantite: 2, fournisseur: "Sponsor", sponsorId: null,
    raffle: { id: "raffle-1", titre: "Soirée finale", statut: "OUVERT" }, sponsor: null, _count: { winners: 0 },
  }]);
  render(<AdminSectionPage section="lots" />);
  expect(await screen.findByText("Console")).toBeTruthy();
  expect(screen.getByText(/Stock faible · 2/)).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Filtrer les lots par stock" })).toBeTruthy();
});

test("modifie un lot via le contrat administrateur depuis le panneau d’édition", async () => {
  const user = userEvent.setup();
  const lot = { id: "lot-1", raffleId: "raffle-1", nom: "Console", valeurEstimee: "499 €", quantite: 2, fournisseur: "Sponsor", sponsorId: null, raffle: { id: "raffle-1", titre: "Soirée finale", statut: "OUVERT" }, sponsor: null, _count: { winners: 0 } };
  listerLotsAdmin.mockResolvedValueOnce([lot]);
  modifierLotAdmin.mockResolvedValueOnce({ ...lot, nom: "Console Pro", quantite: 1 });
  render(<AdminSectionPage section="lots" />);
  await user.click(await screen.findByRole("button", { name: "Modifier" }));
  const name = screen.getByRole("textbox", { name: "Nom" });
  await user.clear(name);
  await user.type(name, "Console Pro");
  await user.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));
  await waitFor(() => expect(modifierLotAdmin).toHaveBeenCalledWith("lot-1", { nom: "Console Pro", valeurEstimee: "499 €", quantite: 2, fournisseur: "Sponsor" }));
  expect(await screen.findByText(/Lot mis à jour/)).toBeTruthy();
});

test("affiche le détail d’un signalement et permet sa qualification", async () => {
  const user = userEvent.setup();
  render(<AdminSectionPage section="moderation" />);
  await user.click(await screen.findByRole("button", { name: /FRAUDE/ }));
  expect(await screen.findByText(/Preuves disponibles/)).toBeTruthy();
  expect(screen.getByText(/Données utilisateur disponibles/)).toBeTruthy();
  expect(detailSignalement).toHaveBeenCalledWith("flag-1");
  await user.click(screen.getByRole("button", { name: /Marquer examinée/ }));
  await waitFor(() => expect(modifierSignalement).toHaveBeenCalledWith("flag-1", "EXAMINEE", ""));
});
