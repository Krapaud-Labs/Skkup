"use client";

import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { CHROME_WEB_STORE_URL } from "@/lib/extension";
import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedExtensionIntro() {
  const { langue } = useLanguage();
  const t = traductions[langue].extension;

  return (
    <div className="max-w-xl">
      <p className="skuup-kicker">{t.kicker}</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
        {t.titleLine}
        <br />
        <span className="skuup-gradient-text">{t.titleAccent}</span>
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">{t.description}</p>
      <a className="skuup-button skuup-button-primary mt-6 inline-flex" href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label={t.installExtensionAria}>
        {t.installExtension} <span aria-hidden="true">↗</span>
      </a>
      <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
        <span><SkkupIcon name="timer" size={15} /> {t.codeValidity}</span>
        <span><SkkupIcon name="check" size={15} /> {t.singleUse}</span>
        <span><SkkupIcon name="extension" size={15} /> {t.devices}</span>
        <span><SkkupIcon name="shield" size={15} /> {t.protectedData}</span>
      </div>
    </div>
  );
}
