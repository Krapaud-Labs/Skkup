"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <header className="skuup-public-header mx-auto grid w-full grid-cols-[auto_1fr] flex-wrap items-center gap-6 px-6 py-6">
      <Link href="/" className="skuup-logo" aria-label="Accueil Skkup">
        <Image
          src="/branding/skkup-wordmark-transparent.png"
          alt="Skkup"
          width={190}
          height={80}
          priority
        />
      </Link>
      <div className="flex items-center justify-end gap-3">
        {profil ? <MenuCompteDashboard profil={profil} /> : (
          <Link href={actionHref} className="skuup-button skuup-button-small">
            {langue === "en" && actionLabel === "S'inscrire"
              ? t.signup
              : actionLabel === "Voir les streams"
                ? t.home.lots[0][2]
                : actionLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
