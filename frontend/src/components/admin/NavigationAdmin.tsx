"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

const liens = [
  { href: "/admin#overview", key: "overview", icon: "analytics" as SkkupIconName },
  { href: "/admin/raffles", key: "raffles", icon: "draws" as SkkupIconName },
  { href: "/admin/lots", key: "lots", icon: "gift" as SkkupIconName },
  { href: "/admin/announcements", key: "announcements", icon: "megaphone" as SkkupIconName },
  { href: "/admin/content", key: "content", icon: "rules" as SkkupIconName },
  { href: "/admin/moderation", key: "moderation", icon: "shield" as SkkupIconName },
  { href: "/admin/users", key: "users", icon: "users" as SkkupIconName },
  { href: "/admin/audit", key: "audit", icon: "audit" as SkkupIconName },
] as const;

const labels = {
  fr: { overview: "Vue d’ensemble", raffles: "Tirages", lots: "Lots", announcements: "Annonces", content: "Contenus", moderation: "Signalements", users: "Utilisateurs", audit: "Journal d’audit", menu: "Menu", navigation: "Navigation administration", viewer: "Espace viewer" },
  en: { overview: "Overview", raffles: "Draws", lots: "Prizes", announcements: "Announcements", content: "Content", moderation: "Reports", users: "Users", audit: "Audit log", menu: "Menu", navigation: "Administration navigation", viewer: "Viewer space" },
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
              <span className="skuup-dashboard-action-icon"><SkkupIcon name={lien.icon} size={20} /></span>
              <span className="flex-1"><strong>{t[lien.key]}</strong></span>
            </Link>
          );
        })}
        <Link href="/dashboard" className="skuup-dashboard-action skuup-premium-dashboard-nav-link skuup-premium-dashboard-nav-back">
          <span className="skuup-dashboard-action-icon"><SkkupIcon name="eye" size={20} /></span>
          <span className="flex-1"><strong>{t.viewer}</strong></span>
        </Link>
        </div>
      </nav>
    </section>
  );
}
