"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deconnexion } from "@/lib/auth";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import type { Profil } from "@/lib/dashboard";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

interface MenuCompteDashboardProps {
  profil: Profil | null;
}

/** Menu du compte accessible depuis l'en-tête du sas Dashboard. */
export function MenuCompteDashboard({ profil }: MenuCompteDashboardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const dernierDeclencheurRef = useRef<HTMLButtonElement | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const { langue, definirLangue } = useLanguage();
  const t = traductions[langue];

  useEffect(() => {
    if (!ouvert) return;
    const premierControle = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"], [role="menuitemradio"][tabindex="0"]',
    );
    premierControle?.focus();
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;

    function fermerSiExterieur(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOuvert(false);
    }

    function fermerAvecEchap(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOuvert(false);
        requestAnimationFrame(() => dernierDeclencheurRef.current?.focus());
      }
      if (event.key === "Tab") {
        const controles = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"], [role="menuitemradio"][tabindex="0"]',
        ) ?? []);
        if (!controles.length) return;
        const premier = controles[0];
        const dernier = controles[controles.length - 1];
        if (event.shiftKey && document.activeElement === premier) { event.preventDefault(); dernier.focus(); }
        else if (!event.shiftKey && document.activeElement === dernier) { event.preventDefault(); premier.focus(); }
      }
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

  const pseudo = profil?.pseudo ?? "Compte";
  const initiale = (profil?.pseudo?.trim().charAt(0) || "S").toUpperCase();

  function choisirLangue(nouvelleLangue: "fr" | "en") {
    if (nouvelleLangue === langue) return;
    definirLangue(nouvelleLangue);
    requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLButtonElement>(`[data-account-language="${nouvelleLangue}"]`)
        ?.focus();
    });
  }

  function gererClavierLangue(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    choisirLangue(event.currentTarget.dataset.accountLanguage === "fr" ? "en" : "fr");
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="skuup-account-trigger"
          aria-haspopup="menu"
          aria-expanded={ouvert}
          aria-label={profil ? `${langue === "en" ? "Open" : "Ouvrir"} ${langue === "en" ? "the menu for" : "le menu de"} ${profil.pseudo}` : langue === "en" ? "Open account menu" : "Ouvrir le menu du compte"}
          onClick={(event) => {
            dernierDeclencheurRef.current = event.currentTarget;
            setOuvert((etat) => !etat);
          }}
        >
          <span className="skuup-account-avatar" aria-hidden="true">{initiale}</span>
          <span className="skuup-account-label">{pseudo}</span>
          <span className="skuup-account-chevron"><SkkupIcon name="chevronDown" size={15} /></span>
        </button>

        {ouvert && (
          <div className="skuup-account-menu" role="menu" aria-label={`${langue === "en" ? "Account actions" : "Actions du compte"} ${pseudo}`}>
            <p className="px-3 pt-2 text-xs uppercase tracking-[.14em] text-white/45">{langue === "en" ? "Signed in as" : "Connecté en tant que"}</p>
            <p className="truncate px-3 pb-2 pt-1 text-sm text-white/75">{profil?.email ?? (langue === "en" ? "Loading..." : "Chargement...")}</p>
            <div className="skuup-account-menu-divider" />
            <div className="skuup-account-language" role="group" aria-label={t.language}>
              <div className="skuup-account-language-control">
                {(["fr", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={langue === code}
                    tabIndex={langue === code ? 0 : -1}
                    data-account-language={code}
                    className="skuup-account-language-option"
                    onClick={() => choisirLangue(code)}
                    onKeyDown={gererClavierLangue}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="skuup-account-menu-divider" />
            <Link href="/dashboard" role="menuitem" onClick={() => setOuvert(false)}>
              {t.dashboard}
            </Link>
            <Link href="/dashboard/compte" role="menuitem" onClick={() => setOuvert(false)}>
              {langue === "en" ? "My account" : "Mon compte"}
            </Link>
            {profil?.role === "ADMIN" && (
              <Link href="/admin" role="menuitem" onClick={() => setOuvert(false)}>
                {langue === "en" ? "Administration" : "Administration"}
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => void gererDeconnexion()}
              disabled={deconnexionEnCours}
            >
              {deconnexionEnCours ? (langue === "en" ? "Logging out..." : "Déconnexion...") : t.logout}
            </button>
          </div>
        )}
      </div>

    </>
  );
}
