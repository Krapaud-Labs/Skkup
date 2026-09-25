"use client";

import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedExtensionSteps() {
  const { langue } = useLanguage();
  const t = traductions[langue].extension;
  return <section className="skuup-card text-sm text-white/65"><h2 className="mb-3 text-base font-bold text-white">{t.howItWorks}</h2><ol className="list-inside list-decimal space-y-2"><li>{t.stepOne}</li><li>{t.stepTwo}</li><li>{t.stepThree}</li></ol></section>;
}
