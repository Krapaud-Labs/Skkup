import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

export const metadata: Metadata = {
  title: "Inscription | Skkup",
  description:
    "Crée ton compte Skkup et gagne des points en regardant tes streams préférés.",
  alternates: { canonical: "/inscription" },
  robots: { index: false, follow: false },
};

export default function PageInscription() {
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/connexion" actionLabel="Se connecter" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <div className="max-w-xl">
          <p className="skuup-kicker">Bienvenue dans Skkup</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
            Ton temps de
            <br />
            <span className="skuup-gradient-text">visionnage a de la valeur.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Crée ton compte gratuitement, regarde les streams disponibles et
            garde une trace claire de tes points et de tes chances.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <span><SkkupIcon name="gift" size={15} /> Gratuit et sans achat obligatoire</span>
            <span><SkkupIcon name="gift" size={15} /> Lots et résultats transparents</span>
          </div>
        </div>
        <FormulaireAuth mode="inscription" />
      </section>
    </main>
  );
}
