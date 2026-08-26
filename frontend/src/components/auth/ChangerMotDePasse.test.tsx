import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ChangerMotDePasse } from "./ChangerMotDePasse";

const { push, changer } = vi.hoisted(() => ({ push: vi.fn(), changer: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth", () => ({ changerMotDePasse: changer }));

describe("ChangerMotDePasse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    changer.mockResolvedValue(undefined);
  });

  test("envoie les secrets et redirige après succès", async () => {
    render(<ChangerMotDePasse />);
    const champs = screen.getAllByLabelText(/mot de passe/i);
    fireEvent.change(champs[0], { target: { value: "AncienMotDePasse1" } });
    fireEvent.change(champs[1], { target: { value: "NouveauMotDePasse2" } });
    fireEvent.change(champs[2], { target: { value: "NouveauMotDePasse2" } });
    fireEvent.submit(screen.getByRole("button", { name: /changer/i }));

    await waitFor(() => expect(changer).toHaveBeenCalledWith({
      ancienMotDePasse: "AncienMotDePasse1",
      nouveauMotDePasse: "NouveauMotDePasse2",
    }));
    expect(push).toHaveBeenCalledWith("/connexion?motDePasseChange=1");
  });

  test("refuse une confirmation différente sans appel réseau", async () => {
    render(<ChangerMotDePasse />);
    const champs = screen.getAllByLabelText(/mot de passe/i);
    fireEvent.change(champs[1], { target: { value: "NouveauMotDePasse2" } });
    fireEvent.change(champs[2], { target: { value: "AutreMotDePasse3" } });
    fireEvent.submit(screen.getByRole("button", { name: /changer/i }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/différents/);
    expect(changer).not.toHaveBeenCalled();
  });
});
