"use client";

/* Reward media URLs come from backend contracts and may be remote. */
/* eslint-disable @next/next/no-img-element */

import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useCallback, useEffect, useRef, useState } from "react";
import { publierNotificationDashboard } from "@/lib/dashboard-notifications";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BandeauStats } from "@/components/ui/BandeauStats";
import { EtatChargementDashboard } from "@/components/dashboard/EtatChargementDashboard";
import { ScratchCardModal } from "@/components/dashboard/ScratchCardModal";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import {
  libellesStatutTirage,
  libellesTypeTransaction,
  prochainPalierStreak,
  recupererCartesAGratter,
  preparerCarteAGratter,
  gratterCarte,
  enregistrerVisiteQuotidienne,
  recupererProfil,
  recupererResumeDashboard,
  recupererTicketsTirage,
  recupererTiragesPublics,
  inscrireTirage,
  type CarteAGratter,
  type Profil,
  type ResumeDashboard,
  type TypeTransactionPoints,
  type TicketsTirage,
  type TiragePublic,
} from "@/lib/dashboard";
import { dispositionIllustrationCarteParPalier, illustrationCarteParPalier, libelleGainCarte } from "@/lib/scratch-card-reward";
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
type ErreursSections = { historique?: string; cartes?: string; tickets?: string };
type ActiviteRecente = ResumeDashboard["transactionsRecentes"][number];

