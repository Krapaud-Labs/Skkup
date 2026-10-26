"use client";

/* Lot media URLs are supplied by the admin API and may be remote. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ErreurApi } from "@/lib/api";
import {
  recupererResumeDashboardAdmin,
  type AdminDashboardSummary,
} from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { EtatChargementDashboard } from "@/components/dashboard/EtatChargementDashboard";
import { priorities } from "./priorities";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { connecterTempsReel, EVENEMENT_RESULTAT_TIRAGE, EVENEMENT_TIRAGE_STATUT, EVENEMENT_UTILISATEURS_INSCRITS } from "@/lib/temps-reel";
import "./cockpit.css";

function dateLisible(date: string, langue: "fr" | "en" = "fr") {
  return new Intl.DateTimeFormat(langue === "en" ? "en-US" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}
function dateCourte(date: string | null, langue: "fr" | "en" = "fr") {
  return date
    ? new Intl.DateTimeFormat(langue === "en" ? "en-US" : "fr-FR", {
        dateStyle: "short",
      }).format(new Date(date))
    : "-";
}

const copy = {
  fr: {
    kicker: "Administration",
    title: "Administration Skkup",
    subtitle:
      "Pilotez les tirages, les lots, les annonces et la communauté de la plateforme.",
    viewer: "Espace viewer",
    loading: "Chargement du cockpit…",
    unavailable: "Le cockpit est indisponible",
    retry: "Réessayer",
    serviceMetrics: "Indicateurs du service",
    operations: "Opérations",
    rafflesTitle: "Tirages à piloter",
    raffleLabel: "Tirage",
    allRaffles: "Voir tous les tirages",
    raffleEnd: "Fin des participations",
    entries: "Participations",
    status: "Statut",
    action: "Action",
    tickets: "tickets",
    manage: "Gérer",
    noRaffles: "Aucun tirage renvoyé par le contrat.",
    noRafflesDescription: "Les tirages ouverts et programmés apparaîtront ici.",
    manageRaffles: "Gérer les tirages",
    inventory: "Inventaire",
    lotsTitle: "Lots",
    addLot: "Ajouter un lot",
    allLots: "Voir tous les lots",
    lot: "Lot",
    stock: "Stock",
    available: "Disponible",
    outOfStock: "Rupture",
    edit: "Modifier",
    noLots: "Aucun lot renvoyé par le contrat.",
    noLotsDescription:
      "Les lots disponibles et leurs stocks seront visibles ici.",
    openInventory: "Ouvrir l’inventaire",
    editorial: "Éditorial",
    announcementsContent: "Annonces et contenus",
    newAnnouncement: "Nouvelle annonce",
    seeAll: "Voir tout",
    resource: "Ressource",
    active: "Active",
    createAnnouncement: "Créer une annonce",
    publishedContent: "Contenus publiés",
    manageContent: "Gérer",
    security: "Sécurité",
    reports: "Signalements",
    seeReports: "Voir les signalements",
    noReports: "Aucun signalement renvoyé par le contrat.",
    noReportsDescription:
      "Les alertes nécessitant une action apparaîtront ici.",
    noAnnouncements: "Aucune annonce active renvoyée par le contrat.",
    noAnnouncementsDescription:
      "Les messages visibles par les viewers seront regroupés ici.",
    openModeration: "Ouvrir la modération",
    openToProcess: "Ouverts à traiter",
    process: "Traiter",
    traceability: "Traçabilité",
    auditLog: "Journal d’audit",
    seeAllAudit: "Tout voir",
    noActivity: "Aucune activité récente à afficher.",
    noActivityDescription:
      "Les actions administratives apparaîtront ici avec leur horodatage.",
    system: "Système",
    unavailableImage: "Image indisponible",
    lotIllustration: (name: string) => `Illustration du lot ${name}`,
    unavailableImageFor: (name: string) => `Image indisponible pour ${name}`,
    priorities: {
      openRaffles: "Tirages ouverts",
      availableLots: "Lots disponibles",
      activeAnnouncements: "Annonces publiées",
      openFraudFlags: "Signalements à traiter",
      totalRaffles: "tirages programmés",
      totalLots: "lots enregistrés",
      totalAnnouncements: "annonces créées",
      totalFraudFlags: "signalements reçus",
    },
  },
  en: {
    kicker: "Administration",
    title: "Skkup administration",
    subtitle:
      "Manage the platform’s draws, prizes, announcements and community.",
    viewer: "Viewer space",
    loading: "Loading administration cockpit…",
    unavailable: "The administration cockpit is unavailable",
    retry: "Try again",
    serviceMetrics: "Service metrics",
    operations: "Operations",
    rafflesTitle: "Draws to manage",
    raffleLabel: "Draw",
    allRaffles: "View all draws",
    raffleEnd: "Entry deadline",
    entries: "Entries",
    status: "Status",
    action: "Action",
    tickets: "tickets",
    manage: "Manage",
    noRaffles: "No draws were returned by the contract.",
    noRafflesDescription: "Open and scheduled draws will appear here.",
    manageRaffles: "Manage draws",
    inventory: "Inventory",
    lotsTitle: "Prizes",
    addLot: "Add a prize",
    allLots: "View all prizes",
    lot: "Prize",
    stock: "Stock",
    available: "Available",
    outOfStock: "Out of stock",
    edit: "Edit",
    noLots: "No prizes were returned by the contract.",
    noLotsDescription: "Available prizes and their stock will appear here.",
    openInventory: "Open inventory",
    editorial: "Editorial",
    announcementsContent: "Announcements and content",
    newAnnouncement: "New announcement",
    seeAll: "View all",
    resource: "Resource",
    active: "Active",
    createAnnouncement: "Create announcement",
    publishedContent: "Published content",
    manageContent: "Manage",
    security: "Security",
    reports: "Reports",
    seeReports: "View reports",
    noReports: "No reports were returned by the contract.",
    noReportsDescription: "Alerts requiring action will appear here.",
    noAnnouncements: "No active announcements were returned by the contract.",
    noAnnouncementsDescription:
      "Messages visible to viewers will be grouped here.",
    openModeration: "Open moderation",
    openToProcess: "Open for review",
    process: "Review",
    traceability: "Traceability",
    auditLog: "Audit log",
    seeAllAudit: "View all",
    noActivity: "No recent activity to display.",
    noActivityDescription:
      "Administrative actions will appear here with their timestamps.",
    system: "System",
    unavailableImage: "Image unavailable",
    lotIllustration: (name: string) => `Illustration of prize ${name}`,
    unavailableImageFor: (name: string) => `Image unavailable for ${name}`,
    priorities: {
      openRaffles: "Open draws",
      availableLots: "Available prizes",
      activeAnnouncements: "Published announcements",
      openFraudFlags: "Reports to review",
      totalRaffles: "scheduled draws",
      totalLots: "registered prizes",
      totalAnnouncements: "created announcements",
      totalFraudFlags: "received reports",
    },
  },
} as const;

function Cockpit() {
  const { langue } = useLanguage();
  const t = copy[langue];
  const reduceMotion = useReducedMotion();
  const [resume, setResume] = useState<AdminDashboardSummary | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const data = await recupererResumeDashboardAdmin();
      setResume({
        ...data,
        raffles: data.raffles ?? [],
        lots: data.lots ?? [],
        announcements: data.announcements ?? [],
        fraudFlags: data.fraudFlags ?? [],
        contents: data.contents ?? [],
      });
    } catch (exception) {
      setErreur(
        exception instanceof ErreurApi
          ? exception.message
          : "Impossible de charger le cockpit administrateur.",
      );
    } finally {
      setChargement(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void charger(), 0);
    return () => window.clearTimeout(timer);
  }, [charger]);
  useEffect(() => {
    const socket = connecterTempsReel();
    const actualiser = () => void charger();
    socket.on(EVENEMENT_UTILISATEURS_INSCRITS, actualiser);
    socket.on(EVENEMENT_TIRAGE_STATUT, actualiser);
    socket.on(EVENEMENT_RESULTAT_TIRAGE, actualiser);
    return () => {
      socket.off(EVENEMENT_UTILISATEURS_INSCRITS, actualiser);
      socket.off(EVENEMENT_TIRAGE_STATUT, actualiser);
      socket.off(EVENEMENT_RESULTAT_TIRAGE, actualiser);
      socket.disconnect();
    };
  }, [charger]);
  return (
    <Shell section="overview" showSectionHeader={false}>
      <motion.div
        id="overview"
        className="skuup-admin-main-cockpit"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <div className="skuup-dashboard-overview-surface skuup-admin-overview-surface">
        <header className="skuup-dashboard-page-header skuup-admin-hero">
          <div className="skuup-admin-hero-copy">
            <p className="skuup-kicker">{t.kicker}</p>
            <h1 className="skuup-dashboard-page-title skuup-premium-dashboard-greeting">
              {t.title}
            </h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="skuup-admin-hero-side">
            <span className="skuup-admin-hero-mark" aria-hidden="true">
              <img src="/assets/brand/marks/skkup-s-favicon.png" alt="" />
            </span>
            <div className="skuup-admin-header-meta">
              <time dateTime={new Date().toISOString()}>
                {new Intl.DateTimeFormat(langue === "en" ? "en-US" : "fr-FR", {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(new Date())}
              </time>
              <Link
                className="skuup-button skuup-button-outline"
                href="/dashboard"
              >
                {t.viewer}
              </Link>
            </div>
          </div>
        </header>
        {chargement && <EtatChargementDashboard titre={t.loading} description={langue === "en" ? "Preparing service indicators and operations." : "Préparation des indicateurs et des opérations."} />}
        {erreur && (
          <section
            className="skuup-premium-panel skuup-admin-alert-error"
            role="alert"
          >
            <h2>{t.unavailable}</h2>
            <p>{erreur}</p>
            <button
              className="skuup-button skuup-button-primary mt-4"
              type="button"
              onClick={() => void charger()}
            >
              {t.retry}
            </button>
          </section>
        )}
        {resume && (
            <section
              className="skuup-dashboard-overview-kpis skuup-admin-kpi-grid"
              aria-label={t.serviceMetrics}
            >
              {priorities.map((priority) => {
                const value = resume.counts[priority.key];
                const total = resume.counts[priority.totalKey] ?? value;
                const ratio =
                  total > 0
                    ? Math.min(100, Math.round((value / total) * 100))
                    : 0;
                const label = t.priorities[priority.key];
                const detail = t.priorities[priority.totalKey];
                return (
                  <Link
                    className={`skuup-admin-kpi skuup-admin-kpi-${priority.tone}`}
                    href={priority.href}
                    key={priority.href}
                  >
                    <span className={`skuup-admin-kpi-label${priority.illustration ? " skuup-admin-kpi-label-illustration" : ""}`}>
                      <span className={`skuup-admin-kpi-icon${priority.illustration ? " skuup-admin-kpi-icon-illustration" : ""}`} aria-hidden="true">
                        <SkkupIcon
                          name={priority.illustration ?? priority.icon}
                          size={52}
                          sizes={priority.illustration ? "(max-width: 767px) 40px, 52px" : "(max-width: 767px) 48px, 52px"}
                        />
                      </span>
                      <span className="skuup-admin-kpi-copy">
                        <span className="skuup-admin-kpi-title">{label}</span>
                        <strong>{value}</strong>
                        <small>
                          {detail} · {value} {langue === "en" ? "of" : "sur"}{" "}
                          {total}
                        </small>
                        <span
                          className="skuup-admin-kpi-meter"
                          aria-hidden="true"
                        >
                          <span style={{ width: `${ratio}%` }} />
                        </span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </section>
          )}
        </div>
        {resume && (
          <>
            <div className="skuup-admin-dashboard-grid">
              <section
                className="skuup-dashboard-panel skuup-admin-data-panel"
                aria-labelledby="operations-title"
              >
                <div className="skuup-admin-panel-heading">
                  <div>
                    <p className="skuup-admin-section-kicker">{t.operations}</p>
                    <h2 id="operations-title">
                      <SkkupIcon name="draws" size={18} /> {t.rafflesTitle}
                    </h2>
                  </div>
                  <Link
                    className="skuup-admin-panel-link"
                    href="/admin/raffles"
                  >
                    {t.allRaffles}
                  </Link>
                </div>
                <div
                  className="skuup-admin-table skuup-admin-table-raffles"
                  role="table"
                  aria-label={t.rafflesTitle}
                  tabIndex={0}
                >
                  <div
                    className="skuup-admin-table-row skuup-admin-table-head"
                    role="row"
                  >
                    <span role="columnheader">{t.raffleLabel}</span>
                    <span role="columnheader">{t.raffleEnd}</span>
                    <span role="columnheader">{t.entries}</span>
                    <span role="columnheader">{t.status}</span>
                    <span role="columnheader">{t.action}</span>
                  </div>
                  {resume.raffles.length ? (
                    resume.raffles.map((raffle) => (
                      <div
                        className="skuup-admin-table-row"
                        role="row"
                        key={raffle.id}
                      >
                        <span role="cell">
                          <strong>{raffle.titre}</strong>
                          {raffle.description && (
                            <small>{raffle.description}</small>
                          )}
                        </span>
                        <span role="cell">
                          <strong>
                            {dateCourte(raffle.dateTirage, langue)}
                          </strong>
                        </span>
                        <span role="cell" className="skuup-admin-table-metric">
                          <strong>{raffle._count.tickets}</strong>
                          <small>{t.tickets}</small>
                        </span>
                        <span
                          role="cell"
                          className="skuup-admin-status-chip skuup-admin-status-success"
                        >
                          {raffle.statut}
                        </span>
                        <Link
                          className="skuup-admin-row-action"
                          href={`/admin/raffles?raffle=${raffle.id}`}
                        >
                          {t.manage}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="skuup-admin-empty-state" role="status">
                      <span
                        className="skuup-admin-empty-icon"
                        aria-hidden="true"
                      >
                        <SkkupIcon name="draws" size={24} />
                      </span>
                      <div>
                        <strong>{t.noRaffles}</strong>
                        <p>{t.noRafflesDescription}</p>
                      </div>
                      <Link
                        className="skuup-button skuup-button-outline"
                        href="/admin/raffles"
                      >
                        {t.manageRaffles}
                      </Link>
                    </div>
                  )}
                </div>
              </section>
              <section
                className="skuup-dashboard-panel skuup-admin-data-panel"
                aria-labelledby="lots-title"
              >
                <div className="skuup-admin-panel-heading">
                  <div>
                    <p className="skuup-admin-section-kicker">{t.inventory}</p>
                    <h2 id="lots-title">
                      <SkkupIcon name="gift" size={18} /> {t.lotsTitle}
                    </h2>
                  </div>
                  <span className="skuup-admin-panel-actions">
                    <Link
                      className="skuup-button skuup-button-primary"
                      href="/admin/lots"
                    >
                      <SkkupIcon name="gift" size={16} /> {t.addLot}
                    </Link>
                    <Link className="skuup-admin-panel-link" href="/admin/lots">
                      {t.allLots}
                    </Link>
                  </span>
                </div>
                <div
                  className="skuup-admin-table skuup-admin-table-lots"
                  role="table"
                  aria-label={t.lotsTitle}
                  tabIndex={0}
                >
                  <div
                    className="skuup-admin-table-row skuup-admin-table-head"
                    role="row"
                  >
                    <span role="columnheader">{t.lot}</span>
                    <span role="columnheader">{t.stock}</span>
                    <span role="columnheader">{t.status}</span>
                    <span role="columnheader">{t.action}</span>
                  </div>
                  {resume.lots.length ? (
                    resume.lots.map((lot) => (
                      <div
                        className="skuup-admin-table-row"
                        role="row"
                        key={lot.id}
                      >
                        <span role="cell" className="skuup-admin-lot-cell">
                          <LotMedia
                            src={lot.imageUrl}
                            alt={lot.nom}
                            langue={langue}
                          />
                          <span>
                            <strong>{lot.nom}</strong>
                            <small>{lot.valeurEstimee}</small>
                          </span>
                        </span>
                        <span role="cell">{lot.quantite}</span>
                        <span
                          role="cell"
                          className={`skuup-admin-status-chip ${lot.quantite > 0 ? "skuup-admin-status-success" : "skuup-admin-status-danger"}`}
                        >
                          {lot.quantite > 0 ? t.available : t.outOfStock}
                        </span>
                        <Link
                          className="skuup-admin-row-action"
                          href={`/admin/lots?lot=${lot.id}`}
                        >
                          {t.edit}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="skuup-admin-empty-state" role="status">
                      <span
                        className="skuup-admin-empty-icon"
                        aria-hidden="true"
                      >
                        <SkkupIcon name="gift" size={24} />
                      </span>
                      <div>
                        <strong>{t.noLots}</strong>
                        <p>{t.noLotsDescription}</p>
                      </div>
                      <Link
                        className="skuup-button skuup-button-outline"
                        href="/admin/lots"
                      >
                        {t.openInventory}
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="skuup-admin-bottom-grid">
              <section
                className="skuup-dashboard-panel skuup-admin-data-panel"
                aria-labelledby="content-title"
              >
                <div className="skuup-admin-panel-heading">
                  <div>
                    <p className="skuup-admin-section-kicker">{t.editorial}</p>
                    <h2 id="content-title">{t.announcementsContent}</h2>
                  </div>
                  <span className="skuup-admin-panel-actions">
                    <Link
                      className="skuup-button skuup-button-primary"
                      href="/admin/announcements"
                    >
                      {t.newAnnouncement}
                    </Link>
                    <Link
                      className="skuup-admin-panel-link"
                      href="/admin/content"
                    >
                      {t.seeAll}
                    </Link>
                  </span>
                </div>
                <div
                  className="skuup-admin-table"
                  role="table"
                  aria-label={t.announcementsContent}
                  tabIndex={0}
                >
                  <div
                    className="skuup-admin-table-row skuup-admin-table-head"
                    role="row"
                  >
                    <span role="columnheader">{t.resource}</span>
                    <span role="columnheader">{t.status}</span>
                    <span role="columnheader">{t.action}</span>
                  </div>
                  {resume.announcements.length ? (
                    resume.announcements.slice(0, 2).map((announcement) => (
                      <div
                        className="skuup-admin-table-row"
                        role="row"
                        key={announcement.id}
                      >
                        <span role="cell">
                          <strong>{announcement.titre}</strong>
                          {announcement.texte && (
                            <small>{announcement.texte}</small>
                          )}
                        </span>
                        <span
                          role="cell"
                          className="skuup-admin-status-chip skuup-admin-status-success"
                        >
                          {t.active}
                        </span>
                        <Link
                          href={`/admin/announcements?announcement=${announcement.id}`}
                        >
                          {t.edit}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="skuup-admin-empty-state" role="status">
                      <span
                        className="skuup-admin-empty-icon"
                        aria-hidden="true"
                      >
                        <SkkupIcon name="megaphone" size={24} />
                      </span>
                      <div>
                        <strong>{t.noAnnouncements}</strong>
                        <p>{t.noAnnouncementsDescription}</p>
                      </div>
                      <Link
                        className="skuup-button skuup-button-outline"
                        href="/admin/announcements"
                      >
                        {t.createAnnouncement}
                      </Link>
                    </div>
                  )}
                  {resume.contents.slice(0, 2).map((content) => (
                    <div
                      className="skuup-admin-table-row skuup-admin-content-row"
                      role="row"
                      key={content.id}
                    >
                      <span role="cell">
                        <strong>{content.slug}</strong>
                        <small>
                          {content.locale} · v{content.version}
                        </small>
                      </span>
                      <span
                        role="cell"
                        className="skuup-admin-status-chip skuup-admin-status-info"
                      >
                        {content.status}
                      </span>
                      <Link href={`/admin/content?content=${content.id}`}>
                        {t.manage}
                      </Link>
                    </div>
                  ))}
                  <div className="skuup-admin-table-row" role="row">
                    <span role="cell">{t.publishedContent}</span>
                    <span
                      role="cell"
                      className="skuup-admin-status-chip skuup-admin-status-info"
                    >
                      {resume.counts.publishedContent}{" "}
                      {t.publishedContent.toLowerCase()}
                    </span>
                    <Link href="/admin/content">{t.manage}</Link>
                  </div>
                </div>
              </section>
              <section
                className="skuup-dashboard-panel skuup-admin-data-panel"
                aria-labelledby="moderation-title"
              >
                <div className="skuup-admin-panel-heading">
                  <div>
                    <p className="skuup-admin-section-kicker">{t.security}</p>
                    <h2 id="moderation-title">
                      <SkkupIcon name="shield" size={18} /> {t.reports}
                    </h2>
                  </div>
                  <Link
                    className="skuup-admin-panel-link"
                    href="/admin/moderation"
                  >
                    {t.seeReports}
                  </Link>
                </div>
                <div
                  className="skuup-admin-flag-list"
                  role="region"
                  aria-labelledby="moderation-title"
                  tabIndex={0}
                >
                  {resume.fraudFlags.length ? (
                    resume.fraudFlags.slice(0, 3).map((flag) => (
                      <Link
                        className="skuup-admin-flag"
                        href={`/admin/moderation?flag=${flag.id}`}
                        key={flag.id}
                      >
                        <span
                          className="skuup-admin-flag-severity"
                          aria-hidden="true"
                        />
                        <span>
                          <strong>{flag.type}</strong>
                          <small>
                            {flag.user.pseudo} ·{" "}
                            {dateCourte(flag.createdAt, langue)}
                          </small>
                        </span>
                        <SkkupIcon name="arrow" size={16} />
                      </Link>
                    ))
                  ) : (
                    <div className="skuup-admin-empty-state" role="status">
                      <span
                        className="skuup-admin-empty-icon"
                        aria-hidden="true"
                      >
                        <SkkupIcon name="shield" size={24} />
                      </span>
                      <div>
                        <strong>{t.noReports}</strong>
                        <p>{t.noReportsDescription}</p>
                      </div>
                      <Link
                        className="skuup-button skuup-button-outline"
                        href="/admin/moderation"
                      >
                        {t.openModeration}
                      </Link>
                    </div>
                  )}
                </div>
                <div className="skuup-admin-moderation-total">
                  <span>{t.openToProcess}</span>
                  <strong
                    className={
                      resume.counts.openFraudFlags
                        ? "skuup-admin-value-warn"
                        : ""
                    }
                  >
                    {resume.counts.openFraudFlags}
                  </strong>
                  <Link href="/admin/moderation">{t.process}</Link>
                </div>
              </section>
              <section
                className="skuup-dashboard-panel skuup-admin-audit-panel"
                aria-labelledby="audit-title"
              >
                <div className="skuup-admin-panel-heading">
                  <div>
                    <p className="skuup-admin-section-kicker">
                      {t.traceability}
                    </p>
                    <h2 id="audit-title">
                      <SkkupIcon name="audit" size={18} /> {t.auditLog}
                    </h2>
                  </div>
                  <Link
                    className="skuup-button skuup-button-outline"
                    href="/admin/audit"
                  >
                    {t.seeAllAudit}
                  </Link>
                </div>
                {resume.recentActivity.length ? (
                  <ol
                    className="skuup-admin-activity-list"
                    aria-labelledby="audit-title"
                    tabIndex={0}
                  >
                    {resume.recentActivity.slice(0, 5).map((event) => (
                      <li className="skuup-admin-activity-event" key={event.id}>
                        <span
                          className="skuup-admin-activity-dot"
                          aria-hidden="true"
                        />
                        <span>
                          <strong>{event.action}</strong>
                          <time dateTime={event.createdAt}>
                            {dateLisible(event.createdAt, langue)}
                          </time>
                          <small>
                            {event.actor?.pseudo ?? t.system} ·{" "}
                            {event.entityType} · {event.entityId}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="skuup-admin-empty-state" role="status">
                    <span className="skuup-admin-empty-icon" aria-hidden="true">
                      <SkkupIcon name="audit" size={24} />
                    </span>
                    <div>
                      <strong>{t.noActivity}</strong>
                      <p>{t.noActivityDescription}</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </motion.div>
    </Shell>
  );
}
function LotMedia({
  src,
  alt,
  langue,
}: {
  src?: string | null;
  alt: string;
  langue: "fr" | "en";
}) {
  const [indisponible, setIndisponible] = useState(!src);
  const t = copy[langue];
  return indisponible ? (
    <span
      className="skuup-admin-lot-placeholder"
      role="img"
      aria-label={t.unavailableImageFor(alt)}
    >
      <img
        src="/assets/icons/ui/gift.png"
        alt=""
        aria-hidden="true"
      />
      <span>{t.unavailableImage}</span>
    </span>
  ) : (
    <img
      src={src ?? undefined}
      alt={t.lotIllustration(alt)}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndisponible(true)}
    />
  );
}

export default function PageAdministration() {
  return <Cockpit />;
}
