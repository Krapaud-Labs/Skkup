"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { ErreurApi } from "@/lib/api";
import { publierNotificationDashboard } from "@/lib/dashboard-notifications";
import { ScratchCardModal } from "@/components/dashboard/ScratchCardModal";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  gratterCarte,
  preparerCarteAGratter,
  recupererCartesAGratter,
  recupererProfil,
  recupererTiragesPublics,
  recupererTicketsTirage,
  type CarteAGratter,
  type TiragePublic,
  type TicketsTirage,
} from "@/lib/dashboard";
import { illustrationCarteParPalier, libelleGainCarte } from "@/lib/scratch-card-reward";

type Filtre = "TOUTES" | "DISPONIBLES" | "UTILISEES";

export function progressionPalier(streakActuel: number, palier: number) {
  return Math.min(Math.max(streakActuel, 0), Math.max(palier, 0));
}

export function CentreRecompenses() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const t = useMemo(() => (anglais
    ? {
        kicker: "Your rewards",
        title: "Rewards",
        description:
          "Use your points to unlock scratch cards and draw tickets.",
        search: "Search",
        searchPlaceholder: "Reward type",
        sort: "Sort",
        recent: "Most recent",
        value: "Highest value",
        collection: "Your collection",
        cards: "Scratch cards",
        filters: "Reward filters",
        all: "All",
        available: "Available",
        used: "Used",
        usedState: "USED",
        availableState: "AVAILABLE",
        usedBadge: "Used",
        scratch: "Scratch now",
        opening: "Opening…",
        noMatch: "No reward matches this filter.",
        balance: "Your balance",
        ticketsEarned: "tickets earned",
        activity: "Recent activity",
        recentTickets: "Recent tickets",
        availableCards: "Available cards",
        nextDraw: "Next draw",
        loadingDraw: "Loading the next draw…",
        noOpenDraw: "There is no open draw right now.",
        drawUnavailable: "The next draw is temporarily unavailable.",
        viewDraw: "View the draw",
        winner: "Winner",
        pending: "In progress",
        notWinner: "Not a winner",
        noTickets: "No ticket is linked to your account yet.",
        selected: "Selected reward",
        alreadyUsed: "This card has already been used.",
        availableContract:
          "This card is available according to your account contract.",
        variable: "Variable reward",
        tier: "Tier",
        created: "Created on",
        validatedActivity: "Validated activity",
        streakProgress: "Streak progress",
        progressLabel: (value: number) =>
          `Progress toward the ${value}-day tier`,
        selectCard: "Select a reward card.",
        days: "days",
        drawTicket: "Draw ticket",
        streakBonus: "Streak bonus",
        classic: "Classic scratch card",
        usedReward: "Used reward",
        retry: "Retry",
        unavailable: "Rewards are temporarily unavailable.",
      }
    : {
        kicker: "Tes récompenses",
        title: "Récompenses",
        description:
          "Utilise tes points pour débloquer des cartes à gratter et des tickets de tirage.",
        search: "Rechercher",
        searchPlaceholder: "Type de récompense",
        sort: "Trier",
        recent: "Plus récentes",
        value: "Valeur la plus élevée",
        collection: "Ta collection",
        cards: "Cartes à gratter",
        filters: "Filtres des récompenses",
        all: "Toutes",
        available: "Disponibles",
        used: "Utilisées",
        usedState: "UTILISÉE",
        availableState: "DISPONIBLE",
        usedBadge: "Utilisée",
        scratch: "Gratter maintenant",
        opening: "Ouverture…",
        noMatch: "Aucune récompense ne correspond à ce filtre.",
        balance: "Ton solde",
        ticketsEarned: "tickets obtenus",
        activity: "Activité récente",
        recentTickets: "Derniers tickets",
        availableCards: "Cartes disponibles",
        nextDraw: "Prochain tirage",
        loadingDraw: "Chargement du prochain tirage…",
        noOpenDraw: "Aucun tirage ouvert pour le moment.",
        drawUnavailable: "Le prochain tirage est temporairement indisponible.",
        viewDraw: "Voir le tirage",
        winner: "Gagnant",
        pending: "En cours",
        notWinner: "Non gagnant",
        noTickets: "Aucun ticket n’est encore associé à ton compte.",
        selected: "Récompense sélectionnée",
        alreadyUsed: "Cette carte a déjà été utilisée.",
        availableContract:
          "Cette carte est disponible selon le contrat de ton compte.",
        variable: "Gain variable",
        tier: "Palier",
        created: "Créée le",
        validatedActivity: "Activité validée",
        streakProgress: "Progression de série",
        progressLabel: (value: number) =>
          `Progression vers le palier de ${value} jours`,
        selectCard: "Sélectionne une carte récompense.",
        days: "jours",
        drawTicket: "Ticket de tirage",
        streakBonus: "Bonus de série",
        classic: "Carte classique",
        usedReward: "Récompense utilisée",
        retry: "Réessayer",
        unavailable: "Les récompenses sont temporairement indisponibles.",
      }), [anglais]);
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [tirageOuvert, setTirageOuvert] = useState<TiragePublic | null>(null);
  const [tirageCharge, setTirageCharge] = useState(false);
  const [tirageIndisponible, setTirageIndisponible] = useState(false);
  const [solde, setSolde] = useState<number | null>(null);
  const [streakActuel, setStreakActuel] = useState<number | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);
  const [filtre, setFiltre] = useState<Filtre>("TOUTES");
  const [carteEnCours, setCarteEnCours] = useState<string | null>(null);
  const [carteModal, setCarteModal] = useState<CarteAGratter | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<"recent" | "value">("recent");

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [cartesRecues, ticketsRecus, profil] = await Promise.all([
        recupererCartesAGratter(),
        recupererTicketsTirage(1, 6),
        recupererProfil(),
      ]);
      setCartes(cartesRecues);
      setTickets(ticketsRecus);
      setSolde(profil.soldePoints);
      setStreakActuel(profil.streakActuel);
      setTirageCharge(false);
      setTirageIndisponible(false);
      setTirageOuvert(null);
      void recupererTiragesPublics()
        .then((tirages) => {
          setTirageOuvert(tirages.find((tirage) => tirage.statut === "OUVERT") ?? null);
          setTirageCharge(true);
        })
        .catch(() => {
          setTirageIndisponible(true);
          setTirageCharge(true);
        });
      setSelection((courante) =>
        courante && cartesRecues.some((carte) => carte.id === courante)
          ? courante
          : (cartesRecues[0]?.id ?? null),
      );
    } catch (exception: unknown) {
      setErreur(
        exception instanceof ErreurApi ? exception.message : t.unavailable,
      );
    }
  }, [t.unavailable]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void charger();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [charger, tentative]);

  async function preparer(carte: CarteAGratter): Promise<string> {
    const resultat = await preparerCarteAGratter(carte.id);
    return libelleGainCarte(resultat.carte, anglais);
  }

  async function gratter(carte: CarteAGratter): Promise<string> {
    if (carte.grattee || carteEnCours !== null) throw new Error(anglais ? "This card is already being opened." : "Cette carte est déjà en cours d’ouverture.");
    setCarteEnCours(carte.id);
    setErreurAction(null);
    try {
      const resultat = await gratterCarte(carte.id);
      setCartes(
        (courantes) =>
          courantes?.map((item) =>
            item.id === carte.id ? resultat.carte : item,
          ) ?? courantes,
      );
      publierNotificationDashboard(
        anglais ? "Scratch card" : "Carte à gratter",
        libelleGainCarte(resultat.carte, anglais),
      );
      return libelleGainCarte(resultat.carte, anglais);
    } catch (exception: unknown) {
      const message = exception instanceof ErreurApi ? exception.message : anglais ? "This card could not be opened." : "Cette carte ne peut pas être ouverte pour le moment.";
      setErreurAction(message);
      throw new Error(message);
    } finally {
      setCarteEnCours(null);
    }
  }

  const disponibles = useMemo(
    () => cartes?.filter((carte) => !carte.grattee) ?? [],
    [cartes],
  );
  const utilisees = useMemo(
    () => cartes?.filter((carte) => carte.grattee) ?? [],
    [cartes],
  );
  const libelleCarte = useCallback(
    (carte: CarteAGratter) => {
      if (carte.grattee) return t.usedReward;
      if (carte.gainType === "TICKET") return t.drawTicket;
      if (carte.streakPalier >= 14) return t.streakBonus;
      return t.classic;
    },
    [t],
  );
  const classeIllustration = useCallback((carte: CarteAGratter) => {
    if (carte.grattee) return "is-used";
    if (carte.gainType === "TICKET") return "is-ticket";
    if (carte.streakPalier >= 14) return "is-streak";
    return "is-classic";
  }, []);
  const visibles = useMemo(() => {
    const source =
      filtre === "DISPONIBLES"
        ? disponibles
        : filtre === "UTILISEES"
          ? utilisees
          : (cartes ?? []);
    const terme = recherche.trim().toLocaleLowerCase();
    return [...source]
      .filter(
        (carte) =>
          !terme || libelleCarte(carte).toLocaleLowerCase().includes(terme),
      )
      .sort((a, b) =>
        tri === "value"
          ? (b.gainMontant ?? 0) - (a.gainMontant ?? 0)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [cartes, disponibles, filtre, libelleCarte, recherche, tri, utilisees]);
  const selectionnee =
    visibles.find((carte) => carte.id === selection) ?? visibles[0] ?? null;
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{t.kicker}</p>
        <h1 className="skuup-dashboard-page-title">{t.title}</h1>
        <p>{t.description}</p>
      </header>
      {erreur ? (
        <div role="alert" className="skuup-viewer-error">
          <p>{erreur}</p>
          <button
            type="button"
            className="skuup-button skuup-button-outline mt-3"
            onClick={() => {
              setCartes(null);
              setTickets(null);
              setSolde(null);
              setStreakActuel(null);
              setTirageOuvert(null);
              setTirageCharge(false);
              setTirageIndisponible(false);
              setTentative((value) => value + 1);
            }}
          >
            {t.retry}
          </button>
        </div>
      ) : cartes === null ||
        tickets === null ||
        solde === null ||
        streakActuel === null ? (
        <section
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="skuup-rewards-layout skuup-rewards-loading"
        >
          <CarteGlow className="skuup-viewer-section skuup-rewards-collection">
            <span className="skuup-loading-line skuup-loading-line-wide" />
            <span className="skuup-loading-line skuup-loading-line-title" />
            <div className="skuup-loading-grid">
              <span />
              <span />
              <span />
            </div>
          </CarteGlow>
          <CarteGlow className="skuup-viewer-section skuup-rewards-balance">
            <span className="skuup-loading-line skuup-loading-line-short" />
            <span className="skuup-loading-line skuup-loading-line-title" />
          </CarteGlow>
        </section>
      ) : (
        <>
        <section className="skuup-rewards-summary" aria-label={t.title}>
          <div>
            <span>{t.balance}</span>
            <strong>{solde.toLocaleString(anglais ? "en-US" : "fr-FR")} <small>points</small></strong>
          </div>
          <div><span>{t.availableCards}</span><strong>{disponibles.length}</strong></div>
          <div><span>{t.ticketsEarned}</span><strong>{tickets.total}</strong></div>
        </section>
        <div className="skuup-rewards-layout">
          <div className="skuup-viewer-toolbar skuup-rewards-toolbar">
            <label htmlFor="rewards-search">
              {t.search}
              <input
                id="rewards-search"
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </label>
            <label htmlFor="rewards-sort">
              {t.sort}
              <select
                id="rewards-sort"
                value={tri}
                onChange={(event) => setTri(event.target.value as typeof tri)}
              >
                <option value="recent">{t.recent}</option>
                <option value="value">{t.value}</option>
              </select>
            </label>
          </div>
          <CarteGlow className="skuup-viewer-section skuup-rewards-collection">
            <div className="skuup-secondary-heading">
              <div>
                <p className="skuup-kicker">{t.collection}</p>
                <h2>{t.cards}</h2>
              </div>
              <SkkupIcon name="rewardIllustration" size={48} />
            </div>
            <div
              className="skuup-rewards-filters"
              role="tablist"
              aria-label={t.filters}
            >
              {(
                [
                  ["TOUTES", t.all, cartes.length],
                  ["DISPONIBLES", t.available, disponibles.length],
                  ["UTILISEES", t.used, utilisees.length],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  id={`reward-filter-${value.toLowerCase()}`}
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filtre === value}
                  aria-controls="reward-cards"
                  className={filtre === value ? "is-active" : ""}
                  onClick={() => setFiltre(value)}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>
            {erreurAction && (
              <p role="alert" className="skuup-viewer-action-message">
                {erreurAction}
              </p>
            )}
            <div
              id="reward-cards"
              role="tabpanel"
              aria-labelledby={`reward-filter-${filtre.toLowerCase()}`}
              className="skuup-rewards-grid"
            >
              {visibles.map((carte) => (
                <article
                  className={`skuup-scratch-card ${carte.grattee ? "is-used" : ""} ${carte.id === selectionnee?.id ? "is-selected" : ""}`}
                  key={carte.id}
                  onClick={() => setSelection(carte.id)}
                >
                  <button
                    type="button"
                    className="skuup-sr-only"
                    onClick={() => setSelection(carte.id)}
                  >
                    {anglais
                      ? `Select ${libelleCarte(carte)}`
                      : `Sélectionner ${libelleCarte(carte)}`}
                  </button>
                  <div
                    className={`skuup-scratch-art ${classeIllustration(carte)}`}
                    style={{ backgroundImage: `url("${illustrationCarteParPalier(carte.streakPalier)}")`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent" }}
                    aria-hidden="true"
                  >
                  </div>
                  <div className="skuup-scratch-card-heading">
                    <h3>{libelleCarte(carte)}</h3>
                    <span className="skuup-scratch-state">
                      {carte.grattee ? t.usedState : t.availableState}
                    </span>
                  </div>
                  <p>
                    {carte.gainMontant === null
                      ? carte.streakPalier > 0
                        ? `${carte.streakPalier} ${t.days}`
                        : t.validatedActivity
                      : `${carte.gainMontant} points`}
                  </p>
                  {carte.grattee ? (
                    <span className="skuup-badge">{t.usedBadge}</span>
                  ) : (
                    <button
                      type="button"
                      className="skuup-button skuup-button-primary"
                      disabled={carteEnCours !== null}
                      onClick={(event) => {
                        event.stopPropagation();
                        setErreurAction(null);
                        setCarteModal(carte);
                      }}
                    >
                      {carteEnCours === carte.id ? t.opening : t.scratch}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {visibles.length === 0 && (
              <p className="skuup-viewer-empty"><SkkupIcon name="sparkle" size={30} className="skuup-rewards-empty-sparkle" /><span>{t.noMatch}</span></p>
            )}
          </CarteGlow>
          <CarteGlow className="skuup-viewer-section skuup-rewards-next-draw">
            <div className="skuup-secondary-heading">
              <div>
                <p className="skuup-kicker">{t.nextDraw}</p>
                <h2>{tirageOuvert?.titre ?? t.nextDraw}</h2>
              </div>
              <SkkupIcon name="draws" size={30} />
            </div>
            {tirageCharge && tirageOuvert ? (
              <div className="skuup-rewards-next-draw-copy">
                <p>{new Date(tirageOuvert.dateTirage).toLocaleString(anglais ? "en-US" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                <p>
                  {tirageOuvert.lots.reduce((total, lot) => total + lot.quantite, 0)} {anglais ? "prizes" : "lots"}
                  {tirageOuvert.lots.length > 0 && ` · ${tirageOuvert.lots.slice(0, 2).map((lot) => lot.nom).join(" · ")}`}
                </p>
                <Link className="skuup-button skuup-button-outline skuup-rewards-draw-link" href="/dashboard/tirages">{t.viewDraw}</Link>
              </div>
            ) : (
              <p className="skuup-rewards-next-draw-copy" role={tirageIndisponible ? "alert" : "status"}>
                {tirageIndisponible ? t.drawUnavailable : tirageCharge ? t.noOpenDraw : t.loadingDraw}
              </p>
            )}
          </CarteGlow>
          <CarteGlow className="skuup-viewer-section skuup-rewards-tickets">
            <div className="skuup-secondary-heading">
              <div>
                <p className="skuup-kicker">{t.activity}</p>
                <h2>{t.recentTickets}</h2>
              </div>
              <SkkupIcon name="ticket" size={25} />
            </div>
            {tickets.tickets.length > 0 ? (
              <ul className="skuup-rewards-ticket-list">
                {tickets.tickets.slice(0, 4).map((ticket) => (
                  <li key={ticket.ticketId}>
                    <div>
                      <strong>{ticket.raffleTitre}</strong>
                      <span>
                        {new Date(ticket.obtenuLe).toLocaleDateString(
                          anglais ? "en-US" : "fr-FR",
                        )}
                      </span>
                    </div>
                    <span
                      className={`skuup-badge ${ticket.gagnant ? "is-success" : ""}`}
                    >
                      {ticket.gagnant
                        ? t.winner
                        : ticket.raffleStatut === "OUVERT"
                          ? t.pending
                          : t.notWinner}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="skuup-viewer-empty">{t.noTickets}</p>
            )}
          </CarteGlow>
          <CarteGlow className="skuup-viewer-section skuup-rewards-selected">
            <p className="skuup-kicker">{t.selected}</p>
            {selectionnee ? (
              <>
                <div className="skuup-rewards-selected-art" style={{ backgroundImage: `url("${illustrationCarteParPalier(selectionnee.streakPalier)}")`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent" }} aria-hidden="true">
                </div>
                <div className="skuup-rewards-selected-heading">
                  <div>
                    <h2>{libelleCarte(selectionnee)}</h2>
                    <p>
                      {selectionnee.grattee
                        ? t.alreadyUsed
                        : t.availableContract}
                    </p>
                  </div>
                  <span className="skuup-badge">
                    {selectionnee.gainMontant === null
                      ? t.variable
                      : `${selectionnee.gainMontant} pts`}
                  </span>
                </div>
                <dl className="skuup-rewards-selected-facts">
                  <div>
                    <dt>{t.tier}</dt>
                    <dd>
                      {selectionnee.streakPalier > 0
                        ? `${selectionnee.streakPalier} ${t.days}`
                        : t.validatedActivity}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.created}</dt>
                    <dd>
                      {new Date(selectionnee.createdAt).toLocaleDateString(
                        anglais ? "en-US" : "fr-FR",
                      )}
                    </dd>
                  </div>
                </dl>
                {selectionnee.streakPalier > 0 && (
                  <div className="skuup-rewards-progress">
                    <div>
                      <span>{t.streakProgress}</span>
                      <strong>
                        {Math.min(streakActuel, selectionnee.streakPalier)} /{" "}
                        {selectionnee.streakPalier} {t.days}
                      </strong>
                    </div>
                    <progress
                      max={selectionnee.streakPalier}
                      value={Math.min(streakActuel, selectionnee.streakPalier)}
                      aria-label={t.progressLabel(selectionnee.streakPalier)}
                    />
                  </div>
                )}
                {!selectionnee.grattee && (
                  <button
                    type="button"
                    className="skuup-button skuup-button-primary w-full"
                    disabled={carteEnCours !== null}
                    onClick={() => { setErreurAction(null); setCarteModal(selectionnee); }}
                  >
                    {carteEnCours === selectionnee.id ? t.opening : t.scratch}
                  </button>
                )}
              </>
            ) : (
              <p className="skuup-viewer-empty mt-4">{t.selectCard}</p>
            )}
          </CarteGlow>
        </div>
        </>
      )}
      {carteModal && <ScratchCardModal card={carteModal} english={anglais} artwork={illustrationCarteParPalier(carteModal.streakPalier)} onClose={() => setCarteModal(null)} onPrepare={() => preparer(carteModal)} onReveal={() => gratter(carteModal)} />}
    </div>
  );
}
