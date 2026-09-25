import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { LocalizedAuthIntro } from "@/components/i18n/LocalizedAuthIntro";

export const metadata: Metadata = {
  title: "Connexion | Skkup",
  description:
    "Connecte-toi pour retrouver tes points, ta série de visites et tes cartes à gratter.",
  alternates: { canonical: "/connexion" },
  robots: { index: false, follow: false },
};

export default function PageConnexion() {
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <LocalizedAuthIntro mode="connexion" />
        <FormulaireAuth mode="connexion" />
      </section>
    </main>
  );
}
