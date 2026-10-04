"use client";

/* Stream and reward media URLs come from backend contracts and may be remote. */
/* eslint-disable @next/next/no-img-element */

import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BandeauStats } from "@/components/ui/BandeauStats";
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
  recupererAnnoncesActives,
  recupererHistoriquePoints,
  recupererProfil,
  recupererTicketsTirage,
  recupererTiragesPublics,
  inscrireTirage,
  type CarteAGratter,
  type HistoriquePoints,
  type Profil,
  type TicketsTirage,
  type AnnoncePublique,
  type TiragePublic,
} from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { listerStreams, libellesPlateforme, miniatureStream, type Stream } from "@/lib/streams";
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
type ErreursSections = { historique?: string; cartes?: string; tickets?: string };

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

  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [annonces, setAnnonces] = useState<AnnoncePublique[] | null>(null);
  const [tirageEnCours, setTirageEnCours] = useState<TiragePublic | null>(null);
  const [streams, setStreams] = useState<Stream[] | null>(null);
  const [erreurStreams, setErreurStreams] = useState(false);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(false);
  const [messageTirage, setMessageTirage] = useState<string | null>(null);
  const [erreurAnnonces, setErreurAnnonces] = useState(false);
  const [erreursSections, setErreursSections] = useState<ErreursSections>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [cleRechargement, setCleRechargement] = useState(0);
  const [pageHistorique, setPageHistorique] = useState(1);
  const [pageTickets, setPageTickets] = useState(1);
  const [erreurPaginationHistorique, setErreurPaginationHistorique] = useState<string | undefined>();
  const [erreurPaginationTickets, setErreurPaginationTickets] = useState<string | undefined>();
  const [clePagination, setClePagination] = useState(0);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [messageAction, setMessageAction] = useState<string | null>(null);
  const sessionChargee = profil !== null;

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    let annule = false;

    recupererProfil()
      .then((profilRecu) => {
        if (!annule) setProfil(profilRecu);
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
      recupererHistoriquePoints(1, TAILLE_PAGE),
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

    recupererAnnoncesActives()
      .then((annoncesRecues) => {
        if (!annule) {
          setAnnonces(annoncesRecues);
          setErreurAnnonces(false);
        }
      })
      .catch(() => {
        if (!annule) setErreurAnnonces(true);
      });

    recupererTiragesPublics()
      .then((tirages) => {
        const ouvert = tirages.find((tirage) => tirage.statut === "OUVERT");
        if (!annule) setTirageEnCours(ouvert ?? null);
      })
      .catch(() => {
        if (!annule) setMessageTirage(langue === "en" ? "The current raffle is temporarily unavailable." : "La loterie en cours est temporairement indisponible.");
      });

    listerStreams()
      .then((streamsRecus) => {
        if (!annule) {
          setStreams(streamsRecus);
          setErreurStreams(false);
        }
      })
      .catch(() => {
        if (!annule) setErreurStreams(true);
      });

    return () => {
      annule = true;
    };
    // Chargement au montage uniquement : `router` (Next.js) est stable en
    // usage réel, l'inclure re-déclencherait l'effet à chaque rendu sans
    // rien apporter.
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
        recupererHistoriquePoints(pageHistorique, TAILLE_PAGE),
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

  async function enregistrerVisite() {
    if (actionEnCours) return;
    setActionEnCours("checkin");
    setMessageAction(null);
    try {
      const resultat = await enregistrerVisiteQuotidienne();
      const profilActualise = await recupererProfil();
      setProfil({ ...profilActualise, soldePoints: resultat.soldePoints, streakActuel: resultat.streakActuel, streakMax: resultat.streakMax });
      if (resultat.carteDebloquee) setCartes((actuelles) => [...(actuelles ?? []), resultat.carteDebloquee as CarteAGratter]);
      const historiqueActualise = await recupererHistoriquePoints(pageHistorique, TAILLE_PAGE);
      setHistorique(historiqueActualise);
      setMessageAction(langue === "en" ? `Daily visit confirmed: +${resultat.pointsCredites} points.` : `Visite confirmée : +${resultat.pointsCredites} points.`);
    } catch (exception) {
      setMessageAction(exception instanceof ErreurApi && exception.statut === 409 ? langue === "en" ? "Today's visit is already confirmed." : "La visite du jour est déjà confirmée." : langue === "en" ? "The daily visit is temporarily unavailable." : "La visite quotidienne est temporairement indisponible.");
    } finally {
      setActionEnCours(null);
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
        recupererHistoriquePoints(pageHistorique, TAILLE_PAGE),
      ]);
      setTickets(ticketsActualises);
      setHistorique(historiqueActualise);
    } catch (exception) {
      setMessageAction(exception instanceof ErreurApi ? exception.message : langue === "en" ? "Scratch card unavailable." : "Carte à gratter indisponible.");
    } finally {
      setActionEnCours(null);
    }
  }

  // ─── Pagination de l'historique de points ──────────────────────────────────

  useEffect(() => {
    if (pageHistorique === 1) {
      // La première page est déjà chargée par l'effet initial.
      return;
    }
    let annule = false;
    recupererHistoriquePoints(pageHistorique, TAILLE_PAGE).then((resultat) => {
      if (!annule) {
        setErreurPaginationHistorique(undefined);
        setHistorique(resultat);
      }
    }).catch(() => {
      if (!annule) setErreurPaginationHistorique(langue === "en" ? "Points history is temporarily unavailable." : "L’historique des points est temporairement indisponible.");
    });
    return () => {
      annule = true;
    };
  }, [pageHistorique, clePagination, langue]);

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
    setCleRechargement((cle) => cle + 1);
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

  if (!profil) {
    return (
      <section role="status" aria-live="polite" aria-busy="true" className="skuup-viewer-loading" aria-label="Chargement du tableau de bord">
        <span /><span /><span />
      </section>
    );
  }

  return (
    <motion.div
      className="skuup-dashboard-content skuup-viewer-v3-content"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div className="skuup-viewer-v3-kpis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }}>
        <BandeauStats embedded statistiques={[
          { valeur: `${profil.soldePoints}`, libelle: "Points disponibles", icone: "points", progression: { valeur: profil.soldePoints, objectif: Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100), libelle: "Solde de points" } },
          { valeur: `${profil.streakActuel} j`, libelle: "Série actuelle", icone: "flame", progression: { valeur: profil.streakActuel, objectif: prochainPalierStreak(profil.streakActuel), libelle: `Palier : ${prochainPalierStreak(profil.streakActuel)} jours` } },
          { valeur: tickets === null ? "…" : `${tickets.total}`, libelle: "Tickets de tirage", icone: "ticket", activite: true },
        ]} />
      </motion.div>

      <motion.div className="skuup-viewer-v3-main-grid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.35 }}>
        <section className="skuup-viewer-v3-feature" aria-labelledby="viewer-v3-feature-title">
          <div className="skuup-viewer-v3-feature-heading">
            <div className="skuup-viewer-v3-title-with-icon">
              <span className="skuup-viewer-v3-title-icon" aria-hidden="true"><SkkupIcon name="streams" size={24} /></span>
              <div><p className="skuup-kicker">Temps de visionnage</p><h2 id="viewer-v3-feature-title">Regarde tes streams préférés et gagne des points</h2><p className="skuup-viewer-v3-section-subtitle">Les points sont comptabilisés uniquement par l’extension Skkup.</p></div>
            </div>
            <a href="/dashboard/streams">Voir tous les streams <span aria-hidden="true">›</span></a>
          </div>
          {erreurStreams ? <div aria-live="polite" className="skuup-viewer-v3-empty-feature"><SkkupIcon name="streams" size={34} /><div><strong>Les streams sont temporairement indisponibles.</strong><p>Le catalogue réel pourra être rechargé depuis l’espace streams.</p></div><button className="skuup-button skuup-button-outline" type="button" onClick={() => setCleRechargement((cle) => cle + 1)}>Réessayer</button><a className="skuup-button skuup-button-outline" href="/dashboard/streams">Ouvrir le catalogue</a></div> : streams === null ? <p role="status" className="skuup-viewer-empty">Chargement des streams disponibles…</p> : streams.length === 0 ? <div aria-live="polite" className="skuup-viewer-v3-empty-feature"><SkkupIcon name="streams" size={34} /><div><strong>Aucun stream partenaire n’est disponible.</strong><p>Le catalogue affiche uniquement les chaînes publiées par le service.</p></div><a className="skuup-button skuup-button-outline" href="/dashboard/streams">Ouvrir le catalogue</a></div> : <StreamFeatureCard stream={streams[0]} />}
          <div className="skuup-viewer-v3-gain" role="status">
            <SkkupIcon name="spark" size={22} />
            <span>{messageAction ?? "Les points sont validés automatiquement par l’extension pendant le visionnage."}</span>
          </div>
        </section>
        <ExtensionViewerCard actionEnCours={actionEnCours} visiteDejaFaite={Boolean(profil.derniereVisiteAt && new Date(profil.derniereVisiteAt).toDateString() === new Date().toDateString())} surVisite={() => void enregistrerVisite()} />
      </motion.div>

      <motion.div className="skuup-viewer-v3-rewards-grid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
        <SectionCartesAGratter
          cartes={cartes ?? []}
          chargement={cartes === null}
          erreur={erreursSections.cartes}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => setCleRechargement((cle) => cle + 1)}
          actionEnCours={actionEnCours}
          surGratter={gratter}
        />
        <SectionLoterieEnCours tirage={tirageEnCours} message={messageTirage} inscriptionEnCours={inscriptionEnCours} surInscription={() => void participerALaLoterie()} />
      </motion.div>

      <motion.div id="history" className="skuup-viewer-v3-history-grid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.35 }}>
        <SectionHistoriquePoints
          historique={historique ?? { transactions: [], page: 1, limit: TAILLE_PAGE, total: 0, totalPages: 1 }}
          chargement={historique === null}
          erreur={erreursSections.historique ?? erreurPaginationHistorique}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => erreursSections.historique ? setCleRechargement((cle) => cle + 1) : setClePagination((cle) => cle + 1)}
          page={pageHistorique}
          surChangementPage={setPageHistorique}
        />

        <SectionTicketsTirage
          tickets={tickets ?? { tickets: [], page: 1, limit: TAILLE_PAGE, total: 0, totalPages: 1 }}
          chargement={tickets === null}
          erreur={erreursSections.tickets ?? erreurPaginationTickets}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => erreursSections.tickets ? setCleRechargement((cle) => cle + 1) : setClePagination((cle) => cle + 1)}
          page={pageTickets}
          surChangementPage={setPageTickets}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.35 }}>
        <SectionAnnonces
        annonces={annonces}
        erreur={erreurAnnonces}
        libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
        surReessai={() => setCleRechargement((cle) => cle + 1)}
        />
      </motion.div>
    </motion.div>
  );
}

