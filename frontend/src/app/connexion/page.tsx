import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";

export const metadata: Metadata = {
  title: "Connexion | Viewer Rewards",
  description:
    "Connecte-toi pour retrouver tes points, ta série de visites et tes cartes à gratter.",
};

export default function PageConnexion() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-6">
      <FormulaireAuth mode="connexion" />
    </main>
  );
}
