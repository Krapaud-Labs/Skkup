import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";

export const metadata: Metadata = {
  title: "Connexion | Skkup",
  description:
    "Connecte-toi pour retrouver tes points, ta série de visites et tes cartes à gratter.",
  alternates: { canonical: "/connexion" },
};

export default function PageConnexion() {
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <div className="max-w-xl">
          <p className="skuup-kicker">Ton espace Skkup</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
            Reviens là où
            <br />
            <span className="skuup-gradient-text">chaque vue compte.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Connecte-toi pour retrouver tes points, suivre tes tirages et
            continuer à profiter de tes streams préférés.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <span>✦ Points et historique centralisés</span>
            <span>✦ Tirages publics et vérifiables</span>
          </div>
        </div>
        <FormulaireAuth mode="connexion" />
      </section>
    </main>
  );
}
