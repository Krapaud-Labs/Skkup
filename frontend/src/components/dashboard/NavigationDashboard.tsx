"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profil } from "@/lib/dashboard";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

interface NavigationDashboardProps {
  profil: Profil;
}

const actions = [
  { href: "/dashboard/streams", icon: "streams", label: "Regarder et suivre", description: "Choisis un direct et associe ton extension." },
  { href: "/dashboard/tirages", icon: "draws", label: "Voir les tirages", description: "Découvre les lots et les résultats publiés." },
  { href: "/dashboard/reglement", icon: "rules", label: "Lire le règlement", description: "Consulte les règles des tirages et des lots." },
] as const;

/** Navigation persistante du sas Dashboard, présentée sous forme de cartes. */
export function NavigationDashboard({ profil }: NavigationDashboardProps) {
  const pathname = usePathname();
  const liens = [
    { href: "/dashboard", icon: "overview", label: "Vue d’ensemble", description: "Retrouve tes points et ton activité." },
    ...actions,
    ...(profil.role === "ADMIN"
      ? [{ href: "/dashboard/admin", icon: "admin", label: "Administration", description: "Gère les tirages et les annonces du service." }]
      : []),
  ];

  return (
    <section className="skuup-dashboard-actions" aria-labelledby="dashboard-actions-title">
      <div className="skuup-dashboard-actions-header">
        <div>
          <p className="skuup-kicker">Ton espace</p>
          <h2 id="dashboard-actions-title" className="mt-1 text-2xl font-extrabold text-white">Parcourir Skkup</h2>
          <p className="mt-2 text-sm text-white/55">Bonjour {profil.pseudo}, tout est accessible ici.</p>
        </div>
      </div>
      <nav aria-label="Navigation de ton espace personnel">
        <div className="skuup-dashboard-sidebar-links">
          {liens.map((lien) => {
            const actif = pathname === lien.href || (lien.href !== "/dashboard" && pathname.startsWith(`${lien.href}/`));
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`skuup-dashboard-action group${actif ? " skuup-dashboard-action-active" : ""}`}
                aria-current={actif ? "page" : undefined}
              >
                <span className="skuup-dashboard-action-icon"><SkkupIcon name={lien.icon as SkkupIconName} size={22} /></span>
                <span className="flex-1"><strong>{lien.label}</strong><span>{lien.description}</span></span>
                <span className="skuup-dashboard-action-arrow"><SkkupIcon name="arrow" size={17} /></span>
              </Link>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
