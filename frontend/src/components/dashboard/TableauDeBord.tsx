"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BandeauStats } from "@/components/ui/BandeauStats";
import { BarreProgressionStreak } from "@/components/ui/BarreProgressionStreak";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { ErreurApi } from "@/lib/api";
import {
  libellesStatutTirage,
  libellesTypeTransaction,
  prochainPalierStreak,
  recupererCartesAGratter,
  recupererHistoriquePoints,
  recupererProfil,
  recupererTicketsTirage,
  type CarteAGratter,
  type HistoriquePoints,
  type Profil,
  type TicketsTirage,
} from "@/lib/dashboard";
import {
  connecterTempsReel,
  EVENEMENT_CARTE_DEBLOQUEE,
  EVENEMENT_POINTS_MIS_A_JOUR,
  EVENEMENT_STREAK_MIS_A_JOUR,
  type EvenementCarteDebloquee,
  type EvenementPointsMisAJour,
  type EvenementStreakMisAJour,
} from "@/lib/temps-reel";

const TAILLE_PAGE = 10;

/**
 * Tableau de bord viewer : solde de points, historique, série de
 * visites, cartes à gratter et tickets de tirage.
 *
 * Chargement initial en REST, puis mises à jour en direct via la
 * Gateway temps réel pour le solde, la série et les nouvelles cartes.
 * Le WebSocket est un confort : sa connexion échoue silencieusement, le
 * dashboard reste utilisable avec les données déjà chargées.
 */
export function TableauDeBord() {
  const router = useRouter();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pageHistorique, setPageHistorique] = useState(1);
  const [pageTickets, setPageTickets] = useState(1);
  const sessionChargee = profil !== null;

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    let annule = false;

    Promise.all([
      recupererProfil(),
      recupererHistoriquePoints(1, TAILLE_PAGE),
      recupererCartesAGratter(),
      recupererTicketsTirage(1, TAILLE_PAGE),
    ])
      .then(([profilRecu, historiqueRecu, cartesRecues, ticketsRecus]) => {
        if (annule) {
          return;
        }
        setProfil(profilRecu);
        setHistorique(historiqueRecu);
        setCartes(cartesRecues);
        setTickets(ticketsRecus);
      })
      .catch((exception: unknown) => {
        if (annule) {
          return;
        }
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.push("/connexion");
          return;
        }
        setErreur(
          exception instanceof ErreurApi
            ? exception.message
            : "Impossible de charger le tableau de bord pour le moment.",
        );
      });

    return () => {
      annule = true;
    };
    // Chargement au montage uniquement : `router` (Next.js) est stable en
    // usage réel, l'inclure re-déclencherait l'effet à chaque rendu sans
    // rien apporter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Pagination de l'historique de points ──────────────────────────────────

  useEffect(() => {
    if (pageHistorique === 1) {
      // La première page est déjà chargée par l'effet initial.
      return;
    }
    let annule = false;
    recupererHistoriquePoints(pageHistorique, TAILLE_PAGE).then((resultat) => {
      if (!annule) {
        setHistorique(resultat);
      }
    });
    return () => {
      annule = true;
    };
  }, [pageHistorique]);

  useEffect(() => {
    if (pageTickets === 1) {
      return;
    }
    let annule = false;
    recupererTicketsTirage(pageTickets, TAILLE_PAGE).then((resultat) => {
      if (!annule) {
        setTickets(resultat);
      }
    });
    return () => {
      annule = true;
    };
  }, [pageTickets]);

  // ─── Temps réel ────────────────────────────────────────────────────────────

  const surPointsMisAJour = useCallback((donnees: EvenementPointsMisAJour) => {
    setProfil((actuel) =>
      actuel ? { ...actuel, soldePoints: donnees.soldePoints } : actuel,
    );
  }, []);

  const surStreakMisAJour = useCallback((donnees: EvenementStreakMisAJour) => {
    setProfil((actuel) =>
      actuel
        ? {
            ...actuel,
            streakActuel: donnees.streakActuel,
            streakMax: donnees.streakMax,
          }
        : actuel,
    );
  }, []);

  const surCarteDebloquee = useCallback((donnees: EvenementCarteDebloquee) => {
    setCartes((actuelles) => {
      if (!actuelles) {
        return actuelles;
      }
      // Le payload ne porte que l'identifiant de la carte et le palier :
      // suffisant pour l'afficher dans la liste des cartes non grattées,
      // pas besoin de refaire l'appel REST complet.
      const nouvelleCarte: CarteAGratter = {
        id: donnees.carteId,
        userId: "",
        streakPalier: donnees.streakPalier,
        grattee: false,
        gainType: null,
        gainMontant: null,
        createdAt: new Date().toISOString(),
        gratteeAt: null,
      };
      return [...actuelles, nouvelleCarte];
    });
  }, []);

  useEffect(() => {
    if (!sessionChargee) {
      return;
    }
    const socket = connecterTempsReel();
    socket.on(EVENEMENT_POINTS_MIS_A_JOUR, surPointsMisAJour);
    socket.on(EVENEMENT_STREAK_MIS_A_JOUR, surStreakMisAJour);
    socket.on(EVENEMENT_CARTE_DEBLOQUEE, surCarteDebloquee);

    return () => {
      socket.disconnect();
    };
  }, [sessionChargee, surPointsMisAJour, surStreakMisAJour, surCarteDebloquee]);

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  if (erreur) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      >
        {erreur}
      </p>
    );
  }

  if (!profil || !historique || !cartes || !tickets) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-foreground-muted">
        Chargement du tableau de bord...
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <BandeauStats
        statistiques={[
          { valeur: `${profil.soldePoints}`, libelle: "Points" },
          { valeur: `${profil.streakActuel} j`, libelle: "Série actuelle" },
          { valeur: `${cartes.length}`, libelle: "Cartes à gratter" },
        ]}
      />

      <div className="skuup-dashboard-card-grid grid gap-6 lg:grid-cols-2">
        <CarteGlow className="skuup-dashboard-panel flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="skuup-kicker">Régularité</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Série de visites</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Record personnel : {profil.streakMax} jours consécutifs.
              </p>
            </div>
            <span className="skuup-dashboard-panel-mark" aria-hidden="true">✦</span>
          </div>
          <div className="mt-6">
            <BarreProgressionStreak
              streakActuel={profil.streakActuel}
              prochainPalier={prochainPalierStreak(profil.streakActuel)}
            />
          </div>
        </CarteGlow>

        <SectionCartesAGratter cartes={cartes} />
      </div>

      <div className="skuup-dashboard-card-grid grid gap-6 lg:grid-cols-2">
        <SectionHistoriquePoints
          historique={historique}
          page={pageHistorique}
          surChangementPage={setPageHistorique}
        />

        <SectionTicketsTirage
          tickets={tickets}
          page={pageTickets}
          surChangementPage={setPageTickets}
        />
      </div>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionCartesAGratter({ cartes }: { cartes: CarteAGratter[] }) {
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="skuup-kicker">Récompenses</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Cartes à gratter</h2>
        </div>
        <span className="skuup-dashboard-count">{cartes.length}</span>
      </div>
      {cartes.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-foreground-muted">
          Aucune carte disponible pour l&apos;instant. Continue ta série de
          visites pour en débloquer.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cartes.map((carte) => (
            <li
              key={carte.id}
              className="skuup-dashboard-scratch flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-center"
            >
              <span className="text-2xl" aria-hidden="true">
                🎟️
              </span>
              <span className="text-sm font-semibold text-foreground">
                Palier {carte.streakPalier} j
              </span>
            </li>
          ))}
        </ul>
      )}
    </CarteGlow>
  );
}

