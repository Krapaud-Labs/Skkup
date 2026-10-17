"use client";

/* Reward media URLs come from backend contracts and may be remote. */
/* eslint-disable @next/next/no-img-element */

import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BandeauStats } from "@/components/ui/BandeauStats";
import { EtatChargementDashboard } from "@/components/dashboard/EtatChargementDashboard";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { ErreurApi } from "@/lib/api";
import {
  libellesStatutTirage,
  libellesTypeTransaction,
  prochainPalierStreak,
  recupererCartesAGratter,
  gratterCarte,
  enregistrerVisiteQuotidienne,
  recupererHistoriquePoints,
  recupererProfil,
  recupererTicketsTirage,
  recupererTiragesPublics,
  inscrireTirage,
  type CarteAGratter,
  type HistoriquePoints,
  type Profil,
  type TypeTransactionPoints,
  type TicketsTirage,
  type TiragePublic,
} from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  connecterTempsReel,
  EVENEMENT_CARTE_DEBLOQUEE,
  EVENEMENT_POINTS_MIS_A_JOUR,
  EVENEMENT_STREAK_MIS_A_JOUR,
  EVENEMENT_TIRAGE_STATUT,
  EVENEMENT_RESULTAT_TIRAGE,
  type EvenementCarteDebloquee,
  type EvenementPointsMisAJour,
  type EvenementStreakMisAJour,
} from "@/lib/temps-reel";

const TAILLE_PAGE = 10;
const TAILLE_HISTORIQUE = 30;
type ErreursSections = { historique?: string; cartes?: string; tickets?: string };

