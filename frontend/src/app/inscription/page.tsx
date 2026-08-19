import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";

export const metadata: Metadata = {
  title: "Inscription | Skuup",
  description:
    "Crée ton compte Skuup et gagne des points en regardant tes streams préférés.",
};

export default function PageInscription() {
  return (
    <main className="skuup-app-shell mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-6">
      <FormulaireAuth mode="inscription" />
    </main>
  );
}