function SectionHistoriquePoints({
  historique,
  page,
  surChangementPage,
}: {
  historique: HistoriquePoints;
  page: number;
  surChangementPage: (page: number) => void;
}) {
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <p className="skuup-kicker">Activité</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">Historique de points</h2>
      {historique.transactions.length === 0 ? (
        <p className="mt-2 text-sm text-foreground-muted">
          Aucune transaction pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-accent-violet-light/20">
          {historique.transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="text-foreground-muted">
                {libellesTypeTransaction[transaction.type]}
                {" · "}
                {new Date(transaction.createdAt).toLocaleDateString("fr-FR")}
              </span>
              <span
                className={`font-semibold ${
                  transaction.montant >= 0 ? "text-accent-cta" : "text-red-300"
                }`}
              >
                {transaction.montant >= 0 ? "+" : ""}
                {transaction.montant}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        totalPages={historique.totalPages}
        surChangementPage={surChangementPage}
      />
    </CarteGlow>
  );
}

function SectionTicketsTirage({
  tickets,
  page,
  surChangementPage,
}: {
  tickets: TicketsTirage;
  page: number;
  surChangementPage: (page: number) => void;
}) {
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <p className="skuup-kicker">Tes participations</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">Tickets de tirage</h2>
      {tickets.tickets.length === 0 ? (
        <p className="mt-2 text-sm text-foreground-muted">
          Aucun ticket obtenu pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-accent-violet-light/20">
          {tickets.tickets.map((ticket) => (
            <li key={ticket.ticketId} className="flex flex-col gap-1 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {ticket.raffleTitre}
                </span>
                <span className="text-xs text-foreground-muted">
                  {libellesStatutTirage[ticket.raffleStatut]}
                </span>
              </div>
              {ticket.gagnant && ticket.lot && (
                <span className="text-sm font-semibold text-accent-cta">
                  Gagné : {ticket.lot.nom}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        totalPages={tickets.totalPages}
        surChangementPage={surChangementPage}
      />
    </CarteGlow>
  );
}

function Pagination({
  page,
  totalPages,
  surChangementPage,
}: {
  page: number;
  totalPages: number;
  surChangementPage: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <BoutonCTA
        variante="secondaire"
        className="px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => surChangementPage(page - 1)}
      >
        Précédent
      </BoutonCTA>
      <span className="text-xs text-foreground-muted">
        Page {page} / {totalPages}
      </span>
      <BoutonCTA
        variante="secondaire"
        className="px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => surChangementPage(page + 1)}
      >
        Suivant
      </BoutonCTA>
    </div>
  );
}