const dashboardCopy = {
  fr: {
    loading: "Chargement du tableau de bord", kicker: "Espace viewer", title: "Ton espace de progression", subtitle: "Retrouve tes points, ta série de visites et tes récompenses dans un seul espace.",
    points: "Points disponibles", balance: "Solde de points", streak: "Série actuelle", tier: (value: number) => `Palier : ${value} jours`, tickets: "Tickets de tirage",
    raffle: "Prochains tirages", drawsAndTickets: "Tirages et tickets", noRaffle: "Aucune loterie ouverte", raffleDescription: "Utilise tes tickets pour tenter de gagner ces cadeaux.", raffleLots: "Lots du tirage", prizeIllustration: (name: string) => `Illustration du lot ${name}`, availableSingular: "disponible", availablePlural: "disponibles", allRaffles: "Voir tous les tirages", unavailableTickets: "Tickets indisponibles", availableTickets: (count: number) => `${count} ticket(s) disponible(s)`, register: "S’inscrire", registering: "Inscription...", currentRaffleError: "La loterie en cours est temporairement indisponible.",
    extension: "Extension à associer", manageExtension: "Gérer l’extension", extensionDescription: "L’état de connexion n’est pas disponible depuis le site. Associe ton navigateur pour commencer.", extensionBenefits: ["Détection des streams après association", "Comptabilisation du temps de visionnage validé", "Gain de points selon les règles du service"], viewingSummary: "Résumé du visionnage", notAvailable: "Non disponible", validatedTime: "Temps validé", sessions: "Sessions", lastVisit: "Dernière visite", dailyVisit: "La visite quotidienne est validée automatiquement à la connexion.", liveNote: "Statut live et spectateurs non fournis par le contrat streams.",
    rewards: "Récompenses", scratch: "Cartes à gratter", scratchDescription: (available: number, used: number) => `${available} disponible(s) · ${used} utilisée(s) · Utilise tes points pour découvrir des récompenses instantanées.`, allCards: "Voir toutes les cartes", loadingCards: "Chargement des cartes…", noCards: "Aucune carte disponible pour l’instant.", noCardsDescription: "Continue ta série de visites pour en débloquer ou consulte les récompenses déjà publiées.", rewardsLink: "Voir les récompenses", scratchGain: "Gain à découvrir", ticket: "Ticket de tirage", used: "Déjà utilisée", scratchAction: "Gratter la carte", opening: "Ouverture…",
    activity: "Activité récente", history: "Historique de points", allActivity: "Voir tout", loadingHistory: "Chargement de l’historique…", noTransactions: "Aucune transaction pour l’instant.", noTransactionsDescription: "Ton activité apparaîtra ici dès que l’extension aura validé un visionnage.", pairExtension: "Associer l’extension", sessionMissing: "Session non fournie", participations: "Tes participations", loadingTickets: "Chargement des tickets…", noTickets: "Aucun ticket obtenu pour l’instant.", noTicketsDescription: "Les tickets gagnés pendant tes parcours seront regroupés ici.", chromeExtension: "Skkup pour Chrome", drawDate: "Tirage le", won: "Gagné", transactionLabels: libellesTypeTransaction, drawStatusLabels: libellesStatutTirage, previous: "Précédent", next: "Suivant", page: (current: number, total: number) => `Page ${current} / ${total}`,
  },
  en: {
    loading: "Loading dashboard", kicker: "Viewer space", title: "Your progress space", subtitle: "Review your points, viewing streak and rewards in one place.",
    points: "Available points", balance: "Points balance", streak: "Current streak", tier: (value: number) => `Tier: ${value} days`, tickets: "Draw tickets",
    raffle: "Upcoming draws", drawsAndTickets: "Draws and tickets", noRaffle: "No raffle currently open", raffleDescription: "Use your tickets for a chance to win these prizes.", raffleLots: "Draw prizes", prizeIllustration: (name: string) => `Illustration of prize ${name}`, availableSingular: "available", availablePlural: "available", allRaffles: "View all draws", unavailableTickets: "Tickets unavailable", availableTickets: (count: number) => `${count} ticket(s) available`, register: "Register", registering: "Registering...", currentRaffleError: "The current raffle is temporarily unavailable.",
    extension: "Extension to pair", manageExtension: "Manage extension", extensionDescription: "The connection state is not available from the website. Pair your browser to get started.", extensionBenefits: ["Stream detection after pairing", "Validated viewing time tracking", "Points earned according to the service rules"], viewingSummary: "Viewing summary", notAvailable: "Not available", validatedTime: "Validated time", sessions: "Sessions", lastVisit: "Last visit", dailyVisit: "Daily visit is confirmed automatically when you sign in.", liveNote: "Live status and viewer counts are not provided by the streams contract.",
    rewards: "Rewards", scratch: "Scratch cards", scratchDescription: (available: number, used: number) => `${available} available · ${used} used · Use your points to discover instant rewards.`, allCards: "View all cards", loadingCards: "Loading scratch cards…", noCards: "No cards available yet.", noCardsDescription: "Keep your viewing streak going to unlock more, or browse published rewards.", rewardsLink: "View rewards", scratchGain: "Reward to discover", ticket: "Draw ticket", used: "Already used", scratchAction: "Scratch card", opening: "Opening…",
    activity: "Recent activity", history: "Points history", allActivity: "View all", loadingHistory: "Loading history…", noTransactions: "No transactions yet.", noTransactionsDescription: "Your activity will appear here once the extension validates viewing.", pairExtension: "Pair the extension", sessionMissing: "Session not provided", participations: "Your entries", loadingTickets: "Loading tickets…", noTickets: "No tickets yet.", noTicketsDescription: "Tickets earned during your activity will be listed here.", chromeExtension: "Skkup for Chrome", drawDate: "Draw date", won: "Won", transactionLabels: { VISITE_QUOTIDIENNE: "Daily visit", WATCH_TIME: "Viewing time", CARTE_A_GRATTER: "Scratch card", AJUSTEMENT_ADMIN: "Admin adjustment" }, drawStatusLabels: { OUVERT: "Open", CLOTURE: "Closed", TIRE: "Result published" }, previous: "Previous", next: "Next", page: (current: number, total: number) => `Page ${current} / ${total}`,
  },
} as const;

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
  const t = dashboardCopy[langue];
  const reduceMotion = useReducedMotion();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [tirageEnCours, setTirageEnCours] = useState<TiragePublic | null>(null);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(false);
  const [messageTirage, setMessageTirage] = useState<string | null>(null);
  const [erreursSections, setErreursSections] = useState<ErreursSections>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [cleRechargement, setCleRechargement] = useState(0);
  const [pageTickets, setPageTickets] = useState(1);
  const [erreurPaginationTickets, setErreurPaginationTickets] = useState<string | undefined>();
  const [clePagination, setClePagination] = useState(0);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [messageAction, setMessageAction] = useState<string | null>(null);
  const visiteAutomatiqueLancee = useRef(false);
  const sessionChargee = profil !== null;

  const enregistrerVisite = useCallback(async () => {
    if (actionEnCours) return;
    setActionEnCours("checkin");
    setMessageAction(null);
    try {
      const resultat = await enregistrerVisiteQuotidienne();
      const profilActualise = await recupererProfil();
      setProfil({ ...profilActualise, soldePoints: resultat.soldePoints, streakActuel: resultat.streakActuel, streakMax: resultat.streakMax });
      if (resultat.carteDebloquee) setCartes((actuelles) => [...(actuelles ?? []), resultat.carteDebloquee as CarteAGratter]);
      const historiqueActualise = await recupererHistoriquePoints(1, TAILLE_HISTORIQUE);
      setHistorique(historiqueActualise);
      setMessageAction(langue === "en" ? `Daily visit confirmed: +${resultat.pointsCredites} points.` : `Visite confirmée : +${resultat.pointsCredites} points.`);
    } catch (exception) {
      setMessageAction(exception instanceof ErreurApi && exception.statut === 409 ? langue === "en" ? "Today's visit is already confirmed." : "La visite du jour est déjà confirmée." : langue === "en" ? "The daily visit is temporarily unavailable." : "La visite quotidienne est temporairement indisponible.");
    } finally {
      setActionEnCours(null);
    }
  }, [actionEnCours, langue]);

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    let annule = false;

    recupererProfil()
      .then((profilRecu) => {
        if (annule) return;
        setProfil(profilRecu);
        const visiteDuJour = profilRecu.derniereVisiteAt
          && new Date(profilRecu.derniereVisiteAt).toDateString() === new Date().toDateString();
        if (!visiteDuJour && !visiteAutomatiqueLancee.current) {
          visiteAutomatiqueLancee.current = true;
          void enregistrerVisite();
        }
      })
      .catch((exception: unknown) => {
        if (annule) return;
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.push("/connexion");
          return;
        }
        setErreur(exception instanceof ErreurApi ? exception.message : "Impossible de charger le tableau de bord pour le moment.");
      });

    Promise.allSettled([
      recupererHistoriquePoints(1, TAILLE_HISTORIQUE),
      recupererCartesAGratter(),
      recupererTicketsTirage(1, TAILLE_PAGE),
    ])
      .then(([historiqueResultat, cartesResultat, ticketsResultat]) => {
        if (annule) return;
        const erreurs: ErreursSections = {};
        if (historiqueResultat.status === "fulfilled") {
          setHistorique(historiqueResultat.value);
        } else {
          setHistorique({ transactions: [], page: 1, limit: TAILLE_PAGE, total: 0, totalPages: 1 });
          erreurs.historique = langue === "en" ? "Points history is temporarily unavailable." : "L’historique des points est temporairement indisponible.";
        }
        const cartesRecues = cartesResultat.status === "fulfilled" ? cartesResultat.value : [];
        if (cartesResultat.status === "rejected") erreurs.cartes = langue === "en" ? "Scratch cards are temporarily unavailable." : "Les cartes à gratter sont temporairement indisponibles.";
        setCartes((actuelles) => {
          if (!actuelles) {
            return cartesRecues;
          }
          const idsRecus = new Set(cartesRecues.map((carte) => carte.id));
          return [
            ...cartesRecues,
            ...actuelles.filter((carte) => !idsRecus.has(carte.id)),
          ];
        });
        if (ticketsResultat.status === "fulfilled") {
          setTickets(ticketsResultat.value);
        } else {
          setTickets({ tickets: [], page: 1, limit: TAILLE_PAGE, total: 0, totalPages: 1 });
          erreurs.tickets = langue === "en" ? "Draw tickets are temporarily unavailable." : "Les tickets de tirage sont temporairement indisponibles.";
        }
        setErreursSections(erreurs);
      });

    recupererTiragesPublics()
      .then((tirages) => {
        const ouvert = tirages.find((tirage) => tirage.statut === "OUVERT");
        if (!annule) setTirageEnCours(ouvert ?? null);
      })
      .catch(() => {
        if (!annule) setMessageTirage(langue === "en" ? "The current raffle is temporarily unavailable." : "La loterie en cours est temporairement indisponible.");
      });

    return () => {
      annule = true;
    };
    // Le changement de langue recharge les libellés et les données locales.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langue, cleRechargement]);

  async function participerALaLoterie() {
    if (!tirageEnCours || inscriptionEnCours) return;
    setInscriptionEnCours(true);
    setMessageTirage(null);
    try {
      await inscrireTirage(tirageEnCours.id);
      setMessageTirage(langue === "en" ? "Registration confirmed." : "Inscription confirmée.");
      setTirageEnCours(null);
      const [ticketsActualises, historiqueActualise] = await Promise.all([
        recupererTicketsTirage(pageTickets, TAILLE_PAGE),
        recupererHistoriquePoints(1, TAILLE_HISTORIQUE),
      ]);
      setTickets(ticketsActualises);
      setHistorique(historiqueActualise);
    } catch (exception) {
      setMessageTirage(exception instanceof ErreurApi && exception.statut === 409
        ? langue === "en" ? "You are already registered for this raffle." : "Tu es déjà inscrit à cette loterie."
        : langue === "en" ? "Registration is temporarily unavailable." : "L’inscription est temporairement indisponible.");
    } finally {
      setInscriptionEnCours(false);
    }
  }

  async function gratter(carte: CarteAGratter) {
    if (actionEnCours) return;
    setActionEnCours(carte.id);
    setMessageAction(null);
    try {
      const resultat = await gratterCarte(carte.id);
      setCartes((actuelles) => (actuelles ?? []).filter((item) => item.id !== carte.id));
      setMessageAction(resultat.ticketCree ? langue === "en" ? "Scratch card opened: a draw ticket was added." : "Carte ouverte : un ticket de tirage a été ajouté." : langue === "en" ? `Scratch card opened: +${resultat.carte.gainMontant ?? 0} points.` : `Carte ouverte : +${resultat.carte.gainMontant ?? 0} points.`);
      if (resultat.carte.gainMontant) setProfil((actuel) => actuel ? { ...actuel, soldePoints: actuel.soldePoints + resultat.carte.gainMontant! } : actuel);
      const [ticketsActualises, historiqueActualise] = await Promise.all([
        recupererTicketsTirage(pageTickets, TAILLE_PAGE),
        recupererHistoriquePoints(1, TAILLE_HISTORIQUE),
      ]);
      setTickets(ticketsActualises);
      setHistorique(historiqueActualise);
    } catch (exception) {
      setMessageAction(exception instanceof ErreurApi ? exception.message : langue === "en" ? "Scratch card unavailable." : "Carte à gratter indisponible.");
    } finally {
      setActionEnCours(null);
    }
  }

  useEffect(() => {
    if (pageTickets === 1) {
      return;
    }
    let annule = false;
    recupererTicketsTirage(pageTickets, TAILLE_PAGE).then((resultat) => {
      if (!annule) {
        setErreurPaginationTickets(undefined);
        setTickets(resultat);
      }
    }).catch(() => {
      if (!annule) setErreurPaginationTickets(langue === "en" ? "Draw tickets are temporarily unavailable." : "Les tickets de tirage sont temporairement indisponibles.");
    });
    return () => {
      annule = true;
    };
  }, [pageTickets, clePagination, langue]);

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
    void donnees;
  }, []);

  const actualiserDonneesTempsReel = useCallback(async () => {
    const [profilResultat, historiqueResultat, cartesResultat, ticketsResultat, tiragesResultat] = await Promise.allSettled([
      recupererProfil(),
      recupererHistoriquePoints(1, TAILLE_HISTORIQUE),
      recupererCartesAGratter(),
      recupererTicketsTirage(pageTickets, TAILLE_PAGE),
      recupererTiragesPublics(),
    ]);
    if (profilResultat.status === "fulfilled") setProfil(profilResultat.value);
    if (historiqueResultat.status === "fulfilled") setHistorique(historiqueResultat.value);
    if (cartesResultat.status === "fulfilled") setCartes(cartesResultat.value);
    if (ticketsResultat.status === "fulfilled") setTickets(ticketsResultat.value);
    if (tiragesResultat.status === "fulfilled") {
      setTirageEnCours(tiragesResultat.value.find((tirage) => tirage.statut === "OUVERT") ?? null);
    }
  }, [pageTickets]);

  const surPointsEtSectionsMisAJour = useCallback((donnees: EvenementPointsMisAJour) => {
    surPointsMisAJour(donnees);
    void actualiserDonneesTempsReel();
  }, [actualiserDonneesTempsReel, surPointsMisAJour]);

  const surStreakEtSectionsMisAJour = useCallback((donnees: EvenementStreakMisAJour) => {
    surStreakMisAJour(donnees);
    void actualiserDonneesTempsReel();
  }, [actualiserDonneesTempsReel, surStreakMisAJour]);

  const surCarteEtSectionsMisAJour = useCallback((donnees: EvenementCarteDebloquee) => {
    surCarteDebloquee(donnees);
    void actualiserDonneesTempsReel();
  }, [actualiserDonneesTempsReel, surCarteDebloquee]);

  const surTirageMisAJour = useCallback(() => {
    void actualiserDonneesTempsReel();
  }, [actualiserDonneesTempsReel]);

  useEffect(() => {
    if (!sessionChargee) {
      return;
    }
    const socket = connecterTempsReel();
    socket.on(EVENEMENT_POINTS_MIS_A_JOUR, surPointsEtSectionsMisAJour);
    socket.on(EVENEMENT_STREAK_MIS_A_JOUR, surStreakEtSectionsMisAJour);
    socket.on(EVENEMENT_CARTE_DEBLOQUEE, surCarteEtSectionsMisAJour);
    socket.on(EVENEMENT_TIRAGE_STATUT, surTirageMisAJour);
    socket.on(EVENEMENT_RESULTAT_TIRAGE, surTirageMisAJour);

    return () => {
      socket.disconnect();
    };
  }, [sessionChargee, surPointsEtSectionsMisAJour, surStreakEtSectionsMisAJour, surCarteEtSectionsMisAJour, surTirageMisAJour]);

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

  if (!profil) {
    return <EtatChargementDashboard titre={t.loading} description={langue === "en" ? "Preparing your points, rewards and activity." : "Préparation de tes points, récompenses et activités."} />;
  }

  return (
    <motion.div
      className="skuup-dashboard-content skuup-viewer-v3-content"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
    >
      <div className="skuup-viewer-v3-overview-shell">
        <header className="skuup-viewer-v3-hero" aria-labelledby="viewer-dashboard-title">
          <div className="skuup-viewer-v3-hero-copy">
            <p className="skuup-kicker">{t.kicker}</p>
            <h1 id="viewer-dashboard-title">{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="skuup-viewer-v3-hero-mark" aria-hidden="true"><img src="/branding/skkup-s-favicon.png" alt="" /></div>
        </header>
        <motion.div className="skuup-viewer-v3-kpis" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.08, duration: 0.3 }}>
          <BandeauStats embedded statistiques={[
            { valeur: `${profil.soldePoints}`, libelle: t.points, imageSrc: "/branding/generated/skkup-icon-points.png", progression: { valeur: profil.soldePoints, objectif: Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100), libelle: t.balance } },
            { valeur: `${profil.streakActuel} j`, libelle: t.streak, imageSrc: "/branding/generated/skkup-icon-streak.png", progression: { valeur: profil.streakActuel, objectif: prochainPalierStreak(profil.streakActuel), libelle: t.tier(prochainPalierStreak(profil.streakActuel)) } },
            { valeur: tickets === null ? "…" : `${tickets.total}`, libelle: t.tickets, imageSrc: "/branding/generated/skkup-icon-ticket-s.png", activite: true },
          ]} />
        </motion.div>
      </div>

      {messageAction && <p role="status" className="text-sm text-accent-cta">{messageAction}</p>}

      <motion.div className="skuup-viewer-v3-rewards-grid" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.35 }}>
        <SectionCartesAGratter
          cartes={cartes ?? []}
          chargement={cartes === null}
          erreur={erreursSections.cartes}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => setCleRechargement((cle) => cle + 1)}
          actionEnCours={actionEnCours}
          surGratter={gratter}
        />
        <SectionLoterieEnCours tirage={tirageEnCours} tickets={tickets ?? { tickets: [], page: 1, limit: TAILLE_PAGE, total: 0, totalPages: 1 }} ticketsChargement={tickets === null} ticketsErreur={erreursSections.tickets ?? erreurPaginationTickets} ticketsPage={pageTickets} surChangementPageTickets={setPageTickets} ticketsDisponibles={tickets?.total ?? null} message={messageTirage} inscriptionEnCours={inscriptionEnCours} surInscription={() => void participerALaLoterie()} />
      </motion.div>

      <motion.div id="history" className="skuup-viewer-v3-history-grid skuup-viewer-v3-history-grid-full" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.26, duration: 0.35 }}>
        <SectionHistoriquePoints
          historique={historique ?? { transactions: [], page: 1, limit: TAILLE_PAGE, total: 0, totalPages: 1 }}
          chargement={historique === null}
          erreur={erreursSections.historique}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => erreursSections.historique ? setCleRechargement((cle) => cle + 1) : setClePagination((cle) => cle + 1)}
        />

      </motion.div>

    </motion.div>
  );
}

