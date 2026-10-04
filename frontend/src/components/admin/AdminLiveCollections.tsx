import Link from "next/link";
import type { AdminDashboardSummary } from "@/lib/admin";

function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value)) : "—";
}

export function AdminLiveCollections({ resume }: { resume: AdminDashboardSummary }) {
  return (
    <section className="skuup-dashboard-panel skuup-admin-collections-panel" aria-labelledby="live-collections-title">
      <div className="skuup-admin-panel-heading">
        <div><p className="skuup-admin-section-kicker">Données en direct</p><h2 id="live-collections-title">Éditorial et sécurité</h2></div>
        <Link className="skuup-admin-panel-link" href="/admin/audit">Voir le journal</Link>
      </div>
      <div className="skuup-admin-collection-grid">
        <div><h3>Dernières publications</h3>
          {resume.announcements.map((item) => <p key={item.id}><strong>{item.titre}</strong><span>Active · {shortDate(item.debutAt)}</span></p>)}
          {resume.contents.map((item) => <p key={item.id}><strong>{item.slug}</strong><span>{item.locale} · publié v{item.version}</span></p>)}
          {!resume.announcements.length && !resume.contents.length && <p role="status">Aucun contenu publié renvoyé par le contrat.</p>}
        </div>
        <div><h3>Signalements ouverts</h3>
          {resume.fraudFlags.map((flag) => <p key={flag.id}><strong>{flag.user.pseudo}</strong><span>{flag.type} · {shortDate(flag.createdAt)}</span></p>)}
          {!resume.fraudFlags.length && <p role="status">Aucun signalement ouvert renvoyé par le contrat.</p>}
        </div>
      </div>
    </section>
  );
}