function StreamFeatureCard({ stream }: { stream: Stream }) {
  const [miniatureIndisponible, setMiniatureIndisponible] = useState(false);
  // Le dashboard n'invente jamais de miniature à partir de l'identifiant de
  // chaîne : seule l'URL réellement fournie par l'API peut être affichée.
  const thumbnailUrl = miniatureStream(stream);
  const afficherMiniature = Boolean(thumbnailUrl) && !miniatureIndisponible;
  const plateforme = libellesPlateforme[stream.plateforme];
  const libelleBonus = stream.bonusPointsHeure !== undefined
    ? `+${stream.bonusPointsHeure} points / heure`
    : null;

  return (
    <article className="skuup-viewer-v3-stream-card" aria-labelledby="featured-stream-title">
      <div className="skuup-viewer-v3-stream-art relative" aria-label={afficherMiniature ? `Miniature de ${stream.nomAffiche}` : "Aucune miniature disponible"}>
        {afficherMiniature ? (
          <img
            src={thumbnailUrl ?? undefined}
            alt={`Miniature de ${stream.nomAffiche}`}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setMiniatureIndisponible(true)}
          />
        ) : (
          <div className="grid h-full place-items-center" aria-hidden="true">
            <SkkupIcon name="streams" size={52} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          <span className="skuup-viewer-live-pill">● {stream.estPartenaire ? "Partenaire" : "Sélection"}</span>
          <span className="rounded-full bg-black/55 px-3 py-1 backdrop-blur-sm">{plateforme}</span>
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-xs font-medium text-white/90">
          {stream.estPartenaire ? "Chaîne partenaire Skkup" : "Chaîne publiée sur Skkup"}
        </span>
      </div>

      <div className="skuup-viewer-v3-stream-copy">
        <div className="skuup-viewer-v3-stream-topline">
          {stream.estPartenaire && <span className="skuup-viewer-platform-label">Partenaire Skkup</span>}
        </div>
        <h3 id="featured-stream-title">{stream.nomAffiche}</h3>
        <p>Connecte ton extension pour comptabiliser automatiquement ton temps de visionnage.</p>
        <div className="skuup-viewer-platforms" aria-label="Informations du stream">
          <span>{stream.estPartenaire ? "Chaîne partenaire" : "Chaîne publique"}</span>
          {libelleBonus && <span>{libelleBonus}</span>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-foreground-muted" aria-label="Conditions de visionnage">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Extension requise</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Points selon le visionnage</span>
        </div>
      </div>

      <a className="skuup-button" href="/dashboard/streams">Regarder <span aria-hidden="true">↗</span></a>
    </article>
  );
}

function SectionLoterieEnCours({ tirage, message, inscriptionEnCours, surInscription }: { tirage: TiragePublic | null; message: string | null; inscriptionEnCours: boolean; surInscription: () => void }) {
  const { langue } = useLanguage();
  return (
    <CarteGlow className="skuup-dashboard-panel border-accent-violet-light/40" aria-labelledby="dashboard-raffle-title">
      <div className="skuup-viewer-v3-section-heading">
        <span className="skuup-viewer-v3-title-icon" aria-hidden="true"><SkkupIcon name="gift" size={24} /></span>
        <div><p className="skuup-kicker">{langue === "en" ? "Current raffle" : "Prochains tirages"}</p><h2 id="dashboard-raffle-title" className="mt-1 text-xl font-bold text-foreground">{tirage?.titre ?? (langue === "en" ? "No raffle currently open" : "Aucune loterie ouverte")}</h2><p className="skuup-viewer-v3-section-subtitle">Utilise tes tickets pour tenter de gagner ces cadeaux.</p></div>
        <a href="/dashboard/tirages" aria-label="Voir tous les tirages">›</a>
      </div>
      {tirage ? <>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{tirage.description}</p>
        <div className="skuup-dashboard-raffle-lots" aria-label="Lots du tirage">{tirage.lots.map((lot) => <RaffleLot key={lot.id} lot={lot} />)}</div>
        <p className="mt-2 text-xs text-foreground-muted">{tirage.lots.length} lot(s) · Tirage le {new Date(tirage.dateTirage).toLocaleDateString(langue === "en" ? "en-US" : "fr-FR")}</p>
        <BoutonCTA className="mt-5" onClick={surInscription} disabled={inscriptionEnCours}>{inscriptionEnCours ? (langue === "en" ? "Registering..." : "Inscription...") : langue === "en" ? "Register" : "S’inscrire"}</BoutonCTA>
      </> : <p className="mt-2 text-sm text-foreground-muted">{message ?? (langue === "en" ? "Check back soon for the next raffle." : "La prochaine loterie sera bientôt annoncée.")}</p>}
      {message && tirage && <p role="status" className="mt-3 text-sm text-accent-cta">{message}</p>}
    </CarteGlow>
  );
}

function RaffleLot({ lot }: { lot: TiragePublic["lots"][number] }) {
  const [imageIndisponible, setImageIndisponible] = useState(!lot.imageUrl);
  return <article className="skuup-dashboard-raffle-lot">
    <div className="skuup-dashboard-raffle-lot-art" aria-hidden={imageIndisponible}>
      {!imageIndisponible && <img src={lot.imageUrl ?? undefined} alt={`Illustration du lot ${lot.nom}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageIndisponible(true)} />}
      {imageIndisponible && <SkkupIcon name="gift" size={24} />}
    </div>
    <div><strong>{lot.nom}</strong><span>{lot.quantite} disponible{lot.quantite > 1 ? "s" : ""} · {lot.valeurEstimee}</span></div>
  </article>;
}

function SectionAnnonces({ annonces, erreur, libelleReessai, surReessai }: { annonces: AnnoncePublique[] | null; erreur: boolean; libelleReessai: string; surReessai: () => void }) {
  const { langue } = useLanguage();
  const [annonceSelectionnee, setAnnonceSelectionnee] = useState<AnnoncePublique | null>(null);
  const boutonFermetureRef = useRef<HTMLButtonElement>(null);
  const dernierDeclencheurRef = useRef<HTMLButtonElement>(null);
  const dialogueRef = useRef<HTMLElement>(null);
  const fermerAnnonce = () => {
    setAnnonceSelectionnee(null);
    window.requestAnimationFrame(() => dernierDeclencheurRef.current?.focus());
  };
  useEffect(() => {
    if (!annonceSelectionnee) return;
    boutonFermetureRef.current?.focus();
    const fermerAvecEchap = (event: KeyboardEvent) => {
      if (event.key === "Escape") fermerAnnonce();
      if (event.key !== "Tab") return;
      const controles = dialogueRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      );
      if (!controles?.length) return;
      const premier = controles[0];
      const dernier = controles[controles.length - 1];
      if (event.shiftKey && document.activeElement === premier) {
        event.preventDefault();
        dernier.focus();
      } else if (!event.shiftKey && document.activeElement === dernier) {
        event.preventDefault();
        premier.focus();
      }
    };
    document.addEventListener("keydown", fermerAvecEchap);
    return () => document.removeEventListener("keydown", fermerAvecEchap);
  }, [annonceSelectionnee]);
  const textes = langue === "en"
    ? { kicker: "Service news", title: "Announcements", loading: "Loading announcements...", empty: "No announcement is published right now.", error: "Announcements are temporarily unavailable." }
    : { kicker: "Actualités du service", title: "Annonces", loading: "Chargement des annonces...", empty: "Aucune annonce n’est publiée pour le moment.", error: "Les annonces sont temporairement indisponibles." };

  return (
    <CarteGlow className="skuup-dashboard-panel skuup-dashboard-announcements" aria-labelledby="dashboard-announcements-title">
      <p className="skuup-kicker">{textes.kicker}</p>
      <h2 id="dashboard-announcements-title" className="mt-1 text-xl font-bold text-foreground">{textes.title}</h2>
      {annonces === null && !erreur && <p role="status" aria-live="polite" className="mt-4 text-sm text-foreground-muted">{textes.loading}</p>}
      {erreur && (
        <div className="mt-4 grid gap-3">
          <p role="alert" className="text-sm text-red-200">{textes.error}</p>
          <button className="skuup-button skuup-button-outline w-fit px-3 py-2 text-xs" type="button" onClick={surReessai}>
            {libelleReessai}
          </button>
        </div>
      )}
      {annonces?.length === 0 && !erreur && <p className="mt-4 text-sm text-foreground-muted">{textes.empty}</p>}
      {annonces && annonces.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {annonces.map((annonce) => (
            <button
              key={annonce.id}
              type="button"
              className="w-full rounded-2xl border border-accent-violet-light/25 bg-black/10 p-4 text-left transition hover:border-accent-violet-light/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-violet-light"
              onClick={(event) => {
                dernierDeclencheurRef.current = event.currentTarget;
                setAnnonceSelectionnee(annonce);
              }}
              aria-haspopup="dialog"
            >
              <h3 className="font-semibold text-foreground">{annonce.titre}</h3>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground-muted">{annonce.texte}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-accent-cta">{langue === "en" ? "Read announcement" : "Lire l’annonce"}</span>
            </button>
          ))}
        </div>
      )}
      {annonceSelectionnee && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fermerAnnonce();
          }}
        >
          <article ref={dialogueRef} className="w-full max-w-2xl rounded-3xl border border-accent-violet-light/40 bg-background p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="announcement-dialog-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="skuup-kicker">{textes.kicker}</p>
                <h3 id="announcement-dialog-title" className="mt-1 text-2xl font-bold text-foreground">{annonceSelectionnee.titre}</h3>
              </div>
              <button ref={boutonFermetureRef} type="button" className="rounded-full px-3 py-1 text-2xl text-foreground-muted hover:text-foreground" aria-label={langue === "en" ? "Close announcement" : "Fermer l’annonce"} onClick={fermerAnnonce}>×</button>
            </div>
            <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-foreground-muted">{annonceSelectionnee.texte}</p>
          </article>
        </div>
      )}
    </CarteGlow>
  );
}

function ExtensionViewerCard({ actionEnCours, visiteDejaFaite, surVisite }: { actionEnCours: string | null; visiteDejaFaite: boolean; surVisite: () => void }) {
  return (
    <CarteGlow className="skuup-dashboard-panel skuup-viewer-v3-extension" aria-labelledby="viewer-extension-title">
      <div className="skuup-viewer-v3-section-heading">
        <span className="skuup-viewer-v3-online-dot skuup-viewer-v3-status-neutral" aria-hidden="true" />
        <h2 id="viewer-extension-title">Extension à associer</h2>
        <a href="/dashboard/extension" aria-label="Gérer l’extension">›</a>
      </div>
      <div className="skuup-viewer-v3-extension-body">
        <div className="skuup-viewer-extension-product">
          <div className="skuup-viewer-extension-orb" aria-hidden="true"><SkkupIcon name="extension" size={34} /></div>
          <div><h3>Skkup pour Chrome</h3><p>L’état de connexion n’est pas disponible depuis le site. Associe ton navigateur pour commencer.</p></div>
        </div>
        <ul className="skuup-viewer-extension-benefits">
          <li><SkkupIcon name="check" size={16} aria-hidden="true" /> Détection des streams après association</li>
          <li><SkkupIcon name="check" size={16} aria-hidden="true" /> Comptabilisation du temps de visionnage validé</li>
          <li><SkkupIcon name="check" size={16} aria-hidden="true" /> Gain de points selon les règles du service</li>
        </ul>
        <a className="skuup-button skuup-button-outline" href="/dashboard/extension">Gérer l’extension <span aria-hidden="true">›</span></a>
        <button className="skuup-button skuup-button-outline" type="button" onClick={surVisite} disabled={Boolean(actionEnCours) || visiteDejaFaite}>{actionEnCours === "checkin" ? "Validation…" : visiteDejaFaite ? "Visite déjà validée" : "Valider ma visite"}</button>
      </div>
    </CarteGlow>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionCartesAGratter({ cartes, chargement, erreur, libelleReessai, surReessai, actionEnCours, surGratter }: { cartes: CarteAGratter[]; chargement: boolean; erreur?: string; libelleReessai: string; surReessai: () => void; actionEnCours: string | null; surGratter: (carte: CarteAGratter) => void }) {
  return (
    <CarteGlow className="skuup-dashboard-panel skuup-viewer-v3-scratch-panel">
      <div className="skuup-viewer-v3-section-heading">
        <span className="skuup-viewer-v3-title-icon" aria-hidden="true"><SkkupIcon name="gift" size={24} /></span>
        <div>
          <p className="skuup-kicker">Récompenses</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Cartes à gratter</h2>
          <p className="skuup-viewer-v3-section-subtitle">Utilise tes points pour découvrir des récompenses instantanées.</p>
        </div>
        <div className="skuup-viewer-v3-section-actions"><span className="skuup-dashboard-count">{cartes.length}</span><a href="/dashboard/recompenses" aria-label="Voir toutes les cartes">›</a></div>
      </div>
      {chargement && <p role="status" aria-live="polite" className="mt-5 text-sm text-foreground-muted">Chargement des cartes…</p>}
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
            <strong>Aucune carte disponible pour l&apos;instant.</strong>
            <p>Continue ta série de visites pour en débloquer ou consulte les récompenses déjà publiées.</p>
          </div>
          <a className="skuup-button skuup-button-outline" href="/dashboard/recompenses">Voir les récompenses</a>
        </div>
      ) : (
        <ul className="skuup-viewer-v3-scratch-grid mt-5">
          {cartes.map((carte) => (
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
                {carte.gainType === "TICKET" ? "Ticket de tirage" : carte.gainMontant !== null ? `${carte.gainMontant} points` : "Gain à découvrir"}
              </span>
              {carte.grattee ? <span className="skuup-badge">Déjà utilisée</span> : <button className="skuup-button skuup-button-outline mt-2 px-3 py-1 text-xs" type="button" onClick={() => surGratter(carte)} disabled={Boolean(actionEnCours)}>{actionEnCours === carte.id ? "Ouverture…" : "Gratter la carte"}</button>}
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
  page,
  surChangementPage,
}: {
  historique: HistoriquePoints;
  chargement: boolean;
  erreur?: string;
  libelleReessai: string;
  surReessai: () => void;
  page: number;
  surChangementPage: (page: number) => void;
}) {
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <div className="skuup-viewer-v3-activity-heading"><div><p className="skuup-kicker">Activité récente</p><h2 className="mt-1 text-xl font-bold text-foreground">Historique de points</h2></div><a href="/dashboard/historique">Voir tout <span aria-hidden="true">›</span></a></div>
      {chargement && <p role="status" aria-live="polite" className="mt-2 text-sm text-foreground-muted">Chargement de l’historique…</p>}
      {erreur && (
        <div className="mt-2 grid gap-3">
          <p role="alert" className="text-sm text-red-200">{erreur}</p>
          <button className="skuup-button skuup-button-outline w-fit px-3 py-2 text-xs" type="button" onClick={surReessai}>
            {libelleReessai}
          </button>
        </div>
      )}
      {historique.transactions.length === 0 && !chargement && !erreur ? (
        <p className="mt-2 text-sm text-foreground-muted">
          Aucune transaction pour l&apos;instant.
        </p>
      ) : (
        <ul className="skuup-viewer-v3-activity-list mt-4">
          {historique.transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="skuup-viewer-v3-activity-item"
            >
              <span className="skuup-viewer-v3-activity-icon" aria-hidden="true"><SkkupIcon name={transaction.montant >= 0 ? "spark" : "check"} size={18} /></span>
              <span className="skuup-viewer-v3-activity-copy"><strong>{libellesTypeTransaction[transaction.type]}</strong><small>{new Date(transaction.createdAt).toLocaleDateString("fr-FR")}</small></span>
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
  chargement,
  erreur,
  libelleReessai,
  surReessai,
  page,
  surChangementPage,
}: {
  tickets: TicketsTirage;
  chargement: boolean;
  erreur?: string;
  libelleReessai: string;
  surReessai: () => void;
  page: number;
  surChangementPage: (page: number) => void;
}) {
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <p className="skuup-kicker">Tes participations</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">Tickets de tirage</h2>
      {chargement && <p role="status" aria-live="polite" className="mt-2 text-sm text-foreground-muted">Chargement des tickets…</p>}
      {erreur && (
        <div className="mt-2 grid gap-3">
          <p role="alert" className="text-sm text-red-200">{erreur}</p>
          <button className="skuup-button skuup-button-outline w-fit px-3 py-2 text-xs" type="button" onClick={surReessai}>
            {libelleReessai}
          </button>
        </div>
      )}
      {tickets.tickets.length === 0 && !chargement && !erreur ? (
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
