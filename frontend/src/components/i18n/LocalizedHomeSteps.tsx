"use client";

import Image from "next/image";
import { traductions, useLanguage } from "./LanguageProvider";

const images = [
  ["/images/skkup-step-install.png", "Un viewer installe l’extension Skkup sur son ordinateur"],
  ["/images/skkup-step-watch.png", "Une gameuse regarde le direct d’un streamer depuis son bureau"],
  ["/images/skkup-step-points-v2.png", "Un viewer accumule des points en regardant un direct"],
  ["/images/skkup-step-reward.png", "Un gamer découvre un casque et une manette dans un coffret cadeau"],
] as const;

export function LocalizedHomeSteps() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  const mentionImage = langue === "en" ? "AI-generated content" : "Contenu généré avec IA";
  return <section id="fonctionnement" className="mx-auto max-w-6xl px-6 py-20 text-center"><h2 className="skuup-section-title">{t.stepsTitle}</h2><p className="mt-2 text-white/55">{t.stepsSubtitle}</p><div className="mt-10 grid gap-5 md:grid-cols-4">{t.steps.map((step, index) => <article key={step.title} className="skuup-step"><div className="skuup-step-media"><Image src={images[index][0]} alt={images[index][1]} fill sizes="(min-width: 768px) 25vw, 100vw" /><span className="skuup-ai-label">{mentionImage}</span>{index === 2 && <span className="skuup-step-progress" aria-hidden="true"><span>{t.progress}</span><i /></span>}</div><div className="skuup-step-content"><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div></section>;
}
