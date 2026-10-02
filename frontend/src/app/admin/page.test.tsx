import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const remplacer = vi.fn();
const creerAnnonce = vi.fn();
const recupererProfil = vi.fn();
const listerSponsors = vi.fn();
const listerSignalements = vi.fn();
const listerStreams = vi.fn();
const listerContenus = vi.fn();
const listerAnnonces = vi.fn();
const listerTiragesAdmin = vi.fn();
const historiqueAnnonce = vi.fn();
const historiqueTirage = vi.fn();
const restaurerAnnonce = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }) }));
vi.mock("@/lib/dashboard", () => ({
  recupererProfil,
}));
vi.mock("@/lib/streams", () => ({
  listerStreams,
}));
vi.mock("@/lib/admin", () => ({
  creerAnnonce,
  creerSponsor: vi.fn(),
  creerTirage: vi.fn(),
  configurerRecompenseStream: vi.fn(),
  listerSignalements,
  listerSponsors,
  modifierSignalement: vi.fn(),
  listerContenus,
  listerAnnonces,
  modifierAnnonce: vi.fn(),
  archiverAnnonce: vi.fn(),
  listerTiragesAdmin,
  modifierTirage: vi.fn(),
  historiqueAnnonce,
  historiqueTirage,
  restaurerAnnonce,
}));

const { default: PageAdministration } = await import("./page");

beforeEach(() => {
  vi.clearAllMocks();
  recupererProfil.mockResolvedValue({ pseudo: "Ada", role: "ADMIN" });
  listerSponsors.mockResolvedValue([]);
  listerSignalements.mockResolvedValue([]);
  listerStreams.mockResolvedValue([]);
  listerContenus.mockResolvedValue([]);
  listerAnnonces.mockResolvedValue([]);
  listerTiragesAdmin.mockResolvedValue([]);
});

describe("PageAdministration", () => {
  test("affiche les outils du back-office à un administrateur", async () => {
    render(<PageAdministration />);
    expect(await screen.findByRole("heading", { name: "Back-office Skkup" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Nouveau sponsor" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Nouvelle annonce" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Nouveau tirage" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Bonus des streams partenaires" })).toBeDefined();
  });

  test("crée une annonce et confirme l'action", async () => {
    creerAnnonce.mockResolvedValue({ id: "annonce-1" });
    const utilisateur = userEvent.setup();
    render(<PageAdministration />);
    const article = (await screen.findByRole("heading", { name: "Nouvelle annonce" })).closest("article")!;
    await utilisateur.type(within(article).getByLabelText("Titre"), "Maintenance");
    await utilisateur.type(within(article).getByLabelText("Message"), "Intervention programmée.");
    await utilisateur.click(within(article).getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(creerAnnonce).toHaveBeenCalledWith("Maintenance", "Intervention programmée."));
    expect(screen.getByRole("status").textContent).toBe("Annonce créée.");
  });

  test("redirige un viewer sans afficher les outils administrateur", async () => {
    recupererProfil.mockResolvedValue({ pseudo: "Viewer", role: "VIEWER" });
    render(<PageAdministration />);

    await waitFor(() => expect(remplacer).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByRole("heading", { name: "Back-office Skkup" })).toBeNull();
    expect(listerSponsors).not.toHaveBeenCalled();
    expect(listerSignalements).not.toHaveBeenCalled();
    expect(listerStreams).not.toHaveBeenCalled();
  });

  test("filtre les annonces administrables par statut et recherche", async () => {
    listerAnnonces.mockResolvedValue([
      { id: "annonce-active", titre: "Maintenance", texte: "Service prévu", actif: true, debutAt: null, finAt: null, createdAt: "2026-10-01T10:00:00Z" },
      { id: "annonce-archivee", titre: "Ancienne campagne", texte: "Archive", actif: false, debutAt: null, finAt: null, createdAt: "2026-09-01T10:00:00Z" },
    ]);
    render(<PageAdministration />);
    await screen.findByText("Maintenance");
    const recherche = screen.getByLabelText("Rechercher");
    await userEvent.setup().type(recherche, "campagne");
    expect(screen.getByText("Ancienne campagne")).toBeDefined();
    expect(screen.queryByText("Maintenance")).toBeNull();
    await userEvent.setup().selectOptions(screen.getByLabelText("Annonces"), "ACTIVES");
    expect(screen.queryByText("Ancienne campagne")).toBeNull();
  });
});
