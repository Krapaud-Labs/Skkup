"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ErreurApi } from "@/lib/api";
import { recupererResumeDashboardAdmin, type AdminDashboardSummary } from "@/lib/admin";
import { AdminSas } from "@/components/admin/AdminSas";
import { NavigationAdmin } from "@/components/admin/NavigationAdmin";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

const priorities = [
  { href: "/admin/raffles", label: "Tirages à piloter", key: "openRaffles" as const, icon: "draws" as SkkupIconName, tone: "cyan", detail: "Participation et résultats" },
  { href: "/admin/lots", label: "Lots disponibles", key: "availableLots" as const, icon: "gift" as SkkupIconName, tone: "blue", detail: "Inventaire et stock" },
  { href: "/admin/announcements", label: "Annonces et contenus", key: "activeAnnouncements" as const, icon: "rules" as SkkupIconName, tone: "pink", detail: "Publication éditoriale" },
  { href: "/admin/moderation", label: "Signalements à traiter", key: "openFraudFlags" as const, icon: "shield" as SkkupIconName, tone: "amber", detail: "Modération et sécurité" },
];

function dateLisible(date: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date)); }

function Cockpit() {
  const [resume, setResume] = useState<AdminDashboardSummary | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const charger = useCallback(async () => { setChargement(true); setErreur(null); try { setResume(await recupererResumeDashboardAdmin()); } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Impossible de charger le cockpit administrateur."); } finally { setChargement(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void charger(), 0); return () => window.clearTimeout(timer); }, [charger]);
  return <div className="skuup-premium-dashboard-shell skuup-premium-admin-shell min-h-screen">
    <aside className="skuup-premium-dashboard-sidebar" aria-label="Navigation administration"><div className="skuup-premium-dashboard-brand"><span aria-hidden="true">✦</span><strong>Skkup</strong><small>ADMINISTRATION</small></div><NavigationAdmin /></aside>
    <main className="skuup-premium-dashboard-content" id="overview">
      <div className="skuup-admin-topbar" aria-label="Contexte de l’administration"><span className="skuup-admin-environment"><span aria-hidden="true" /> En production <span aria-hidden="true">⌄</span></span><Link href="/" className="skuup-admin-site-link">Skkup.fr ↗</Link><span className="skuup-admin-topbar-spacer" /><span className="skuup-admin-notification" aria-label="3 notifications">♧ <b>3</b></span><span className="skuup-premium-dashboard-avatar" aria-label="Administrateur">AD</span><span className="skuup-admin-user-label">Alexandre D.<small>Administrateur</small></span></div>
      <header className="skuup-dashboard-page-header"><div><p className="skuup-kicker">Administration</p><h1 className="skuup-dashboard-page-title skuup-premium-dashboard-greeting">Administration Skkup</h1><p>Pilotez les tirages, les lots, les annonces et la communauté de la plateforme.</p></div><div className="flex items-center gap-3"><span className="skuup-premium-dashboard-status"><span aria-hidden="true" /> Tous les services opérationnels</span><Link className="skuup-button skuup-button-outline" href="/dashboard">Espace viewer</Link></div></header>
      {chargement && <section className="skuup-premium-panel" aria-busy="true" aria-live="polite"><p role="status">Chargement du cockpit…</p></section>}
      {erreur && <section className="skuup-premium-panel skuup-admin-alert-error" role="alert"><h2>Le cockpit est indisponible</h2><p>{erreur}</p><button className="skuup-button skuup-button-primary mt-4" type="button" onClick={() => void charger()}>Réessayer</button></section>}
      {resume && <><section className="skuup-admin-kpi-grid" aria-label="Indicateurs du service"><Link className="skuup-admin-kpi" href="/admin/raffles"><span>Tirages ouverts</span><strong>{resume.counts.openRaffles}</strong><small>à piloter maintenant</small></Link><Link className="skuup-admin-kpi" href="/admin/lots"><span>Lots disponibles</span><strong>{resume.counts.availableLots}</strong><small>dans le catalogue</small></Link><Link className="skuup-admin-kpi" href="/admin/announcements"><span>Annonces publiées</span><strong>{resume.counts.activeAnnouncements}</strong><small>visibles par les viewers</small></Link><Link className="skuup-admin-kpi" href="/admin/moderation"><span>Signalements à traiter</span><strong>{resume.counts.openFraudFlags}</strong><small>requièrent une décision</small></Link></section>
        <div className="skuup-admin-overview-grid">{priorities.map((priority) => <Link className={`skuup-admin-overview-card skuup-admin-overview-card-${priority.tone}`} href={priority.href} key={priority.href}><span className="skuup-admin-overview-icon"><SkkupIcon name={priority.icon} size={24} /></span><div><span className="skuup-admin-section-kicker">{priority.detail}</span><h2>{priority.label}</h2><strong>{resume.counts[priority.key]}</strong><small>Voir les détails <span aria-hidden="true">→</span></small></div></Link>)}</div>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><section className="skuup-dashboard-panel" aria-labelledby="operations-title"><div className="flex items-center justify-between gap-3"><div><p className="skuup-admin-section-kicker">Opérations</p><h2 id="operations-title">Tirages à piloter</h2></div><Link className="skuup-button skuup-button-outline" href="/admin/raffles">Voir tous les tirages</Link></div><div className="skuup-admin-table mt-5"><div className="skuup-admin-table-row skuup-admin-table-head"><span>Indicateur</span><span>Valeur</span><span>Action</span></div><div className="skuup-admin-table-row"><span>Tirages ouverts</span><strong>{resume.counts.openRaffles}</strong><Link href="/admin/raffles">Gérer</Link></div><div className="skuup-admin-table-row"><span>Streams actifs</span><strong>{resume.counts.activeStreams}</strong><Link href="/dashboard/streams">Consulter</Link></div><div className="skuup-admin-table-row"><span>Utilisateurs actifs</span><strong>{resume.counts.activeUsers} / {resume.counts.users}</strong><Link href="/admin/users">Voir</Link></div></div></section>
          <section className="skuup-dashboard-panel" aria-labelledby="audit-title"><div className="flex items-center justify-between gap-3"><div><p className="skuup-admin-section-kicker">Traçabilité</p><h2 id="audit-title">Journal d’audit</h2></div><Link className="skuup-button skuup-button-outline" href="/admin/audit">Tout voir</Link></div>{resume.recentActivity.length ? <ol className="skuup-admin-activity-list mt-5">{resume.recentActivity.slice(0, 5).map((event) => <li key={event.id}><strong>{event.action}</strong><span>{event.actor?.pseudo ?? "Système"} · {dateLisible(event.createdAt)}</span></li>)}</ol> : <p className="mt-5 text-foreground-muted" role="status">Aucune activité récente à afficher.</p>}</section></div></>}
    </main>
  </div>;
}
export default function PageAdministration() { return <AdminSas><Cockpit /></AdminSas>; }
