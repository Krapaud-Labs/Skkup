"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import Link from "next/link";
import Image from "next/image";
import { NavigationDashboard } from "@/components/dashboard/NavigationDashboard";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";
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
      <div className="skuup-dashboard-host">
        <div className="skuup-premium-dashboard-shell">
          <aside className="skuup-premium-dashboard-nav" aria-label="Navigation du tableau de bord">
            <Link href="/" className="skuup-premium-dashboard-brand skuup-viewer-brand" aria-label="Accueil Skkup">
              <Image src="/branding/skkup-wordmark-transparent.png" alt="Skkup" width={190} height={80} priority className="skuup-dashboard-wordmark" />
            </Link>
            <NavigationDashboard profil={profil} />
          </aside>
          <main className="skuup-premium-dashboard-content" aria-live="polite">
            <div className="skuup-viewer-topbar">
              <div className="min-w-0 flex-1">
                <p className="skuup-kicker">Espace viewer</p>
                <h1 className="skuup-premium-dashboard-greeting">Bonjour, {profil.pseudo}</h1>
              </div>
              <div className="skuup-viewer-topbar-actions">
                <div className="relative">
                  <button type="button" className="skuup-viewer-icon-button" aria-label="Notifications" aria-expanded={notificationsOuvertes} onClick={() => setNotificationsOuvertes((ouvert) => !ouvert)}>
                    <SkkupIcon name="bell" size={20} />
                    <span aria-hidden="true" />
                  </button>
                  {notificationsOuvertes && <div role="status" className="skuup-viewer-notification-popover"><strong>Notifications</strong><p>Aucune nouvelle notification.</p></div>}
                </div>
                <MenuCompteDashboard profil={profil} />
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
