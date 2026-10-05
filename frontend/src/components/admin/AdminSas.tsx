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

  const chargerProfil = useCallback(() => {
    setChargement(true);
    setErreur(null);
    return recupererProfil().then((profilRecu) => {
      if (profilRecu.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }
      setProfil(profilRecu);
    }).catch((exception: unknown) => {
      if (exception instanceof ErreurApi && exception.statut === 401) {
        router.replace("/connexion");
        return;
      }
      setErreur("Impossible de charger l’espace administrateur.");
    }).finally(() => setChargement(false));
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void chargerProfil());
  }, [chargerProfil]);

  if (!profil) {
    return <div className="skuup-shell skuup-app-shell min-h-screen w-full" aria-busy="true"><div className="mx-auto flex min-h-[24rem] w-full max-w-6xl flex-col items-center justify-center gap-3 px-6 py-16"><h1 className="skuup-dashboard-page-title">Administration Skkup</h1><p role={erreur ? "alert" : "status"} className={erreur ? "skuup-admin-alert skuup-admin-alert-error" : "text-sm text-foreground-muted"}>{erreur ?? "Chargement de l’espace administrateur…"}</p>{erreur && <button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerProfil()} disabled={chargement}>Réessayer</button>}</div></div>;
  }

  return <AdminProfilContext.Provider value={profil}><div className="skuup-shell skuup-app-shell min-h-screen w-full">{children}</div></AdminProfilContext.Provider>;
}
