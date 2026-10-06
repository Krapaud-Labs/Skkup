"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";

const AdminProfilContext = createContext<Profil | null>(null);

export function useAdminProfil() {
  return useContext(AdminProfilContext);
}

export function AdminSas({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    let dernierErreur: unknown;
    for (let tentative = 0; tentative < 3; tentative += 1) {
      try {
        const profilRecu = await recupererProfil();
        if (profilRecu.role !== "ADMIN") {
          setChargement(false);
          router.replace("/dashboard");
          return;
        }
        setChargement(false);
        setProfil(profilRecu);
        return;
      } catch (exception: unknown) {
        dernierErreur = exception;
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/connexion");
          return;
        }
        if (tentative < 2) await new Promise((resolve) => window.setTimeout(resolve, 250 * (tentative + 1)));
      }
    }
    if (dernierErreur) setErreur("Impossible de charger l’espace administrateur.");
    setChargement(false);
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void chargerProfil());
  }, [chargerProfil]);

  if (!profil) {
    return <div className="skuup-shell skuup-app-shell min-h-screen w-full" aria-busy="true"><div className="mx-auto flex min-h-[24rem] w-full max-w-6xl flex-col items-center justify-center gap-3 px-6 py-16"><h1 className="skuup-dashboard-page-title">Administration Skkup</h1><p role={erreur ? "alert" : "status"} className={erreur ? "skuup-admin-alert skuup-admin-alert-error" : "text-sm text-foreground-muted"}>{erreur ?? "Chargement de l’espace administrateur…"}</p>{erreur && <button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerProfil()} disabled={chargement}>Réessayer</button>}</div></div>;
  }

  return <AdminProfilContext.Provider value={profil}><div className="skuup-shell skuup-app-shell min-h-screen w-full">{children}</div></AdminProfilContext.Provider>;
}
