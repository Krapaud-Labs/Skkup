"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import Link from "next/link";
import Image from "next/image";
import { NavigationDashboard } from "@/components/dashboard/NavigationDashboard";
import { TopbarDashboard } from "@/components/dashboard/TopbarDashboard";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

interface DashboardSasProps {
  children: ReactNode;
}

/** Sas applicatif : shell partagé, navigation utilisateur portée par le menu du pseudo. */
export function DashboardSas({ children }: DashboardSasProps) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const { langue } = useLanguage();
  const t = traductions[langue];

  const chargerProfil = useCallback(() => {
    setChargement(true);
    setErreur(null);
    return recupererProfil()
      .then((profilRecu) => setProfil(profilRecu))
      .catch((exception: unknown) => {
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/");
          return;
        }
        setErreur(
          langue === "en"
            ? "Unable to load your Skkup space."
            : "Impossible de charger ton espace Skkup.",
        );
      })
      .finally(() => setChargement(false));
  }, [langue, router]);

  useEffect(() => {
    queueMicrotask(() => void chargerProfil());
  }, [chargerProfil]);

  if (!profil) {
    return (
      <div
        className="skuup-shell skuup-app-shell min-h-screen w-full"
        aria-busy="true"
      >
        <div className="mx-auto flex min-h-[24rem] w-full max-w-6xl items-center px-6 py-16">
          <div className="flex flex-col items-start gap-3">
            <p
              role={erreur ? "alert" : "status"}
              className={
                erreur
                  ? "skuup-admin-alert skuup-admin-alert-error"
                  : "text-sm text-foreground-muted"
              }
            >
              {erreur ??
                (langue === "en"
                  ? "Loading your Skkup space…"
                  : "Chargement de ton espace Skkup…")}
            </p>
            {erreur && (
              <button
                className="skuup-button skuup-button-outline"
                type="button"
                onClick={() => void chargerProfil()}
                disabled={chargement}
              >
                {t.content.retry}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skuup-shell skuup-app-shell min-h-screen w-full">
      <div className="skuup-dashboard-host">
        <div className="skuup-premium-dashboard-shell">
          <aside
            className="skuup-premium-dashboard-nav"
            aria-label={t.dashboardNav}
          >
            <Link
              href="/"
              className="skuup-premium-dashboard-brand skuup-viewer-brand"
              aria-label={t.home.ariaTitle}
            >
              <Image
                src="/branding/skkup-wordmark-transparent.png"
                alt="Skkup"
                width={190}
                height={80}
                priority
                className="skuup-dashboard-wordmark"
              />
            </Link>
            <NavigationDashboard profil={profil} />
          </aside>
          <main
            id="dashboard-main"
            className="skuup-premium-dashboard-content"
            aria-label={t.dashboard}
            aria-live="polite"
          >
            <TopbarDashboard profil={profil} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
