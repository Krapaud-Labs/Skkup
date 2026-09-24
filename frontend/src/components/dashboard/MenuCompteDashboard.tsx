"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChangerMotDePasse } from "@/components/auth/ChangerMotDePasse";
import { deconnexion } from "@/lib/auth";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import type { Profil } from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface MenuCompteDashboardProps {
  profil: Profil | null;
}

/** Menu du compte accessible depuis l'en-tête du sas Dashboard. */
export function MenuCompteDashboard({ profil }: MenuCompteDashboardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [motDePasseOuvert, setMotDePasseOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const { langue } = useLanguage();
  const anglais = langue === "en";

  useEffect(() => {
    if (!ouvert) return;

    function fermerSiExterieur(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOuvert(false);
    }

    function fermerAvecEchap(event: KeyboardEvent) {
      if (event.key === "Escape") setOuvert(false);
    }

    document.addEventListener("pointerdown", fermerSiExterieur);
    document.addEventListener("keydown", fermerAvecEchap);
    return () => {
      document.removeEventListener("pointerdown", fermerSiExterieur);
      document.removeEventListener("keydown", fermerAvecEchap);
    };
  }, [ouvert]);

  async function gererDeconnexion() {
    setDeconnexionEnCours(true);
    try {
      await deconnexion();
      router.push("/");
      router.refresh();
    } finally {
      setDeconnexionEnCours(false);
    }
  }

  const pseudo = profil?.pseudo ?? (anglais ? "Account" : "Compte");
  const initiale = (profil?.pseudo?.trim().charAt(0) || "S").toUpperCase();

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="skuup-account-trigger"
          aria-haspopup="menu"
          aria-expanded={ouvert}
          aria-label={profil ? `${anglais ? "Open menu for" : "Ouvrir le menu de"} ${profil.pseudo}` : anglais ? "Open account menu" : "Ouvrir le menu du compte"}
          onClick={() => setOuvert((etat) => !etat)}
        >
          <span className="skuup-account-avatar" aria-hidden="true">{initiale}</span>
          <span className="skuup-account-label">{pseudo}</span>
          <span className="skuup-account-chevron"><SkkupIcon name="chevronDown" size={15} /></span>
        </button>

        {ouvert && (
          <div className="skuup-account-menu" role="menu" aria-label={`${anglais ? "Account actions" : "Actions du compte"} ${pseudo}`}>
            <p className="px-3 pt-2 text-xs uppercase tracking-[.14em] text-white/45">{anglais ? "Signed in as" : "Connecté en tant que"}</p>
            <p className="truncate px-3 pb-2 pt-1 text-sm text-white/75">{profil?.email ?? (anglais ? "Loading..." : "Chargement...")}</p>
            <div className="skuup-account-menu-divider" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOuvert(false);
                setMotDePasseOuvert(true);
              }}
            >
              {anglais ? "Change password" : "Modifier le mot de passe"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => void gererDeconnexion()}
              disabled={deconnexionEnCours}
            >
              {deconnexionEnCours ? anglais ? "Signing out..." : "Déconnexion..." : anglais ? "Sign out" : "Déconnexion"}
            </button>
          </div>
        )}
      </div>

      {motDePasseOuvert && (
        <div
          className="skuup-account-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMotDePasseOuvert(false);
          }}
        >
          <div className="skuup-account-dialog" role="dialog" aria-modal="true" aria-label={anglais ? "Change password" : "Modifier le mot de passe"}>
            <button
              type="button"
              className="skuup-account-dialog-close"
              aria-label={anglais ? "Close password change dialog" : "Fermer la fenêtre de modification du mot de passe"}
              onClick={() => setMotDePasseOuvert(false)}
            >
              ×
            </button>
            <ChangerMotDePasse />
          </div>
        </div>
      )}
    </>
  );
}