function SectionLoterieEnCours({ tirage, tickets, ticketsChargement, ticketsErreur, ticketsPage, surChangementPageTickets, ticketsDisponibles, message, inscriptionEnCours, surInscription }: { tirage: TiragePublic | null; tickets: TicketsTirage; ticketsChargement: boolean; ticketsErreur?: string; ticketsPage: number; surChangementPageTickets: (page: number) => void; ticketsDisponibles: number | null; message: string | null; inscriptionEnCours: boolean; surInscription: () => void }) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  return (
    <CarteGlow className="skuup-dashboard-panel skuup-viewer-v3-draws-panel border-accent-violet-light/40" aria-labelledby="dashboard-raffle-title">
      <div className="skuup-viewer-v3-section-heading">
        <div><p className="skuup-kicker">{t.raffle}</p><h2 id="dashboard-raffle-title" className="mt-1 text-xl font-bold text-foreground">{tirage?.titre ?? t.noRaffle}</h2><p className="skuup-viewer-v3-section-subtitle">{t.raffleDescription}</p></div>
      </div>
      {tirage ? <>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{tirage.description}</p>
        <div className="skuup-dashboard-raffle-lots" aria-label={t.raffleLots}>{tirage.lots.map((lot) => <RaffleLot key={lot.id} lot={lot} />)}</div>
        <p className="mt-2 text-xs text-foreground-muted">{tirage.lots.length} lot(s) · {t.drawDate} {new Date(tirage.dateTirage).toLocaleDateString(langue === "en" ? "en-US" : "fr-FR")} · {ticketsDisponibles === null ? t.unavailableTickets : t.availableTickets(ticketsDisponibles)}</p>
        <BoutonCTA className="mt-5" onClick={surInscription} disabled={inscriptionEnCours}>{inscriptionEnCours ? t.registering : t.register}</BoutonCTA>
      </> : <p className="mt-2 text-sm text-foreground-muted">{message ?? (langue === "en" ? "Check back soon for the next raffle." : "La prochaine loterie sera bientôt annoncée.")}</p>}
      {message && tirage && <p role="status" className="mt-3 text-sm text-accent-cta">{message}</p>}
      <div className="skuup-dashboard-raffle-tickets">
        <div className="skuup-viewer-v3-section-heading"><div><p className="skuup-kicker">{t.drawsAndTickets}</p><h3 className="mt-1 text-lg font-bold text-foreground">{t.tickets}</h3></div></div>
        {ticketsChargement && <p role="status" aria-live="polite" className="mt-2 text-sm text-foreground-muted">{t.loadingTickets}</p>}
        {ticketsErreur && <p role="alert" className="mt-2 text-sm text-red-200">{ticketsErreur}</p>}
        {tickets.tickets.length === 0 && !ticketsChargement && !ticketsErreur ? <div className="skuup-viewer-v3-empty-panel" role="status"><span className="skuup-viewer-v3-empty-icon" aria-hidden="true"><SkkupIcon name="ticket" size={22} /></span><div><strong>{t.noTickets}</strong><p>{t.noTicketsDescription}</p></div></div> : <ul className="mt-4 flex flex-col divide-y divide-accent-violet-light/20">{tickets.tickets.map((ticket) => <li key={ticket.ticketId} className="flex flex-col gap-1 py-3 text-sm"><div className="flex items-center justify-between"><span className="font-semibold text-foreground">{ticket.raffleTitre}</span><span className="text-xs text-foreground-muted">{t.drawStatusLabels[ticket.raffleStatut]}</span></div>{ticket.gagnant && ticket.lot && <span className="text-sm font-semibold text-accent-cta">{t.won} : {ticket.lot.nom}</span>}</li>)}</ul>}
        <Pagination page={ticketsPage} totalPages={tickets.totalPages} surChangementPage={surChangementPageTickets} />
      </div>
    </CarteGlow>
  );
}

