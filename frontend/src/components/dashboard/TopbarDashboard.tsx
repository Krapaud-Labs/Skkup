"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";
import { ecouterNotificationsDashboard, ecouterStatutTirageDashboard, type DashboardNotification } from "@/lib/dashboard-notifications";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { recupererAnnoncesViewer, type AnnonceViewer, type Profil } from "@/lib/dashboard";
import { connecterTempsReel, EVENEMENT_TIRAGE_STATUT } from "@/lib/temps-reel";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const CLE_ANNONCES_LUES = "skkup-dashboard-read-announcements-v1";
const cleAnnoncesLuesPourProfil = (profilId: string) => `${CLE_ANNONCES_LUES}:${encodeURIComponent(profilId)}`;

function idsAnnoncesValides(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((id): id is string => typeof id === "string"));
}

export function TopbarDashboard({ profil, notificationLabel = "Notifications", admin = false }: { profil: Profil | null; notificationLabel?: string; admin?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [annonces, setAnnonces] = useState<AnnonceViewer[]>([]);
  const [annoncesChargeesPour, setAnnoncesChargeesPour] = useState<string | null>(null);
  const [annoncesLues, setAnnoncesLues] = useState<Set<string>>(() => new Set());
  const [annoncesLuesHydrateesPour, setAnnoncesLuesHydrateesPour] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [chargementSuivant, setChargementSuivant] = useState(false);
  const [curseurSuivant, setCurseurSuivant] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);
  const [annonceSelectionnee, setAnnonceSelectionnee] = useState<AnnonceViewer | null>(null);
  const [notificationToast, setNotificationToast] = useState<DashboardNotification | null>(null);
  const expirationToast = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueAnnonce = useRef<HTMLDivElement>(null);
  const boutonNotifications = useRef<HTMLButtonElement>(null);
  const popoverNotifications = useRef<HTMLElement>(null);
  const [positionPopover, setPositionPopover] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const requeteAnnonces = useRef(0);
  const prechargementAnnoncesPour = useRef<string | null>(null);
  const focusARestaurer = useRef<HTMLElement | null>(null);
  const { langue } = useLanguage();
  const pathname = usePathname();
  const cleAnnoncesLues = profil?.id ? cleAnnoncesLuesPourProfil(profil.id) : null;
  const annoncesLuesHydratees = cleAnnoncesLues !== null && annoncesLuesHydrateesPour === cleAnnoncesLues;
  const annoncesChargees = Boolean(profil?.id && annoncesChargeesPour === profil.id);
  const annoncesActuelles = annoncesChargees ? annonces : [];
  const curseurAnnoncesActuel = annoncesChargees ? curseurSuivant : null;
  const notificationsNonLues = annoncesLuesHydratees && annoncesChargees
    ? annoncesActuelles.filter((annonce) => !annoncesLues.has(annonce.id)).length
    : 0;
  const libelleNotifications = notificationsNonLues > 0
    ? `${notificationLabel}, ${notificationsNonLues} ${langue === "en" ? `unread notification${notificationsNonLues === 1 ? "" : "s"}` : `notification${notificationsNonLues > 1 ? "s" : ""} non lue${notificationsNonLues > 1 ? "s" : ""}`}`
    : notificationLabel;

  useEffect(() => {
    if (!cleAnnoncesLues) {
      return;
    }

    let annoncesLuesDepuisStockage = new Set<string>();
    try {
      annoncesLuesDepuisStockage = idsAnnoncesValides(JSON.parse(window.localStorage.getItem(cleAnnoncesLues) ?? "[]"));
    } catch {
      annoncesLuesDepuisStockage = new Set();
    }
    const temporisateur = window.setTimeout(() => {
      setAnnoncesLues(annoncesLuesDepuisStockage);
      setAnnoncesLuesHydrateesPour(cleAnnoncesLues);
    }, 0);
    return () => window.clearTimeout(temporisateur);
  }, [cleAnnoncesLues]);

  useEffect(() => {
    if (!cleAnnoncesLues || !annoncesLuesHydratees) return;
    try {
      window.localStorage.setItem(cleAnnoncesLues, JSON.stringify([...annoncesLues]));
    } catch {
      // La lecture reste mémorisée en mémoire si le stockage local échoue.
    }
  }, [annoncesLues, annoncesLuesHydratees, cleAnnoncesLues]);

  function marquerAnnonceLue(id: string) {
    setAnnoncesLues((courantes) => courantes.has(id) ? courantes : new Set(courantes).add(id));
  }

  const chargerAnnonces = useCallback(async () => {
    const profilId = profil?.id;
    if (!profilId) return;
    const idRequete = ++requeteAnnonces.current;
    setChargement(true);
    setErreur(false);
    try {
      const resultat = await recupererAnnoncesViewer();
      if (idRequete === requeteAnnonces.current) {
        setAnnonces(resultat.items);
        setCurseurSuivant(resultat.nextCursor);
        setAnnoncesChargeesPour(profilId);
      }
    } catch {
      if (idRequete === requeteAnnonces.current) setErreur(true);
    } finally {
      if (idRequete === requeteAnnonces.current) setChargement(false);
    }
  }, [profil?.id]);

  useEffect(() => {
    const profilId = profil?.id;
    if (!profilId || !annoncesLuesHydratees || prechargementAnnoncesPour.current === profilId) return;
    prechargementAnnoncesPour.current = profilId;
    const temporisateur = window.setTimeout(() => void chargerAnnonces(), 0);
    return () => {
      window.clearTimeout(temporisateur);
      requeteAnnonces.current += 1;
      if (prechargementAnnoncesPour.current === profilId) prechargementAnnoncesPour.current = null;
    };
  }, [annoncesLuesHydratees, chargerAnnonces, profil?.id]);

  useLayoutEffect(() => {
    if (!ouvert || admin) return;
    const positionner = () => {
      const bouton = boutonNotifications.current;
      const popover = popoverNotifications.current;
      if (!bouton || !popover) return;
      const marge = 12;
      const ancre = bouton.getBoundingClientRect();
      const dimensions = popover.getBoundingClientRect();
      const largeur = Math.min(dimensions.width, window.innerWidth - marge * 2);
      const hauteurMax = Math.max(120, window.innerHeight - marge * 2);
      const gauche = Math.min(window.innerWidth - marge - largeur, Math.max(marge, ancre.right - largeur));
      const hauteur = Math.min(dimensions.height, hauteurMax);
      const dessous = ancre.bottom + 8;
      const dessus = ancre.top - hauteur - 8;
      const haut = dessous + hauteur <= window.innerHeight - marge
        ? dessous
        : dessus >= marge ? dessus : Math.max(marge, window.innerHeight - marge - hauteur);
      setPositionPopover((courante) => courante?.left === gauche && courante.top === haut && courante.maxHeight === hauteurMax
        ? courante
        : { left: gauche, top: haut, maxHeight: hauteurMax });
    };
    positionner();
    window.addEventListener("resize", positionner);
    window.addEventListener("scroll", positionner, true);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(positionner);
    if (boutonNotifications.current) observer?.observe(boutonNotifications.current);
    if (popoverNotifications.current) observer?.observe(popoverNotifications.current);
    return () => {
      window.removeEventListener("resize", positionner);
      window.removeEventListener("scroll", positionner, true);
      observer?.disconnect();
    };
  }, [admin, annonces, chargement, chargementSuivant, curseurSuivant, erreur, ouvert]);

  function basculerNotifications() {
    if (ouvert) {
      requeteAnnonces.current += 1;
      setOuvert(false);
      setChargement(false);
      setChargementSuivant(false);
      return;
    }
    setOuvert(true);
    setChargementSuivant(false);
    if (annoncesLuesHydratees && !chargement) void chargerAnnonces();
  }

  async function chargerPageSuivante() {
    if (!curseurSuivant || chargementSuivant) return;
    const curseur = curseurSuivant;
    const idRequete = requeteAnnonces.current;
    setChargementSuivant(true);
    setErreur(false);
    try {
      const resultat = await recupererAnnoncesViewer(curseur);
      if (idRequete === requeteAnnonces.current) {
        setAnnonces((courantes) => {
          const ids = new Set(courantes.map((annonce) => annonce.id));
          return [...courantes, ...resultat.items.filter((annonce) => !ids.has(annonce.id))];
        });
        setCurseurSuivant(resultat.nextCursor);
      }
    } catch {
      if (idRequete === requeteAnnonces.current) setErreur(true);
    } finally {
      if (idRequete === requeteAnnonces.current) setChargementSuivant(false);
    }
  }

  useEffect(() => {
    if (!profil?.id || admin) return;
    const unsubscribe = ecouterNotificationsDashboard((notification) => {
      setNotificationToast(notification);
      if (expirationToast.current) clearTimeout(expirationToast.current);
      expirationToast.current = setTimeout(() => setNotificationToast(null), 5000);
    });
    return () => {
      unsubscribe();
      if (expirationToast.current) clearTimeout(expirationToast.current);
      expirationToast.current = null;
    };
  }, [admin, profil?.id]);

  useEffect(() => {
    if (!profil?.id || admin) return;
    const actualiserAnnonces = () => void chargerAnnonces();
    if (pathname === "/dashboard") return ecouterStatutTirageDashboard(actualiserAnnonces);

    const socket = connecterTempsReel();
    socket.on(EVENEMENT_TIRAGE_STATUT, actualiserAnnonces);
    return () => {
      socket.off(EVENEMENT_TIRAGE_STATUT, actualiserAnnonces);
      socket.disconnect();
    };
  }, [admin, chargerAnnonces, pathname, profil?.id]);

  useEffect(() => {
    if (!ouvert) return;

    const popover = popoverNotifications.current;
    const premierControle = popover?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    (premierControle ?? popover)?.focus();
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;

    function fermerAuClicExterieur(event: PointerEvent) {
      const cible = event.target;
      if (!(cible instanceof Node)) return;
      if (boutonNotifications.current?.contains(cible) || popoverNotifications.current?.contains(cible)) return;
      requeteAnnonces.current += 1;
      setOuvert(false);
      setChargement(false);
      setChargementSuivant(false);
    }

    function fermerAvecEchap(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      requeteAnnonces.current += 1;
      setOuvert(false);
      setChargement(false);
      setChargementSuivant(false);
      boutonNotifications.current?.focus();
    }

    document.addEventListener("pointerdown", fermerAuClicExterieur);
    document.addEventListener("keydown", fermerAvecEchap);
    return () => {
      document.removeEventListener("pointerdown", fermerAuClicExterieur);
      document.removeEventListener("keydown", fermerAvecEchap);
    };
  }, [ouvert]);

  function ouvrirAnnonce(annonce: AnnonceViewer) {
    requeteAnnonces.current += 1;
    setChargement(false);
    setChargementSuivant(false);
    setOuvert(false);
    marquerAnnonceLue(annonce.id);
    setAnnonceSelectionnee(annonce);
  }

  function rendreAnnonces() {
    return <>
      {chargement || (profil?.id && !annoncesChargees) ? <p role="status">Chargement des annonces…</p> : erreur && annoncesActuelles.length === 0 ? <p role="alert">Impossible de charger les annonces.</p> : annoncesActuelles.length ? annoncesActuelles.map((annonce) => {
        const nonLue = annoncesLuesHydratees && !annoncesLues.has(annonce.id);
        const etatLecture = langue === "en" ? (nonLue ? "unread announcement" : "read announcement") : (nonLue ? "annonce non lue" : "annonce lue");
        return <button key={annonce.id} type="button" className="skuup-viewer-notification-item" aria-label={`${annonce.titre}, ${etatLecture}`} onClick={() => ouvrirAnnonce(annonce)}>{annonce.titre}</button>;
      }) : <p>Aucune annonce disponible.</p>}
      {erreur && annoncesActuelles.length > 0 && <p role="alert">Impossible de charger les annonces suivantes.</p>}
      {curseurAnnoncesActuel && <button type="button" className="skuup-viewer-notification-item" onClick={chargerPageSuivante} disabled={chargementSuivant}>{chargementSuivant ? "Chargement…" : "Charger plus"}</button>}
    </>;
  }

  useEffect(() => {
    if (!annonceSelectionnee) return;
    const dialogue = dialogueAnnonce.current;
    const precedent = document.activeElement as HTMLElement | null;
    focusARestaurer.current = precedent;
    dialogue?.focus();
    function gererClavier(event: KeyboardEvent) {
      if (event.key === "Escape") { setAnnonceSelectionnee(null); return; }
      if (event.key !== "Tab" || !dialogue) return;
      const elements = [...dialogue.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!elements.length) return;
      const premier = elements[0];
      const dernier = elements[elements.length - 1];
      if (document.activeElement === dialogue) {
        event.preventDefault();
        (event.shiftKey ? dernier : premier).focus();
      } else if (event.shiftKey && document.activeElement === premier) { event.preventDefault(); dernier.focus(); }
      else if (!event.shiftKey && document.activeElement === dernier) { event.preventDefault(); premier.focus(); }
    }
    document.addEventListener("keydown", gererClavier);
    return () => document.removeEventListener("keydown", gererClavier);
  }, [annonceSelectionnee]);

  useEffect(() => {
    if (annonceSelectionnee || !focusARestaurer.current) return;
    const precedent = focusARestaurer.current;
    focusARestaurer.current = null;
    if (precedent !== document.body && precedent.isConnected) precedent.focus();
    else boutonNotifications.current?.focus();
  }, [annonceSelectionnee]);

  return <div className="skuup-viewer-topbar">
    <div className="skuup-viewer-topbar-actions">
      <div className="relative skuup-notification-anchor">
        <button ref={boutonNotifications} type="button" className="skuup-viewer-icon-button" aria-label={libelleNotifications} aria-expanded={ouvert} aria-controls="viewer-notifications" onClick={basculerNotifications}>
          <SkkupIcon name="bell" size={20} />
          {notificationsNonLues > 0 && <span className="skuup-viewer-notification-badge" aria-hidden="true">{notificationsNonLues > 9 ? "9+" : notificationsNonLues}</span>}
        </button>
        {ouvert && !admin && typeof document !== "undefined" && createPortal(<section ref={popoverNotifications} id="viewer-notifications" className="skuup-viewer-notification-popover" aria-label={notificationLabel} tabIndex={-1} style={{ position: "fixed", left: positionPopover?.left ?? 12, top: positionPopover?.top ?? 12, right: "auto", maxHeight: positionPopover?.maxHeight ?? "calc(100dvh - 24px)", visibility: positionPopover ? "visible" : "hidden" }}>
          <strong>{notificationLabel}</strong>
          <div className="skuup-viewer-notification-list" aria-live="polite">
            {rendreAnnonces()}
          </div>
        </section>, document.body)}
        {ouvert && admin && <section ref={popoverNotifications} id="viewer-notifications" className="skuup-viewer-notification-popover" aria-label={notificationLabel} tabIndex={-1}>
          <strong>{notificationLabel}</strong>
          <div className="skuup-viewer-notification-list" aria-live="polite">
            {rendreAnnonces()}
          </div>
        </section>}
      </div>
      <MenuCompteDashboard profil={profil} />
      {notificationToast && <div className="skuup-viewer-notification-toast" role="status" aria-live="polite" aria-atomic="true"><strong>{notificationToast.title}</strong><br />{notificationToast.message}</div>}
    </div>
    {annonceSelectionnee && typeof document !== "undefined" && createPortal(<div className="skuup-viewer-announcement-backdrop" onMouseDown={(event) => {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      dialogueAnnonce.current?.focus();
    }}><div ref={dialogueAnnonce} className="skuup-viewer-announcement-dialog" role="dialog" aria-modal="true" aria-labelledby="viewer-announcement-title" aria-describedby="viewer-announcement-body" tabIndex={-1}>
      <header className="skuup-viewer-announcement-header">
        <div className="skuup-viewer-announcement-heading">
          <p className="skuup-viewer-announcement-kicker">{langue === "en" ? "Announcement" : "Annonce"}</p>
          <h2 id="viewer-announcement-title">{annonceSelectionnee.titre}</h2>
        </div>
        <button type="button" className="skuup-viewer-announcement-close" aria-label={langue === "en" ? "Close announcement" : "Fermer l’annonce"} onClick={() => setAnnonceSelectionnee(null)}><SkkupIcon name="close" size={16} /></button>
      </header>
      <div id="viewer-announcement-body" className="skuup-viewer-announcement-content" tabIndex={0}>
        <p>{annonceSelectionnee.texte}</p>
      </div>
      <footer className="skuup-viewer-announcement-footer">
        <button type="button" className="skuup-button skuup-button-primary" onClick={() => setAnnonceSelectionnee(null)}>{langue === "en" ? "Close" : "Fermer"}</button>
      </footer>
    </div></div>, document.body)}
  </div>;
}
