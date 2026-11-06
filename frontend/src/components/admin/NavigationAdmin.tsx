"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const liens = [
  { href: "/admin#overview", key: "overview", icon: "analytics" },
  { href: "/admin/raffles", key: "raffles", icon: "draws" },
  { href: "/admin/lots", key: "lots", icon: "gift" },
  { href: "/admin/announcements", key: "announcements", icon: "megaphone" },
  { href: "/admin/moderation", key: "moderation", icon: "flag" },
  { href: "/admin/users", key: "users", icon: "users" },
  { href: "/admin/audit", key: "audit", icon: "audit" },
] as const;

const labels = {
  fr: { overview: "Vue d’ensemble", raffles: "Tirages", lots: "Lots", announcements: "Annonces", moderation: "Signalements", users: "Utilisateurs", audit: "Journal d’audit", navigation: "Navigation administration" },
  en: { overview: "Overview", raffles: "Draws", lots: "Prizes", announcements: "Announcements", moderation: "Reports", users: "Users", audit: "Audit log", navigation: "Administration navigation" },
} as const;

/** Navigation dédiée à l’administration, séparée du parcours viewer. */
export function NavigationAdmin() {
  const { langue } = useLanguage();
  const pathname = usePathname();
  const t = labels[langue];

  return (
    <div className="skuup-dashboard-actions">
      <nav className="skuup-premium-dashboard-nav-group" aria-label={t.navigation}>
        <div className="skuup-dashboard-sidebar-links">
        {liens.map((lien) => {
          const [hrefPath, hrefHash] = lien.href.split("#");
          const actif = hrefHash === "overview"
            ? pathname === "/admin"
            : pathname === hrefPath;
          return (
            <Link key={lien.href} href={lien.href} className={`skuup-dashboard-action skuup-premium-dashboard-nav-link group${actif ? " skuup-dashboard-action-active skuup-premium-dashboard-nav-active" : ""}`} aria-current={actif ? "page" : undefined}>
              <span className="skuup-dashboard-action-icon">
                <SkkupIcon name={lien.icon} size={32} sizes="2rem" />
              </span>
              <span className="flex-1"><strong className={/\s/.test(t[lien.key]) ? undefined : "skuup-dashboard-nav-label-single-word"}>{t[lien.key]}</strong></span>
            </Link>
          );
        })}
        </div>
      </nav>
    </div>
  );
}
