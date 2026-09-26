"use client";

import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";

const icons: SkkupIconName[] = ["eye", "points", "trophy", "shield"];
const lotIcons: SkkupIconName[] = ["gift", "draws", "check"];

export function LocalizedHomeTrust() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  return <><section className="skuup-stats mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4">{t.stats.map(([value, label], index) => <div key={label} className="skuup-stat"><span className="skuup-stat-icon"><SkkupIcon name={icons[index]} size={28} /></span><strong>{value}</strong><span>{label}</span></div>)}</section><section id="lots" className="mx-auto max-w-6xl px-6 pb-16 text-center"><p className="skuup-kicker">{t.lotsKicker}</p><h2 className="skuup-section-title">{t.lotsTitle}</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{t.lots.map(([title, description, badge], index) => <article key={title} className="skuup-lot"><div className="skuup-lot-visual"><SkkupIcon name={lotIcons[index]} size={42} /></div><h3>{title}</h3><p>{description}</p><span className="skuup-badge"><SkkupIcon name="spark" size={12} /> {badge}</span></article>)}</div></section></>;
}
