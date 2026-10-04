import Link from "next/link";
import type { AdminDashboardSummary } from "@/lib/admin";

function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value)) : "—";
}

export function AdminLiveCollections({ resume }: { resume: AdminDashboardSummary }) {
  const publicationCount = resume.announcements.length + resume.contents.length;
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
        <div><p className="skuup-admin-section-kicker">Pilotage en direct</p><h2 id="live-collections-title">Annonces, sécurité et audit</h2><p className="text-sm text-foreground-muted">{publicationCount} publication{publicationCount > 1 ? "s" : ""}, {resume.fraudFlags.length} signalement{resume.fraudFlags.length > 1 ? "s" : ""} et {resume.recentActivity.length} événement{resume.recentActivity.length > 1 ? "s" : ""} renvoyés par l’API.</p></div>
        <Link className="skuup-admin-panel-link" href="/admin/audit">Voir le journal</Link>
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
    </section>
  );
}
