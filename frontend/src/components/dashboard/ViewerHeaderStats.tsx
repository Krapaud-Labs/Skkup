"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { recupererTicketsTirage, type Profil } from "@/lib/dashboard";

type ProfilHeader = Pick<Profil, "soldePoints" | "streakActuel">;

interface ViewerHeaderStatsValue {
  profil: ProfilHeader;
  ticketsTotal: number | null;
  ticketsLoading: boolean;
  ticketsError: boolean;
  setProfil: (profil: ProfilHeader) => void;
  setPoints: (value: number | ((current: number) => number)) => void;
  setStreak: (value: number | ((current: number) => number)) => void;
  refreshTickets: () => Promise<void>;
}

const ViewerHeaderStatsContext = createContext<ViewerHeaderStatsValue | null>(null);

export function ViewerHeaderStatsProvider({ profil, children }: { profil: Profil; children: ReactNode }) {
  const [profilStats, setProfilStats] = useState<ProfilHeader>({
    soldePoints: profil.soldePoints,
    streakActuel: profil.streakActuel,
  });
  const [dernierProfilRecu, setDernierProfilRecu] = useState<ProfilHeader>({
    soldePoints: profil.soldePoints,
    streakActuel: profil.streakActuel,
  });
  const [ticketsTotal, setTicketsTotal] = useState<number | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(false);
  const requeteEnCours = useRef<Promise<void> | null>(null);

  if (profil.soldePoints !== dernierProfilRecu.soldePoints || profil.streakActuel !== dernierProfilRecu.streakActuel) {
    const profilRecu = { soldePoints: profil.soldePoints, streakActuel: profil.streakActuel };
    setDernierProfilRecu(profilRecu);
    setProfilStats(profilRecu);
  }

  const setProfil = useCallback((valeurs: ProfilHeader) => {
    setProfilStats({ soldePoints: valeurs.soldePoints, streakActuel: valeurs.streakActuel });
  }, []);
  const setPoints = useCallback((value: number | ((current: number) => number)) => {
    setProfilStats((current) => ({ ...current, soldePoints: typeof value === "function" ? value(current.soldePoints) : value }));
  }, []);
  const setStreak = useCallback((value: number | ((current: number) => number)) => {
    setProfilStats((current) => ({ ...current, streakActuel: typeof value === "function" ? value(current.streakActuel) : value }));
  }, []);

  const refreshTickets = useCallback(() => {
    if (requeteEnCours.current) return requeteEnCours.current;

    setTicketsLoading(true);
    setTicketsError(false);
    const requete = recupererTicketsTirage(1, 1)
      .then((resultat) => {
        setTicketsTotal(resultat.total);
        setTicketsError(false);
      })
      .catch(() => {
        setTicketsTotal(null);
        setTicketsError(true);
      })
      .finally(() => {
        setTicketsLoading(false);
        requeteEnCours.current = null;
      });

    requeteEnCours.current = requete;
    return requete;
  }, []);

  useEffect(() => {
    void refreshTickets();
  }, [profil.id, refreshTickets]);

  return (
    <ViewerHeaderStatsContext.Provider value={{ profil: profilStats, ticketsTotal, ticketsLoading, ticketsError, setProfil, setPoints, setStreak, refreshTickets }}>
      {children}
    </ViewerHeaderStatsContext.Provider>
  );
}

export function useViewerHeaderStats() {
  return useContext(ViewerHeaderStatsContext);
}
