"use client";

import Link from "next/link";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedHomeCta() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  return <><section id="engagement" className="mx-6 rounded-3xl border border-fuchsia-400/30 bg-gradient-to-r from-violet-700/70 to-fuchsia-600/70 px-6 py-8 sm:px-12"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">{t.ctaTitle}</h2><p className="mt-2 text-white/70">{t.ctaDescription}</p></div><Link href="/inscription" className="skuup-button whitespace-nowrap">{t.ctaButton} <SkkupIcon name="arrow" size={18} /></Link></div></section><footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-6 py-8 text-sm text-white/55">{t.footer.map(([icon, label]) => <span key={label}><SkkupIcon name={icon} size={15} /> {label}</span>)}<Link href="/confidentialite" className="transition hover:text-white">{traductions[langue].privacy}</Link></footer></>;
}
