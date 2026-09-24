import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/FormulaireAuth";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Connexion | Skkup",
  description:
    "Connecte-toi pour retrouver tes points, ta série de visites et tes cartes à gratter.",
  alternates: { canonical: "/connexion" },
  robots: { index: false, follow: false },
};

export default function PageConnexion() {
  const { langue } = useLanguage();
  const t = traductions[langue];
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/inscription" actionLabel={t.signup} />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <div className="max-w-xl">
          <p className="skuup-kicker">{t.loginSpace}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
            {t.loginTitle}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            {t.loginDescription}
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <span><SkkupIcon name="points" size={15} /> {t.centralPoints}</span>
            <span><SkkupIcon name="points" size={15} /> {t.verifiableDraws}</span>
          </div>
        </div>
        <FormulaireAuth mode="connexion" />
      </section>
    </main>
  );
}
