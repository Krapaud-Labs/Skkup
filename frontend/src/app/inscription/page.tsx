import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { LocalizedAuthIntro } from "@/components/i18n/LocalizedAuthIntro";
import { publicMetadata } from "../public-metadata";

export const metadata: Metadata = {
  ...publicMetadata({
    path: "/inscription",
    title: "Inscription | Skkup",
    description:
      "Crée ton compte Skkup et gagne des points en regardant tes streams préférés.",
  }),
  robots: { index: false, follow: false },
};

export default function PageInscription() {
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/connexion" actionLabel="Se connecter" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <LocalizedAuthIntro mode="inscription" />
        <FormulaireAuth mode="inscription" />
      </section>
    </main>
  );
}
