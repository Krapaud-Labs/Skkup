"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const liens = [
  { href: "/admin#overview", key: "overview" },
  { href: "/admin/raffles", key: "raffles" },
  { href: "/admin/lots", key: "lots" },
  { href: "/admin/announcements", key: "announcements" },
  { href: "/admin/moderation", key: "moderation" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/audit", key: "audit" },
] as const;

const labels = {
  fr: { overview: "Vue d’ensemble", raffles: "Tirages", lots: "Lots", announcements: "Annonces", moderation: "Signalements", users: "Utilisateurs", audit: "Journal d’audit", menu: "Menu", navigation: "Navigation administration" },
  en: { overview: "Overview", raffles: "Draws", lots: "Prizes", announcements: "Announcements", moderation: "Reports", users: "Users", audit: "Audit log", menu: "Menu", navigation: "Administration navigation" },
} as const;

/** Navigation dédiée à l’administration, séparée du parcours viewer. */
export function NavigationAdmin() {
  const { langue } = useLanguage();
  const pathname = usePathname();
  const t = labels[langue];

  return (
    <section className="skuup-dashboard-actions" aria-labelledby="admin-actions-title">
      <div className="skuup-dashboard-actions-header"><p id="admin-actions-title" className="skuup-kicker">{t.menu}</p></div>
      <nav className="skuup-premium-dashboard-nav-group" aria-label={t.navigation}>
        <div className="skuup-dashboard-sidebar-links">
        {liens.map((lien) => {
          const [hrefPath, hrefHash] = lien.href.split("#");
          const actif = hrefHash === "overview"
            ? pathname === "/admin"
            : pathname === hrefPath;
          return (
            <Link key={lien.href} href={lien.href} className={`skuup-dashboard-action skuup-premium-dashboard-nav-link group${actif ? " skuup-dashboard-action-active skuup-premium-dashboard-nav-active" : ""}`} aria-current={actif ? "page" : undefined}>
              <span className="flex-1"><strong>{t[lien.key]}</strong></span>
            </Link>
          );
        })}
        </div>
      </nav>
    </section>
  );
}
