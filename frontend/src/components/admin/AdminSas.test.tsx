/* eslint-disable @next/next/no-img-element */
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { remplacer, recupererProfil } = vi.hoisted(() => ({
  remplacer: vi.fn(),
  recupererProfil: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }) }));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => { const { unoptimized, ...imageProps } = props; void unoptimized; return <img alt={imageProps.alt ?? ""} {...imageProps} />; } }));

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

test("affiche le logo de marque dans le titre du chargement Admin", () => {
  recupererProfil.mockReturnValue(new Promise(() => {}));
  render(<AdminSas><div>Contenu administrateur</div></AdminSas>);

  const title = screen.getByRole("heading", { name: "Administration Skkup" });
  expect(title.querySelector("img[src='/assets/brand/marks/skkup-s-favicon.png']")?.getAttribute("aria-hidden")).toBe("true");
});
