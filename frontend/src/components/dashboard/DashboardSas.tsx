"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import Image from "next/image";
import Link from "next/link";
import { NavigationDashboard } from "@/components/dashboard/NavigationDashboard";

interface DashboardSasProps {
  children: ReactNode;
}

/** Sas applicatif : shell partagé, navigation utilisateur portée par le menu du pseudo. */
export function DashboardSas({ children }: DashboardSasProps) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

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
              <Link href="/dashboard/extension">Connectée <span aria-hidden="true">›</span></Link>
            </div>
          </aside>
          <main className="skuup-premium-dashboard-content" aria-live="polite">
            <div className="skuup-viewer-topbar">
              <div><p className="skuup-kicker">Espace viewer</p><h1>Bonjour, {profil.pseudo}</h1></div>
              <div className="skuup-viewer-topbar-actions">
                <button type="button" className="skuup-viewer-icon-button" aria-label="Notifications">♧<span aria-hidden="true" /></button>
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
