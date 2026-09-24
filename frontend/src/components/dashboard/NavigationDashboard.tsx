"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profil } from "@/lib/dashboard";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

interface NavigationDashboardProps {
  profil: Profil;
}

const actions = [
  { href: "/dashboard/streams", icon: "streams", key: "streams" },
  { href: "/dashboard/tirages", icon: "draws", key: "draws" },
  { href: "/dashboard/reglement", icon: "rules", key: "rules" },
] as const;

/** Navigation persistante du sas Dashboard, présentée sous forme de cartes. */
export function NavigationDashboard({ profil }: NavigationDashboardProps) {
  const pathname = usePathname();
  const { langue, definirLangue } = useLanguage();
  const t = traductions[langue];
  const liens = [
    { href: "/dashboard", icon: "overview", label: t.overview, description: t.overviewDescription },
    ...actions.map((action) => ({ ...action, label: t[action.key], description: t[`${action.key}Description` as "streamsDescription" | "drawsDescription" | "rulesDescription"] })),
    ...(profil.role === "ADMIN" ? [{ href: "/dashboard/admin", icon: "admin", label: t.admin, description: t.adminDescription }] : []),
  ];

  return (
    <section className="skuup-dashboard-actions" aria-labelledby="dashboard-actions-title">
      <div className="skuup-dashboard-actions-header">
        <div>
          <p className="skuup-kicker">{t.space}</p>
          <h2 id="dashboard-actions-title" className="mt-1 text-2xl font-extrabold text-white">{t.browse}</h2>
          <p className="mt-2 text-sm text-white/55">{t.welcome(profil.pseudo)}</p>
        </div>
        <label className="sr-only" htmlFor="dashboard-language-select">Langue</label>
        <select id="dashboard-language-select" value={langue} onChange={(event) => definirLangue(event.target.value as "fr" | "en")} aria-label={t.language} className="rounded-md border border-white/20 bg-black/20 px-2 py-1 text-xs text-white"><option value="fr">FR</option><option value="en">EN</option></select>
      </div>
      <nav aria-label={t.dashboardNav}>
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
