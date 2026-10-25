"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deconnexion } from "@/lib/auth";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Navigation commune aux pages publiques et authentifiées.
 * Le profil est relu au montage pour que le serveur reste la source de
 * vérité du cookie de session et du rôle administrateur.
 */
export function NavigationGlobale() {
  const router = useRouter();
  const pathname = usePathname();
  const [profil, setProfil] = useState<Profil | null>(null);
  const { langue } = useLanguage();
  const t = traductions[langue];
  const estDansEspacePrive = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const estRoutePublique = [
    "/",
    "/faq",
    "/connexion",
    "/inscription",
    "/streams",
    "/tirages",
    "/extension",
    "/confidentialite",
    "/reglement",
  ].includes(pathname);

  useEffect(() => {
    if (estRoutePublique || estDansEspacePrive) {
      return;
    }
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
  }, [estDansEspacePrive, estRoutePublique, pathname]);

  if (estDansEspacePrive) return null;

  if (
    pathname === "/" ||
    pathname === "/faq" ||
    pathname === "/connexion" ||
    pathname === "/inscription" ||
    pathname === "/streams" ||
    pathname === "/tirages" ||
    pathname === "/extension" ||
    pathname === "/confidentialite"
    || pathname === "/reglement"
  ) {
    return null;
  }

  async function gererDeconnexion() {
    await deconnexion();
    setProfil(null);
    router.push("/");
    router.refresh();
  }

  const liens = [
    { href: "/#fonctionnement", label: t.how },
    { href: "/#lots", label: t.prizes },
    { href: "/#engagement", label: t.project },
    { href: "/faq", label: t.faq },
    ...(profil ? [{ href: "/dashboard", label: t.dashboard }] : []),
  ];

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Link href="/" className="skuup-logo" aria-label="Accueil Skkup">
        <Image src="/assets/brand/logos/skkup-wordmark-transparent.png" alt="Skkup" width={190} height={70} priority />
      </Link>
      <nav aria-label="Navigation principale" className="order-3 flex w-full flex-wrap items-center justify-center gap-4 text-sm text-white/80 md:order-none md:w-auto md:gap-6">
          {liens.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="transition hover:text-white"
              aria-current={pathname === lien.href ? "page" : undefined}
            >
              {lien.label}
            </Link>
          ))}
          {profil ? (
            <button
              type="button"
              onClick={() => void gererDeconnexion()}
              className="skuup-button skuup-button-small"
            >
              {t.logout}
            </button>
          ) : (
            <Link
              href="/connexion"
              className="skuup-button skuup-button-small"
            >
              {langue === "en" ? "Log in" : "Connexion"}
            </Link>
          )}
      </nav>

    </header>
  );
}
