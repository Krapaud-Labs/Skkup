"use client";

import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";
import { AnimationAuScroll } from "@/components/ui/AnimationAuScroll";
import { HomepageScrollIndicator } from "@/components/ui/HomepageScrollIndicator";
import { traductions, useLanguage } from "./LanguageProvider";

const lotIcons: SkkupIconName[] = ["gift", "draws", "check"];
const icons: SkkupIconName[] = ["eye", "points", "trophy", "shield"];

export function LocalizedHomeTrust() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  return (
    <section id="lots" className="skuup-home-snap-section mx-auto max-w-6xl pb-16 text-center">
      <AnimationAuScroll variante="montee" delay={80} className="skuup-reveal-stagger">
        <div className="px-6">
          <p className="skuup-kicker">{t.lotsKicker}</p>
          <h2 className="skuup-section-title">{t.lotsTitle}</h2>
          <div className="mt-10 mb-8 grid gap-5 md:grid-cols-3">
            {t.lots.map(([title, description, badge], index) => (
              <article key={title} className="skuup-lot">
                <div className="skuup-lot-visual"><SkkupIcon name={lotIcons[index]} size={42} /></div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="skuup-badge"><SkkupIcon name="draws" size={12} /> {badge}</span>
              </article>
            ))}
          </div>
        </div>
        <section className="skuup-stats mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4">{t.stats.map(([value, label], index) => <div key={label} className="skuup-stat"><span className="skuup-stat-icon"><SkkupIcon name={icons[index]} size={28} /></span><strong>{value}</strong><span>{label}</span></div>)}</section>
      </AnimationAuScroll>
      <HomepageScrollIndicator />
    </section>
  );
}
