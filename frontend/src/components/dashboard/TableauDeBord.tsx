"use client";

import Image from "next/image";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";
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
      setProfil((actuel) => actuel ? { ...actuel, soldePoints: resultat.soldePoints, streakActuel: resultat.streakActuel, streakMax: resultat.streakMax, derniereVisiteAt: new Date().toISOString() } : actuel);
      if (resultat.carteDebloquee) setCartes((actuelles) => [...(actuelles ?? []), resultat.carteDebloquee as CarteAGratter]);
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
      if ((actuelles ?? []).some((carte) => carte.id === nouvelleCarte.id)) {
        return actuelles;
      }
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

  if (!profil) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-foreground-muted">
        Chargement du tableau de bord...
      </p>
    );
  }

  return (
    <div className="skuup-dashboard-content">
        <div className="flex w-full flex-col gap-6">
      <section className="skuup-dashboard-overview">
        <header className="skuup-dashboard-hero">
          <div>
            <LocalizedPageIntro page="dashboard" />
          </div>
          <div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} className="skuup-dashboard-orb-logo" priority /></div>
        </header>
        <BandeauStats
          embedded
          statistiques={[
          {
            valeur: `${profil.soldePoints}`,
            libelle: "Points cumulés",
            progression: {
              valeur: profil.soldePoints,
              objectif: Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100),
              libelle: `Prochain repère : ${Math.max(100, Math.ceil((profil.soldePoints + 1) / 100) * 100)} pts`,
            },
          },
          {
            valeur: `${profil.streakActuel} j`,
            libelle: "Série actuelle",
            progression: {
              valeur: profil.streakActuel,
              objectif: prochainPalierStreak(profil.streakActuel),
              libelle: `Prochain palier : ${prochainPalierStreak(profil.streakActuel)} j`,
            },
          },
          { valeur: `${cartes?.length ?? 0}`, libelle: "Cartes à gratter", activite: true },
          ]}
        />
      </section>

      <div className="skuup-dashboard-three-columns grid gap-6 lg:grid-cols-[minmax(13rem,0.85fr)_minmax(0,2fr)_minmax(13rem,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <CarteGlow className="skuup-dashboard-panel flex flex-col justify-between" aria-labelledby="dashboard-streak-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="skuup-kicker">Régularité</p>
                <h2 id="dashboard-streak-title" className="mt-1 text-xl font-bold text-foreground">Série de visites</h2>
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

          <SectionCartesAGratter
            cartes={cartes ?? []}
            chargement={cartes === null}
            erreur={erreursSections.cartes}
            libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
            surReessai={() => setCleRechargement((cle) => cle + 1)}
            actionEnCours={actionEnCours}
            surGratter={gratter}
          />
        </div>

        <SectionAnnonces
          annonces={annonces}
          erreur={erreurAnnonces}
          libelleReessai={langue === "en" ? "Retry" : "Réessayer"}
          surReessai={() => setCleRechargement((cle) => cle + 1)}
        />

        <SectionLoterieEnCours tirage={tirageEnCours} message={messageTirage} inscriptionEnCours={inscriptionEnCours} surInscription={() => void participerALaLoterie()} />
      </div>

      <section id="points" className="skuup-dashboard-action-panel" aria-labelledby="dashboard-points-title">
        <div><p className="skuup-kicker">Prochaine action</p><h2 id="dashboard-points-title" className="text-xl font-bold text-foreground">Valider la visite du jour</h2><p className="text-sm text-foreground-muted">Confirme ta présence pour prolonger ta série et créditer tes points.</p></div>
        <button className="skuup-button skuup-admin-button" type="button" onClick={() => void enregistrerVisite()} disabled={Boolean(actionEnCours)}>{actionEnCours === "checkin" ? "Validation…" : "Valider ma visite"}</button>
        {messageAction && <p role="status" className="text-sm text-accent-cta">{messageAction}</p>}
      </section>

      <div id="history" className="skuup-dashboard-card-grid grid gap-6 lg:grid-cols-2">
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
      </div>
        </div>
      </div>
  );
}

function SectionLoterieEnCours({ tirage, message, inscriptionEnCours, surInscription }: { tirage: TiragePublic | null; message: string | null; inscriptionEnCours: boolean; surInscription: () => void }) {
  const { langue } = useLanguage();
  return (
    <CarteGlow className="skuup-dashboard-panel border-accent-violet-light/40" aria-labelledby="dashboard-raffle-title">
      <p className="skuup-kicker">{langue === "en" ? "Current raffle" : "Loterie en cours"}</p>
      <h2 id="dashboard-raffle-title" className="mt-1 text-xl font-bold text-foreground">{tirage?.titre ?? (langue === "en" ? "No raffle currently open" : "Aucune loterie ouverte")}</h2>
      {tirage ? <>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{tirage.description}</p>
        <p className="mt-2 text-xs text-foreground-muted">{tirage.lots.length} lot(s) · Tirage le {new Date(tirage.dateTirage).toLocaleDateString(langue === "en" ? "en-US" : "fr-FR")}</p>
        <BoutonCTA className="mt-5" onClick={surInscription} disabled={inscriptionEnCours}>{inscriptionEnCours ? (langue === "en" ? "Registering..." : "Inscription...") : langue === "en" ? "Register" : "S’inscrire"}</BoutonCTA>
      </> : <p className="mt-2 text-sm text-foreground-muted">{message ?? (langue === "en" ? "Check back soon for the next raffle." : "La prochaine loterie sera bientôt annoncée.")}</p>}
      {message && tirage && <p role="status" className="mt-3 text-sm text-accent-cta">{message}</p>}
    </CarteGlow>
  );
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

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionCartesAGratter({ cartes, chargement, erreur, libelleReessai, surReessai, actionEnCours, surGratter }: { cartes: CarteAGratter[]; chargement: boolean; erreur?: string; libelleReessai: string; surReessai: () => void; actionEnCours: string | null; surGratter: (carte: CarteAGratter) => void }) {
  return (
    <CarteGlow className="skuup-dashboard-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="skuup-kicker">Récompenses</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Cartes à gratter</h2>
        </div>
        <span className="skuup-dashboard-count">{cartes.length}</span>
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
              <button className="skuup-button skuup-button-outline mt-2 px-3 py-1 text-xs" type="button" onClick={() => surGratter(carte)} disabled={Boolean(actionEnCours)}>{actionEnCours === carte.id ? "Ouverture…" : "Gratter la carte"}</button>
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
      <p className="skuup-kicker">Activité</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">Historique de points</h2>
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
