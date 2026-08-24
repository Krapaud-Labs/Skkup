import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const remplacer = vi.fn();
const creerAnnonce = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }) }));
vi.mock("@/lib/dashboard", () => ({
  recupererProfil: vi.fn().mockResolvedValue({ pseudo: "Ada", role: "ADMIN" }),
}));
vi.mock("@/lib/streams", () => ({
  listerStreams: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/admin", () => ({
  creerAnnonce,
  creerSponsor: vi.fn(),
  creerTirage: vi.fn(),
  configurerRecompenseStream: vi.fn(),
  listerSignalements: vi.fn().mockResolvedValue([]),
  listerSponsors: vi.fn().mockResolvedValue([]),
  modifierSignalement: vi.fn(),
}));

const { default: PageAdministration } = await import("./page");

beforeEach(() => vi.clearAllMocks());

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
});
