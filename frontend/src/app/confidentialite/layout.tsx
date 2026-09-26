import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidentialité | Skkup",
  description: "Politique de confidentialité de Skkup pour le site, le compte, l’extension et les tirages.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
