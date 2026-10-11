import { render, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { remplacer, recupererProfil } = vi.hoisted(() => ({
  remplacer: vi.fn(),
  recupererProfil: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }) }));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));

import { AdminSas } from "./AdminSas";

beforeEach(() => {
  vi.clearAllMocks();
  recupererProfil.mockResolvedValue({ pseudo: "Viewer", role: "VIEWER" });
});

test("redirige un viewer et ne rend pas le contenu admin", async () => {
  const contenu = <div>Contenu administrateur</div>;
  const { queryByText } = render(<AdminSas>{contenu}</AdminSas>);

  await waitFor(() => expect(remplacer).toHaveBeenCalledWith("/dashboard"));
  expect(queryByText("Contenu administrateur")).toBeNull();
});
