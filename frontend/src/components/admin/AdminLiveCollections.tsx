import Link from "next/link";
import type { AdminDashboardSummary } from "@/lib/admin";

function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value)) : "—";
}

export function AdminLiveCollections({ resume }: { resume: AdminDashboardSummary }) {
  const publicationCount = resume.announcements.length + resume.contents.length;
  const metrics = [
    { label: "Tirages ouverts", value: resume.counts.openRaffles, detail: `${resume.raffles.length} suivis`, tone: "skuup-admin-metric-violet", href: "/admin/raffles" },
    { label: "Lots disponibles", value: resume.counts.availableLots, detail: `${resume.lots.length} visibles`, tone: "skuup-admin-metric-cyan", href: "/admin/lots" },
    { label: "Annonces publiées", value: resume.counts.activeAnnouncements, detail: `${resume.announcements.length} récentes`, tone: "skuup-admin-metric-pink", href: "/admin/announcements" },
    { label: "Signalements ouverts", value: resume.counts.openFraudFlags, detail: `${resume.fraudFlags.length} récents`, tone: "skuup-admin-metric-amber", href: "/admin/moderation" },
  ];
  const publicationItems = [
    ...resume.announcements.map((item) => ({
      id: `announcement-${item.id}`,
      title: item.titre,
      meta: `Annonce · ${item.actif ? "publiée" : "inactive"} · début ${shortDate(item.debutAt)}`,
      status: item.actif ? "Publié" : "Inactif",
      tone: item.actif ? "skuup-admin-status-success" : "skuup-admin-status-muted",
      href: "/admin/announcements",
    })),
    ...resume.contents.map((item) => ({
      id: `content-${item.id}`,
      title: item.slug,
      meta: `Contenu · ${item.locale.toUpperCase()} · version ${item.version}`,
      status: item.status,
      tone: "skuup-admin-status-info",
      href: "/admin/content",
    })),
  ].slice(0, 5);

  return (
    <section className="skuup-dashboard-panel skuup-admin-collections-panel" aria-labelledby="live-collections-title">
      <div className="skuup-admin-panel-heading">
        <div><p className="skuup-admin-section-kicker">Cockpit opérationnel</p><h2 id="live-collections-title">Administration Skuup</h2><p className="text-sm text-foreground-muted">Pilotage des tirages, lots, annonces et de la communauté.</p></div>
        <Link className="skuup-admin-panel-link" href="/admin/audit">Voir le journal</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs opérationnels">
        {metrics.map((metric) => <Link href={metric.href} key={metric.label} className={`skuup-admin-metric-card ${metric.tone}`}><span className="skuup-admin-metric-icon" aria-hidden="true">{metric.label === "Tirages ouverts" ? "✦" : metric.label === "Lots disponibles" ? "◇" : metric.label === "Annonces publiées" ? "◆" : "⚑"}</span><span className="min-w-0"><span className="block text-xs text-foreground-muted">{metric.label}</span><strong className="block text-2xl leading-none">{metric.value}</strong><span className="block text-xs text-foreground-muted">{metric.detail}</span></span><span aria-hidden="true">›</span></Link>)}
      </div>
      <div className="skuup-admin-collection-grid">
        <div><div className="flex items-start justify-between gap-3"><div><h3>Dernières publications</h3><p className="text-xs text-foreground-muted">Annonces et contenus réellement publiés</p></div><Link className="skuup-admin-panel-link" href="/admin/content">Gérer</Link></div>
          <div className="mt-4 grid gap-2">
          {publicationItems.map((item) => <Link className="skuup-admin-collection-item" href={item.href} key={item.id}><strong>{item.title}</strong><span><span className={`skuup-admin-status-chip ${item.tone}`}>{item.status}</span> · {item.meta}</span></Link>)}
          </div>
          {!resume.announcements.length && !resume.contents.length && <p role="status">Aucun contenu publié renvoyé par le contrat.</p>}
        </div>
        <div><div className="flex items-start justify-between gap-3"><div><h3>Signalements ouverts</h3><p className="text-xs text-foreground-muted">Priorités nécessitant une décision</p></div><Link className="skuup-admin-panel-link" href="/admin/moderation">Traiter</Link></div>
          <div className="mt-4 grid gap-2">
          {resume.fraudFlags.slice(0, 5).map((flag) => <Link className="skuup-admin-collection-item" href="/admin/moderation" key={flag.id}><strong>{flag.user.pseudo}</strong><span><span className="skuup-admin-status-chip skuup-admin-status-danger">{flag.type}</span> · reçu le {shortDate(flag.createdAt)}</span></Link>)}
          </div>
          {!resume.fraudFlags.length && <p role="status">Aucun signalement ouvert renvoyé par le contrat.</p>}
        </div>
      </div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3"><div><h3>Journal d’activité</h3><p className="text-xs text-foreground-muted">Les derniers événements renvoyés par l’API</p></div><Link className="skuup-admin-panel-link" href="/admin/audit">Tout le journal</Link></div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {resume.recentActivity.slice(0, 6).map((event) => <Link className="skuup-admin-collection-item" href="/admin/audit" key={event.id}><strong>{event.action}</strong><span>{event.entityType} · {event.actor?.pseudo ?? "Système"} · {shortDate(event.createdAt)}</span></Link>)}
        </div>
        {!resume.recentActivity.length && <p role="status" className="mt-3">Aucun événement récent renvoyé par le contrat.</p>}
      </div>
    </section>
  );
}
