"use client";

import { ListeStreams } from "@/components/streams/ListeStreams";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

export default function PageStreams() {
  const { langue } = useLanguage();
  const t = traductions[langue];
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <h1 className="text-4xl font-extrabold text-foreground">{t.streamsTitle}</h1>
        <p className="mt-2 text-foreground-muted">{t.catalogueDescription}</p>
      </header>

      <ListeStreams />
      </div>
    </main>
  );
}