const dashboardCopy = {
  fr: {
    loading: "Chargement du tableau de bord", kicker: "Espace viewer", title: "Ton espace de progression", subtitle: "Retrouve tes points, ta série de visites et tes récompenses dans un seul espace.",
    points: "Points disponibles", balance: "Solde de points", streak: "Série actuelle", tier: (value: number) => `Palier : ${value} jours`, tickets: "Tickets de tirage",
    raffle: "Prochain tirage", drawsAndTickets: "Tirage et tickets", noRaffle: "Aucun tirage ouvert", raffleLots: "Lots du tirage", prizeIllustration: (name: string) => `Illustration du lot ${name}`, availableSingular: "disponible", availablePlural: "disponibles", currentParticipation: (count: number) => count === 0 ? "Pas encore inscrit" : `${count} ticket${count > 1 ? "s" : ""} pour ce tirage`, drawLotCount: (count: number) => `${count} lot${count > 1 ? "s" : ""}`, allLots: (count: number) => `Voir les ${count} lots`, register: "S’inscrire", registering: "Inscription...", currentRaffleError: "Le tirage en cours est temporairement indisponible.",
    extension: "Extension à associer", manageExtension: "Gérer l’extension", extensionDescription: "L’état de connexion n’est pas disponible depuis le site. Associe ton navigateur pour commencer.", extensionBenefits: ["Détection des streams après association", "Comptabilisation du temps de visionnage validé", "Gain de points selon les règles du service"], viewingSummary: "Résumé du visionnage", notAvailable: "Non disponible", validatedTime: "Temps validé", sessions: "Sessions", lastVisit: "Dernière visite", dailyVisit: "La visite quotidienne est validée automatiquement à la connexion.", liveNote: "Statut live et spectateurs non fournis par le contrat streams.",
    rewards: "Récompenses", scratch: "Cartes à gratter", allCards: "Voir toutes les cartes", loadingCards: "Chargement des cartes…", noCards: "Aucune carte disponible pour l’instant.", noCardsDescription: "Continue ta série de visites pour en débloquer ou consulte les récompenses déjà publiées.", rewardsLink: "Voir les récompenses", ticket: "Ticket de tirage", used: "Déjà utilisée", scratchAction: "Gratter la carte", opening: "Ouverture…",
    activity: "Activité récente", allActivity: "Voir tout", loadingHistory: "Chargement de l’activité…", noTransactions: "Aucune activité pour l’instant.", noTransactionsDescription: "Les activités apparaîtront ici dès que ton compte aura des événements à afficher.", noPointsActivity: "0 point", noPointsActivityLabel: "0 point, aucun point crédité", sessionDetails: (platform: string, duration: string) => `${platform} · ${duration} validées`, pairExtension: "Associer l’extension", sessionMissing: "Session non fournie", participations: "Tes participations", loadingTickets: "Chargement des tickets…", noTickets: "Aucun ticket obtenu pour l’instant.", noTicketsDescription: "Les tickets gagnés pendant tes parcours seront regroupés ici.", chromeExtension: "Skkup pour Chrome", drawDate: "Tirage le", won: "Gagné", transactionLabels: libellesTypeTransaction, drawStatusLabels: libellesStatutTirage, previous: "Précédent", next: "Suivant", page: (current: number, total: number) => `Page ${current} / ${total}`,
  },
  en: {
    loading: "Loading dashboard", kicker: "Viewer space", title: "Your progress space", subtitle: "Review your points, viewing streak and rewards in one place.",
    points: "Available points", balance: "Points balance", streak: "Current streak", tier: (value: number) => `Tier: ${value} days`, tickets: "Draw tickets",
    raffle: "Next draw", drawsAndTickets: "Draw and tickets", noRaffle: "No draw currently open", raffleLots: "Draw prizes", prizeIllustration: (name: string) => `Illustration of prize ${name}`, availableSingular: "available", availablePlural: "available", currentParticipation: (count: number) => count === 0 ? "Not entered yet" : `${count} ticket${count === 1 ? "" : "s"} in this draw`, drawLotCount: (count: number) => `${count} prize${count === 1 ? "" : "s"}`, allLots: (count: number) => `See all ${count} prizes`, register: "Enter draw", registering: "Registering...", currentRaffleError: "The current draw is temporarily unavailable.",
    extension: "Extension to pair", manageExtension: "Manage extension", extensionDescription: "The connection state is not available from the website. Pair your browser to get started.", extensionBenefits: ["Stream detection after pairing", "Validated viewing time tracking", "Points earned according to the service rules"], viewingSummary: "Viewing summary", notAvailable: "Not available", validatedTime: "Validated time", sessions: "Sessions", lastVisit: "Last visit", dailyVisit: "Daily visit is confirmed automatically when you sign in.", liveNote: "Live status and viewer counts are not provided by the streams contract.",
    rewards: "Rewards", scratch: "Scratch cards", allCards: "View all cards", loadingCards: "Loading scratch cards…", noCards: "No cards available yet.", noCardsDescription: "Keep your viewing streak going to unlock more, or browse published rewards.", rewardsLink: "View rewards", ticket: "Draw ticket", used: "Already used", scratchAction: "Scratch card", opening: "Opening…",
    activity: "Recent activity", allActivity: "View all", loadingHistory: "Loading activity…", noTransactions: "No activity yet.", noTransactionsDescription: "Activity will appear here once your account has events to show.", noPointsActivity: "0 points", noPointsActivityLabel: "0 points, no points credited", sessionDetails: (platform: string, duration: string) => `${platform} · ${duration} validated`, pairExtension: "Pair the extension", sessionMissing: "Session not provided", participations: "Your entries", loadingTickets: "Loading tickets…", noTickets: "No tickets yet.", noTicketsDescription: "Tickets earned during your activity will be listed here.", chromeExtension: "Skkup pour Chrome", drawDate: "Draw date", won: "Won", transactionLabels: { VISITE_QUOTIDIENNE: "Daily visit", WATCH_TIME: "Viewing time", CARTE_A_GRATTER: "Scratch card", AJUSTEMENT_ADMIN: "Admin adjustment" }, drawStatusLabels: { OUVERT: "Open", CLOTURE: "Closed", TIRE: "Result published" }, previous: "Previous", next: "Next", page: (current: number, total: number) => `Page ${current} / ${total}`,
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
  const [activitesRecentes, setActivitesRecentes] = useState<ActiviteRecente[] | null>(null);
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [tirageEnCours, setTirageEnCours] = useState<TiragePublic | null>(null);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(false);
  const [messageTirage, setMessageTirage] = useState<string | null>(null);
  const [erreursSections, setErreursSections] = useState<ErreursSections>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [cleRechargement, setCleRechargement] = useState(0);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [carteEnGrattage, setCarteEnGrattage] = useState<CarteAGratter | null>(null);
  const [erreurActionCarte, setErreurActionCarte] = useState<{ carteId: string; message: string } | null>(null);
  const visiteAutomatiqueLancee = useRef(false);
  const sessionChargee = profil !== null;

  const enregistrerVisite = useCallback(async () => {
    if (actionEnCours) return;
    setActionEnCours("checkin");
    try {
      const resultat = await enregistrerVisiteQuotidienne();
      const profilActualise = await recupererProfil();
      setProfil({ ...profilActualise, soldePoints: resultat.soldePoints, streakActuel: resultat.streakActuel, streakMax: resultat.streakMax });
      if (resultat.carteDebloquee) setCartes((actuelles) => [...(actuelles ?? []), resultat.carteDebloquee as CarteAGratter]);
      const resumeActualise = await recupererResumeDashboard();
      setActivitesRecentes(resumeActualise.transactionsRecentes);
      publierNotificationDashboard(langue === "en" ? "Visit confirmed" : "Visite confirmée", langue === "en" ? `Daily visit confirmed: +${resultat.pointsCredites} points.` : `Visite confirmée : +${resultat.pointsCredites} points.`);
    } catch (exception) {
      publierNotificationDashboard(langue === "en" ? "Daily visit" : "Visite quotidienne", exception instanceof ErreurApi && exception.statut === 409 ? langue === "en" ? "Today's visit is already confirmed." : "La visite du jour est déjà confirmée." : langue === "en" ? "The daily visit is temporarily unavailable." : "La visite quotidienne est temporairement indisponible.");
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
      recupererResumeDashboard(),
      recupererCartesAGratter(),
      recupererTicketsTirage(1, TAILLE_PAGE),
    ])
      .then(([resumeResultat, cartesResultat, ticketsResultat]) => {
        if (annule) return;
        const erreurs: ErreursSections = {};
        if (resumeResultat.status === "fulfilled") {
          setActivitesRecentes(resumeResultat.value.transactionsRecentes);
        } else {
          setActivitesRecentes([]);
          erreurs.historique = langue === "en" ? "Recent activity is temporarily unavailable." : "L’activité récente est temporairement indisponible.";
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
      publierNotificationDashboard(langue === "en" ? "Draw registration" : "Inscription au tirage", langue === "en" ? "Your entry has been recorded." : "Ton inscription est enregistrée.");
      setTirageEnCours(null);
      const [ticketsActualises, resumeActualise] = await Promise.all([
        recupererTicketsTirage(1, TAILLE_PAGE),
        recupererResumeDashboard(),
      ]);
      setTickets(ticketsActualises);
      setActivitesRecentes(resumeActualise.transactionsRecentes);
    } catch (exception) {
      if (exception instanceof ErreurApi && exception.statut === 409) {
        publierNotificationDashboard(langue === "en" ? "Draw registration" : "Inscription au tirage", langue === "en" ? "You are already registered for this draw." : "Tu es déjà inscrit à ce tirage.");
      } else {
        setMessageTirage(langue === "en" ? "Registration is temporarily unavailable." : "L’inscription est temporairement indisponible.");
      }
    } finally {
      setInscriptionEnCours(false);
    }
  }

  async function preparerGrattage(carte: CarteAGratter): Promise<string> {
    const resultat = await preparerCarteAGratter(carte.id);
    return libelleGainCarte(resultat.carte, langue === "en");
  }

  async function gratter(carte: CarteAGratter): Promise<string> {
    if (actionEnCours) throw new Error(langue === "en" ? "Another action is in progress." : "Une autre action est en cours.");
    setActionEnCours(carte.id);
    setErreurActionCarte(null);
    try {
      const resultat = await gratterCarte(carte.id);
      setCartes((actuelles) => (actuelles ?? []).filter((item) => item.id !== carte.id));
      const libelleGain = libelleGainCarte(resultat.carte, langue === "en");
      publierNotificationDashboard(langue === "en" ? "Scratch card" : "Carte à gratter", libelleGain);
      if (resultat.carte.gainMontant) setProfil((actuel) => actuel ? { ...actuel, soldePoints: actuel.soldePoints + resultat.carte.gainMontant! } : actuel);
      const [ticketsActualises, resumeActualise] = await Promise.all([
        recupererTicketsTirage(1, TAILLE_PAGE),
        recupererResumeDashboard(),
      ]);
      setTickets(ticketsActualises);
      setActivitesRecentes(resumeActualise.transactionsRecentes);
      return libelleGain;
    } catch (exception) {
      const message = exception instanceof ErreurApi ? exception.message : langue === "en" ? "Scratch card unavailable." : "Carte à gratter indisponible.";
      setErreurActionCarte({
        carteId: carte.id,
        message,
      });
      throw new Error(message);
    } finally {
      setActionEnCours(null);
    }
  }

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
    const [profilResultat, resumeResultat, cartesResultat, ticketsResultat, tiragesResultat] = await Promise.allSettled([
      recupererProfil(),
      recupererResumeDashboard(),
      recupererCartesAGratter(),
      recupererTicketsTirage(1, TAILLE_PAGE),
      recupererTiragesPublics(),
    ]);
    if (profilResultat.status === "fulfilled") setProfil(profilResultat.value);
    if (resumeResultat.status === "fulfilled") setActivitesRecentes(resumeResultat.value.transactionsRecentes);
    if (cartesResultat.status === "fulfilled") setCartes(cartesResultat.value);
    if (ticketsResultat.status === "fulfilled") setTickets(ticketsResultat.value);
    if (tiragesResultat.status === "fulfilled") {
      setTirageEnCours(tiragesResultat.value.find((tirage) => tirage.statut === "OUVERT") ?? null);
    }
  }, []);

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
      <div className="skuup-dashboard-overview-surface skuup-viewer-v3-overview-shell">
        <header className="skuup-dashboard-page-header skuup-viewer-v3-hero" aria-labelledby="viewer-dashboard-title">
          <div className="skuup-viewer-v3-hero-copy">
            <p className="skuup-kicker">{t.kicker}</p>
            <h1 id="viewer-dashboard-title">{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="skuup-viewer-v3-hero-mark" aria-hidden="true"><img src="/assets/brand/marks/skkup-s-favicon.png" alt="" /></div>
        </header>
        <motion.div className="skuup-dashboard-overview-kpis skuup-viewer-v3-kpis" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.08, duration: 0.3 }}>
          <BandeauStats embedded statistiques={[
            { valeur: `${profil.soldePoints}`, libelle: t.points, icone: "points", progression: { valeur: profil.soldePoints, objectif: Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100), libelle: t.balance } },
            { valeur: `${profil.streakActuel} j`, libelle: t.streak, icone: "flame", progression: { valeur: profil.streakActuel, objectif: prochainPalierStreak(profil.streakActuel), libelle: t.tier(prochainPalierStreak(profil.streakActuel)) } },
            { valeur: tickets === null ? "…" : `${tickets.total}`, libelle: t.tickets, icone: "ticket", activite: true },
          ]} />
        </motion.div>
      </div>

      <motion.div className="skuup-viewer-v3-rewards-grid" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.35 }}>
        <SectionCartesAGratter
          cartes={(cartes ?? []).filter((carte) => !carte.grattee).slice(0, 3)}
          chargement={cartes === null}
          erreur={erreursSections.cartes}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => setCleRechargement((cle) => cle + 1)}
          actionEnCours={actionEnCours}
          erreurAction={erreurActionCarte}
          surGratter={setCarteEnGrattage}
        />
        <SectionLoterieEnCours tirage={tirageEnCours} ticketsChargement={tickets === null} ticketsErreur={erreursSections.tickets} message={messageTirage} inscriptionEnCours={inscriptionEnCours} surInscription={() => void participerALaLoterie()} />
      </motion.div>

      <motion.div id="history" className="skuup-viewer-v3-history-grid skuup-viewer-v3-history-grid-full" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.26, duration: 0.35 }}>
        <SectionHistoriquePoints
          activites={activitesRecentes ?? []}
          chargement={activitesRecentes === null}
          erreur={erreursSections.historique}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => setCleRechargement((cle) => cle + 1)}
        />

      </motion.div>

      {carteEnGrattage && <ScratchCardModal card={carteEnGrattage} english={langue === "en"} artwork={illustrationCarteParPalier(carteEnGrattage.streakPalier)} onClose={() => setCarteEnGrattage(null)} onPrepare={() => preparerGrattage(carteEnGrattage)} onReveal={() => gratter(carteEnGrattage)} />}
    </motion.div>
  );
}

