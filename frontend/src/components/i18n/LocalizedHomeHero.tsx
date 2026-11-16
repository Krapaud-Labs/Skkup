"use client";

import Image from "next/image";
import Link from "next/link";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";

export function LocalizedHomeHero() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;

  return (
    <section className="skuup-hero skuup-hero-treasure mx-auto grid items-center gap-8 px-6 pb-10 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-0">
      <div className="skuup-hero-copy relative z-10">
        {t.kicker && (
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-fuchsia-300">
            {t.kicker}
          </p>
        )}
        <h1 aria-label={t.ariaTitle} className="max-w-xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl">
          {t.titleLineOne}
          <br />
          <span className="skuup-gradient-text">
            {t.titleLineTwo} {t.titleAccent}
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">{t.description}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/connexion" className="skuup-button">
            {t.start} <SkkupIcon name="arrow" size={18} />
          </Link>
          <a href="#fonctionnement" className="skuup-button skuup-button-outline">
            <SkkupIcon name="streams" size={17} /> {t.how}
          </a>
        </div>
      </div>
      <div className="skuup-prize-orbit skuup-treasure-orbit" aria-label={t.imageLabel}>
        <Image
          src="/assets/marketing/hero/skkup-hero-treasure.png"
          alt={langue === "en" ? "Open purple treasure chest with gold coins" : "Coffre au trésor violet ouvert avec des pièces d’or"}
          width={1370}
          height={1148}
          priority
          className="skuup-treasure-image mx-auto h-auto w-full object-contain"
        />
      </div>
    </section>
  );
}
