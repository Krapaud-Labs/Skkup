"use client";

import Link from "next/link";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedHomeCta() {
  const { langue } = useLanguage();
  const labels = traductions[langue];
  const t = labels.home;
  return <><section id="engagement" className="mx-6 mt-16 rounded-3xl border border-fuchsia-400/30 bg-gradient-to-r from-violet-700/70 to-fuchsia-600/70 px-6 py-8 sm:px-12"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">{t.ctaTitle}</h2><p className="mt-2 text-white/70">{t.ctaDescription}</p></div><Link href="/connexion" className="skuup-button whitespace-nowrap">{t.ctaButton} <SkkupIcon name="arrow" size={18} preferSvg /></Link></div></section><footer className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-center gap-6 px-6 py-8 text-sm text-white/55"><Link href="/confidentialite">{labels.privacy}</Link><Link href="/reglement">{labels.rulesLabel}</Link><a href="mailto:skkup.pro@gmail.com">{labels.contact}</a></footer></>;
}
