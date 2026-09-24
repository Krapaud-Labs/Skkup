"use client";

import { ListeTirages } from "@/components/raffles/ListeTirages";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

export default function PageTirages() {
  const { langue } = useLanguage();
  const t = traductions[langue];
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <p className="skuup-kicker">Résultats transparents</p>
        <h1 className="mt-2 text-4xl font-extrabold text-foreground">{t.drawsTitle}</h1>
        <p className="mt-3 max-w-2xl text-foreground-muted">Retrouve les lots en jeu, les dates prévues et les résultats déjà publiés.</p>
      </header>
      <ListeTirages />
      </div>
    </main>
  );
}
