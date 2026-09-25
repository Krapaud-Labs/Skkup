"use client";

import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedAuthIntro({ mode }: { mode: "connexion" | "inscription" }) {
  const { langue } = useLanguage();
  const t = traductions[langue].auth[mode];

  return (
    <div className="max-w-xl">
      <p className="skuup-kicker">{t.kicker}</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
        {t.titleLine}
        <br />
        <span className="skuup-gradient-text">{t.titleAccent}</span>
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">{t.description}</p>
      <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
        <span><SkkupIcon name={mode === "connexion" ? "points" : "gift"} size={15} /> {t.benefitOne}</span>
        <span><SkkupIcon name={mode === "connexion" ? "points" : "gift"} size={15} /> {t.benefitTwo}</span>
      </div>
    </div>
  );
}
