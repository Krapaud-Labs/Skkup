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
  { href: "/dashboard/recompenses", icon: "gift", key: "rewards" },
  { href: "/dashboard/tirages", icon: "draws", key: "draws" },
  { href: "/dashboard/historique", icon: "points", key: "history" },
  { href: "/dashboard/reglement", icon: "rules", key: "rules" },
  { href: "/dashboard/extension", icon: "extension", key: "extension" },
  { href: "/dashboard/compte", icon: "users", key: "account" },
] as const;

/** Navigation persistante du sas Dashboard, présentée sous forme de cartes. */
export function NavigationDashboard({ profil }: NavigationDashboardProps) {
  const pathname = usePathname();
  const { langue } = useLanguage();
  const t = traductions[langue];
  const liens = [
    { href: "/dashboard", icon: "overview", label: t.overview, description: t.overviewDescription },
    ...actions.map((action) => action.key === "extension"
      ? { ...action, label: langue === "en" ? "Connect extension" : "Connecter l’extension", description: langue === "en" ? "Pair your browser for validated viewing." : "Associe ton navigateur pour valider tes vues." }
      : action.key === "rewards"
        ? { ...action, label: langue === "en" ? "Rewards" : "Récompenses", description: langue === "en" ? "Scratch cards, tickets and prizes." : "Cartes, tickets et lots disponibles." }
      : action.key === "history"
        ? { ...action, label: langue === "en" ? "History" : "Historique", description: langue === "en" ? "Review your points activity." : "Retrouve ton activité de points." }
      : action.key === "account"
        ? { ...action, label: langue === "en" ? "My account" : "Mon compte", description: langue === "en" ? "Profile and account security." : "Profil et sécurité du compte." }
      : { ...action, label: t[action.key], description: t[`${action.key}Description` as "streamsDescription" | "drawsDescription" | "rulesDescription"] }),
  ];

  return (
    <section className="skuup-dashboard-actions" aria-labelledby="dashboard-actions-title">
      <div className="skuup-dashboard-actions-header">
        <div>
          <p className="skuup-kicker">{t.space}</p>
          <h2 id="dashboard-actions-title" className="mt-1 text-2xl font-extrabold text-white">{t.browse}</h2>
          <p className="mt-2 text-sm text-white/55">{t.welcome(profil.pseudo)}</p>
        </div>
      </div>
      <nav className="skuup-premium-dashboard-nav-group" aria-label={t.dashboardNav}>
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
