interface EtatChargementDashboardProps {
  titre: string;
  description: string;
  className?: string;
}

export function EtatChargementDashboard({ titre, description, className = "" }: EtatChargementDashboardProps) {
  return (
    <section className={`skuup-dashboard-loading ${className}`.trim()} role="status" aria-live="polite" aria-busy="true">
      <div className="skuup-dashboard-loading-orbit" aria-hidden="true"><span /></div>
      <div className="skuup-dashboard-loading-copy">
        <p className="skuup-kicker">Skkup</p>
        <h2>{titre}</h2>
        <p>{description}</p>
      </div>
      <div className="skuup-dashboard-loading-bar" aria-hidden="true"><span /></div>
    </section>
  );
}
