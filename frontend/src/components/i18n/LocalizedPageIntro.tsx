"use client";

import { traductions, useLanguage } from "./LanguageProvider";

type ClePage = "raffles" | "dashboardRaffles" | "rules" | "streams";

export function LocalizedPageIntro({ page }: { page: ClePage }) {
  const { langue } = useLanguage();
  const t = traductions[langue].pages[page];
  return (
    <>
      <p className="skuup-kicker">{t.kicker}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-foreground">{t.title}</h1>
      <p className="mt-3 max-w-2xl text-foreground-muted">{t.description}</p>
    </>
  );
}
