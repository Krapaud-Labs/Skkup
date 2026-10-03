import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const { listerSignalements, modifierSignalement } = vi.hoisted(() => ({ listerSignalements: vi.fn(), modifierSignalement: vi.fn() }));
vi.mock("@/lib/admin", () => ({
  listerSignalements,
  modifierSignalement,
}));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import { AdminSectionPage } from "./AdminSectionPage";

beforeEach(() => {
  listerSignalements.mockResolvedValue([{ id: "flag-1", type: "FRAUDE", details: "", statut: "OUVERTE", createdAt: "2026-01-01", user: { id: "user-1", pseudo: "Ada", email: "ada@example.test" }, watchSession: null }]);
  modifierSignalement.mockImplementation(async (_id: string, statut: string) => ({ ...(await listerSignalements.mock.results[0].value)[0], statut }));
});

test("affiche le détail d’un signalement et permet sa qualification", async () => {
  const user = userEvent.setup();
  render(<AdminSectionPage section="moderation" />);
  await user.click(await screen.findByRole("button", { name: /FRAUDE/ }));
  expect(screen.getByText(/Preuves/)).toBeTruthy();
  expect(screen.getByText(/Données disponibles/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /Marquer examinée/ }));
  await waitFor(() => expect(modifierSignalement).toHaveBeenCalledWith("flag-1", "EXAMINEE"));
});
