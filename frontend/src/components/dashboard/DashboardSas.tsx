"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NavigationDashboard } from "@/components/dashboard/NavigationDashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";

interface DashboardSasProps {
  children: ReactNode;
}

/** Sas applicatif : navigation persistante à gauche et contenu central. */
export function DashboardSas({ children }: DashboardSasProps) {
  const router = useRouter();
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    recupererProfil()
      .then((profilRecu) => {
        if (!annule) setProfil(profilRecu);
      })
      .catch((exception: unknown) => {
        if (annule) return;
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/connexion");
          return;
        }
        setErreur(anglais ? "Unable to load your Skkup space." : "Impossible de charger ton espace Skkup.");
      });
    return () => {
      annule = true;
    };
  }, [anglais, router]);

  if (!profil) {
    return (
      <main className="skuup-app-shell min-h-screen w-full" aria-busy="true">
        <div className="mx-auto flex min-h-[24rem] w-full max-w-6xl items-center px-6 py-16">
          <p role={erreur ? "alert" : "status"} className={erreur ? "skuup-admin-alert skuup-admin-alert-error" : "text-sm text-foreground-muted"}>
            {erreur ?? (anglais ? "Loading your Skkup space…" : "Chargement de ton espace Skkup…")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="skuup-app-shell min-h-screen w-full">
      <div className="skuup-dashboard-sas mx-auto w-full gap-6 pb-16 pt-10">
        <aside className="skuup-dashboard-sidebar" aria-label="Parcours de ton espace Skkup">
          <NavigationDashboard profil={profil} />
        </aside>
        <section className="skuup-dashboard-content" aria-live="polite">
          {children}
        </section>
      </div>
    </main>
  );
}
