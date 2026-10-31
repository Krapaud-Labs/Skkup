"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";
import { ecouterNotificationsDashboard, type DashboardNotification } from "@/lib/dashboard-notifications";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { recupererAnnoncesViewer, type AnnonceViewer, type Profil } from "@/lib/dashboard";
import { connecterTempsReel, EVENEMENT_APPARIEMENTS_MIS_A_JOUR, EVENEMENT_CARTE_DEBLOQUEE, EVENEMENT_POINTS_MIS_A_JOUR, EVENEMENT_STREAK_MIS_A_JOUR } from "@/lib/temps-reel";

type NotificationAffichee = DashboardNotification & { href: string; read: boolean };

function cleAnnoncesLues(profilId: string) {
  return `skkup:viewer:announcements-read:${profilId}`;
}

function lireAnnoncesLues(profilId: string): Set<string> {
  try {
    const raw = localStorage.getItem(cleAnnoncesLues(profilId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

type PageAnnoncesViewer = Awaited<ReturnType<typeof recupererAnnoncesViewer>>;

function normaliserPageAnnoncesViewer(resultat: PageAnnoncesViewer | null | undefined): PageAnnoncesViewer {
  return {
    items: Array.isArray(resultat?.items) ? resultat.items : [],
    nextCursor: typeof resultat?.nextCursor === "string" ? resultat.nextCursor : null,
  };
}

function chargerPageAnnoncesViewer(cursor?: string | null): Promise<PageAnnoncesViewer> {
  return Promise.resolve()
    .then(() => recupererAnnoncesViewer(cursor))
    .then(normaliserPageAnnoncesViewer);
}

export function TopbarDashboard({ profil, notificationHref = "/dashboard", notificationLabel = "Notifications", admin = false }: { profil: Profil | null; notificationHref?: string; notificationLabel?: string; admin?: boolean }) {
  const { langue } = useLanguage();
  const [ouvert, setOuvert] = useState(false);
  const [annonces, setAnnonces] = useState<AnnonceViewer[]>([]);
  const [chargement, setChargement] = useState(false);
  const [chargementSuivant, setChargementSuivant] = useState(false);
  const [curseurSuivant, setCurseurSuivant] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);
  const [annonceSelectionnee, setAnnonceSelectionnee] = useState<AnnonceViewer | null>(null);
  const [notificationsTempsReel, setNotificationsTempsReel] = useState<NotificationAffichee[]>([]);
  const [annoncesLues, setAnnoncesLues] = useState<Set<string>>(() => new Set());
  const [notificationToast, setNotificationToast] = useState<DashboardNotification | null>(null);
  const expirationToast = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueAnnonce = useRef<HTMLDivElement>(null);
  const boutonNotifications = useRef<HTMLButtonElement>(null);
  const popoverNotifications = useRef<HTMLElement>(null);
  const [positionPopover, setPositionPopover] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const requeteAnnonces = useRef(0);
  const requeteInitialeAnnonces = useRef<Promise<Awaited<ReturnType<typeof recupererAnnoncesViewer>>> | null>(null);
  const pageInitialeEnCache = useRef(false);
  const focusARestaurer = useRef<HTMLElement | null>(null);
  const aNotificationNonLue = notificationsTempsReel.some((notification) => !notification.read)
    || annonces.some((annonce) => !annoncesLues.has(annonce.id));

  useEffect(() => {
    if (!profil?.id || admin) return;
    const profilId = profil.id;
    let actif = true;
    const timer = window.setTimeout(() => {
      if (actif) setAnnoncesLues(lireAnnoncesLues(profilId));
    }, 0);
    const idRequeteInitiale = requeteAnnonces.current;
    const requete = chargerPageAnnoncesViewer();
    requeteInitialeAnnonces.current = requete;
    requete
      .then((resultat) => {
        if (!actif || requeteAnnonces.current !== idRequeteInitiale) return;
        setAnnonces(resultat.items);
        setCurseurSuivant(resultat.nextCursor);
        pageInitialeEnCache.current = true;
      })
      .catch(() => {
        // L'ouverture du menu affiche son erreur et permet de relancer la lecture.
      })
      .finally(() => {
        if (requeteInitialeAnnonces.current === requete) requeteInitialeAnnonces.current = null;
      });
    return () => {
      actif = false;
      window.clearTimeout(timer);
      requeteInitialeAnnonces.current = null;
      pageInitialeEnCache.current = false;
    };
  }, [admin, profil?.id]);

  function marquerAnnonceLue(id: string) {
    if (!profil?.id) return;
    const suivantes = new Set(lireAnnoncesLues(profil.id));
    annoncesLues.forEach((annonceId) => suivantes.add(annonceId));
    suivantes.add(id);
    try {
      localStorage.setItem(cleAnnoncesLues(profil.id), JSON.stringify([...suivantes]));
    } catch {
      // Sans stockage local, la lecture reste mémorisée jusqu'au prochain démontage.
    }
    setAnnoncesLues(suivantes);
  }

  function marquerNotificationLue(id: string) {
    setNotificationsTempsReel((courantes) => courantes.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  }

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
  }, [admin, annonces, chargement, chargementSuivant, curseurSuivant, erreur, notificationsTempsReel, ouvert]);

  async function basculerNotifications() {
    if (ouvert) {
      requeteAnnonces.current += 1;
      setOuvert(false);
      setChargement(false);
      setChargementSuivant(false);
      pageInitialeEnCache.current = false;
      requeteInitialeAnnonces.current = null;
      return;
    }
    setOuvert(true);
    if (admin) return;
    const idRequete = ++requeteAnnonces.current;
    const cacheInitialDisponible = pageInitialeEnCache.current;
    const promesseInitiale = requeteInitialeAnnonces.current;
    if (!cacheInitialDisponible) setChargement(true);
    setChargementSuivant(false);
    setErreur(false);
    if (!cacheInitialDisponible) {
      setAnnonces([]);
      setCurseurSuivant(null);
    }
    try {
      const resultat = cacheInitialDisponible
        ? { items: annonces, nextCursor: curseurSuivant }
        : await (promesseInitiale ?? chargerPageAnnoncesViewer());
      if (idRequete === requeteAnnonces.current) {
        setAnnonces(resultat.items);
        setCurseurSuivant(resultat.nextCursor);
        pageInitialeEnCache.current = true;
      }
    } catch {
      if (idRequete === requeteAnnonces.current) { setErreur(true); setAnnonces([]); setCurseurSuivant(null); }
    } finally {
      if (idRequete === requeteAnnonces.current) setChargement(false);
    }
  }

  async function chargerPageSuivante() {
    if (!curseurSuivant || chargementSuivant) return;
    const curseur = curseurSuivant;
    const idRequete = requeteAnnonces.current;
    setChargementSuivant(true);
    setErreur(false);
    try {
      const resultat = await chargerPageAnnoncesViewer(curseur);
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
    const socket = connecterTempsReel();
    const ajouter = (title: string, message: string, type: string) => setNotificationsTempsReel((courantes) => [{ id: `${type}-${Date.now()}`, title, message, href: notificationHref, read: false }, ...courantes].slice(0, 8));
    socket.on(EVENEMENT_POINTS_MIS_A_JOUR, (event: { montant: number }) => ajouter("Points mis à jour", `${event.montant >= 0 ? "+" : ""}${event.montant} point${Math.abs(event.montant) > 1 ? "s" : ""} ajouté${Math.abs(event.montant) > 1 ? "s" : ""} à ton solde.`, "points"));
    socket.on(EVENEMENT_STREAK_MIS_A_JOUR, (event: { streakActuel: number }) => ajouter("Série mise à jour", `Ta série actuelle est de ${event.streakActuel} jour${event.streakActuel > 1 ? "s" : ""}.`, "streak"));
    socket.on(EVENEMENT_CARTE_DEBLOQUEE, () => ajouter("Nouvelle carte à gratter", "Une carte est disponible dans tes récompenses.", "scratch-card"));
    socket.on(EVENEMENT_APPARIEMENTS_MIS_A_JOUR, () => ajouter("Extension mise à jour", "L’état de ton extension a changé.", "extension"));
    return () => { socket.disconnect(); };
  }, [admin, notificationHref, profil?.id]);

  useEffect(() => {
    const unsubscribe = ecouterNotificationsDashboard((notification) => {
      setNotificationsTempsReel((courantes) => [{ ...notification, href: notificationHref, read: false }, ...courantes].slice(0, 8));
      setNotificationToast(notification);
      if (expirationToast.current) clearTimeout(expirationToast.current);
      expirationToast.current = setTimeout(() => setNotificationToast(null), 5000);
    });
    return () => {
      unsubscribe();
      if (expirationToast.current) clearTimeout(expirationToast.current);
      expirationToast.current = null;
    };
  }, [notificationHref]);

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

    document.addEventListener("pointerdown", fermerAuClicExterieur, true);
    document.addEventListener("keydown", fermerAvecEchap);
    return () => {
      document.removeEventListener("pointerdown", fermerAuClicExterieur, true);
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

  return <div className={`skuup-viewer-topbar${admin ? " skuup-admin-topbar" : ""}`}>
    <div className="skuup-viewer-topbar-actions">
      <div className="relative skuup-notification-anchor">
        <button ref={boutonNotifications} type="button" className="skuup-viewer-icon-button skuup-notification-trigger" aria-label={`${notificationLabel}${aNotificationNonLue ? (langue === "en" ? " (unread)" : " (non lue)") : ""}`} aria-expanded={ouvert} aria-controls="viewer-notifications" onClick={basculerNotifications}><SkkupIcon name="bell" size={20} />{aNotificationNonLue && <span className="skuup-notification-bell-badge" aria-hidden="true" />}</button>
        {ouvert && !admin && typeof document !== "undefined" && createPortal(<section ref={popoverNotifications} id="viewer-notifications" className="skuup-viewer-notification-popover" aria-label={notificationLabel} style={{ position: "fixed", left: positionPopover?.left ?? 12, top: positionPopover?.top ?? 12, right: "auto", maxHeight: positionPopover?.maxHeight ?? "calc(100dvh - 24px)", visibility: positionPopover ? "visible" : "hidden" }}>
          <strong>{notificationLabel}</strong>
          <div className="skuup-viewer-notification-list" aria-live="polite">
            {chargement ? <p role="status">Chargement des annonces…</p> : erreur && annonces.length === 0 ? <p role="alert">Impossible de charger les annonces.</p> : annonces.length ? annonces.map((annonce) => <button key={annonce.id} type="button" className="skuup-viewer-notification-item" onClick={() => ouvrirAnnonce(annonce)}>{annonce.titre}</button>) : <p>Aucune annonce disponible.</p>}
            {erreur && annonces.length > 0 && <p role="alert">Impossible de charger la page suivante.</p>}
            {curseurSuivant && <button type="button" className="skuup-viewer-notification-item" onClick={chargerPageSuivante} disabled={chargementSuivant}>{chargementSuivant ? "Chargement…" : "Charger plus"}</button>}
            {notificationsTempsReel.map((notification) => <Link key={notification.id} href={notification.href} className="skuup-viewer-realtime-notification" onClick={() => { marquerNotificationLue(notification.id); setOuvert(false); }}><strong>{notification.title}</strong><br />{notification.message}</Link>)}
          </div>
        </section>, document.body)}
        {ouvert && admin && <section ref={popoverNotifications} id="viewer-notifications" className="skuup-viewer-notification-popover" aria-label={notificationLabel}>
          <strong>{notificationLabel}</strong>
          {notificationsTempsReel.length > 0 ? notificationsTempsReel.map((notification) => <Link key={notification.id} href={notification.href} className="skuup-viewer-realtime-notification" onClick={() => { marquerNotificationLue(notification.id); setOuvert(false); }}><strong>{notification.title}</strong><br />{notification.message}</Link>) : <p>Aucune nouvelle notification.</p>}
          <Link href={notificationHref} onClick={() => { requeteAnnonces.current += 1; setOuvert(false); }}>Ouvrir le journal</Link>
        </section>}
      </div>
      <MenuCompteDashboard profil={profil} />
      {notificationToast && <div className="skuup-viewer-notification-toast" role="status" aria-live="polite" aria-atomic="true"><strong>{notificationToast.title}</strong><br />{notificationToast.message}</div>}
    </div>
    {annonceSelectionnee && typeof document !== "undefined" && createPortal(<div className="skuup-viewer-announcement-backdrop" onMouseDown={(event) => {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
    }}><div ref={dialogueAnnonce} className="skuup-viewer-announcement-dialog" role="dialog" aria-modal="true" aria-labelledby="viewer-announcement-title" tabIndex={-1}>
      <button type="button" className="skuup-viewer-announcement-close" aria-label="Fermer l’annonce" onClick={() => setAnnonceSelectionnee(null)}><SkkupIcon name="close" size={16} /></button>
      <h2 id="viewer-announcement-title">{annonceSelectionnee.titre}</h2><p>{annonceSelectionnee.texte}</p>
    </div></div>, document.body)}
  </div>;
}
