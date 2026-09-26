import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";

const remplacer = vi.fn();
const creerAnnonce = vi.fn();
const recupererProfil = vi.fn();
const listerSponsors = vi.fn();
const listerSignalements = vi.fn();
const listerStreams = vi.fn();

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
}));

const { default: PageAdministration } = await import("./page");

beforeEach(() => {
  vi.clearAllMocks();
  recupererProfil.mockResolvedValue({ pseudo: "Ada", role: "ADMIN" });
  listerSponsors.mockResolvedValue([]);
  listerSignalements.mockResolvedValue([]);
  listerStreams.mockResolvedValue([]);
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

  test("ne révèle pas un message API brut lors du chargement", async () => {
    listerSponsors.mockRejectedValue(new ErreurApi("Erreur interne française.", 503));
    render(<PageAdministration />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Le service est temporairement indisponible. Réessaie plus tard.");
  });
});
