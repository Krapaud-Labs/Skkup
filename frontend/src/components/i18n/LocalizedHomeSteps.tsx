"use client";

import Image from "next/image";
import { traductions, useLanguage } from "./LanguageProvider";

const images = [
  ["/images/skkup-step-watch.png", { fr: "Une gameuse regarde le direct d’un streamer depuis son bureau", en: "A gamer watches a streamer’s live broadcast from her desk" }],
  ["/images/skkup-step-points-v2.png", { fr: "Un viewer regarde le direct d’un streamer depuis son bureau", en: "A viewer watches a streamer’s live broadcast from a desk" }],
  ["/images/skkup-step-reward.png", { fr: "Un gamer découvre un casque et une manette dans un coffret cadeau", en: "A gamer discovers headphones and a controller in a gift box" }],
] as const;

export function LocalizedHomeSteps() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  return <section id="fonctionnement" className="mx-auto max-w-6xl px-6 py-20 text-center"><p className="skuup-kicker">{t.stepsKicker}</p><h2 className="skuup-section-title">{t.stepsTitle}</h2><p className="mt-2 text-white/55">{t.stepsSubtitle}</p><div className="mt-10 grid gap-5 md:grid-cols-3">{t.steps.map((step, index) => <article key={step.title} className="skuup-step"><div className="skuup-step-media"><Image src={images[index][0]} alt={images[index][1][langue]} fill sizes="(min-width: 768px) 33vw, 100vw" /><span className="skuup-step-number">{index + 1}</span>{index === 1 && <span className="skuup-step-progress" aria-hidden="true"><span>{t.progress}</span><i /></span>}</div><div className="skuup-step-content"><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div><p className="mt-8 text-sm font-semibold text-fuchsia-300">{t.stepsFooter}</p></section>;
}
