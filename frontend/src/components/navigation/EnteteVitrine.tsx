"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { deconnexion } from "@/lib/auth";
import { recupererProfil, type Profil } from "@/lib/dashboard";

interface EnteteVitrineProps {
  actionHref: string;
  actionLabel: string;
}

/** Header public partagé par la vitrine et les parcours d'authentification. */
export function EnteteVitrine({
  actionHref,
  actionLabel,
}: EnteteVitrineProps) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    let annule = false;
    recupererProfil()
      .then((profilRecu) => {
        if (!annule) setProfil(profilRecu);
      })
      .catch(() => {
        if (!annule) setProfil(null);
      });
    return () => {
      annule = true;
    };
  }, []);

  async function gererDeconnexion() {
    await deconnexion();
    setProfil(null);
    router.push("/");
    router.refresh();
  }

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
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Link href="/" className="skuup-logo" aria-label="Accueil Skuup">
        <Image
          src="/branding/skkup-wordmark-transparent.png"
          alt="Skkup"
          width={190}
          height={80}
          priority
        />
      </Link>
      <nav
        className="order-3 flex w-full flex-wrap items-center justify-center gap-4 text-sm text-white/80 md:order-none md:w-auto md:gap-6"
        aria-label="Navigation vitrine"
      >
        <Link href="/#fonctionnement" onClick={(event) => gererNavigationInterne(event, "/#fonctionnement")}>Comment ça marche</Link>
        <Link href="/#lots" onClick={(event) => gererNavigationInterne(event, "/#lots")}>Lots partenaires</Link>
        <Link href="/#engagement" onClick={(event) => gererNavigationInterne(event, "/#engagement")}>Le projet</Link>
        <Link href="/faq">FAQ</Link>
        {profil && <Link href="/streams">Streams</Link>}
        {profil && <Link href="/tirages">Tirages</Link>}
        {profil && <Link href="/dashboard">Dashboard</Link>}
        {profil && <Link href="/extension">Extension</Link>}
      </nav>
      {profil ? (
        <button type="button" onClick={() => void gererDeconnexion()} className="skuup-button skuup-button-small">
          Déconnexion
        </button>
      ) : (
        <Link href={actionHref} className="skuup-button skuup-button-small">
          {actionLabel}
        </Link>
      )}
    </header>
  );
}
