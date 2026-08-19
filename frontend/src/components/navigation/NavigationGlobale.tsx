"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deconnexion } from "@/lib/auth";
import { recupererProfil, type Profil } from "@/lib/dashboard";

/**
 * Navigation commune aux pages publiques et authentifiées.
 * Le profil est relu au montage pour que le serveur reste la source de
 * vérité du cookie de session et du rôle administrateur.
 */
export function NavigationGlobale() {
  const router = useRouter();
  const pathname = usePathname();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    recupererProfil()
      .then((profilRecu) => {
        if (!annule) setProfil(profilRecu);
      })
      .catch(() => {
        if (!annule) setProfil(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [pathname]);

  async function gererDeconnexion() {
    await deconnexion();
    setProfil(null);
    router.push("/");
    router.refresh();
  }

  const liens = [
    { href: "/", label: "Accueil" },
    { href: "/streams", label: "Streams" },
    ...(profil
      ? [
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/extension", label: "Extension" },
        ]
      : []),
  ];

  return (
    <header className="border-b border-white/10 bg-background-elevated/90 px-4 py-3 backdrop-blur">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"
      >
        <Link href="/" className="text-lg font-extrabold text-accent-cta">
          Skuup
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {liens.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="rounded-lg px-3 py-2 text-foreground-muted transition hover:bg-white/10 hover:text-foreground"
              aria-current={pathname === lien.href ? "page" : undefined}
            >
              {lien.label}
            </Link>
          ))}
          {!chargement && profil?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-accent-violet-light hover:bg-white/10"
            >
              Administration
            </Link>
          )}
          {profil ? (
            <button
              type="button"
              onClick={() => void gererDeconnexion()}
              className="rounded-lg border border-accent-cta/50 px-3 py-2 text-accent-cta hover:bg-accent-cta/10"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/connexion"
              className="rounded-lg border border-accent-cta/50 px-3 py-2 text-accent-cta hover:bg-accent-cta/10"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
