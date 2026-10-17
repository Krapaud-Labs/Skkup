"use client";

import { SkkupIcon } from "@/components/ui/SkkupIcon";
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
  type TypeTransactionPoints,
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
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

const TAILLE_PAGE = 10;
const TAILLE_HISTORIQUE = 30;

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
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const t = traductions[langue];

  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pageTickets, setPageTickets] = useState(1);
  const sessionChargee = profil !== null;

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    let annule = false;

    Promise.all([
      recupererProfil(),
      recupererHistoriquePoints(1, TAILLE_HISTORIQUE),
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
      // Le WebSocket peut recevoir l'événement juste après le profil,
      // avant la résolution de la requête REST des cartes. On conserve
      // alors la carte en mémoire au lieu de perdre la notification.
      return [...(actuelles ?? []), nouvelleCarte];
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
        {anglais ? "Loading your dashboard..." : "Chargement du tableau de bord..."}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <BandeauStats
        statistiques={[
          {
            valeur: `${profil.soldePoints}`,
            libelle: anglais ? "Total points" : "Points cumulés",
            progression: {
              valeur: profil.soldePoints,
              objectif: Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100),
              libelle: anglais ? `Next milestone: ${Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100)} pts` : `Prochain repère : ${Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100)} pts`,
            },
          },
          {
            valeur: `${profil.streakActuel} j`,
            libelle: anglais ? "Current streak" : "Série actuelle",
            progression: {
              valeur: profil.streakActuel,
              objectif: prochainPalierStreak(profil.streakActuel),
              libelle: anglais ? `Next level: ${prochainPalierStreak(profil.streakActuel)} days` : `Prochain palier : ${prochainPalierStreak(profil.streakActuel)} j`,
            },
          },
          { valeur: `${cartes.length}`, libelle: "Cartes à gratter", activite: true },
        ]}
      />

      <div className="grid gap-6">
        <CarteGlow className="skuup-dashboard-panel flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="skuup-kicker">{t.regularity}</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">{t.visitStreak}</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Record personnel : {profil.streakMax} jours consécutifs.
              </p>
            </div>
            <span className="skuup-dashboard-panel-mark"><SkkupIcon name="spark" size={20} /></span>
          </div>
          <div className="mt-6">
            <BarreProgressionStreak
              streakActuel={profil.streakActuel}
              prochainPalier={prochainPalierStreak(profil.streakActuel)}
            />
          </div>
        </CarteGlow>

        <SectionCartesAGratter cartes={cartes} anglais={anglais} />
      </div>

      <div className="skuup-dashboard-card-grid grid gap-6 lg:grid-cols-2">
        <SectionHistoriquePoints
          historique={historique}
          anglais={anglais}
        />

        <SectionTicketsTirage
          tickets={tickets}
          page={pageTickets}
          surChangementPage={setPageTickets}
          anglais={anglais}
        />
      </div>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionCartesAGratter({ cartes, anglais }: { cartes: CarteAGratter[]; anglais: boolean }) {
  const t = traductions[anglais ? "en" : "fr"];
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="skuup-kicker">{t.rewards}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{t.scratchCards}</h2>
        </div>
        <span className="skuup-dashboard-count">{cartes.length}</span>
      </div>
          {cartes.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-foreground-muted">
          {anglais ? "No cards available yet. Keep your visit streak going to unlock one." : "Aucune carte disponible pour l'instant. Continue ta série de visites pour en débloquer."}
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
                {anglais ? `Level ${carte.streakPalier} days` : `Palier ${carte.streakPalier} j`}
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
  anglais,
}: {
  historique: HistoriquePoints;
  anglais: boolean;
}) {
  const t = traductions[anglais ? "en" : "fr"];
  return (
    <CarteGlow className="skuup-dashboard-panel w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="skuup-kicker">{t.activity}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{anglais ? "Recent activity" : "Activité récente"}</h2>
        </div>
        <SkkupIcon name="points" size={28} aria-hidden="true" />
      </div>
      {historique.transactions.length === 0 ? (
        <p className="mt-2 text-sm text-foreground-muted">
          {anglais ? "No transactions yet." : "Aucune transaction pour l'instant."}
        </p>
      ) : (
        <ul className="skuup-dashboard-activity-list mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {historique.transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-accent-violet-light/20 bg-background/30 px-3 py-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden="true">
                  <SkkupIcon name={iconeTransaction(transaction.type)} size={24} />
                </span>
                <span className="min-w-0 text-foreground-muted">
                  <span className="block truncate text-foreground">{libelleTransaction(transaction.type, anglais)}</span>
                  <span className="block text-xs">{new Date(transaction.createdAt).toLocaleDateString(anglais ? "en-GB" : "fr-FR")}</span>
                </span>
              </span>
              <span className={`shrink-0 font-semibold ${transaction.montant >= 0 ? "text-accent-cta" : "text-red-300"}`}>
                {transaction.montant >= 0 ? "+" : ""}{transaction.montant} <SkkupIcon name="points" size={16} className="inline-block align-text-bottom" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </CarteGlow>
  );
}

function iconeTransaction(type: TypeTransactionPoints): "points" | "eye" | "gift" | "admin" {
  switch (type) {
    case "WATCH_TIME": return "eye";
    case "CARTE_A_GRATTER": return "gift";
    case "AJUSTEMENT_ADMIN": return "admin";
    default: return "points";
  }
}

function libelleTransaction(type: TypeTransactionPoints, anglais: boolean): string {
  if (!anglais) return libellesTypeTransaction[type];
  return { VISITE_QUOTIDIENNE: "Daily visit", WATCH_TIME: "Watch time", CARTE_A_GRATTER: "Scratch card", AJUSTEMENT_ADMIN: "Admin adjustment" }[type];
}

function SectionTicketsTirage({
  tickets,
  page,
  surChangementPage,
  anglais,
}: {
  tickets: TicketsTirage;
  page: number;
  surChangementPage: (page: number) => void;
  anglais: boolean;
}) {
  const t = traductions[anglais ? "en" : "fr"];
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <p className="skuup-kicker">{t.entries}</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">{t.drawTickets}</h2>
      {tickets.tickets.length === 0 ? (
        <p className="mt-2 text-sm text-foreground-muted">
          {anglais ? "No ticket earned yet." : "Aucun ticket obtenu pour l'instant."}
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
                  {t.won} : {ticket.lot.nom}
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
