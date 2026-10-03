"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import Image from "next/image";
import Link from "next/link";
import { NavigationDashboard } from "@/components/dashboard/NavigationDashboard";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

interface DashboardSasProps {
  children: ReactNode;
}

/** Sas applicatif : shell partagé, navigation utilisateur portée par le menu du pseudo. */
export function DashboardSas({ children }: DashboardSasProps) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [notificationsOuvertes, setNotificationsOuvertes] = useState(false);

  const chargerProfil = useCallback(() => {
    setChargement(true);
    setErreur(null);
    return recupererProfil()
      .then((profilRecu) => setProfil(profilRecu))
      .catch((exception: unknown) => {
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/connexion");
          return;
        }
        setErreur("Impossible de charger ton espace Skkup.");
      })
      .finally(() => setChargement(false));
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void chargerProfil());
  }, [chargerProfil]);

  if (!profil) {
    return (
      <div className="skuup-shell skuup-app-shell min-h-screen w-full" aria-busy="true">
        <div className="mx-auto flex min-h-[24rem] w-full max-w-6xl items-center px-6 py-16">
          <div className="flex flex-col items-start gap-3">
            <p role={erreur ? "alert" : "status"} className={erreur ? "skuup-admin-alert skuup-admin-alert-error" : "text-sm text-foreground-muted"}>
              {erreur ?? "Chargement de ton espace Skkup…"}
            </p>
            {erreur && <button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerProfil()} disabled={chargement}>Réessayer</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skuup-shell skuup-app-shell min-h-screen w-full">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6">
        <div className="skuup-premium-dashboard-shell">
          <aside className="skuup-premium-dashboard-nav" aria-label="Navigation du tableau de bord">
            <Link href="/" className="skuup-premium-dashboard-brand" aria-label="Accueil Skkup"><Image src="/branding/skkup-wordmark-transparent.png" alt="Skkup" width={150} height={64} priority /></Link>
            <NavigationDashboard profil={profil} />
            <div className="skuup-viewer-extension-teaser">
              <span className="skuup-viewer-extension-orb" aria-hidden="true">◉</span>
              <strong>Extension Skkup</strong>
              <small>Gagne des points en regardant tes streams</small>
              <Link href="/dashboard/extension">Associer <span aria-hidden="true">›</span></Link>
            </div>
            <div className="mt-auto grid gap-3">
              <Link
                href="/dashboard/compte"
                className="group rounded-2xl border border-cyan-300/25 bg-cyan-300/[.04] p-4 transition hover:border-cyan-300/60"
              >
                <span className="flex items-center justify-between gap-3 text-xs text-foreground-muted">
                  <span>Mes points</span>
                  <span aria-hidden="true" className="text-lg text-cyan-200 transition group-hover:translate-x-1">›</span>
                </span>
                <strong className="mt-1 block text-2xl tracking-tight text-foreground">
                  {profil.soldePoints.toLocaleString("fr-FR")}
                </strong>
              </Link>
              <div className="rounded-2xl border border-accent-violet-light/25 bg-gradient-to-br from-accent-violet-light/15 to-cyan-400/[.04] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <SkkupIcon name="extension" size={18} />
                  Installe l’extension Skkup
                </div>
                <p className="mt-2 text-xs leading-5 text-foreground-muted">Regarde tes streams et gagne des points automatiquement.</p>
                <Link href="/dashboard/extension" className="skuup-button mt-3 inline-flex w-full justify-center px-3 py-2 text-xs">Ajouter à mon navigateur</Link>
              </div>
            </div>
          </aside>
          <main className="skuup-premium-dashboard-content" aria-live="polite">
            <div className="skuup-viewer-topbar">
              <div className="flex min-w-0 flex-1 items-center gap-6">
                <label className="relative hidden min-w-0 max-w-xl flex-1 md:block">
                  <span className="sr-only">Rechercher dans ton espace</span>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-foreground-muted">⌕</span>
                  <input className="w-full rounded-xl border border-cyan-300/20 bg-slate-950/40 py-3 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-foreground-muted focus:border-cyan-300/70" type="search" placeholder="Rechercher un streamer, un jeu ou une catégorie…" />
                </label>
                <div className="lg:hidden"><p className="skuup-kicker">Espace viewer</p><h1 className="skuup-premium-dashboard-greeting">Bonjour, {profil.pseudo}</h1></div>
                <div className="hidden lg:block"><p className="skuup-kicker">Espace viewer</p><h1 className="skuup-premium-dashboard-greeting">Bonjour, {profil.pseudo}</h1></div>
              </div>
              <div className="skuup-viewer-topbar-actions">
                <div className="relative">
                  <button type="button" className="skuup-viewer-icon-button" aria-label="Notifications" aria-expanded={notificationsOuvertes} onClick={() => setNotificationsOuvertes((ouvert) => !ouvert)}>
                    <SkkupIcon name="bell" size={20} />
                    <span aria-hidden="true" />
                  </button>
                  {notificationsOuvertes && <div role="status" className="skuup-viewer-notification-popover"><strong>Notifications</strong><p>Aucune nouvelle notification.</p></div>}
                </div>
                <Link href="/dashboard/compte" className="skuup-viewer-profile-chip"><span aria-hidden="true">{profil.pseudo.slice(0, 1).toUpperCase()}</span><strong>{profil.pseudo}</strong><small>Niveau {Math.max(1, Math.floor(profil.soldePoints / 250) + 1)}</small><b aria-hidden="true">⌄</b></Link>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
