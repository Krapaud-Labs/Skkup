"use client";

import { traductions, useLanguage } from "./LanguageProvider";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

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
      <div className="mt-8 grid gap-4 text-sm text-white/75 sm:grid-cols-2">
        <span className="flex items-center gap-3">
          <SkkupIcon name="points" size={28} />
          {t.benefitOne}
        </span>
        <span className="flex items-center gap-3">
          <SkkupIcon name="ticket" size={28} />
          {t.benefitTwo}
        </span>
      </div>
    </div>
  );
}