function SectionLoterieEnCours({ tirage, ticketsChargement, ticketsErreur, message, inscriptionEnCours, surInscription }: { tirage: TiragePublic | null; ticketsChargement: boolean; ticketsErreur?: string; message: string | null; inscriptionEnCours: boolean; surInscription: () => void }) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  const lotsVisibles = tirage?.lots.slice(0, 2) ?? [];
  const lotsRestants = Math.max(0, (tirage?.lots.length ?? 0) - lotsVisibles.length);
  return (
    <CarteGlow className="skuup-dashboard-panel skuup-viewer-v3-draws-panel border-accent-violet-light/40" aria-labelledby="dashboard-raffle-title">
      <div className="skuup-viewer-v3-section-heading skuup-viewer-v3-draws-heading">
        <div><p className="skuup-kicker">{t.raffle}</p><h2 id="dashboard-raffle-title" className="mt-1 text-xl font-bold text-foreground">{tirage?.titre ?? t.noRaffle}</h2></div>
      </div>
      {tirage ? <>
        <div className="skuup-dashboard-raffle-lots skuup-dashboard-raffle-lots-compact" aria-label={t.raffleLots}>{lotsVisibles.map((lot) => <RaffleLot key={lot.id} lot={lot} />)}{lotsRestants > 0 && <a className="skuup-dashboard-raffle-more" href="/dashboard/tirages">{t.allLots(tirage.lots.length)}</a>}</div>
        <div className="skuup-dashboard-draw-summary">
          <button className="skuup-button skuup-button-outline skuup-dashboard-draw-cta" type="button" onClick={surInscription} disabled={inscriptionEnCours}>{inscriptionEnCours ? t.registering : t.register}</button>
        </div>
      </> : <p className="mt-2 text-sm text-foreground-muted">{message ?? (langue === "en" ? "Check back soon for the next raffle." : "La prochaine loterie sera bientôt annoncée.")}</p>}
      {message && tirage && <p role="status" className="mt-3 text-sm text-accent-cta">{message}</p>}
      {ticketsChargement && <p role="status" aria-live="polite" className="mt-2 text-sm text-foreground-muted">{t.loadingTickets}</p>}
      {ticketsErreur && <p role="alert" className="mt-2 text-sm text-red-200">{ticketsErreur}</p>}
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

function SectionCartesAGratter({ cartes, chargement, erreur, libelleReessai, surReessai, actionEnCours, erreurAction, surGratter }: { cartes: CarteAGratter[]; chargement: boolean; erreur?: string; libelleReessai: string; surReessai: () => void; actionEnCours: string | null; erreurAction: { carteId: string; message: string } | null; surGratter: (carte: CarteAGratter) => void }) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  return (
    <CarteGlow className="skuup-dashboard-panel skuup-viewer-v3-scratch-panel">
      <div className="skuup-viewer-v3-section-heading">
        <div>
          <p className="skuup-kicker">{t.rewards}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{t.scratch}</h2>
        </div>
      </div>
      <ul className="skuup-viewer-v3-scratch-grid mt-5" aria-label={t.scratch} tabIndex={0}>
        {cartes.length === 0 ? (
          <li className="skuup-viewer-v3-empty-feature skuup-viewer-v3-scratch-empty" role={chargement ? "status" : erreur ? "alert" : "note"}>
            <SkkupIcon name="scratchCard" size={52} aria-hidden="true" />
            <div>
              <strong>{chargement ? t.loadingCards : erreur || t.noCards}</strong>
              <p>{chargement ? "" : erreur ? libelleReessai : t.noCardsDescription}</p>
              {erreur && !chargement && <button className="skuup-button skuup-button-outline mt-2 px-3 py-1 text-xs" type="button" onClick={surReessai}>{libelleReessai}</button>}
            </div>
          </li>
        ) : (
          cartes.map((carte) => {
            const dispositionIllustration = dispositionIllustrationCarteParPalier(carte.streakPalier);
            return (
              <li
                key={carte.id}
                className={`skuup-dashboard-scratch skuup-scratch-card ${carte.grattee ? "is-used" : ""} ${carte.gainType !== "TICKET" && carte.gainMontant === null ? "no-reward" : ""}`}
              >
                <span className={`skuup-scratch-art w-full ${carte.gainType === "TICKET" ? "is-ticket" : carte.streakPalier > 0 ? "is-streak" : "is-classic"} ${carte.grattee ? "is-used" : ""}`} style={{ backgroundImage: `url("${illustrationCarteParPalier(carte.streakPalier)}")`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", marginBlockEnd: `-${dispositionIllustration.decalageAlphaBasPct}%` }} aria-hidden="true">
                </span>
                <span className="skuup-viewer-v3-scratch-title">
                  Palier {carte.streakPalier} j
                </span>
                {(carte.gainType === "TICKET" || carte.gainMontant !== null) && (
                  <span className="skuup-viewer-v3-scratch-reward">
                    {carte.gainType === "TICKET" ? t.ticket : `${carte.gainMontant} points`}
                  </span>
                )}
                {carte.grattee ? <span className="skuup-badge">{t.used}</span> : <button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => surGratter(carte)} disabled={Boolean(actionEnCours)}>{actionEnCours === carte.id ? t.opening : t.scratchAction}</button>}
                {erreurAction?.carteId === carte.id && <span role="alert" className="mt-2 text-xs text-red-200">{erreurAction.message}</span>}
              </li>
            );
          })
        )}
      </ul>
    </CarteGlow>
  );
}

function SectionHistoriquePoints({
  activites,
  chargement,
  erreur,
  libelleReessai,
  surReessai,
}: {
  activites: ActiviteRecente[];
  chargement: boolean;
  erreur?: string;
  libelleReessai: string;
  surReessai: () => void;
}) {
  const { langue } = useLanguage();
  const t = dashboardCopy[langue];
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <div className="skuup-viewer-v3-activity-heading"><div><h2 id="dashboard-history-title" className="skuup-kicker">{t.activity}</h2></div></div>
      {chargement && <p role="status" aria-live="polite" className="mt-2 text-sm text-foreground-muted">{t.loadingHistory}</p>}
      {erreur && (
        <div className="mt-2 grid gap-3">
          <p role="alert" className="text-sm text-red-200">{erreur}</p>
          <button className="skuup-button skuup-button-outline w-fit px-3 py-2 text-xs" type="button" onClick={surReessai}>
            {libelleReessai}
          </button>
        </div>
      )}
      {activites.length === 0 && !chargement && !erreur ? (
        <div className="skuup-viewer-v3-empty-panel" role="status">
          <span className="skuup-viewer-v3-empty-icon" aria-hidden="true"><SkkupIcon name="draws" size={22} /></span>
          <div><strong>{t.noTransactions}</strong><p>{t.noTransactionsDescription}</p></div>
          <a className="skuup-button skuup-button-outline" href="/dashboard/extension">{t.pairExtension}</a>
        </div>
      ) : (
        <ul className="skuup-viewer-v3-activity-list mt-4" aria-labelledby="dashboard-history-title" tabIndex={0}>
          {activites.map((transaction) => (
            <li
              key={transaction.id}
              className="skuup-viewer-v3-activity-item"
            >
              <span className="skuup-viewer-v3-activity-icon" aria-hidden="true"><SkkupIcon name={iconeTransaction(transaction.type)} size={24} /></span>
              <span className="skuup-viewer-v3-activity-copy"><strong>{t.transactionLabels[transaction.type]}</strong><small>{new Date(transaction.createdAt).toLocaleDateString(langue === "en" ? "en-GB" : "fr-FR")} · {transaction.session ? t.sessionDetails(libellePlateforme(transaction.session.platform), formaterDureeValidee(transaction.session.dureeValideeSecondes, langue === "en")) : t.sessionMissing}</small></span>
              <span
                className={`skuup-viewer-v3-activity-value ${transaction.montant === 0 ? "is-neutral" : transaction.montant > 0 ? "text-accent-cta" : "text-red-300"}`}
                role="group"
                aria-label={transaction.montant === 0 ? t.noPointsActivityLabel : `${transaction.montant > 0 ? "+" : ""}${transaction.montant} points`}
              >
                <SkkupIcon name="points" size={16} className="skuup-activity-coin" data-icon="points" />
                <span>{transaction.montant === 0 ? t.noPointsActivity : `${transaction.montant > 0 ? "+" : ""}${transaction.montant}`}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </CarteGlow>
  );
}

function libellePlateforme(platform: string): string {
  switch (platform.toUpperCase()) {
    case "TWITCH": return "Twitch";
    case "YOUTUBE": return "YouTube";
    case "KICK": return "Kick";
    default: return platform;
  }
}

function formaterDureeValidee(secondes: number, anglais: boolean): string {
  if (secondes < 60) return `${secondes} ${anglais ? "sec" : "s"}`;
  const minutes = Math.floor(secondes / 60);
  const heures = Math.floor(minutes / 60);
  const minutesRestantes = minutes % 60;
  if (heures === 0) return `${minutes} min`;
  return minutesRestantes === 0
    ? `${heures} h`
    : `${heures} h ${minutesRestantes} min`;
}

function iconeTransaction(type: TypeTransactionPoints): "points" | "eye" | "scratchCard" | "check" | "shield" {
  switch (type) {
      case "VISITE_QUOTIDIENNE": return "check";
    case "WATCH_TIME": return "eye";
    case "CARTE_A_GRATTER": return "scratchCard";
    case "AJUSTEMENT_ADMIN": return "shield";
    default: return "points";
  }
}