function RaffleLot({ lot }: { lot: TiragePublic["lots"][number] }) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  const [imageIndisponible, setImageIndisponible] = useState(!lot.imageUrl);
  return <article className="skuup-dashboard-raffle-lot">
    <div className="skuup-dashboard-raffle-lot-art" aria-hidden={imageIndisponible}>
      {!imageIndisponible && <img src={lot.imageUrl ?? undefined} alt={t.prizeIllustration(lot.nom)} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageIndisponible(true)} />}
      {imageIndisponible && <SkkupIcon name="gift" size={24} />}
    </div>
    <div><strong>{lot.nom}</strong><span>{lot.quantite} {lot.quantite > 1 ? t.availablePlural : t.availableSingular} · {lot.valeurEstimee}</span></div>
  </article>;
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionCartesAGratter({ cartes, chargement, erreur, libelleReessai, surReessai, actionEnCours, surGratter }: { cartes: CarteAGratter[]; chargement: boolean; erreur?: string; libelleReessai: string; surReessai: () => void; actionEnCours: string | null; surGratter: (carte: CarteAGratter) => void }) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  return (
    <CarteGlow className="skuup-dashboard-panel skuup-viewer-v3-scratch-panel">
      <div className="skuup-viewer-v3-section-heading">
        <div>
          <p className="skuup-kicker">{t.rewards}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{t.scratch}</h2>
          <p className="skuup-viewer-v3-section-subtitle">{t.scratchDescription(cartes.filter((carte) => !carte.grattee).length, cartes.filter((carte) => carte.grattee).length)}</p>
        </div>
      </div>
      {chargement && <p role="status" aria-live="polite" className="mt-5 text-sm text-foreground-muted">{t.loadingCards}</p>}
      {erreur && (
        <div className="mt-4 grid gap-3">
          <p role="alert" className="text-sm text-red-200">{erreur}</p>
          <button className="skuup-button skuup-button-outline w-fit px-3 py-2 text-xs" type="button" onClick={surReessai}>
            {libelleReessai}
          </button>
        </div>
      )}
      {cartes.length === 0 && !chargement && !erreur ? (
        <div className="skuup-viewer-v3-empty-feature mt-5">
          <SkkupIcon name="gift" size={30} aria-hidden="true" />
          <div>
            <strong>{t.noCards}</strong>
            <p>{t.noCardsDescription}</p>
          </div>
        </div>
      ) : (
        <ul className="skuup-viewer-v3-scratch-grid mt-5">
          {cartes.slice(0, 3).map((carte) => (
            <li
              key={carte.id}
              className={`skuup-dashboard-scratch skuup-scratch-card ${carte.grattee ? "is-used" : ""}`}
            >
              <span className={`skuup-scratch-art w-full ${carte.gainType === "TICKET" ? "is-ticket" : carte.streakPalier > 0 ? "is-streak" : "is-classic"} ${carte.grattee ? "is-used" : ""}`} aria-hidden="true">
                <SkkupIcon name={carte.grattee ? "check" : carte.gainType === "TICKET" ? "ticket" : "scratchCard"} size={26} />
              </span>
              <span className="skuup-viewer-v3-scratch-title">
                Palier {carte.streakPalier} j
              </span>
              <span className="skuup-viewer-v3-scratch-reward">
                {carte.gainType === "TICKET" ? t.ticket : carte.gainMontant !== null ? `${carte.gainMontant} points` : t.scratchGain}
              </span>
              {carte.grattee ? <span className="skuup-badge">{t.used}</span> : <button className="skuup-button skuup-button-outline mt-2 px-3 py-1 text-xs" type="button" onClick={() => surGratter(carte)} disabled={Boolean(actionEnCours)}>{actionEnCours === carte.id ? t.opening : t.scratchAction}</button>}
            </li>
          ))}
        </ul>
      )}
    </CarteGlow>
  );
}

