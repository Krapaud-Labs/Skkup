"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ErreurApi } from "@/lib/api";
import { recupererResumeDashboardAdmin, type AdminDashboardSummary } from "@/lib/admin";
import { AdminSas } from "@/components/admin/AdminSas";
import { NavigationAdmin } from "@/components/admin/NavigationAdmin";

const actions = [
  { href: "/admin/moderation", label: "Examiner les signalements", description: "Traiter les alertes et décisions anti-fraude.", key: "openFraudFlags" as const },
  { href: "/admin/raffles", label: "Gérer les tirages", description: "Créer, suivre et auditer les tirages.", key: "openRaffles" as const },
  { href: "/admin/content", label: "Publier du contenu", description: "Gérer les versions éditoriales publiées.", key: "publishedContent" as const },
  { href: "/admin/announcements", label: "Gérer les annonces", description: "Contrôler les messages visibles par les viewers.", key: "activeAnnouncements" as const },
];

function dateLisible(date: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date)); }

function Cockpit() {
  const [resume, setResume] = useState<AdminDashboardSummary | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const charger = useCallback(async () => { setChargement(true); setErreur(null); try { setResume(await recupererResumeDashboardAdmin()); } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Impossible de charger le cockpit administrateur."); } finally { setChargement(false); } }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void charger(), 0);
    return () => window.clearTimeout(timer);
  }, [charger]);
  return <div className="skuup-premium-dashboard-shell skuup-premium-admin-shell min-h-screen">
    <aside className="skuup-premium-dashboard-sidebar" aria-label="Navigation administration"><div className="skuup-premium-dashboard-brand"><span aria-hidden="true">✦</span><strong>Skkup</strong><small>ADMINISTRATION</small></div><NavigationAdmin /></aside>
    <main className="skuup-premium-dashboard-content" id="overview">
      <header className="skuup-dashboard-page-header"><div><p className="skuup-kicker">Administration</p><h1 className="skuup-dashboard-page-title skuup-premium-dashboard-greeting">Le cockpit opérationnel</h1><p>Une vue courte de l’état du service et des décisions qui attendent une action.</p></div><Link className="skuup-button skuup-button-outline" href="/dashboard">Espace viewer</Link></header>
      {chargement && <section className="skuup-premium-panel" aria-busy="true" aria-live="polite"><p role="status">Chargement du cockpit…</p></section>}
      {erreur && <section className="skuup-premium-panel skuup-admin-alert-error" role="alert"><h2>Le cockpit est indisponible</h2><p>{erreur}</p><button className="skuup-button skuup-button-primary mt-4" type="button" onClick={() => void charger()}>Réessayer</button></section>}
      {resume && <><section className="skuup-admin-cockpit" aria-labelledby="cockpit-summary-title"><div className="skuup-admin-cockpit-heading"><div><p className="skuup-admin-section-kicker">État du service</p><h2 id="cockpit-summary-title">Priorités maintenant</h2><p className="skuup-admin-cockpit-subtitle">Les compteurs viennent du résumé administrateur, les détails restent dans leurs espaces dédiés.</p></div><span className="skuup-premium-dashboard-status"><span aria-hidden="true" /> Service connecté</span></div><div className="skuup-admin-kpi-grid" aria-label="Indicateurs du service"><Link className="skuup-admin-kpi" href="/admin/users"><span>Utilisateurs actifs</span><strong>{resume.counts.activeUsers}</strong><small>sur {resume.counts.users} comptes</small></Link><Link className="skuup-admin-kpi" href="/admin/raffles"><span>Tirages ouverts</span><strong>{resume.counts.openRaffles}</strong><small>à surveiller</small></Link><Link className="skuup-admin-kpi" href="/admin/moderation"><span>Signalements ouverts</span><strong>{resume.counts.openFraudFlags}</strong><small>à examiner</small></Link><Link className="skuup-admin-kpi" href="/admin/raffles"><span>Streams actifs</span><strong>{resume.counts.activeStreams}</strong><small>connectés</small></Link></div></section><section className="skuup-dashboard-panel" aria-labelledby="priority-title"><div className="skuup-admin-section-kicker">Actions</div><h2 id="priority-title">Une prochaine action, pas un mur d’informations</h2><div className="skuup-admin-overview-grid mt-5">{actions.map((action) => <Link className="skuup-admin-list-item" href={action.href} key={action.href}><strong>{action.label}</strong><span>{action.description}</span><small>{resume.counts[action.key]} élément(s) signalé(s)</small></Link>)}</div></section><section className="skuup-dashboard-panel" aria-labelledby="activity-title"><div className="flex items-center justify-between gap-3"><div><div className="skuup-admin-section-kicker">Traçabilité</div><h2 id="activity-title">Activité récente</h2></div><Link className="skuup-button skuup-button-outline" href="/admin/audit">Ouvrir le journal</Link></div>{resume.recentActivity.length ? <ol className="skuup-admin-activity-list mt-5">{resume.recentActivity.map((event) => <li key={event.id}><strong>{event.action} · {event.entityType}</strong><span>{event.actor?.pseudo ?? "Système"} · {event.entityId} · {dateLisible(event.createdAt)}</span></li>)}</ol> : <p className="mt-5 text-foreground-muted" role="status">Aucune activité récente à afficher.</p>}</section></>}
    </main>
  </div>;
}
export default function PageAdministration() { return <AdminSas><Cockpit /></AdminSas>; }
