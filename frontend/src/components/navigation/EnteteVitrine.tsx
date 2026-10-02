"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { recupererSession } from "@/lib/auth";
import type { Profil } from "@/lib/dashboard";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";

interface EnteteVitrineProps {
  actionHref: string;
  actionLabel: string;
}

/** Header public partagé par la vitrine et les parcours d'authentification. */
export function EnteteVitrine({
  actionHref,
  actionLabel,
}: EnteteVitrineProps) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const { langue } = useLanguage();
  const t = traductions[langue];

  useEffect(() => {
    let annule = false;
    recupererSession()
      .then((session) => {
        if (!annule) setProfil(session.profil);
      })
      .catch(() => {
        if (!annule) setProfil(null);
      });
    return () => {
      annule = true;
    };
  }, []);

  function gererNavigationInterne(event: MouseEvent<HTMLAnchorElement>, href: string) {
    const [chemin, ancre] = href.split("#");
    if (!ancre || chemin !== "/" || window.location.pathname !== "/") return;

    const cible = document.getElementById(ancre);
    if (!cible) return;

    event.preventDefault();
    cible.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${ancre}`);
  }

  return (
    <header className="skuup-public-header mx-auto grid w-full grid-cols-[auto_1fr_auto] flex-wrap items-center gap-4 px-6 py-5">
      <Link href="/" className="skuup-logo" aria-label="Accueil Skkup">
        <Image
          src="/branding/skkup-wordmark-transparent.png"
          alt="Skkup"
          width={190}
          height={80}
          priority
        />
      </Link>
      <nav
        className="skuup-public-nav order-3 flex w-full flex-wrap items-center justify-center gap-4 text-sm text-white/80 md:order-none md:w-auto md:gap-6"
        aria-label="Navigation vitrine"
      >
        <Link href="/#fonctionnement" onClick={(event) => gererNavigationInterne(event, "/#fonctionnement")}>{t.how}</Link>
        <Link href="/#lots" onClick={(event) => gererNavigationInterne(event, "/#lots")}>{t.prizes}</Link>
        <Link href="/#engagement" onClick={(event) => gererNavigationInterne(event, "/#engagement")}>{t.project}</Link>
        <Link href="/faq">{t.faq}</Link>
        <Link href="/confidentialite">{t.privacy}</Link>
        {profil && <Link href="/dashboard">{t.dashboard}</Link>}
      </nav>
      {profil ? <MenuCompteDashboard profil={profil} /> : (
        <Link href={actionHref} className="skuup-button skuup-button-small">
          {langue === "en" && actionLabel === "S'inscrire" ? t.signup : actionLabel}
        </Link>
      )}
    </header>
  );
}
