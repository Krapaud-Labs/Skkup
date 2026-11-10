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
    <main className="skuup-vitrine flex min-h-svh flex-col">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <section className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 content-center items-center justify-items-center gap-12 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_30rem]">
        <LocalizedAuthIntro mode="connexion" />
        <FormulaireAuth mode="connexion" />
      </section>
    </main>
  );
}
