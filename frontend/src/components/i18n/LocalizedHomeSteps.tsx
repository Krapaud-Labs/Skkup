"use client";

import Image from "next/image";
import { traductions, useLanguage } from "./LanguageProvider";

const images = [
  "/assets/vitrine/steps/skkup-step-install.png",
  "/assets/vitrine/steps/skkup-step-watch.png",
  "/assets/vitrine/steps/skkup-step-points-v2.png",
  "/assets/vitrine/steps/skkup-step-reward.png",
] as const;

const imageAlts = {
  fr: [
    "Un viewer installe l’extension Skkup sur son ordinateur",
    "Un viewer regarde le direct d’un streamer depuis son bureau",
    "Un viewer accumule des points en regardant un direct",
    "Un viewer découvre un casque et une manette dans un coffret cadeau",
  ],
  en: [
    "A viewer installs the Skkup extension on their computer",
    "A viewer watches a streamer’s live broadcast from their desk",
    "A viewer earns points by watching a live broadcast",
    "A viewer discovers a headset and a controller in a gift box",
  ],
} as const;

export function LocalizedHomeSteps() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  return <section id="fonctionnement" className="mx-auto max-w-6xl px-6 py-20 text-center"><h2 className="skuup-section-title">{t.stepsTitle}</h2><p className="mt-2 text-white/55">{t.stepsSubtitle}</p><div className="mt-10 grid gap-5 md:grid-cols-4">{t.steps.map((step, index) => <article key={step.title} className="skuup-step"><div className="skuup-step-media"><Image src={images[index]} alt={imageAlts[langue][index]} fill sizes="(min-width: 768px) 25vw, 100vw" />{index === 2 && <span className="skuup-step-progress" aria-hidden="true"><span>{t.progress}</span><i /></span>}</div><div className="skuup-step-content"><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div></section>;
}
