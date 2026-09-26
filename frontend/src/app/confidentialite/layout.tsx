import type { Metadata } from "next";
import { publicMetadata } from "../public-metadata";

export const metadata: Metadata = publicMetadata({
  path: "/confidentialite",
  title: "Confidentialité | Skkup",
  description:
    "La politique de confidentialité de Skkup pour le site, le compte, l’extension et les tirages.",
});

export default function ConfidentialiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