function SectionHistoriquePoints({
  historique,
  chargement,
  erreur,
  libelleReessai,
  surReessai,
}: {
  historique: HistoriquePoints;
  chargement: boolean;
  erreur?: string;
  libelleReessai: string;
  surReessai: () => void;
}) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <div className="skuup-viewer-v3-activity-heading"><div><p className="skuup-kicker">{t.activity}</p><h2 className="mt-1 text-xl font-bold text-foreground">{t.history}</h2></div></div>
      {chargement && <p role="status" aria-live="polite" className="mt-2 text-sm text-foreground-muted">{t.loadingHistory}</p>}
      {erreur && (
        <div className="mt-2 grid gap-3">
          <p role="alert" className="text-sm text-red-200">{erreur}</p>
          <button className="skuup-button skuup-button-outline w-fit px-3 py-2 text-xs" type="button" onClick={surReessai}>
            {libelleReessai}
          </button>
        </div>
      )}
      {historique.transactions.length === 0 && !chargement && !erreur ? (
        <div className="skuup-viewer-v3-empty-panel" role="status">
          <span className="skuup-viewer-v3-empty-icon" aria-hidden="true"><SkkupIcon name="spark" size={22} /></span>
          <div><strong>{t.noTransactions}</strong><p>{t.noTransactionsDescription}</p></div>
          <a className="skuup-button skuup-button-outline" href="/dashboard/extension">{t.pairExtension}</a>
        </div>
      ) : (
        <ul className="skuup-viewer-v3-activity-list mt-4">
          {historique.transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="skuup-viewer-v3-activity-item"
            >
              <span className="skuup-viewer-v3-activity-icon" aria-hidden="true"><SkkupIcon name={iconeTransaction(transaction.type)} size={18} /></span>
              <span className="skuup-viewer-v3-activity-copy"><strong>{t.transactionLabels[transaction.type]}</strong><small>{new Date(transaction.createdAt).toLocaleDateString(langue === "en" ? "en-GB" : "fr-FR")} · {t.sessionMissing}</small></span>
              <span
                className={`font-semibold ${
                  transaction.montant >= 0 ? "text-accent-cta" : "text-red-300"
                }`}
              >
                <img className="skuup-activity-coin" src="/branding/generated/skkup-icon-points.png" alt="" aria-hidden="true" data-icon="points" />
                {transaction.montant >= 0 ? "+" : ""}
                {transaction.montant}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CarteGlow>
  );
}

function iconeTransaction(type: TypeTransactionPoints): "points" | "eye" | "scratchCard" | "admin" | "dailyVisit" {
  switch (type) {
      case "VISITE_QUOTIDIENNE": return "dailyVisit";
    case "WATCH_TIME": return "eye";
    case "CARTE_A_GRATTER": return "scratchCard";
    case "AJUSTEMENT_ADMIN": return "admin";
    default: return "points";
  }
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
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
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
        {t.previous}
      </BoutonCTA>
      <span className="text-xs text-foreground-muted">
        {t.page(page, totalPages)}
      </span>
      <BoutonCTA
        variante="secondaire"
        className="px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => surChangementPage(page + 1)}
      >
        {t.next}
      </BoutonCTA>
    </div>
  );
}
