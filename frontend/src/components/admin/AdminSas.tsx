"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { NavigationAdmin } from "@/components/admin/NavigationAdmin";

export function AdminSas({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    recupererProfil().then((profilRecu) => {
      if (annule) return;
      if (profilRecu.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }
      setProfil(profilRecu);
    }).catch((exception: unknown) => {
      if (annule) return;
      if (exception instanceof ErreurApi && exception.statut === 401) {
        router.replace("/connexion");
        return;
      }
      setErreur("Impossible de charger l’espace administrateur.");
    });
    return () => { annule = true; };
  }, [router]);

  if (!profil) {
    return <main className="skuup-shell skuup-app-shell min-h-screen w-full" aria-busy="true"><div className="mx-auto flex min-h-[24rem] w-full max-w-6xl flex-col items-center justify-center gap-3 px-6 py-16"><h1 className="skuup-dashboard-page-title">Administration Skkup</h1><p role={erreur ? "alert" : "status"} className={erreur ? "skuup-admin-alert skuup-admin-alert-error" : "text-sm text-foreground-muted"}>{erreur ?? "Chargement de l’espace administrateur…"}</p></div></main>;
  }

  return <main className="skuup-shell skuup-app-shell min-h-screen w-full"><div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6"><section className="skuup-dashboard-content" aria-live="polite"><div className="skuup-admin-navigation-inline"><header className="skuup-admin-navigation-header"><div><p className="skuup-kicker">Administration</p><h1 className="skuup-dashboard-page-title">Back-office <span className="skuup-gradient-text">Skkup</span></h1><p>Gère les sponsors, les annonces, les tirages et les signalements depuis un espace centralisé.</p></div><div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} priority className="skuup-dashboard-orb-logo" /></div></header><NavigationAdmin profil={profil} /></div>{children}</section></div></main>;
}
