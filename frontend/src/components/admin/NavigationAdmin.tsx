"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

const liens = [
  { href: "/admin#overview", label: "Vue d’ensemble", icon: "overview" as SkkupIconName },
  { href: "/admin/raffles", label: "Tirages", icon: "draws" as SkkupIconName },
  { href: "/admin/lots", label: "Lots", icon: "gift" as SkkupIconName },
  { href: "/admin/announcements", label: "Annonces", icon: "rules" as SkkupIconName },
  { href: "/admin/content", label: "Contenus", icon: "content" as SkkupIconName },
  { href: "/admin/moderation", label: "Signalements", icon: "shield" as SkkupIconName },
  { href: "/admin/users", label: "Utilisateurs", icon: "users" as SkkupIconName },
  { href: "/admin/audit", label: "Journal d’audit", icon: "audit" as SkkupIconName },
] as const;

/** Navigation dédiée à l’administration, séparée du parcours viewer. */
export function NavigationAdmin() {
  const { langue } = useLanguage();
  const pathname = usePathname();

  return (
    <section className="skuup-dashboard-actions" aria-labelledby="admin-actions-title">
      <div className="skuup-dashboard-actions-header"><p id="admin-actions-title" className="skuup-kicker">Menu</p></div>
      <nav className="skuup-premium-dashboard-nav-group" aria-label={langue === "en" ? "Administration navigation" : "Navigation administration"}>
        <div className="skuup-dashboard-sidebar-links">
        {liens.map((lien) => {
          const [hrefPath, hrefHash] = lien.href.split("#");
          const actif = hrefHash === "overview"
            ? pathname === "/admin"
            : pathname === hrefPath;
          return (
            <Link key={lien.href} href={lien.href} className={`skuup-dashboard-action skuup-premium-dashboard-nav-link group${actif ? " skuup-dashboard-action-active skuup-premium-dashboard-nav-active" : ""}`} aria-current={actif ? "page" : undefined}>
              <span className="skuup-dashboard-action-icon"><SkkupIcon name={lien.icon} size={20} /><svg aria-hidden="true" focusable="false" width="1" height="1" viewBox="0 0 1 1" className="skuup-nav-icon-marker"><circle cx=".5" cy=".5" r=".4" /></svg></span>
              <span className="flex-1"><strong>{lien.label}</strong></span>
            </Link>
          );
        })}
        <Link href="/dashboard" className="skuup-dashboard-action skuup-premium-dashboard-nav-link skuup-premium-dashboard-nav-back">
          <span className="skuup-dashboard-action-icon"><SkkupIcon name="eye" size={20} /></span>
          <span className="flex-1"><strong>{langue === "en" ? "Viewer space" : "Espace viewer"}</strong></span>
        </Link>
        </div>
      </nav>
    </section>
  );
}
