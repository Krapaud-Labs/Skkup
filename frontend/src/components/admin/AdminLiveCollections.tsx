import Link from "next/link";
import type { AdminDashboardSummary } from "@/lib/admin";

function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value)) : "—";
}

export function AdminLiveCollections({ resume }: { resume: AdminDashboardSummary }) {
  const publicationCount = resume.announcements.length + resume.contents.length;
  return (
    <section className="skuup-dashboard-panel skuup-admin-collections-panel" aria-labelledby="live-collections-title">
      <div className="skuup-admin-panel-heading">
        <div><p className="skuup-admin-section-kicker">Données en direct</p><h2 id="live-collections-title">Éditorial et sécurité</h2><p className="text-sm text-foreground-muted">{publicationCount} publication{publicationCount > 1 ? "s" : ""} et {resume.fraudFlags.length} signalement{resume.fraudFlags.length > 1 ? "s" : ""} renvoyés par l’API.</p></div>
        <Link className="skuup-admin-panel-link" href="/admin/audit">Voir le journal</Link>
      </div>
      <div className="skuup-admin-collection-grid">
        <div><div className="flex items-start justify-between gap-3"><div><h3>Dernières publications</h3><p className="text-xs text-foreground-muted">Annonces et contenus réellement publiés</p></div><Link className="skuup-admin-panel-link" href="/admin/content">Gérer</Link></div>
          <div className="mt-4 grid gap-2">
          {resume.announcements.map((item) => <Link className="skuup-admin-collection-item" href="/admin/announcements" key={`announcement-${item.id}`}><strong>{item.titre}</strong><span><span className={`skuup-admin-status-chip ${item.actif ? "skuup-admin-status-success" : "skuup-admin-status-muted"}`}>{item.actif ? "Active" : "Inactive"}</span> · début {shortDate(item.debutAt)}</span></Link>)}
          {resume.contents.map((item) => <Link className="skuup-admin-collection-item" href="/admin/content" key={`content-${item.id}`}><strong>{item.slug}</strong><span><span className="skuup-admin-status-chip skuup-admin-status-info">{item.status}</span> · {item.locale} · v{item.version}</span></Link>)}
          </div>
          {!resume.announcements.length && !resume.contents.length && <p role="status">Aucun contenu publié renvoyé par le contrat.</p>}
        </div>
        <div><div className="flex items-start justify-between gap-3"><div><h3>Signalements ouverts</h3><p className="text-xs text-foreground-muted">Priorités nécessitant une décision</p></div><Link className="skuup-admin-panel-link" href="/admin/moderation">Traiter</Link></div>
          <div className="mt-4 grid gap-2">
          {resume.fraudFlags.map((flag) => <Link className="skuup-admin-collection-item" href="/admin/moderation" key={flag.id}><strong>{flag.user.pseudo}</strong><span><span className="skuup-admin-status-chip skuup-admin-status-danger">{flag.type}</span> · reçu le {shortDate(flag.createdAt)}</span></Link>)}
          </div>
          {!resume.fraudFlags.length && <p role="status">Aucun signalement ouvert renvoyé par le contrat.</p>}
        </div>
      </div>
    </section>
  );
}
