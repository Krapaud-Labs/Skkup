"use client";

import Link from "next/link";
import Image from "next/image";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedHomeHero() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  return <section className="skuup-hero mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-2"><div>{t.kicker && <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-fuchsia-300">{t.kicker}</p>}<h1 aria-label={t.ariaTitle} className="max-w-xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl">{t.titleLineOne}<br /><span className="skuup-gradient-text">{t.titleLineTwo} {t.titleAccent}</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">{t.description}</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/connexion" className="skuup-button">{t.start} <SkkupIcon name="arrow" size={18} /></Link><a href="#fonctionnement" className="skuup-button skuup-button-outline"><SkkupIcon name="streams" size={17} /> {t.how}</a></div></div><div className="skuup-prize-orbit" aria-label={t.imageLabel}><Image src="/assets/marketing/hero/skkup-hero-products-v3.png" alt={t.imageAlt} width={1024} height={1536} priority className="mx-auto h-auto max-h-[620px] w-full object-contain" /></div></section>;
}
